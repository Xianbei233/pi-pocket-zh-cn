// Actual dictionary in a throwaway Pocket and Chromium profile. No live data or provider calls.
// Usage: node ui-browser-smoke.mjs /path/to/isolated-pocket-source
import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.argv[2]) throw new Error("Explicit isolated Pi Pocket source directory required");
const source = resolve(process.argv[2]);
if (!existsSync(join(source, "web/i18n.js"))) {
  throw new Error("Target Pocket source has no UI locale runtime; host support is required.");
}
const hostImport = (path) => import(pathToFileURL(join(source, path)));
// Helpers must precede server imports: they isolate Pi's auth/settings/home as well as Pocket data.
const { root, cleanUp, openApp, owner, scriptedModel, newSession, until } =
  await hostImport("test/helpers.ts");
let app;
let server;
let browsers;
const file = "zh-cn-ui.ts";
const draft = "Menu {{name}} / custom-model /home/user/file — 用户原文";

try {
  const { Browsers } = await hostImport("src/server/browser.ts");
  const { findBrowser } = await hostImport("src/server/browser/discovery.ts");
  const { VIEWPORTS } = await hostImport("src/server/browser/viewport.ts");
  const { createHandler } = await hostImport("src/server/http.ts");
  assert.ok(findBrowser(), "Chromium is required; this smoke test must not silently skip");
  const data = join(root, "zh-browser-pack");
  mkdirSync(join(data, "extensions"), { recursive: true });
  copyFileSync(fileURLToPath(new URL(`./${file}`, import.meta.url)), join(data, "extensions", file));
  app = await openApp(scriptedModel(), data);
  const session = await newSession(app);
  await app.commands.updateSession(session, owner(app), { title: "Menu" });
  const guest = app.config.addUser("Locale guest", "guest", [String(session)]);
  server = createServer(createHandler({ app, listen: { host: "127.0.0.2", port: 0 }, restart: () => {} }));
  await new Promise((resolve) => server.listen(0, "127.0.0.2", resolve));
  const base = `http://127.0.0.2:${server.address().port}`;
  browsers = new Browsers({
    dataDir: mkdtempSync(join(root, "zh-chromium-")),
    load: async () => undefined,
    save: () => {},
  });
  const state = async (page) => JSON.parse(await page.evaluate(`return JSON.stringify({
    lang: document.documentElement.lang, path: location.pathname, origin: performance.timeOrigin,
    placeholder: document.querySelector('.composer textarea')?.placeholder,
    draft: document.querySelector('.composer textarea')?.value,
    title: document.querySelector('.sheet-head h2')?.textContent.trim(),
    menu: document.querySelector('.topbar [aria-label="菜单"], .topbar [aria-label="Menu"]')?.getAttribute('aria-label'),
    labels: [...document.querySelectorAll('.sheet .group .list-item > span:first-child')].map(e => e.textContent.trim()),
    model: document.querySelector('.model-chip')?.textContent.trim(),
    width: innerWidth, pageWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
  })`));

  for (const [index, size] of ["mobile", "desktop"].entries()) {
    const page = await browsers.open(701 + index, { restore: false, viewport: VIEWPORTS[size] });
    await page.setViewport(VIEWPORTS[size]);
    await page.navigate(`${base}/login?token=${encodeURIComponent(guest.token)}`);
    await page.navigate(`${base}/s/${session}`);
    await until(async () => (await state(page)).placeholder === "Ask Pi anything…", `${size} English composer`, 20_000);
    await page.type({ selector: ".composer textarea" }, draft);
    await page.evaluate(`document.querySelector('.topbar [aria-label="Menu"]').click()`);
    await until(async () => (await state(page)).labels.includes("Extensions"), `${size} menu`);
    const initial = await state(page);
    assert.equal(initial.lang, "en");
    assert.equal(initial.title, "Menu");
    assert.equal(initial.draft, draft);
    assert.match(initial.model, /faux-1/);

    for (const enabled of [true, false]) {
      await app.setExtensionEnabled(owner(app), file, enabled);
      const lang = enabled ? "zh-CN" : "en";
      const placeholder = enabled ? "向 Pi 提问…" : "Ask Pi anything…";
      await until(async () => {
        const now = await state(page);
        return now.lang === lang && now.placeholder === placeholder &&
          now.labels.includes(enabled ? "扩展" : "Extensions");
      }, `${size} ${lang} live update`, 20_000);
      const now = await state(page);
      assert.equal(now.title, "Menu", "user title is not a UI source key");
      assert.equal(now.draft, draft);
      assert.equal(now.model, initial.model);
      assert.equal(now.path, initial.path);
      assert.equal(now.origin, initial.origin, "no document reload");
      assert.equal(now.menu, enabled ? "菜单" : "Menu");
      assert.ok(now.pageWidth <= now.width, `horizontal overflow: ${now.pageWidth}/${now.width}`);
    }
    const errors = page.logs().filter((entry) => entry.level === "error");
    assert.deepEqual(errors, [], `${size} browser console errors`);
    console.log(`PASS: ${size} actual pack, composer, open menu, enable/disable without reload, dynamic data intact, no overflow/errors`);
  }
} finally {
  await browsers?.closeAll({ final: true });
  server?.closeAllConnections();
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  await app?.close();
  cleanUp();
}

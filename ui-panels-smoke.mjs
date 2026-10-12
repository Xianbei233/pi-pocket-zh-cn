// Actual UI pack and real HTTP/Chromium, isolated data/auth/home and no model submissions.
// Usage: node ui-panels-smoke.mjs /path/to/pocket mobile|desktop [--serve]
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const source = resolve(process.argv[2]);
const size = process.argv[3] ?? "mobile";
const serve = process.argv.includes("--serve");
const hostImport = (path) => import(pathToFileURL(join(source, path)));
const { root, cleanUp, openApp, owner, scriptedModel, newSession, until, work } = await hostImport("test/helpers.ts");
const { Browsers } = await hostImport("src/server/browser.ts");
const { findBrowser } = await hostImport("src/server/browser/discovery.ts");
const { VIEWPORTS } = await hostImport("src/server/browser/viewport.ts");
const { createHandler } = await hostImport("src/server/http.ts");
assert.ok(findBrowser(), "Chromium required, no silent skip");
const file = "zh-cn-ui.ts";
const draft = "Menu {{name}} <img src=x onerror=alert(1)> / custom-provider/model /home/user/file — 用户原文";
let app, server, browsers;
const data = join(root, "locale-panels");
mkdirSync(join(data, "extensions"), { recursive: true });
copyFileSync(fileURLToPath(new URL("./zh-cn-ui.ts", import.meta.url)), join(data, "extensions", file));
mkdirSync(join(work, ".agents/skills/locale-fixture"), { recursive: true });
writeFileSync(join(work, ".agents/skills/locale-fixture/SKILL.md"), "---\nname: locale-fixture\ndescription: Fixture only\n---\nDo not run.\n");
const stop = async () => {
  await browsers?.closeAll({ final: true });
  server?.closeAllConnections();
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  await app?.close();
  cleanUp();
};
try {
  app = await openApp(scriptedModel(() => { throw new Error("No model requests allowed in locale panels smoke"); }), data);
  const session = await newSession(app);
  await app.commands.updateSession(session, owner(app), { title: "Menu {{name}} — 用户标题" });
  const lessonText = "Menu {{name}} /custom-model 原样保留的经验";
  await app.memory.add(session, work, { userId: owner(app).id, byPi: true, name: "Pi" }, { text: lessonText, scope: "project" });
  const hook = await app.hooks.add(owner(app), session, { name: "Menu {{name}}", instructions: draft, signed: true });
  // Helpers supply isolated no-op compression adapters/services; never starts a real proxy.
  await app.setExtensionEnabled(owner(app), "headroom.ts", true);
  server = createServer(createHandler({ app, listen: { host: "127.0.0.2", port: 0 }, restart: () => {} }));
  await new Promise((resolve) => server.listen(0, "127.0.0.2", resolve));
  const base = `http://127.0.0.2:${server.address().port}`;
  if (serve) {
    await app.setExtensionEnabled(owner(app), file, true);
    console.log(JSON.stringify({ base, login: `${base}/login?token=${encodeURIComponent(app.config.ownerToken)}`, session, root, pid: process.pid }));
    process.on("SIGTERM", () => void stop().then(() => process.exit(0)));
    process.on("SIGINT", () => void stop().then(() => process.exit(0)));
    await new Promise(() => {});
  }
  browsers = new Browsers({ dataDir: mkdtempSync(join(root, "locale-chromium-")), load: async () => undefined, save: () => {} });
  const page = await browsers.open(901, { restore: false, viewport: VIEWPORTS[size] });
  await page.setViewport(VIEWPORTS[size]);
  await page.navigate(`${base}/login?token=${encodeURIComponent(app.config.ownerToken)}`);
  await page.navigate(`${base}/s/${session}`);
  const evaluate = async (script) => JSON.parse(await page.evaluate(`return JSON.stringify(await (async () => { ${script} })())`));
  const state = async () => evaluate(`return {
    lang: document.documentElement.lang, origin: performance.timeOrigin, path: location.pathname,
    draft: document.querySelector('.composer textarea')?.value,
    title: document.querySelector('.title-main')?.textContent,
    model: document.querySelector('.model-chip .model-name')?.textContent,
    text: document.querySelector('.sheet,.pop-menu,.pip-panel,.board,.splash')?.textContent ?? '',
    attrs: [...document.querySelectorAll('.sheet [aria-label],.sheet [placeholder],.pop-menu[aria-label],.pop-menu [aria-label],.pip-panel[aria-label],.pip-panel [aria-label],.board[aria-label],.board [aria-label]')].map(e => e.getAttribute('aria-label') || e.getAttribute('placeholder')),
    width: innerWidth, pageWidth: Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)
  };`);
  await until(async () => (await state()).model?.includes("faux-1"), "signed-in session", 15_000);
  await page.type({ selector: ".composer textarea" }, draft);
  const initial = await state();
  const panels = [
    ["menu", "Default model", "默认模型"],
    ["extensions", "automatically installs missing dependencies", "自动安装缺失的依赖"],
    ["model", "New sessions:", "新会话："],
    ["memory", "Short lessons Pi keeps across sessions", "Pi 跨会话保留的简短经验"],
    ["hooks", "Posted by", "推送来源"],
    ["trust", "No decision yet.", "尚未决定。"],
    ["shortcuts", "Open or close PiP", "打开或关闭你的助手 PiP"],
    ["spend", "subagents' reports wait", "子代理的报告"],
    ["pi-sessions", "Pi has no sessions", "此设备上尚无 Pi 会话"],
    ["providers", "Pi Pocket shares Pi's sign-ins", "Pi Pocket 与 Pi 共用登录信息"],
    ["appearance", "Appearance", "外观"],
    ["schedules", "Scheduled messages", "定时消息"],
    ["instructions", "Instructions for Pi", "给 Pi 的指示"],
    ["reset", "New context", "新上下文"],
  ];
  for (const [panel, english, chinese] of panels) {
    await app.setExtensionEnabled(owner(app), file, false);
    await evaluate(`const {store,openSheet}=await import('/store.js'); store.set({sheet:null,sheetTrail:[]}); openSheet({type:${JSON.stringify(panel)}}); return true;`);
    await until(async () => (await state()).text.includes(english), `${size} ${panel} English`, 12_000);
    if (panel === "hooks") {
      await evaluate(`window.localeConfirmations=[];window.confirm=(message)=>{window.localeConfirmations.push(message);return false};return true;`);
    }
    if (panel === "memory" || panel === "hooks") {
      await evaluate(`const input=document.querySelector(${JSON.stringify(panel === "memory" ? ".lesson-add textarea" : ".sheet textarea")}); input.value=${JSON.stringify(draft)}; input.dispatchEvent(new Event('input',{bubbles:true})); return true;`);
    }
    for (const enabled of [true, false]) {
      await app.setExtensionEnabled(owner(app), file, enabled);
      await until(async () => { const s = await state(); return s.lang === (enabled ? "zh-CN" : "en") && s.text.includes(enabled ? chinese : english); }, `${size} ${panel} ${enabled ? "Chinese" : "fallback"}`, 12_000);
      const now = await state();
      assert.equal(now.origin, initial.origin, `${panel}: no reload`);
      assert.equal(now.path, initial.path);
      assert.equal(now.draft, draft, `${panel}: composer draft`);
      assert.equal(now.title, initial.title, `${panel}: user title`);
      assert.equal(now.model, initial.model, `${panel}: model ID`);
      assert.ok(now.pageWidth <= now.width, `${panel}: overflow ${now.pageWidth}/${now.width}`);
      if (panel === "memory" || panel === "hooks") {
        assert.equal(await evaluate(`return document.querySelector(${JSON.stringify(panel === "memory" ? ".lesson-add textarea" : ".sheet textarea")}).value`), draft, `${panel}: entered text remains verbatim`);
      }
      if (panel === "memory") {
        assert.ok(now.attrs.includes(enabled ? "适用范围" : "For"));
        assert.ok(now.text.includes(lessonText), "pending lesson text verbatim");
        assert.ok(now.text.includes(enabled ? "待批准" : "To approve"));
      }
      if (panel === "hooks") {
        assert.ok(now.text.includes(hook.name), "hook name verbatim");
        assert.ok(now.text.includes(draft), "hook instructions verbatim");
        const confirmation = await evaluate(`const buttons=[...document.querySelectorAll('.hook .hook-actions button')];buttons.at(-1).click();return window.localeConfirmations.at(-1);`);
        assert.ok(confirmation.includes(hook.name));
        assert.ok(confirmation.includes(enabled ? "移除 Webhook" : "Remove the webhook"));
      }
      if (panel === "model") { assert.ok(now.attrs.includes(enabled ? "模型" : "Model")); assert.match(now.text, /Headroom/); }
      if (panel === "extensions") {
        assert.ok(now.text.includes(enabled ? "系统提示" : "System prompt"));
        assert.ok(now.text.includes(enabled ? "完成条件" : "Done when"));
      }
      if (panel === "hooks") assert.ok(now.text.includes(enabled ? "此会话" : "This session"));
    }
    console.log(`PASS ${size}: ${panel}; actual pack enable/disable, open panel, no reload/overflow, draft/title/model intact`);
  }
  await evaluate(`const {store,openSheet}=await import('/store.js');store.set({sheet:null,sheetTrail:[]});openSheet({type:'model',query:'Menu {{query}} <img>'});return true;`);
  for (const enabled of [true, false]) {
    await app.setExtensionEnabled(owner(app), file, enabled);
    await until(async () => (await state()).text.includes(enabled ? '没有匹配的模型：“Menu {{query}} <img>”。' : 'No model matches “Menu {{query}} <img>”.'), 'model no-match parameter', 12_000);
    assert.equal(await evaluate(`return document.querySelectorAll('.pop-menu-note img').length`), 0, 'query renders as text, never HTML');
  }
  console.log(`PASS ${size}: model search no-match, braces/HTML-looking query preserved as text`);
  await evaluate(`const {store}=await import('/store.js'); store.set({sheet:null,sheetTrail:[],launcher:true}); return true;`);
  for (const enabled of [true, false]) {
    await app.setExtensionEnabled(owner(app), file, enabled);
    await until(async () => await evaluate(`return document.querySelector('.launcher')?.textContent.includes(${JSON.stringify(enabled ? '默认模型' : 'Default model')})`), 'launcher actions', 12_000);
  }
  console.log(`PASS ${size}: launcher fixed actions live translation`);
  await evaluate(`const {store}=await import('/store.js'); store.set({launcher:false,sheet:null,sheetTrail:[],board:true}); return true;`);
  for (const enabled of [true, false]) {
    await app.setExtensionEnabled(owner(app), file, enabled);
    await until(async () => (await state()).text.includes(enabled ? "暂无子代理" : "No subagents yet"), "board localization", 12_000);
  }
  console.log(`PASS ${size}: subagent board empty state and aria`);
  await evaluate(`const {store}=await import('/store.js');store.set({board:false});const {openPip}=await import('/pip.js');openPip();return true;`);
  for (const enabled of [true, false]) {
    await app.setExtensionEnabled(owner(app), file, enabled);
    await until(async () => (await state()).text.includes(enabled ? "我会关注你的会话和仓库" : "I keep an eye on your sessions"), "PiP welcome", 12_000);
    const s = await state();
    assert.ok(s.attrs.includes(enabled ? "PiP，你的助手" : "PiP, your assistant"));
    assert.equal(s.origin, initial.origin);
    assert.ok(s.pageWidth <= s.width);
  }
  console.log(`PASS ${size}: PiP welcome, buttons and aria; no model request`);
  const unknown = "EXTERNAL RAW <img> {{name}} /home/user";
  app.notice("error", unknown, session);
  await until(async () => await evaluate(`return [...document.querySelectorAll('.notice')].some(e=>e.textContent.trim()===${JSON.stringify(unknown)})`), "raw server notice");
  app.notice("info", "english fallback", session, { key: "Could not attach {{name}}: {{error}}", params: { name: "Menu {{name}}", error: unknown } });
  await app.setExtensionEnabled(owner(app), file, true);
  await until(async () => await evaluate(`return [...document.querySelectorAll('.notice')].some(e=>e.textContent.includes('无法附加 Menu {{name}}：')&&e.textContent.includes(${JSON.stringify(unknown)}))`), "server parameterized notice");
  await app.setExtensionEnabled(owner(app), file, false);
  await until(async () => await evaluate(`return [...document.querySelectorAll('.notice')].some(e=>e.textContent.includes('Could not attach Menu {{name}}:'))`), "live notice English fallback");
  assert.deepEqual(page.logs().filter(e=>e.level === "error"), [], "console errors");
  console.log(`PASS ${size}: parameterized server notice live fallback; raw external error remains unchanged; no console errors`);
} finally {
  await stop();
}

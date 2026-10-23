// Real 0.20 rendering of the 0.8.0 candidate: new font tools and artifact sharing, phone and desktop.
// Isolated data and synthetic content only. Usage: node evidence-080.mjs /path/to/pr64-worktree
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const source = resolve(process.argv[2] ?? ".");
const hostImport = (path) => import(pathToFileURL(join(source, path)));
const { cleanUp, context, newSession, openApp, owner, root, scriptedModel, until, work } =
    await hostImport("test/helpers.ts");
const createArtifacts = (await hostImport("src/server/extensions/artifacts.ts")).default;
const { Browsers } = await hostImport("src/server/browser.ts");
const { findBrowser } = await hostImport("src/server/browser/discovery.ts");
const { VIEWPORTS } = await hostImport("src/server/browser/viewport.ts");
const { createHandler } = await hostImport("src/server/http.ts");

assert.ok(findBrowser(), "Chromium is required");
const evidence = fileURLToPath(new URL("./evidence-output/0.8.0", import.meta.url));
mkdirSync(evidence, { recursive: true });

const data = join(root, "zh-080-evidence");
mkdirSync(join(data, "extensions"), { recursive: true });
copyFileSync(fileURLToPath(new URL("./zh-cn-ui.ts", import.meta.url)), join(data, "extensions", "zh-cn-ui.ts"));

const app = await openApp(scriptedModel(), data);
app.config.lastModel ??= { provider: "faux", modelId: "faux-1", thinkingLevel: "off" };
const session = await newSession(app);
await app.commands.updateSession(session, owner(app), { title: "Menu" });
await app.setExtensionEnabled(owner(app), "zh-cn-ui.ts", true);

const page = `<button id="go" style="position:fixed;inset:0">Ask</button><script>document.title="Calc"</script>`;
await createArtifacts({}).tools[0].execute(
    { id: "calc", title: "Calculator", content: page, type: "html" },
    {
        conversationId: session,
        taskId: 9101,
        callId: "publish",
        agent: async () => ({ cwd: work }),
        snapshot: app.harness.snapshot.bind(app.harness),
        commit: app.harness.commit.bind(app.harness),
    },
    context,
);

const server = createServer(
    createHandler({ app, listen: { host: "127.0.0.2", port: 0 }, restart: () => {} }),
);
await new Promise((resolveListen) => server.listen(0, "127.0.0.2", resolveListen));
const base = `http://127.0.0.2:${server.address().port}`;
const browsers = new Browsers({
    dataDir: mkdtempSync(join(root, "zh-080-browser-")),
    load: async () => undefined,
    save: () => {},
});

const report = { source, viewports: {}, errors: [], checks: {} };

try {
    for (const [name, viewport] of [
        ["mobile", VIEWPORTS.mobile],
        ["desktop", VIEWPORTS.desktop],
    ]) {
        const page = await browsers.open(name === "mobile" ? 901 : 902, {
            restore: false,
            viewport,
        });
        await page.setViewport(viewport);
        await page.navigate(`${base}/login?token=${encodeURIComponent(app.config.ownerToken)}`);
        await page.navigate(`${base}/s/${session}`);
        await until(
            async () =>
                JSON.parse(
                    await page.evaluate(
                        "return JSON.stringify(document.documentElement.lang === 'zh-CN' && !!document.querySelector('.composer'))",
                    ),
                ) === true,
            `${name} Chinese composer`,
            20_000,
        );

        const shot = async (label) => {
            const image = await page.screenshot();
            writeFileSync(join(evidence, `${name}-${label}.png`), Buffer.from(image.data, "base64"));
        };

        await page.evaluate(
            `(await import('/store.js')).openSheet({ type: "viewer", id: "calc" })`,
        );
        await until(
            async () =>
                JSON.parse(
                    await page.evaluate(
                        "return JSON.stringify(!!document.querySelector('.viewer iframe'))",
                    ),
                ) === true,
            `${name} artifact viewer`,
            20_000,
        );
        await shot("artifact-viewer");

        await page.evaluate(`
            [...document.querySelectorAll('.viewer-head button')]
                .find((button) => ["分享", "Share"].includes(button.textContent.trim()))
                ?.click()
        `);
        await until(
            async () =>
                JSON.parse(
                    await page.evaluate(
                        "return JSON.stringify(!!document.querySelector('.sheet'))",
                    ),
                ) === true,
            `${name} share sheet`,
            15_000,
        );
        await new Promise((resolveWait) => setTimeout(resolveWait, 400));
        const shareText = await page.evaluate(
            "return document.querySelector('.sheet')?.innerText ?? ''",
        );
        await shot("artifact-share");
        await page.evaluate(`(await import('/store.js')).closeSheet()`);

        await page.evaluate(`(await import('/store.js')).openSheet({ type: "appearance" })`);
        await until(
            async () =>
                JSON.parse(
                    await page.evaluate(
                        "return JSON.stringify(!!document.querySelector('.sheet'))",
                    ),
                ) === true,
            `${name} appearance sheet`,
            15_000,
        );
        await page.evaluate(
            "document.querySelector('.font-tools')?.scrollIntoView({ block: 'start' })",
        );
        await new Promise((resolveWait) => setTimeout(resolveWait, 400));
        const lookText = await page.evaluate(
            "return document.querySelector('.font-tools')?.innerText ?? ''",
        );
        await shot("font-tools");
        await page.evaluate(`(await import('/store.js')).closeSheet()`);

        const overflow = JSON.parse(
            await page.evaluate(
                "return JSON.stringify(document.documentElement.scrollWidth > innerWidth + 2)",
            ),
        );
        const errors = page.logs().filter((entry) => entry.level === "error");
        const check = {
            shareChinese:
                shareText.includes("发布链接") &&
                shareText.includes("有效期") &&
                shareText.includes("直到我结束") &&
                shareText.includes("一周"),
            fontsChinese: lookText.includes("字体") && lookText.includes("连字"),
            noPlaceholders: !/\{\{[^}]+\}\}|\uFFFD/.test(shareText + lookText),
            overflow,
        };
        Object.assign(report.checks, { [name]: check });
        report.errors.push(...errors.map((entry) => ({ name, message: entry.message })));

        assert.equal(overflow, false, `${name} overflow`);
        assert.equal(check.noPlaceholders, true, `${name} placeholders or replacement characters`);
        assert.equal(check.shareChinese, true, `${name} share sheet is Chinese`);
        assert.equal(check.fontsChinese, true, `${name} font tools are Chinese`);
        assert.deepEqual(errors, [], `${name} console errors`);

        await browsers.close(name === "mobile" ? 901 : 902);
    }

    writeFileSync(join(evidence, "report.json"), JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report, null, 2));
} finally {
    await browsers.closeAll({ final: true });
    server.closeAllConnections();
    await new Promise((resolveClose) => server.close(resolveClose));
    await app.close();
    cleanUp();
}

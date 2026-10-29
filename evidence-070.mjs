// Real 0.19 rendering evidence for the 0.7.0 candidate. Isolated data and synthetic content only.
// Usage: node evidence-070.mjs /path/to/pi-pocket-production
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.argv[2]) {
    throw new Error("Explicit Pi Pocket 0.19 source directory required");
}

const source = resolve(process.argv[2]);
const hostImport = (path) => import(pathToFileURL(join(source, path)));
const { cleanUp, newSession, openApp, owner, root, scriptedModel, until } = await hostImport(
    "test/helpers.ts",
);
const { Browsers } = await hostImport("src/server/browser.ts");
const { findBrowser } = await hostImport("src/server/browser/discovery.ts");
const { VIEWPORTS } = await hostImport("src/server/browser/viewport.ts");
const { createHandler } = await hostImport("src/server/http.ts");

assert.ok(findBrowser(), "Chromium is required");

const label = source.split("/").filter(Boolean).at(-1) ?? "source";
const evidence = fileURLToPath(new URL(`./evidence-output/0.7.0-${label}`, import.meta.url));
mkdirSync(evidence, { recursive: true });

const data = join(root, "zh-070-evidence");
mkdirSync(join(data, "extensions"), { recursive: true });
copyFileSync(fileURLToPath(new URL("./zh-cn-ui.ts", import.meta.url)), join(data, "extensions", "zh-cn-ui.ts"));

const app = await openApp(scriptedModel(), data);
const session = await newSession(app);
await app.commands.updateSession(session, owner(app), { title: "Menu" });
await app.setExtensionEnabled(owner(app), "zh-cn-ui.ts", true);
const server = createServer(
    createHandler({ app, listen: { host: "127.0.0.2", port: 0 }, restart: () => {} }),
);
await new Promise((resolveListen) => server.listen(0, "127.0.0.2", resolveListen));
const base = `http://127.0.0.2:${server.address().port}`;
const browsers = new Browsers({
    dataDir: mkdtempSync(join(root, "zh-070-browser-")),
    load: async () => undefined,
    save: () => {},
});

const sheets = ["menu", "appearance", "extensions", "providers", "memory", "schedules", "session"];
const captions = {
    menu: "菜单",
    appearance: "外观",
    extensions: "扩展",
    providers: "模型提供方",
    memory: "记忆",
    session: "会话",
};
const report = { source, viewports: {}, residualEnglish: [], errors: [], checks: {} };
const pageErrors = [];
const allow = /^(Pi|PiP|GitHub|API|JSON|Markdown|Omarchy|CSS|HTML|SVG|URL|HTTP|SSE|ID|PR|Menu|faux-1|tok\/s|tokens\/s|ms|s|Esc|Alt|Ctrl|Enter|Tab|Cmd|OpenAI|Anthropic|Claude|GPT|Luna|Sol|[A-Za-z0-9_.@/:-]+\.(?:ts|js|json|md|png|css))$/;

try {
    for (const [name, viewport] of [
        ["mobile", VIEWPORTS.mobile],
        ["desktop", VIEWPORTS.desktop],
    ]) {
        const page = await browsers.open(name === "mobile" ? 801 : 802, {
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

        await shot("composer");
        const texts = { composer: await page.evaluate("return document.body.innerText") };

        for (const type of sheets) {
            const open =
                type === "session"
                    ? `openSheet({ type: "session", id: store.state.conversationId })`
                    : type === "extensions"
                      ? `openSheet({ type: "extensions", tab: "installed" })`
                      : `openSheet({ type: ${JSON.stringify(type)} })`;
            await page.evaluate(
                `(await import('/store.js')).closeSheet(); const { store, openSheet } = await import('/store.js'); ${open}`,
            );
            await until(
                async () =>
                    JSON.parse(
                        await page.evaluate(
                            "return JSON.stringify(!!document.querySelector('.sheet'))",
                        ),
                    ) === true,
                `${name} ${type} sheet`,
                15_000,
            );
            await new Promise((resolveWait) => setTimeout(resolveWait, 250));
            texts[type] = await page.evaluate(
                "return document.querySelector('.sheet')?.innerText ?? ''",
            );
            await shot(type);
            await page.evaluate("(await import('/store.js')).closeSheet()");
            await until(
                async () =>
                    JSON.parse(
                        await page.evaluate(
                            "return JSON.stringify(!document.querySelector('.sheet'))",
                        ),
                    ) === true,
                `${name} ${type} sheet closed`,
                10_000,
            );
        }

        const all = Object.values(texts).join("\n");
        const overflow = JSON.parse(
            await page.evaluate(
                "return JSON.stringify(document.documentElement.scrollWidth > innerWidth + 2)",
            ),
        );
        const lang = await page.evaluate("return document.documentElement.lang");
        const broken = /\{\{[^}]+\}\}|\uFFFD/.test(all);
        const check = {
            lang,
            overflow,
            broken,
            captions: Object.fromEntries(
                Object.entries(captions).map(([key, text]) => [key, all.includes(text)]),
            ),
        };

        assert.equal(overflow, false, `${name} horizontal overflow`);
        assert.equal(broken, false, `${name} unresolved placeholder or replacement character`);
        assert.equal(lang, "zh-CN", `${name} locale`);

        for (const [type, text] of Object.entries(captions)) {
            assert.equal(check.captions[type], true, `${name} ${type} shows ${text}`);
        }

        const residual = [];

        for (const [panel, text] of Object.entries(texts)) {
            for (const line of [...new Set(text.split("\n").map((value) => value.trim()))]) {
                if (!line) {
                    continue;
                }

                const words = (line.match(/[A-Za-z][A-Za-z'’-]+/g) ?? []).filter(
                    (word) => !allow.test(word) && !allow.test(line),
                );

                if (words.length > 0 && !/^[\d\s.,:;%·+\-/()]+$/.test(line)) {
                    residual.push({ panel, line });
                }
            }
        }

        report.viewports[name] = { ...check, screenshots: sheets.length + 1 };
        report.texts ??= {};
        report.texts[name] = texts;
        report.residualEnglish.push(...residual.map((entry) => ({ viewport: name, ...entry })));

        await page.evaluate(`(await import('/store.js')).closeSheet()`);
        report.errors.push(
            ...page
                .logs()
                .filter((entry) => entry.level === "error")
                .map((entry) => ({ viewport: name, message: entry.message })),
        );
        await browsers.close(name === "mobile" ? 801 : 802);
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

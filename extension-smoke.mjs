// Isolated extension test. Usage: node extension-smoke.mjs /path/to/pi-pocket-source
import assert from "node:assert/strict";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
const source = process.argv[2];
if (!source) throw new Error("Explicit Pi Pocket source directory required");
const rootSource = resolve(source);
const {
  context,
  cleanUp,
  newSession,
  openApp,
  owner,
  root,
  say,
  scriptedModel,
} = await import(pathToFileURL(join(rootSource, "test/helpers.ts")));
const { fauxAssistantMessage, fauxText } = await import(
  pathToFileURL(
    join(
      rootSource,
      "node_modules/@earendil-works/pi-ai/dist/providers/faux.js",
    ),
  )
);
let seenPrompt = "";
let seenTools = [];
const model = scriptedModel((context) => {
  seenPrompt = JSON.stringify(context.messages);
  return fauxAssistantMessage([fauxText("隔离测试完成")]);
});
const data = join(root, "zh-extension-smoke");
mkdirSync(join(data, "extensions"), { recursive: true });
copyFileSync(
  fileURLToPath(new URL("./zh-cn-localization.ts", import.meta.url)),
  join(data, "extensions/zh-cn-localization.ts"),
);
let app;
try {
  app = await openApp(model, data);
  const modules = (await app.extensions(owner(app))).modules;
  assert.equal(
    modules.find((module) => module.file === "zh-cn-localization.ts")?.enabled,
    false,
  );
  await app.setExtensionEnabled(owner(app), "zh-cn-localization.ts", true);
  const id = await newSession(app);
  const conversation = await app.harness.conversation(id, context);
  seenTools = (await conversation.agent(context)).tools;
  await say(app, id, "请进行隔离验证");
  assert.match(seenPrompt, /默认使用简体中文回答/);
  assert.match(seenPrompt, /原始日志/);
  assert.match(JSON.stringify(seenTools), /读取文本文件/);
  assert.match(JSON.stringify(seenTools), /操作用户可实时查看的 Chromium/);
  console.log(
    "PASS: default-off drop-in, enable in isolated app, Chinese prompt and tool descriptions",
  );
} finally {
  await app?.close();
  cleanUp();
}

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { test } from "node:test";

const source = await readFile(
  new URL("./zh-cn-ui.ts", import.meta.url),
  "utf8",
);
// The pack is data-only; do not import Pi Durable or connect to a running app.
const data = source.slice(
  source.indexOf("const strings ="),
  source.indexOf("export default"),
);
const { strings, templates } = vm.runInNewContext(
  `${data}\n({ strings, templates })`,
);
const runtime = await readFile(
  new URL("./test/fixtures/i18n.js", import.meta.url),
  "utf8",
);
const { t, setUiLocales } = await import(
  `data:text/javascript;base64,${Buffer.from(runtime).toString("base64")}`
);
const pack = { locale: "zh-CN", default: true, strings, templates };
const placeholders = (s) =>
  [...s.matchAll(/{{([A-Za-z][A-Za-z0-9_]*)}}/g)].map((m) => m[1]).sort();

test("static entries and parameterized templates use the correct dictionary", () => {
  for (const [key, value] of Object.entries(strings)) {
    assert.equal(key.includes("{{"), false, key);
    assert.equal(value.includes("{{"), false, key);
  }
  for (const [key, value] of Object.entries(templates)) {
    assert.ok(key.includes("{{"), key);
    assert.deepEqual(placeholders(key), placeholders(value), key);
  }
});

test("screenshot regressions translate with the runtime fixture and revert on disable", async () => {
  const keys = [
    "API key",
    "Log out",
    "signed in",
    "not configured",
    "Pi Pocket shares Pi's sign-ins",
    "here now",
    "Write the plan here…",
    "Show hidden",
    "New folder",
    "No archived sessions.",
    "follows your Omarchy theme",
    "Sign in with ChatGPT",
    "Read",
    "You",
    "15 min",
    "1 hour",
    "in 15 minutes",
    "Put a .ts extension module in",
    "Registers Simplified Chinese UI strings for Pi Pocket's explicit localization API.",
    "Spend goes to whoever asked for the work. Past a limit, Pi takes no new messages there, and a run that crosses it stops.",
  ];
  const shortcuts = [
    "Launcher: sessions, actions, themes",
    "… Alt 9: jump to a session, like a workspace",
    "Alt ↓: previous or next session",
    "New session",
    "Open or close the browser",
    "Open or close the Files tile: the folder's files, and what changed",
    "k: in Changes, the next or previous file",
    "p: in Changes, the next or previous change",
    "In Changes: mark the file viewed, or not",
    "In Changes: the layout, auto, split, or unified",
    "In Changes: wrap long lines, or not",
    "Show or hide peek tiles",
    "Fold or unfold the sidebar",
    "In the sidebar: select a session; drag to select every one you pass",
    "In the sidebar: select a run of sessions",
    "Hold to see session numbers",
    "In the message box: commands",
    "In the message box: mention a file or folder",
    "In the message box: run a command (!! keeps it from Pi)",
    "In an empty message box: what you sent before",
    "In the message box: search what you sent before",
    "Find in this session",
    "Stop Pi while it works",
    "This list",
    "Close what is open",
  ];
  assert.equal(shortcuts.length, 25);
  keys.push(...shortcuts);
  for (const active of [false, true, false, true]) {
    setUiLocales(active ? [pack] : []);
    for (const key of keys) {
      if (active) {
        assert.ok(Object.hasOwn(strings, key), `missing static entry: ${key}`);
        assert.notEqual(t(key), key, key);
      } else assert.equal(t(key), key);
    }
  }
  const model = "custom {{name}} / gpt-model";
  assert.equal(
    t("switched the model to {{model}}", { model }),
    `切换了模型：${model}`,
  );
  assert.equal(
    t("only “{{title}}”", { title: "a user-created title" }),
    "仅限“a user-created title”",
  );
  assert.equal(
    t(
      "Scan this on the other device, or send it the link. It works once and expires {{lasting}}. Whoever joins sees {{where}}.",
      { lasting: t("in 15 minutes"), where: t("every session") },
    ),
    "请在另一台设备上扫描此码或发送链接。该链接仅可使用一次，并于 15 分钟后过期。加入者可以访问：所有会话。",
  );
  assert.equal(t("Desktop · {{theme}}", { theme: "nyxuri" }), "桌面 · nyxuri");
  assert.equal(
    t("arbitrary user message /home/foo"),
    "arbitrary user message /home/foo",
  );
  setUiLocales([]);
});

test("0.13 composer source keys translate, preserve missing-key fallback, and revert", () => {
  const entries = [
    ["Listening…", "正在聆听…"],
    ["Ask Pi anything…", "向 Pi 提问…"],
    ["Queue a message for after this run…", "排队发送消息，待本次运行结束后处理…"],
  ];
  for (const active of [false, true, false]) {
    setUiLocales(active ? [pack] : []);
    for (const [key, translated] of entries) {
      assert.equal(t(key), active ? translated : key);
    }
    assert.equal(t("A future UI label not in this pack"), "A future UI label not in this pack");
    assert.equal(
      t("Unknown {{model}}", { model: "Menu {{name}} / custom-model" }),
      "Unknown Menu {{name}} / custom-model",
    );
  }
  setUiLocales([]);
});

test("reviewed 0.13 coverage contract translates every approved key and falls back on disable", async () => {
  const contract = JSON.parse(await readFile(new URL("./locale-coverage.json", import.meta.url), "utf8"));
  const keys = new Set();
  let templateCount = 0;
  try {
    for (const active of [false, true, false, true]) {
      setUiLocales(active ? [pack] : []);
      for (const group of contract.groups) {
        for (const [key, translation] of Object.entries(group.strings)) {
          assert.equal(strings[key], translation, `${group.file}: ${key}`);
          assert.equal(t(key), active ? translation : key, `${group.file}: ${key}`);
          keys.add(key);
        }
        for (const [key, translation] of Object.entries(group.templates)) {
          assert.equal(templates[key], translation, key);
          const number = "17 {{name}} / custom-model";
          assert.equal(
            t(key, { number }),
            (active ? translation : key).replace("{{number}}", number),
            "the PR number parameter is inserted verbatim, not recursively translated",
          );
        }
      }
      assert.equal(t("Unreviewed future UI label"), "Unreviewed future UI label");
      const original = "Memory / 用户原文 / custom-model / secret-{{number}}";
      assert.equal(t("Open {{title}}", { title: original }), (active ? "打开 " : "Open ") + original);
      assert.equal(t("Server unreachable: ") + "RAW {{name}} ECONNRESET", (active ? "无法连接服务器：" : "Server unreachable: ") + "RAW {{name}} ECONNRESET");
    }
    for (const group of contract.groups) templateCount += Object.keys(group.templates).length;
    assert.equal(keys.size, 64);
    assert.equal(templateCount, 1);
  } finally {
    setUiLocales([]);
  }
});

test("expanded surface contract preserves every placeholder and supports live fallback", async () => {
  const expanded = JSON.parse(await readFile(new URL("./locale-expansion.json", import.meta.url), "utf8"));
  const value = "Menu {{name}} <img src=x onerror=alert(1)> $& /custom-provider/model /home/user 密钥";
  try {
    for (const enabled of [false, true, false, true]) {
      setUiLocales(enabled ? [pack] : []);
      for (const [key, translation] of Object.entries(expanded.strings)) {
        assert.ok(expanded.sourceEvidence[key]?.length > 0, `source evidence: ${key}`);
        assert.equal(strings[key], translation, key);
        assert.equal(t(key), enabled ? translation : key, key);
      }
      for (const [key, translation] of Object.entries(expanded.templates)) {
        assert.ok(expanded.sourceEvidence[key]?.length > 0, `source evidence: ${key}`);
        assert.equal(templates[key], translation, key);
        assert.deepEqual(placeholders(key), placeholders(translation), key);
        const params = Object.fromEntries(placeholders(key).map((name) => [name, value]));
        assert.equal(t(key, params), (enabled ? translation : key).replace(/{{[A-Za-z][A-Za-z0-9_]*}}/g, () => value), key);
      }
      assert.equal(t("Future unknown UI key"), "Future unknown UI key");
      assert.equal(t("Future {{value}}", { value }), `Future ${value}`);
    }
  } finally {
    setUiLocales([]);
  }
});

test("app notices translate while dynamic names, paths, and errors stay intact", () => {
  setUiLocales([pack]);
  assert.equal(
    t("Restarting. Running work continues after the restart."),
    "正在重启。重启后当前任务会继续运行。",
  );
  assert.equal(
    t("Signed in to {{provider}}.", { provider: "custom-provider" }),
    "已登录到 custom-provider。",
  );
  assert.equal(
    t("Archived {{what}}. Tap to undo.", { what: "“my private session”" }),
    "已归档 “my private session”。点击撤销。",
  );
  assert.equal(
    t("{{count}} new chat messages", { count: 3 }),
    "收到 3 条新聊天消息",
  );
  assert.equal(
    t("Deleted {{path}}.", { path: "/home/person/private.txt" }),
    "已删除 /home/person/private.txt。",
  );
  assert.equal(
    t("Server unreachable: ") + "ECONNRESET",
    "无法连接服务器：ECONNRESET",
  );
  setUiLocales([]);
});

// Terminology and 0.19 source-key consistency. Every assertion names the production call site it guards.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./zh-cn-ui.ts", import.meta.url), "utf8");

function unpack(name) {
    const match = source.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`));
    assert.ok(match, `${name} object is present`);

    return new Function(`return (${match[1]});`)();
}

const strings = unpack("strings");
const templates = unpack("templates");
const entries = [...Object.entries(strings), ...Object.entries(templates)];
const values = (key) => strings[key] ?? templates[key];

test("0.19 gallery separates the installed state from the install time", () => {
    // web/sheets/gallery.js: TABS and RowState use t("Installed"); EntryFacts uses t("Installed at").
    assert.equal(values("Installed"), "已安装");
    assert.equal(values("Installed at"), "安装时间");
});

test("one Chinese term for each English concept, with the source call site it serves", () => {
    // web/sheets/providers.js: the sheet's subtitle.
    assert.equal(values("sign in to model providers"), "登录模型提供方");

    // web/files-panel.js, web/extension-ui.js, web/subagents-board.js: back to the conversation.
    assert.equal(values("Back to the conversation"), "返回对话");

    // web/pip.js: opening PiP as a conversation.
    assert.equal(values("Open as a conversation"), "作为对话打开");
    assert.equal(values("Open as a conversation, with every step"), "作为对话打开，查看每个步骤");

    // web/sheets/menu.js: scheduled messages still to be sent, not tasks to run.
    assert.equal(values("{{count}} coming"), "{{count}} 项待发送");

    // Conversations are 对话; sessions are 会话. Keys that name both may use both.
    for (const [key, value] of entries) {
        if (/conversation/i.test(key) && !/session/i.test(key)) {
            assert.ok(!value.includes("会话"), `conversation key uses 会话: ${key}`);
        }

        if (/session/i.test(key) && !/conversation/i.test(key)) {
            assert.ok(!value.includes("对话"), `session key uses 对话: ${key}`);
        }
    }

    for (const [key, value] of entries) {
        for (const banned of ["提供商", "插件"]) {
            assert.ok(!value.includes(banned), `${banned} in ${key}`);
        }
    }
});

test("the 0.19 extensions and memory copy reads as written, not word by word", () => {
    // web/sheets/extensions.js: install stays off; nothing runs before the owner turns it on.
    assert.equal(
        values("Extensions install turned off. Nothing runs until you turn it on."),
        "扩展安装后保持关闭，启用前不会运行。",
    );
    // web/sheets/memory.js: proposals happen only when asked, or when sure; the owner approves.
    assert.match(
        values(
            "Pi proposes one only when asked, or when sure it will help in many later sessions, and the owner approves; yours count at once.",
        ),
        /^Pi 只会在被要求时，/,
    );
});

test("template placeholders, replacement characters, and baseline entries stay intact", () => {
    const slots = (text) =>
        [...new Set([...text.matchAll(/\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g)].map((m) => m[1]))].sort();

    for (const [key, value] of Object.entries(templates)) {
        assert.deepEqual(slots(value), slots(key), key);
    }

    for (const [key, value] of entries) {
        assert.ok(!value.includes("\uFFFD"), `replacement character in ${key}`);
        assert.ok(
            !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(value),
            `unpaired surrogate in ${key}`,
        );
    }

    const baseline = JSON.parse(
        readFileSync(new URL("./test/fixtures/baseline-0.6.0-keys.json", import.meta.url), "utf8"),
    );

    for (const key of baseline.strings) {
        assert.ok(Object.hasOwn(strings, key), `removed string: ${key}`);
    }

    for (const key of baseline.templates) {
        assert.ok(Object.hasOwn(templates, key), `removed template: ${key}`);
    }
});

test("dynamic 0.19 slot and metadata keys are present with source evidence", () => {
    // web/slots.js SLOTS labels, rendered by web/sheets/appearance.js as t(SLOTS[slot].label).
    const slotLabels = {
        "Top bar buttons": "顶栏按钮",
        "Status line items": "状态栏项目",
        "Message box buttons": "输入框按钮",
        "Places (phones)": "快捷入口（手机）",
        "Under Pi's answers": "Pi 回答下方",
    };
    // defineItem labels, rendered by web/sheets/appearance.js as t(item.label).
    const itemLabels = {
        Connection: "连接",
        "People here": "在线成员",
        Cache: "缓存",
        "Lancet Guard": "Lancet Guard",
    };
    // web/sheets/providers.js group titles.
    const providerGroups = { "Needs sign-in": "需要登录", "Signed in": "已登录", "Not configured": "未配置" };
    // Built-in extension metadata shown by the Extensions sheet.
    const extensions = {
        "Agent Teams": "代理团队",
        "Claude subscription billing": "Claude 订阅计费",
        "Lancet Guard is off (PI_POCKET_GUARD=off); tools run unguarded.":
            "Lancet Guard 已关闭（PI_POCKET_GUARD=off）；工具将不经检查运行。",
        "Extension gallery": "扩展库",
    };

    for (const [key, value] of Object.entries({
        ...slotLabels,
        ...itemLabels,
        ...providerGroups,
        ...extensions,
        unread: "条未读",
    })) {
        assert.equal(strings[key], value, key);
    }
});

test("0.20 fonts, artifact sharing and session UI use source-backed keys", () => {
    // web/sheets/appearance.js: TextSize, FontTools.
    const appearance = {
        "Text size in pixels": "以像素为单位的字号",
        "Fonts for {{theme}}": "{{theme}} 的字体",
        Ligatures: "连字",
        "Font preview": "字体预览",
        "Duplicate to change": "复制后修改",
        "The conversation's, in pixels: any from {{min}} to {{max}}":
            "对话的字号（像素）：{{min}} 到 {{max}} 之间的任意值",
    };
    // web/sheets/viewers.js: ArtifactShareSheet and ShareRow.
    const sharing = {
        "Publish it to anyone with a link": "发布给任何持有链接的人",
        Share: "分享",
        Lasts: "有效期",
        "Publish link": "发布链接",
        "No link yet. A published page stays out of the app, and out of everything an invite to this session gave.":
            "尚无链接。已发布的页面不会出现在应用内，也不会出现在邀请此会话时授予的任何内容中。",
        "Until I end it": "直到我结束",
        "A day": "一天",
        "A week": "一周",
        "A month": "一个月",
    };
    // web/sheets/file.js, web/sheets/sessions.js, web/sheets/shortcuts.js, web/transcript.js.
    const elsewhere = {
        "Show in the file manager": "在文件管理器中显示",
        "No sessions match the filters.": "没有会话符合这些筛选条件。",
        "Message box: from extensions": "输入框：来自扩展",
        "Message time": "消息时间",
        "Loading earlier messages": "正在加载更早的消息",
    };

    for (const [key, value] of Object.entries({ ...appearance, ...sharing, ...elsewhere })) {
        assert.equal(strings[key] ?? templates[key], value, key);
    }
});

import assert from "node:assert/strict";
import { test } from "node:test";
import register, { pack } from "./zh-cn-semantic.ts";

test("the standalone module registers exactly one data-only semantic Chinese catalog", () => {
    const registrations = [];

    assert.equal(register(undefined, { uiLocales: (value) => registrations.push(value) }), undefined);
    assert.deepEqual(registrations, [[pack]]);
    assert.deepEqual(Object.keys(pack).sort(), ["id", "label", "messages"]);
    assert.equal(pack.id, "zh-CN");
    assert.equal(pack.label, "简体中文");
    assert.equal(pack.messages["ui.close"], "关闭");
    assert.ok(Object.values(pack.messages).every((value) => typeof value === "string"));
});

test("a server without the semantic API receives an explicit compatibility error", () => {
    assert.throws(() => register(undefined, {}), /needs a Pi Pocket build with web\.uiLocales/);
});

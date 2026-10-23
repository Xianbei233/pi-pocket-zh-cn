// Check the distributable drop-in, full dictionary shape, limits, templates, and exact GitHub pack compatibility.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const path = new URL("./zh-cn-ui.ts", import.meta.url);
const source = readFileSync(path, "utf8");
const unpack = (name) => {
    const match = source.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`));
    assert.ok(match, `${name} object is present`);

    return vm.runInNewContext(`(${match[1]})`);
};
const strings = unpack("strings");
const templates = unpack("templates");
const sha256 = createHash("sha256").update(source).digest("hex");

test("0.8.0 contains the full local-runtime pack and stays within loader bounds", () => {
    const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
    const latest = JSON.parse(readFileSync(new URL("./locale-expansion.json", import.meta.url), "utf8"));
    const bytes = Buffer.byteLength(JSON.stringify({
        locale: "zh-CN",
        label: "简体中文",
        default: true,
        strings,
        templates,
    }));

    assert.equal(pkg.version, "0.8.0");
    assert.equal(pkg.private, true, "the project is not published to npm");
    assert.equal(Object.keys(strings).length, 1461);
    assert.equal(Object.keys(templates).length, 294);
    assert.equal(Object.keys(latest.strings).length, 302);
    assert.equal(Object.keys(latest.templates).length, 111);
    assert.ok(bytes < 512 * 1024, `serialized locale size ${bytes} stays under host limit`);
    assert.equal(sha256, "356cc8119d39977880192064bde515198a6f18945cb22cd825337f895131e51c");
});

test("all template slots match and every key/translation is unique and well-formed", () => {
    const keys = [...Object.keys(strings), ...Object.keys(templates)];
    const slots = (value) => [...new Set([...value.matchAll(/\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g)].map((match) => match[1]))].sort();

    assert.equal(new Set(keys).size, keys.length, "no duplicate source keys across maps");
    for (const [key, value] of Object.entries(strings)) {
        assert.equal(typeof value, "string", key);
        assert.ok(value.length > 0, `non-empty translation for ${key}`);
        assert.deepEqual(slots(value), [], `fixed string has no unresolved template slots: ${key}`);
    }
    for (const [key, value] of Object.entries(templates)) {
        assert.equal(typeof value, "string", key);
        assert.ok(value.length > 0, `non-empty translation for ${key}`);
        assert.deepEqual(slots(value), slots(key), `template placeholders match for ${key}`);
    }
});

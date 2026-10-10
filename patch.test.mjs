import assert from "node:assert/strict";
import {
  readFile,
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  access,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

const patch = JSON.parse(
  await readFile(new URL("./ui-patch.json", import.meta.url), "utf8"),
);
const byPath = new Map(patch.map((entry) => [entry.path, entry]));

test("UI patch uses explicit call sites, not a global text rewrite", () => {
  assert.equal(byPath.size, patch.length);
  assert.ok(patch.length > 0);
  const ui = byPath.get("web/ui.js").after;
  assert.match(ui, /export const html = htm\.bind\(h\);/);
  for (const { path, after } of patch) {
    assert.ok(!after.includes("localizedH"), `${path} contains unsafe wrapper`);
  }
});

test("document locale and core menu labels are packaged", () => {
  assert.match(byPath.get("web/index.html").after, /lang="zh-CN"/);
  assert.match(byPath.get("web/sheets/menu.js").after, /t\("Appearance"\)/);
  assert.match(byPath.get("web/sheets/menu.js").after, /t\("Extensions"\)/);
});

test("dictionary handles whitespace, unknown input, and prototype keys", async () => {
  const source = byPath.get("web/i18n.js").after;
  const { t } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
  assert.equal(t("Menu"), "菜单");
  assert.equal(t("Copy"), "复制");
  assert.equal(t("  Menu  "), "  菜单  ");
  assert.equal(t("an unknown UI label"), "an unknown UI label");
  assert.equal(t("toString"), "toString");
  assert.equal(t("__proto__"), "__proto__");
  assert.equal(t(null), null);
  assert.equal(t(42), 42);
});

test("real payload installs and uninstalls byte-for-byte on an isolated baseline", async () => {
  const target = await mkdtemp(join(tmpdir(), "zh-real-patch-"));
  const installer = fileURLToPath(new URL("./install-ui.mjs", import.meta.url));
  try {
    await mkdir(join(target, "web"));
    await writeFile(join(target, "package.json"), '{"type":"module"}');
    for (const { path, before } of patch) {
      if (before === null) continue;
      const filename = join(target, path);
      await mkdir(dirname(filename), { recursive: true });
      await writeFile(filename, before);
    }
    for (const command of ["check", "install", "check", "install"]) {
      execFileSync(process.execPath, [installer, command, target], {
        stdio: "pipe",
      });
    }
    for (const { path, after } of patch)
      assert.equal(await readFile(join(target, path), "utf8"), after);
    execFileSync(process.execPath, [installer, "uninstall", target], {
      stdio: "pipe",
    });
    for (const { path, before } of patch) {
      if (before === null) await assert.rejects(access(join(target, path)));
      else assert.equal(await readFile(join(target, path), "utf8"), before);
    }
    execFileSync(process.execPath, [installer, "check", target], {
      stdio: "pipe",
    });
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INSTALLER = path.join(HERE, "install-ui.mjs");
const BACKUP = ".pi-pocket-zh-cn-backup";

const payload = [
  {
    path: "web/index.html",
    before: "<!doctype html>\n<h1>Original</h1>\n",
    after: "<!doctype html>\n<h1>Localized</h1>\n",
  },
  {
    path: "web/assets/new-module.js",
    before: null,
    after: "export const label = '中文';\n",
  },
];

function fixture(entries = payload) {
  const temp = mkdtempSync(path.join(os.tmpdir(), "pi-pocket-installer-test-"));
  const target = path.join(temp, "checkout");
  const web = path.join(target, "web");
  mkdirSync(web, { recursive: true });
  for (const entry of entries) {
    if (entry.before === null) continue;
    const filename = path.join(web, ...entry.path.slice(4).split("/"));
    mkdirSync(path.dirname(filename), { recursive: true });
    writeFileSync(filename, entry.before, "utf8");
  }
  const patchPath = path.join(temp, "synthetic-ui-patch.json");
  writeFileSync(patchPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  return { temp, target, web, patchPath };
}

function run(fx, command, options = {}) {
  const args = [INSTALLER, command];
  if (options.target !== false) args.push(options.target ?? fx.target);
  args.push("--patch", options.patch ?? fx.patchPath);
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

function succeeds(result) {
  assert.equal(
    result.status,
    0,
    `Expected success.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
  );
}

function fails(result, text) {
  assert.notEqual(
    result.status,
    0,
    `Expected failure.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
  );
  if (text) assert.match(result.stderr, text);
}

test("check, install, idempotent install, and uninstall round-trip using --patch", (t) => {
  const fx = fixture();
  t.after(() => rmSync(fx.temp, { recursive: true, force: true }));

  succeeds(run(fx, "check"));
  assert.match(run(fx, "check").stdout, /ready to install/);
  assert.equal(existsSync(path.join(fx.target, BACKUP)), false);

  succeeds(run(fx, "install"));
  assert.equal(
    readFileSync(path.join(fx.web, "index.html"), "utf8"),
    payload[0].after,
  );
  assert.equal(
    readFileSync(path.join(fx.web, "assets/new-module.js"), "utf8"),
    payload[1].after,
  );
  assert.equal(existsSync(path.join(fx.target, BACKUP, "manifest.json")), true);

  assert.match(run(fx, "check").stdout, /intact/);
  assert.match(run(fx, "install").stdout, /already installed/);
  succeeds(run(fx, "uninstall"));
  assert.equal(
    readFileSync(path.join(fx.web, "index.html"), "utf8"),
    payload[0].before,
  );
  assert.equal(existsSync(path.join(fx.web, "assets/new-module.js")), false);
  assert.equal(existsSync(path.join(fx.target, BACKUP)), false);
});

test("validates every baseline before writing any file", (t) => {
  const fx = fixture();
  t.after(() => rmSync(fx.temp, { recursive: true, force: true }));
  const changed = path.join(fx.web, "index.html");
  writeFileSync(changed, "locally modified\n", "utf8");

  fails(run(fx, "install"), /Baseline conflict/);
  assert.equal(readFileSync(changed, "utf8"), "locally modified\n");
  assert.equal(existsSync(path.join(fx.web, "assets/new-module.js")), false);
  assert.equal(existsSync(path.join(fx.target, BACKUP)), false);
});

test("refuses uninstall if an installed file changed and preserves all files", (t) => {
  const fx = fixture();
  t.after(() => rmSync(fx.temp, { recursive: true, force: true }));
  succeeds(run(fx, "install"));
  const changed = path.join(fx.web, "index.html");
  writeFileSync(changed, "external edit\n", "utf8");

  fails(run(fx, "uninstall"), /changed or removed/);
  assert.equal(readFileSync(changed, "utf8"), "external edit\n");
  assert.equal(
    readFileSync(path.join(fx.web, "assets/new-module.js"), "utf8"),
    payload[1].after,
  );
  assert.equal(existsSync(path.join(fx.target, BACKUP, "manifest.json")), true);
});

test("rejects malformed staged JavaScript before creating backups or changing files", (t) => {
  const bad = [
    {
      path: "web/index.html",
      before: "<h1>Original</h1>\n",
      after: "<h1>Changed</h1>\n",
    },
    { path: "web/assets/bad.js", before: null, after: "export const = ;\n" },
  ];
  const fx = fixture(bad);
  t.after(() => rmSync(fx.temp, { recursive: true, force: true }));

  fails(run(fx, "install"), /Staged JavaScript syntax check failed/);
  assert.equal(
    readFileSync(path.join(fx.web, "index.html"), "utf8"),
    bad[0].before,
  );
  assert.equal(existsSync(path.join(fx.web, "assets/bad.js")), false);
  assert.equal(existsSync(path.join(fx.target, BACKUP)), false);
});

test("rejects symlink traversal in a payload path", (t) => {
  const fx = fixture();
  const outside = path.join(fx.temp, "outside");
  mkdirSync(outside);
  symlinkSync(outside, path.join(fx.web, "assets"));
  t.after(() => rmSync(fx.temp, { recursive: true, force: true }));

  fails(run(fx, "install"), /Symlink/);
  assert.equal(existsSync(path.join(outside, "new-module.js")), false);
  assert.equal(existsSync(path.join(fx.target, BACKUP)), false);
});

test("requires an explicit target and confines --patch fixtures to the supplied target", (t) => {
  const fx = fixture();
  t.after(() => rmSync(fx.temp, { recursive: true, force: true }));
  const noTarget = spawnSync(
    process.execPath,
    [INSTALLER, "check", "--patch", fx.patchPath],
    { encoding: "utf8" },
  );
  fails(noTarget, /explicit SOURCE_DIR/);

  const other = path.join(fx.temp, "other");
  mkdirSync(path.join(other, "web"), { recursive: true });
  fails(run(fx, "check", { target: other }), /Baseline conflict/);
  assert.equal(existsSync(path.join(fx.target, BACKUP)), false);
});

test("rejects ../ traversal before creating backups or writing outside web/", (t) => {
  const unsafe = [
    {
      path: "web/../outside.txt",
      before: null,
      after: "must not be written\n",
    },
  ];
  const fx = fixture(unsafe);
  t.after(() => rmSync(fx.temp, { recursive: true, force: true }));

  fails(run(fx, "install"), /Unsafe relative path/);
  assert.equal(existsSync(path.join(fx.target, "outside.txt")), false);
  assert.equal(existsSync(path.join(fx.target, BACKUP)), false);
});

test("rolls back a web write when the immediate post-write node --check fails", (t) => {
  const entries = [
    {
      path: "web/index.html",
      before: "<h1>Original</h1>\n",
      after: "<h1>Changed</h1>\n",
    },
    {
      path: "web/new-module.js",
      before: null,
      after: "console.log(import.meta.url);\n",
    },
  ];
  const fx = fixture(entries);
  writeFileSync(
    path.join(fx.web, "package.json"),
    '{"type":"commonjs"}\n',
    "utf8",
  );
  t.after(() => rmSync(fx.temp, { recursive: true, force: true }));

  fails(run(fx, "install"), /Post-write JavaScript syntax check failed/);
  assert.equal(
    readFileSync(path.join(fx.web, "index.html"), "utf8"),
    entries[0].before,
  );
  assert.equal(existsSync(path.join(fx.web, "new-module.js")), false);
  assert.equal(existsSync(path.join(fx.target, BACKUP)), false);
});

test("refuses an existing symlink as the target", (t) => {
  const fx = fixture();
  const targetLink = path.join(fx.temp, "target-link");
  symlinkSync(fx.target, targetLink);
  t.after(() => rmSync(fx.temp, { recursive: true, force: true }));

  fails(run(fx, "check", { target: targetLink }), /Symlink/);
});

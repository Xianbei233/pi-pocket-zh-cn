#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const BACKUP_NAME = ".pi-pocket-zh-cn-backup";
const MANIFEST_NAME = "manifest.json";
const ORIGINALS_NAME = "originals";
const VERSION = 1;
const DEFAULT_PATCH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "ui-patch.json",
);

function fail(message) {
  throw new Error(message);
}

function usage() {
  return [
    "Usage: node install-ui.mjs <check|install|uninstall> SOURCE_DIR [--patch <ui-patch.json>]",
    "Patch paths are relative to SOURCE_DIR and must start with web/. The target and its web/ directory must already exist.",
  ].join("\n");
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!["check", "install", "uninstall"].includes(command)) fail(usage());
  let target;
  let patch = DEFAULT_PATCH;
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--patch") {
      const value = rest[++i];
      if (!value || value.startsWith("--"))
        fail(`Missing value for ${arg}.\n${usage()}`);
      patch = value;
    } else if (!arg.startsWith("-") && target === undefined) {
      target = arg;
    } else {
      fail(`Unknown argument: ${arg}\n${usage()}`);
    }
  }
  if (!target) fail(`An explicit SOURCE_DIR target is required.\n${usage()}`);
  return { command, target: path.resolve(target), patch: path.resolve(patch) };
}

function assertNodeVersion() {
  const major = Number(process.versions.node.split(".")[0]);
  if (!Number.isInteger(major) || major < 22)
    fail(`Node.js >=22 is required; found ${process.versions.node}.`);
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function isWellFormedText(value) {
  return typeof value === "string" && value.isWellFormed();
}

function parsePatch(patchPath) {
  let stat;
  try {
    stat = lstatSync(patchPath);
  } catch (error) {
    if (error.code === "ENOENT") fail(`Patch file not found: ${patchPath}`);
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isFile())
    fail(`Patch must be a regular, non-symlink file: ${patchPath}`);

  let raw;
  try {
    raw = readFileSync(patchPath, "utf8");
  } catch (error) {
    fail(`Cannot read patch ${patchPath}: ${error.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON in ${patchPath}: ${error.message}`);
  }
  if (!Array.isArray(parsed)) fail("Patch must be a JSON array.");

  const seen = new Set();
  const entries = parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      fail(`Patch entry ${index} must be an object.`);
    const { path: relativePath, before, after } = entry;
    if (
      typeof relativePath !== "string" ||
      !relativePath ||
      relativePath.startsWith("/") ||
      relativePath.includes("\\")
    ) {
      fail(
        `Invalid relative path in patch entry ${index}: ${String(relativePath)}`,
      );
    }
    if (!relativePath.startsWith("web/"))
      fail(`Patch path must start with web/: ${relativePath}`);
    const parts = relativePath.split("/");
    if (
      parts.some(
        (part) => !part || part === "." || part === ".." || part.includes("\0"),
      )
    ) {
      fail(`Unsafe relative path in patch entry ${index}: ${relativePath}`);
    }
    if (seen.has(relativePath)) fail(`Duplicate patch path: ${relativePath}`);
    seen.add(relativePath);
    if (before !== null && !isWellFormedText(before))
      fail(`Entry ${relativePath}: before must be null or valid Unicode text.`);
    if (!isWellFormedText(after))
      fail(`Entry ${relativePath}: after must be valid Unicode text.`);
    if (before === after)
      fail(
        `Entry ${relativePath}: before and after are identical; refusing a no-op patch.`,
      );
    return { path: relativePath, before, after };
  });

  entries.sort((a, b) => a.path.localeCompare(b.path));
  const patchHash = sha256(
    Buffer.from(
      JSON.stringify(
        entries.map(({ path: name, before, after }) => ({
          path: name,
          before,
          after,
        })),
      ),
      "utf8",
    ),
  );
  return { entries, patchHash };
}

function assertPathHasNoSymlinks(absolutePath, { allowMissing = false } = {}) {
  const parsed = path.parse(absolutePath);
  let current = parsed.root;
  const parts = absolutePath
    .slice(parsed.root.length)
    .split(path.sep)
    .filter(Boolean);
  for (const part of parts) {
    current = path.join(current, part);
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT" && allowMissing) return;
      throw error;
    }
    if (stat.isSymbolicLink())
      fail(`Symlink path component is not allowed: ${current}`);
  }
}

function validateTarget(targetArg) {
  assertPathHasNoSymlinks(targetArg);
  const targetStat = lstatSync(targetArg);
  if (!targetStat.isDirectory())
    fail(`Target must be an existing directory: ${targetArg}`);
  const target = realpathSync(targetArg);
  const web = path.join(target, "web");
  assertPathHasNoSymlinks(web);
  if (!lstatSync(web).isDirectory())
    fail(`Target must contain a web/ directory: ${target}`);
  return { target, web };
}

function pathState(webRoot, relativePath) {
  const parts = relativePath.slice(4).split("/");
  let current = webRoot;
  for (let i = 0; i < parts.length; i += 1) {
    current = path.join(current, parts[i]);
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
    if (stat.isSymbolicLink())
      fail(`Symlink in managed path is not allowed: ${current}`);
    const final = i === parts.length - 1;
    if (final) {
      if (!stat.isFile())
        fail(`Managed path is not a regular file: ${current}`);
      return {
        absolute: current,
        mode: stat.mode & 0o777,
        data: readFileSync(current),
      };
    }
    if (!stat.isDirectory())
      fail(`Managed path parent is not a directory: ${current}`);
  }
  return null;
}

function decodeUtf8(data, label) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(data);
  } catch {
    fail(`${label} is not valid UTF-8.`);
  }
}

function isJavaScriptPath(relativePath) {
  return /\.(?:js|mjs|cjs)$/i.test(relativePath);
}

function checkStagedJavaScript(source, relativePath) {
  let result;
  if (relativePath.toLowerCase().endsWith(".cjs")) {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-pocket-ui-check-"));
    const tempFile = path.join(tempDir, "staged.cjs");
    try {
      writeFileSync(tempFile, source, "utf8");
      result = spawnSync(process.execPath, ["--check", tempFile], {
        encoding: "utf8",
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  } else {
    // Browser .js files are checked as modules regardless of package.json location.
    result = spawnSync(process.execPath, ["--check", "--input-type=module"], {
      input: source,
      encoding: "utf8",
    });
  }
  if (result.error)
    fail(
      `Could not run node --check for ${relativePath}: ${result.error.message}`,
    );
  if (result.status !== 0) {
    fail(
      `Staged JavaScript syntax check failed for ${relativePath}:\n${(result.stderr || result.stdout || "").trim()}`,
    );
  }
}

function checkInstalledJavaScript(absolutePath, relativePath) {
  const result = spawnSync(process.execPath, ["--check", absolutePath], {
    encoding: "utf8",
  });
  if (result.error)
    fail(
      `Could not run node --check for ${relativePath}: ${result.error.message}`,
    );
  if (result.status !== 0) {
    fail(
      `Post-write JavaScript syntax check failed for ${relativePath}:\n${(result.stderr || result.stdout || "").trim()}`,
    );
  }
}

function validatePayloadJavaScript(entries) {
  for (const entry of entries) {
    if (isJavaScriptPath(entry.path))
      checkStagedJavaScript(entry.after, entry.path);
  }
}

function validateBaseline(web, entries) {
  const snapshots = new Map();
  for (const entry of entries) {
    const current = pathState(web, entry.path);
    const expected =
      entry.before === null ? null : Buffer.from(entry.before, "utf8");
    if (expected === null) {
      if (current !== null)
        fail(
          `Baseline conflict: ${entry.path} already exists (expected a new file).`,
        );
    } else if (current === null || !current.data.equals(expected)) {
      fail(
        `Baseline conflict: ${entry.path} does not exactly match the packaged before-content.`,
      );
    }
    snapshots.set(entry.path, current);
  }
  return snapshots;
}

function backupPaths(target) {
  const dir = path.join(target, BACKUP_NAME);
  return {
    dir,
    manifest: path.join(dir, MANIFEST_NAME),
    originals: path.join(dir, ORIGINALS_NAME),
  };
}

function readBackup(target) {
  const { dir, manifest: manifestPath, originals } = backupPaths(target);
  let dirStat;
  try {
    dirStat = lstatSync(dir);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  if (dirStat.isSymbolicLink() || !dirStat.isDirectory())
    fail(`Backup path is not a regular directory: ${dir}`);
  const manifestStat = lstatSync(manifestPath);
  if (manifestStat.isSymbolicLink() || !manifestStat.isFile())
    fail(`Backup manifest is missing or unsafe: ${manifestPath}`);
  const originalsStat = lstatSync(originals);
  if (originalsStat.isSymbolicLink() || !originalsStat.isDirectory())
    fail(`Backup originals directory is missing or unsafe: ${originals}`);

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`Cannot read backup manifest: ${error.message}`);
  }
  if (
    !manifest ||
    manifest.version !== VERSION ||
    !Array.isArray(manifest.entries) ||
    typeof manifest.patchHash !== "string"
  ) {
    fail("Backup manifest has an unsupported or invalid format.");
  }

  const expectedNames = new Set([MANIFEST_NAME, ORIGINALS_NAME]);
  const backupFiles = new Set();
  for (const entry of manifest.entries) {
    if (
      !entry ||
      typeof entry.path !== "string" ||
      !/^[a-f0-9]{64}$/.test(entry.afterSha256)
    )
      fail("Invalid entry in backup manifest.");
    if (entry.before === null) {
      if (entry.backup !== null || entry.beforeSha256 !== null)
        fail(`Invalid new-file entry in backup manifest: ${entry.path}`);
    } else {
      if (
        entry.before !== true ||
        typeof entry.backup !== "string" ||
        !/^[0-9]{6}\.bin$/.test(entry.backup) ||
        !/^[a-f0-9]{64}$/.test(entry.beforeSha256)
      ) {
        fail(`Invalid original backup metadata for ${entry.path}.`);
      }
      if (backupFiles.has(entry.backup))
        fail(`Duplicate original backup filename: ${entry.backup}`);
      backupFiles.add(entry.backup);
    }
  }
  const rootNames = readdirSync(dir);
  if (
    rootNames.length !== expectedNames.size ||
    rootNames.some((name) => !expectedNames.has(name))
  ) {
    fail(`Unexpected files in dedicated backup directory: ${dir}`);
  }
  const actualBackupNames = readdirSync(originals);
  if (
    actualBackupNames.length !== backupFiles.size ||
    actualBackupNames.some((name) => !backupFiles.has(name))
  ) {
    fail(`Unexpected or missing original backup files in ${originals}`);
  }
  const originalData = new Map();
  for (const name of backupFiles) {
    const filename = path.join(originals, name);
    const stat = lstatSync(filename);
    if (stat.isSymbolicLink() || !stat.isFile())
      fail(`Unsafe original backup file: ${filename}`);
    originalData.set(name, readFileSync(filename));
  }
  return {
    manifest,
    originalData,
    paths: { dir, manifest: manifestPath, originals },
  };
}

function verifyBackupMatchesPatch(backup, patch) {
  if (backup.manifest.patchHash !== patch.patchHash) {
    fail(
      "A different UI patch is already recorded in the target backup; refusing to proceed.",
    );
  }
  const entries = backup.manifest.entries;
  if (entries.length !== patch.entries.length)
    fail("Backup manifest does not match this UI patch.");
  for (let i = 0; i < entries.length; i += 1) {
    const managed = entries[i];
    const packaged = patch.entries[i];
    if (managed.path !== packaged.path)
      fail(`Backup manifest path mismatch: ${managed.path}`);
    const after = Buffer.from(packaged.after, "utf8");
    if (managed.afterSha256 !== sha256(after))
      fail(`Backup manifest after-content mismatch: ${managed.path}`);
    if (packaged.before === null) {
      if (
        managed.before !== null ||
        managed.beforeSha256 !== null ||
        managed.backup !== null
      )
        fail(`Backup manifest before-content mismatch: ${managed.path}`);
    } else {
      const original = Buffer.from(packaged.before, "utf8");
      if (managed.before !== true || managed.beforeSha256 !== sha256(original))
        fail(`Backup manifest before-content mismatch: ${managed.path}`);
      const data = backup.originalData.get(managed.backup);
      if (!data || !data.equals(original))
        fail(
          `Stored original backup does not match the package baseline: ${managed.path}`,
        );
    }
  }
}

function verifyInstalled(web, patch, backup) {
  verifyBackupMatchesPatch(backup, patch);
  for (const entry of patch.entries) {
    const current = pathState(web, entry.path);
    const expected = Buffer.from(entry.after, "utf8");
    if (!current || !current.data.equals(expected))
      fail(`Installed file was changed or removed: ${entry.path}`);
  }
}

function mkdirTracked(directory, createdDirs) {
  const parent = path.dirname(directory);
  if (!existsSync(parent)) mkdirTracked(parent, createdDirs);
  assertPathHasNoSymlinks(directory, { allowMissing: true });
  try {
    mkdirSync(directory, { mode: 0o755 });
    createdDirs.push(directory);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const stat = lstatSync(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory())
      fail(`Unsafe directory in managed path: ${directory}`);
  }
}

function atomicWrite(absolutePath, data, mode = 0o644) {
  const parent = path.dirname(absolutePath);
  const temp = path.join(
    parent,
    `.${path.basename(absolutePath)}.pi-pocket-${randomUUID()}.tmp`,
  );
  let fd;
  try {
    fd = openSync(temp, "wx", mode);
    writeFileSync(fd, data);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    renameSync(temp, absolutePath);
  } catch (error) {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        /* preserve primary error */
      }
    }
    try {
      unlinkSync(temp);
    } catch {
      /* temp may not exist */
    }
    throw error;
  }
}

function ensureManagedParent(web, relativePath, createdDirs) {
  const parentParts = relativePath.slice(4).split("/").slice(0, -1);
  let current = web;
  for (const part of parentParts) {
    current = path.join(current, part);
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      mkdirTracked(current, createdDirs);
      stat = lstatSync(current);
    }
    if (stat.isSymbolicLink() || !stat.isDirectory())
      fail(`Unsafe managed path parent: ${current}`);
  }
}

function atomicManagedWrite(web, entry, data, mode, createdDirs) {
  ensureManagedParent(web, entry.path, createdDirs);
  const absolutePath = path.join(web, ...entry.path.slice(4).split("/"));
  const state = pathState(web, entry.path);
  if (state && state.absolute !== absolutePath)
    fail(`Unexpected managed path resolution for ${entry.path}`);
  atomicWrite(absolutePath, data, mode);
  return absolutePath;
}

function writeBackup(target, patch) {
  const paths = backupPaths(target);
  if (existsSync(paths.dir))
    fail(
      `Backup directory already exists without a valid manifest: ${paths.dir}`,
    );
  mkdirSync(paths.dir, { mode: 0o700 });
  const manifestEntries = [];
  let index = 0;
  try {
    mkdirSync(paths.originals, { mode: 0o700 });
    for (const entry of patch.entries) {
      const after = Buffer.from(entry.after, "utf8");
      if (entry.before === null) {
        manifestEntries.push({
          path: entry.path,
          before: null,
          beforeSha256: null,
          backup: null,
          afterSha256: sha256(after),
        });
      } else {
        const original = Buffer.from(entry.before, "utf8");
        const name = `${String(index).padStart(6, "0")}.bin`;
        index += 1;
        atomicWrite(path.join(paths.originals, name), original, 0o600);
        manifestEntries.push({
          path: entry.path,
          before: true,
          beforeSha256: sha256(original),
          backup: name,
          afterSha256: sha256(after),
        });
      }
    }
    const manifest = {
      version: VERSION,
      patchHash: patch.patchHash,
      entries: manifestEntries,
    };
    atomicWrite(
      paths.manifest,
      Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
      0o600,
    );
    return manifest;
  } catch (error) {
    rmSync(paths.dir, { recursive: true, force: true });
    throw error;
  }
}

function rollbackInstall(web, patch, snapshots, createdDirs) {
  const errors = [];
  for (const entry of [...patch.entries].reverse()) {
    const original = snapshots.get(entry.path);
    const installedBytes = Buffer.from(entry.after, "utf8");
    try {
      const current = pathState(web, entry.path);
      if (original === null) {
        if (current && current.data.equals(installedBytes))
          unlinkSync(current.absolute);
        else if (current)
          fail(
            `Rollback left externally changed file untouched: ${entry.path}`,
          );
      } else if (current && current.data.equals(original.data)) {
        // This entry was not replaced (or was already restored).
      } else if (current && current.data.equals(installedBytes)) {
        atomicWrite(current.absolute, original.data, original.mode);
        if (isJavaScriptPath(entry.path))
          checkInstalledJavaScript(current.absolute, entry.path);
      } else {
        fail(`Rollback left externally changed file untouched: ${entry.path}`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
  for (const directory of [...createdDirs].reverse()) {
    try {
      rmdirSync(directory);
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTEMPTY")
        errors.push(error.message);
    }
  }
  return errors;
}

function install(target, web, patch) {
  const backup = readBackup(target);
  if (backup) {
    verifyInstalled(web, patch, backup);
    return "UI patch is already installed and intact.";
  }
  const snapshots = validateBaseline(web, patch.entries);
  validatePayloadJavaScript(patch.entries);

  const createdDirs = [];
  let backupCreated = false;
  try {
    writeBackup(target, patch);
    backupCreated = true;
    for (const entry of [...patch.entries].sort(
      (a, b) => Number(a.before !== null) - Number(b.before !== null),
    )) {
      const data = Buffer.from(entry.after, "utf8");
      const old = snapshots.get(entry.path);
      const filename = atomicManagedWrite(
        web,
        entry,
        data,
        old?.mode ?? 0o644,
        createdDirs,
      );
      if (isJavaScriptPath(entry.path))
        checkInstalledJavaScript(filename, entry.path);
    }
    return "UI patch installed successfully.";
  } catch (error) {
    const rollbackErrors = rollbackInstall(web, patch, snapshots, createdDirs);
    if (backupCreated && rollbackErrors.length === 0) {
      try {
        rmSync(backupPaths(target).dir, { recursive: true, force: true });
      } catch (cleanupError) {
        rollbackErrors.push(
          `Could not remove backup after rollback: ${cleanupError.message}`,
        );
      }
    }
    if (rollbackErrors.length)
      fail(
        `${error.message}\nRollback was incomplete: ${rollbackErrors.join("; ")}`,
      );
    throw error;
  }
}

function validateUninstall(web, patch, backup) {
  if (!backup)
    fail("No installer backup manifest exists; nothing to uninstall.");
  verifyInstalled(web, patch, backup);
  const restoreSources = new Map();
  for (const managed of backup.manifest.entries) {
    if (managed.before === null) {
      restoreSources.set(managed.path, null);
    } else {
      const data = backup.originalData.get(managed.backup);
      const text = decodeUtf8(data, `Backup for ${managed.path}`);
      if (isJavaScriptPath(managed.path))
        checkStagedJavaScript(text, managed.path);
      const current = pathState(web, managed.path);
      restoreSources.set(managed.path, { data, mode: current.mode });
    }
  }
  return restoreSources;
}

function rollbackUninstall(web, patch, installedModes, createdDirs) {
  const errors = [];
  for (const entry of [...patch.entries].reverse()) {
    const installed = Buffer.from(entry.after, "utf8");
    try {
      const current = pathState(web, entry.path);
      if (current && current.data.equals(installed)) continue;
      if (entry.before === null) {
        if (current)
          fail(
            `Rollback left externally changed file untouched: ${entry.path}`,
          );
      } else {
        const baseline = Buffer.from(entry.before, "utf8");
        if (!current || !current.data.equals(baseline))
          fail(
            `Rollback left externally changed or missing file untouched: ${entry.path}`,
          );
      }
      const filename = path.join(web, ...entry.path.slice(4).split("/"));
      if (!current) {
        const temporaryCreatedDirs = [];
        ensureManagedParent(web, entry.path, temporaryCreatedDirs);
      }
      atomicWrite(filename, installed, installedModes.get(entry.path) ?? 0o644);
      if (isJavaScriptPath(entry.path))
        checkInstalledJavaScript(filename, entry.path);
    } catch (error) {
      errors.push(error.message);
    }
  }
  for (const directory of [...createdDirs].reverse()) {
    try {
      rmdirSync(directory);
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTEMPTY")
        errors.push(error.message);
    }
  }
  return errors;
}

function uninstall(target, web, patch) {
  const backup = readBackup(target);
  if (!backup) {
    validateBaseline(web, patch.entries);
    return "UI patch is already uninstalled; baselines are intact.";
  }
  const restoreSources = validateUninstall(web, patch, backup);
  const installedModes = new Map();
  for (const entry of patch.entries)
    installedModes.set(entry.path, pathState(web, entry.path).mode);
  const createdDirs = [];
  try {
    for (const entry of [...patch.entries].sort(
      (a, b) => Number(a.before === null) - Number(b.before === null),
    )) {
      const restore = restoreSources.get(entry.path);
      const current = pathState(web, entry.path);
      if (restore === null) {
        unlinkSync(current.absolute);
      } else {
        const filename = atomicManagedWrite(
          web,
          entry,
          restore.data,
          restore.mode,
          createdDirs,
        );
        if (isJavaScriptPath(entry.path))
          checkInstalledJavaScript(filename, entry.path);
      }
    }
  } catch (error) {
    const rollbackErrors = rollbackUninstall(
      web,
      patch,
      installedModes,
      createdDirs,
    );
    if (rollbackErrors.length)
      fail(
        `${error.message}\nRollback was incomplete: ${rollbackErrors.join("; ")}`,
      );
    throw error;
  }

  const backupDir = backupPaths(target).dir;
  const retiredDir = `${backupDir}.removed-${randomUUID()}`;
  try {
    renameSync(backupDir, retiredDir);
  } catch (error) {
    const rollbackErrors = rollbackUninstall(
      web,
      patch,
      installedModes,
      createdDirs,
    );
    if (rollbackErrors.length)
      fail(
        `Could not retire backup directory: ${error.message}\nRollback was incomplete: ${rollbackErrors.join("; ")}`,
      );
    throw error;
  }
  try {
    rmSync(retiredDir, { recursive: true, force: true });
  } catch (error) {
    return `UI patch uninstalled; warning: could not remove retired backup ${retiredDir}: ${error.message}`;
  }
  return "UI patch uninstalled successfully.";
}

function check(target, web, patch) {
  const backup = readBackup(target);
  if (backup) {
    verifyInstalled(web, patch, backup);
    return "Installed UI patch is intact.";
  }
  validateBaseline(web, patch.entries);
  validatePayloadJavaScript(patch.entries);
  return "Target baselines and staged JavaScript are valid; ready to install.";
}

function main() {
  assertNodeVersion();
  const options = parseArgs(process.argv.slice(2));
  const patch = parsePatch(options.patch);
  const { target, web } = validateTarget(options.target);
  const runtime = path.join(web, "i18n.js");
  if (existsSync(runtime) && readFileSync(runtime, "utf8").includes("export function setUiLocales(")) {
    fail("This target uses the extension UI locale API. The legacy source-patch installer cannot check, install, or uninstall it. Keep the old backup; use the Extensions switch instead.");
  }
  let message;
  if (options.command === "check") message = check(target, web, patch);
  else if (options.command === "install") message = install(target, web, patch);
  else message = uninstall(target, web, patch);
  process.stdout.write(`${message}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`install-ui: ${error.message}\n`);
  process.exitCode = 1;
}

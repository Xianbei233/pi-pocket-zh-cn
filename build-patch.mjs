// Maintainer tool: package reviewed UI changes from an isolated source copy.
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const [baseline, translated] = process.argv
  .slice(2)
  .map((path) => resolve(path));
if (!baseline || !translated || baseline === translated) {
  throw new Error(
    "Usage: node build-patch.mjs BASELINE_SOURCE TRANSLATED_COPY",
  );
}
const files = async (directory, prefix = "") => {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(prefix, entry.name);
    if (entry.isDirectory())
      result.push(...(await files(join(directory, entry.name), path)));
    else if (entry.isFile() && /\.(js|html)$/.test(entry.name))
      result.push(path);
  }
  return result;
};
const changes = [];
for (const relative of (await files(join(translated, "web"))).sort()) {
  const path = `web/${relative}`;
  const after = await readFile(join(translated, path), "utf8");
  let before;
  try {
    before = await readFile(join(baseline, path), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    before = null;
  }
  if (before === after) continue;
  if (path.endsWith(".js"))
    execFileSync(process.execPath, ["--check", join(translated, path)]);
  changes.push({ path, before, after });
}
if (!changes.length) throw new Error("No changes to package");
const destination = fileURLToPath(new URL("./ui-patch.json", import.meta.url));
await writeFile(destination, `${JSON.stringify(changes, null, 2)}\n`, {
  flag: "w",
});
console.log(`Packaged ${changes.length} reviewed files into ${destination}`);
for (const { path } of changes) console.log(path);

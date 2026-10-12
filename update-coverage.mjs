// Regenerate local source evidence after an intentional vocabulary change.
// Usage: node update-coverage.mjs /path/to/pocket
// No install, network, package metadata or framework source writes.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import vm from "node:vm";
const root = resolve(process.argv[2] ?? "../locale-framework");
const { parse } = createRequire(join(root, "package.json"))("acorn");
const extract = (source) => vm.runInNewContext(source.slice(source.indexOf("const strings ="), source.indexOf("export default")) + "\n({strings,templates})");
const path = new URL("./zh-cn-ui.ts", import.meta.url);
const manifestPath = new URL("./locale-expansion.json", import.meta.url);
const contract = JSON.parse(readFileSync(manifestPath, "utf8"));
let source = readFileSync(path, "utf8");
let current = extract(source);
for (const kind of ["strings", "templates"]) {
  const extra = Object.entries(contract[kind]).filter(([key]) => !Object.hasOwn(current[kind], key));
  if (extra.length) {
    const at = source.indexOf(`const ${kind} = {`) + `const ${kind} = {`.length;
    source = source.slice(0, at) + "\n" + extra.map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`).join("\n") + source.slice(at);
  }
}
writeFileSync(path, source);
current = extract(source);
const baseline = extract(execFileSync("git", ["show", `${contract.baseline.dictionary}:zh-cn-ui.ts`], { encoding: "utf8", cwd: new URL(".", import.meta.url) }));
for (const kind of ["strings", "templates"]) {
  for (const [key, value] of Object.entries(current[kind])) {
    if (!Object.hasOwn(baseline[kind], key)) contract[kind][key] = value;
  }
}
const evidence = {};
const keys = new Set([...Object.keys(contract.strings), ...Object.keys(contract.templates)]);
function add(key, file, line, type) {
  if (keys.has(key)) (evidence[key] ??= []).push({ file, line, type });
}
function walk(node, file) {
  if (!node || typeof node !== "object") return;
  if (node.type === "Literal" && typeof node.value === "string") add(node.value, file, node.loc.start.line, "literal");
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, file));
    else if (value && typeof value === "object") walk(value, file);
  }
}
function scan(dir) {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.(js|ts)$/.test(file)) continue;
    const text = readFileSync(join(root, file), "utf8");
    if (file.endsWith(".js")) walk(parse(text, { ecmaVersion: "latest", sourceType: "module", locations: true }), file);
    else {
      for (const key of keys) {
        const at = text.indexOf(key);
        if (at >= 0) add(key, file, text.slice(0, at).split("\n").length, "server source");
      }
      if (dir === "src/server/extensions") {
        const comment = text.match(/^\s*\/\*\*([\s\S]*?)\*\//)?.[1]?.replace(/^\s*\* ?/gm, "").replace(/\s+/g, " ").trim();
        const first = comment?.match(/^(.*?[.!?])(\s|$)/)?.[1] ?? comment;
        if (first) add(first, file, 1, "built-in summary rendered by web/sheets/extensions.js");
      }
    }
  }
}
scan("web");
scan("src/server");
contract.sourceEvidence = evidence;
writeFileSync(manifestPath, JSON.stringify(contract, null, 2) + "\n");
console.log(JSON.stringify({ counts: Object.fromEntries(["strings", "templates"].map((kind) => [kind, Object.keys(current[kind]).length])), missingEvidence: [...keys].filter((key) => !evidence[key]) }));

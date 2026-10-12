// Read-only call-site inventory. Usage: node audit-ui.mjs /path/to/pocket [--missing]
// Uses the explicitly selected Pocket tree's existing Acorn; installs nothing.
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve, relative } from "node:path";
import vm from "node:vm";

const root = resolve(process.argv[2] ?? "../locale-framework");
const { parse } = createRequire(join(root, "package.json"))("acorn");
const source = readFileSync(new URL("./zh-cn-ui.ts", import.meta.url), "utf8");
const { strings, templates } = vm.runInNewContext(source.slice(source.indexOf("const strings ="), source.indexOf("export default")) + "\n({ strings, templates })");
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]).filter((file) => file.endsWith(".js"));
}
function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === "object") walk(value, visit);
  }
}
function literals(node) {
  if (!node) return [];
  if (node.type === "Literal" && typeof node.value === "string") return [node.value];
  if (node.type === "ConditionalExpression") return [...literals(node.consequent), ...literals(node.alternate)];
  if (node.type === "LogicalExpression") return [...literals(node.left), ...literals(node.right)];
  return [];
}
const calls = [];
const indirect = [];
const missing = [];
for (const file of files(join(root, "web"))) {
  const text = readFileSync(file, "utf8");
  const ast = parse(text, { ecmaVersion: "latest", sourceType: "module", locations: true });
  walk(ast, (node) => {
    if (node.type !== "CallExpression" || node.callee.type !== "Identifier" || node.callee.name !== "t") return;
    const keys = literals(node.arguments[0]);
    const kind = node.arguments.length > 1 ? "templates" : "strings";
    const site = { file: relative(root, file), line: node.loc.start.line };
    if (!keys.length) indirect.push({ ...site, expression: text.slice(node.arguments[0]?.start, node.arguments[0]?.end) });
    for (const key of keys) {
      const item = { ...site, kind, key };
      calls.push(item);
      if (key && !Object.hasOwn(kind === "strings" ? strings : templates, key)) missing.push(item);
    }
  });
}
console.log(JSON.stringify(process.argv.includes("--missing") ? missing : {
  dictionary: { strings: Object.keys(strings).length, templates: Object.keys(templates).length },
  note: "Literal and conditional t() calls only. Indirect labels and raw HTM require the accompanying manual surface audit; zero missing keys is not full UI coverage.",
  calls, indirect, missing,
}, null, 2));

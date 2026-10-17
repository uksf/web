#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const usage = "usage: surface.mjs [--web <dir, default: this checkout>] [--api-repo <dir>] [--api-ref <ref>]\nPrints every web route, API endpoint, SignalR hub, and game event type, one id per line, sorted.";
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(name);
  return at < 0 ? fallback : args[at + 1];
};
if (args.includes("--help")) {
  console.log(usage);
  process.exit(0);
}
const web = resolve(option("--web", fileURLToPath(new URL("../../../..", import.meta.url))));
const apiRepo = resolve(option("--api-repo", process.env.UKSF_API_REPO ?? join(process.env.HOME, "Workspace/uksf/api")));
const apiRef = option("--api-ref", "origin/main");
const refuse = (message) => {
  console.error(`refusing: ${message}\n${usage}`);
  process.exit(2);
};
if (!existsSync(join(web, "src/app/app.routes.ts"))) refuse(`${web} has no src/app/app.routes.ts`);
if (!existsSync(join(web, "node_modules/typescript"))) refuse(`${web} has no node_modules/typescript; run bun install --frozen-lockfile there first`);

const ts = createRequire(join(web, "package.json"))("typescript");

function parse(file) {
  return ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
}

function exportedArray(source, name) {
  let found;
  source.forEachChild(function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText() === name && node.initializer) found = node.initializer;
    node.forEachChild(visit);
  });
  if (!found || !ts.isArrayLiteralExpression(found)) throw new Error(`${source.fileName}: ${name} is not an array literal`);
  return found;
}

const prop = (object, key) => object.properties.find((entry) => ts.isPropertyAssignment(entry) && entry.name.getText() === key)?.initializer;
const join2 = (prefix, path) => (path ? `${prefix.replace(/\/$/, "")}/${path}` : prefix || "/");

function lazyTarget(file, init) {
  const text = init.getText();
  const target = /import\(\s*['"]([^'"]+)['"]\s*\)\s*\.then\(\s*\(?(\w+)\)?\s*=>\s*\2\.(\w+)\s*\)/.exec(text);
  if (!target) throw new Error(`${file}: cannot read loadChildren ${text}`);
  const base = target[1].startsWith("@app/") ? join(web, "src/app", target[1].slice(5)) : resolve(dirname(file), target[1]);
  return { file: `${base}.ts`, name: target[3] };
}

function walkRoutes(file, array, prefix, out) {
  for (const element of array.elements) {
    if (!ts.isObjectLiteralExpression(element)) throw new Error(`${file}: route ${element.getText().slice(0, 60)} is not an object literal`);
    const pathNode = prop(element, "path");
    const path = pathNode && ts.isStringLiteral(pathNode) ? pathNode.text : "";
    if (path === "**" || prop(element, "redirectTo")) continue;
    const full = join2(prefix, path);
    const children = prop(element, "children");
    const lazy = prop(element, "loadChildren");
    if (children && ts.isArrayLiteralExpression(children)) walkRoutes(file, children, full, out);
    else if (lazy) {
      const target = lazyTarget(file, lazy);
      walkRoutes(target.file, exportedArray(parse(target.file), target.name), full, out);
    } else out.add(`web:${full}`);
  }
}

function webRoutes() {
  const out = new Set();
  const root = join(web, "src/app/app.routes.ts");
  walkRoutes(root, exportedArray(parse(root), "appRoutes"), "", out);
  return out;
}

function git(...gitArgs) {
  const result = spawnSync("git", ["-C", apiRepo, ...gitArgs], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (result.status !== 0) refuse(`git ${gitArgs.join(" ")} in ${apiRepo} failed: ${result.stderr.trim()}`);
  return result.stdout;
}

function apiSources() {
  const files = git("ls-tree", "-r", "--name-only", apiRef).split("\n").filter((name) => name.endsWith(".cs") && !/(^|\/)Tests?\//.test(name) && !name.startsWith("Tests"));
  const batch = spawnSync("git", ["-C", apiRepo, "cat-file", "--batch"], { input: files.map((name) => `${apiRef}:${name}`).join("\n"), maxBuffer: 256 * 1024 * 1024 });
  if (batch.status !== 0) refuse(`git cat-file in ${apiRepo} failed`);
  const sources = new Map();
  let at = 0;
  for (const name of files) {
    const header = batch.stdout.indexOf(10, at);
    const size = Number(batch.stdout.subarray(at, header).toString().split(" ")[2]);
    sources.set(name, batch.stdout.subarray(header + 1, header + 1 + size).toString("utf8"));
    at = header + 1 + size + 1;
  }
  return sources;
}

const verbs = /\[Http(Get|Post|Put|Patch|Delete)(?:\(\s*"([^"]*)"[^)]*\))?\]/g;

function apiEndpoints(sources) {
  const out = new Set();
  for (const [name, text] of sources) {
    const controller = /(?:^|\n)\[Route\("([^"]*)"\)\][^{]*?class (\w+?)(?:Controller)?\s*[:(]/s.exec(text);
    if (!controller) continue;
    const base = controller[1].replace("[controller]", controller[2].toLowerCase());
    const found = [...text.matchAll(verbs)];
    for (const match of found) {
      const template = match[2] ?? "";
      const path = template.startsWith("~/") ? template.slice(1) : template ? `/${base}/${template}` : `/${base}`;
      out.add(`api:${match[1].toUpperCase()} ${path}`);
    }
  }
  for (const text of sources.values()) for (const hub of text.matchAll(/MapHub<(\w+)>/g)) out.add(`hub:${hub[1]}`);
  return out;
}

function gameEvents(sources) {
  const handler = [...sources].find(([name]) => name.endsWith("/GameServerEventHandler.cs"));
  if (!handler) refuse(`no GameServerEventHandler.cs at ${apiRef}`);
  const body = handler[1].slice(handler[1].indexOf("switch (gameServerEvent.Type)"));
  const block = body.slice(0, body.indexOf("default:"));
  return new Set([...block.matchAll(/case "([a-z_]+)":/g)].map((match) => `game:${match[1]}`));
}

const sources = apiSources();
const all = [...webRoutes(), ...apiEndpoints(sources), ...gameEvents(sources)].sort();
console.log(all.join("\n"));

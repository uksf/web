#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { webRoutes } from "./surface-lib.mjs";

const usage = "usage: surface.mjs [--web <dir, default: this checkout>] [--api-repo <dir>] [--api-ref <ref>]\nPrints every web route, API endpoint, SignalR hub, and game event type, one id per line, sorted.";
const args = process.argv.slice(2);
const refuse = (message) => {
  console.error(`refusing: ${message}\n${usage}`);
  process.exit(2);
};
const option = (name, fallback) => {
  const at = args.indexOf(name);
  if (at < 0) return fallback;
  if (!args[at + 1] || args[at + 1].startsWith("--")) refuse(`${name} needs a value`);
  return args[at + 1];
};
if (args.includes("--help")) {
  console.log(usage);
  process.exit(0);
}
const web = resolve(option("--web", fileURLToPath(new URL("../../../..", import.meta.url))));
const apiRepo = resolve(option("--api-repo", process.env.UKSF_API_REPO ?? join(process.env.HOME, "Workspace/uksf/api")));
const apiRef = option("--api-ref", "origin/main");
if (!existsSync(join(web, "src/app/app.routes.ts"))) refuse(`${web} has no src/app/app.routes.ts`);
if (!existsSync(join(web, "node_modules/typescript"))) refuse(`${web} has no node_modules/typescript; run bun install --frozen-lockfile there first`);

const ts = createRequire(join(web, "package.json"))("typescript");
const read = (file) => readFileSync(file, "utf8");

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

function apiIds(sources) {
  const dotnetRoot = process.env.DOTNET_ROOT ?? join(process.env.HOME, ".dotnet");
  const env = { ...process.env, DOTNET_ROOT: dotnetRoot, PATH: `${dotnetRoot}:${process.env.PATH}`, DOTNET_NOLOGO: "1", DOTNET_CLI_TELEMETRY_OPTOUT: "1", DOTNET_SKIP_FIRST_TIME_EXPERIENCE: "1" };
  const reader = fileURLToPath(new URL("./surface-api.cs", import.meta.url));
  const result = spawnSync("dotnet", ["run", reader], { input: JSON.stringify(Object.fromEntries(sources)), encoding: "utf8", env, maxBuffer: 64 * 1024 * 1024 });
  if (result.error) refuse(`cannot run dotnet: ${result.error.message}`);
  if (result.status !== 0) refuse(`surface-api.cs exited ${result.status}: ${result.stderr.trim()}`);
  const frames = result.stdout.split("\n").filter((line) => line.startsWith("SURFACE-API "));
  if (frames.length !== 1) refuse(`surface-api.cs printed ${frames.length} result lines`);
  const ids = JSON.parse(frames[0].slice("SURFACE-API ".length));
  if (!Array.isArray(ids) || !ids.length || ids.some((id) => typeof id !== "string" || /[\n\r]/.test(id))) refuse("surface-api.cs returned an invalid id list");
  return ids;
}

let web_;
try {
  web_ = [...webRoutes(ts, join(web, "src/app"), read)];
} catch (error) {
  refuse(error.message);
}
const all = [...web_, ...apiIds(apiSources())].sort();
console.log(all.join("\n"));

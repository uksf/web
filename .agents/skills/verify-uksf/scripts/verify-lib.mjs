import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const RUN_ID = /^v[0-9]{14}-[0-9a-f]{16}$/;

function verifyScript(scripts, args) {
  return execFileSync(join(scripts, "uksf-verify.sh"), args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

function startedAt(pid) {
  return execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8" }).trim().replace(/\s+/g, " ");
}

export function driverArguments(usage) {
  const [runDir, runId, scripts] = process.argv.slice(2);
  if (!runDir || !runId || !scripts) {
    console.error(`usage: ${usage} <run-dir> <run-id> <scripts-dir>`);
    process.exit(2);
  }
  if (!RUN_ID.test(runId)) {
    console.error(`refusing: '${runId}' is not a verify run id`);
    process.exit(2);
  }
  const active = verifyScript(scripts, ["dir"]);
  const canonical = (path) => {
    try {
      return realpathSync(path);
    } catch {
      return undefined;
    }
  };
  if (!canonical(runDir) || canonical(runDir) !== canonical(active) || !active.endsWith(`/runs/${runId}`)) {
    console.error(`refusing: '${runDir}' is not the active run directory ${active}`);
    process.exit(2);
  }
  return { runDir: realpathSync(active), runId, scripts };
}

export function requireOwned(scripts, runId) {
  try {
    verifyScript(scripts, ["owned", runId]);
  } catch (error) {
    throw new Error(`run ${runId} is not the active instance this skill started: ${String(error.stderr ?? error).trim()}`);
  }
}

export function holdLease(runDir) {
  const lease = join(runDir, "drivers", String(process.pid));
  writeFileSync(lease, startedAt(process.pid));
  const release = () => rmSync(lease, { force: true });
  process.on("exit", release);
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => process.exit(130));
}

export function reserveEvidence(directory) {
  try {
    mkdirSync(directory);
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`refusing: ${directory} already exists; each run drives a feature once`);
    throw error;
  }
}

export function recordOwnership(runDir, kind) {
  appendFileSync(join(runDir, "owned"), `${kind}\n`);
}

export function recordWrites(runDir, patch) {
  const path = join(runDir, "account-writes.json");
  const current = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
  writeFileSync(path, JSON.stringify({ ...current, ...patch }, null, 2));
}

export function data(runDir, scripts, args, timeoutMs) {
  const settings = join(runDir, "settings.json");
  const result = { ok: false, value: undefined, error: undefined };
  try {
    const output = execFileSync("dotnet", ["run", join(scripts, "verify-data.cs"), "--", settings, ...args], {
      encoding: "utf8",
      timeout: Math.max(1000, timeoutMs),
      stdio: ["ignore", "pipe", "pipe"],
    });
    result.value = JSON.parse(output.trim().split("\n").pop());
    result.ok = true;
  } catch (error) {
    const stdout = String(error.stdout ?? "").trim().split("\n").pop();
    if (error.status === 1 && stdout?.startsWith("{")) {
      result.value = JSON.parse(stdout);
      result.ok = true;
    } else {
      result.error = String(error.message ?? error).split("\n")[0];
    }
  }
  return result;
}

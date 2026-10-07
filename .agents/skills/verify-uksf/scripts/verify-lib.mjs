import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const RUN_ID = /^v[0-9]{14}-[0-9a-f]{4}$/;

export function driverArguments(usage) {
  const [runDir, runId, scripts] = process.argv.slice(2);
  if (!runDir || !runId || !scripts) {
    console.error(`usage: ${usage} <run-dir> <run-id> <scripts-dir>`);
    process.exit(2);
  }
  if (!RUN_ID.test(runId) || !runDir.endsWith(`/runs/${runId}`)) {
    console.error(`refusing: '${runId}' and '${runDir}' are not a verify run and its directory`);
    process.exit(2);
  }
  return { runDir, runId, scripts };
}

export function requireOwned(scripts, runId) {
  try {
    execFileSync(join(scripts, "uksf-verify.sh"), ["owned", runId], { stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" });
  } catch (error) {
    throw new Error(`run ${runId} is not the active instance this skill started: ${String(error.stderr ?? error).trim()}`);
  }
}

export function requireFreshEvidence(directory) {
  if (existsSync(directory)) throw new Error(`refusing: ${directory} already exists; each run drives a feature once`);
}

export function data(scripts, args, timeoutMs) {
  const result = { ok: false, value: undefined, error: undefined };
  try {
    const output = execFileSync("dotnet", ["run", join(scripts, "verify-data.cs"), "--", process.env.UKSF_API_DIR, ...args], {
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

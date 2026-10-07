import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const [runDir, runId, scripts] = process.argv.slice(2);
if (!runDir || !runId || !scripts) {
  console.error("usage: drive-mission.mjs <run-dir> <run-id> <scripts-dir>");
  process.exit(2);
}

const LISTENER_PORT = Number(process.env.UKSF_VERIFY_LISTENER_PORT ?? 47999);
const API = "http://127.0.0.1:5500/gameservers/events";
const evidence = join(runDir, "evidence", "mission");
const sessionId = `verify-${runId}`;
const uid = "76561190000000001";
const sent = [];
const commands = [];
const otherRequests = [];
mkdirSync(evidence, { recursive: true });

function sqf(value) {
  if (Array.isArray(value)) return `[${value.map(sqf).join(",")}]`;
  if (typeof value === "number") return String(value);
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function send(type, pairs) {
  const body = sqf([type, Object.entries(pairs)]);
  const response = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain", "X-Api-Port": String(LISTENER_PORT), "X-Enqueued-At": new Date().toISOString() },
    body,
  });
  sent.push({ type, body, status: response.status });
  if (response.status >= 300) throw new Error(`${type} answered ${response.status}: ${await response.text()}`);
}

function mission() {
  const output = execFileSync("dotnet", ["run", join(scripts, "verify-data.cs"), "--", process.env.UKSF_API_DIR, "mission", sessionId], { encoding: "utf8" });
  return JSON.parse(output.trim().split("\n").pop());
}

const timings = {};

async function until(description, predicate) {
  const startedAt = Date.now();
  const deadline = startedAt + 180_000;
  let last;
  while (Date.now() < deadline) {
    try {
      last = mission();
    } catch {
      last = { found: false };
    }
    if (predicate(last)) {
      timings[description] = Math.round((Date.now() - startedAt) / 1000);
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`timed out waiting for ${description}; last state ${JSON.stringify(last)}`);
}

const listener = createServer((request, response) => {
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    const entry = { at: new Date().toISOString(), method: request.method, path: request.url, userAgent: request.headers["user-agent"] ?? null, body };
    (request.method === "POST" && request.url === "/command" ? commands : otherRequests).push(entry);
    response.writeHead(200).end("ok");
  });
});
await new Promise((resolve) => listener.listen(LISTENER_PORT, "127.0.0.1", resolve));

try {
  await send("mission_started", { sessionId, mission: "verify_mission", map: "VR" });
  const started = await until("the mission session", (state) => state.found && state.missionStarted !== "BsonNull");
  await send("player_connected", { sessionId, uid, name: "Verify Agent" });
  const joined = await until("the player presence", (state) => state.players?.includes(uid));
  await send("player_disconnected", { sessionId, uid });
  await send("mission_ended", { sessionId, duration: 42 });
  const ended = await until("the mission end", (state) => state.missionEnded !== "BsonNull");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const result = {
    runId,
    sessionId,
    listenerPort: LISTENER_PORT,
    sent,
    started,
    joined,
    ended,
    secondsUntilVisible: timings,
    commandsPushedToGame: commands,
    otherListenerRequests: otherRequests,
    pass: started.mission === "verify_mission" && joined.players.includes(uid) && ended.durationSeconds === "42" && commands.length === 0,
  };
  writeFileSync(join(evidence, "result.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ pass: result.pass, sessionId, secondsUntilVisible: timings, durationSeconds: ended.durationSeconds, players: ended.players, commandsPushedToGame: commands.length, evidence }));
  process.exitCode = result.pass ? 0 : 1;
} catch (error) {
  writeFileSync(join(evidence, "result.json"), JSON.stringify({ runId, sessionId, sent, commandsPushedToGame: commands, pass: false, error: String(error) }, null, 2));
  console.error(String(error));
  process.exitCode = 1;
} finally {
  listener.close();
}

import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { data as lookup, driverArguments, holdLease, recordOwnership, requireOwned, reserveEvidence } from "./verify-lib.mjs";

const { runDir, runId, scripts } = driverArguments("drive-mission.mjs");
const LISTENER_PORT = Number(process.env.UKSF_VERIFY_LISTENER_PORT ?? 47999);
const API = "http://127.0.0.1:5500/gameservers/events";
const STEP_SECONDS = 180;
const QUIET_SECONDS = 10;
const evidence = join(runDir, "evidence", "mission");
const sessionId = `verify-${runId}`;
const uid = "76561190000000001";
const sent = [];
const commands = [];
const otherRequests = [];
const lookupErrors = [];
const timings = {};

function sqf(value) {
  if (Array.isArray(value)) return `[${value.map(sqf).join(",")}]`;
  if (typeof value === "number") return String(value);
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function send(type, pairs) {
  requireOwned(scripts, runId);
  const body = sqf([type, Object.entries(pairs)]);
  const response = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain", "X-Api-Port": String(LISTENER_PORT), "X-Enqueued-At": new Date().toISOString() },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  sent.push({ type, body, status: response.status });
  if (response.status !== 202) throw new Error(`${type} answered ${response.status}, expected 202: ${await response.text()}`);
}

async function until(description, predicate) {
  const startedAt = Date.now();
  const deadline = startedAt + STEP_SECONDS * 1000;
  let last;
  while (Date.now() < deadline) {
    const found = lookup(runDir, scripts, ["mission", sessionId], deadline - Date.now());
    if (found.ok) {
      last = found.value;
      if (last.found && predicate(last)) {
        timings[description] = Math.round((Date.now() - startedAt) / 1000);
        return last;
      }
    } else {
      lookupErrors.push({ at: new Date().toISOString(), step: description, error: found.error });
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`no ${description} within ${STEP_SECONDS}s; last state ${JSON.stringify(last)}`);
}

const isSet = (value) => typeof value === "string" && value !== "BsonNull" && value.length > 0;
const ourPresence = (state) => state.presence?.find((entry) => entry.uid === uid);

holdLease(runDir);
reserveEvidence(evidence);
requireOwned(scripts, runId);
const port = lookup(runDir, scripts, ["gameserver-port", String(LISTENER_PORT)], 60_000);
if (!port.ok || port.value.configuredServers !== 0) throw new Error(`refusing: port ${LISTENER_PORT} is configured for a game server in devLocal or could not be checked (${port.error ?? JSON.stringify(port.value)})`);
const existing = lookup(runDir, scripts, ["mission", sessionId], 60_000);
if (!existing.ok || existing.value.found || existing.value.playerMissionStats !== 0) throw new Error(`refusing: mission session ${sessionId} or its player stats already exist, or could not be checked (${existing.error ?? JSON.stringify(existing.value)})`);
recordOwnership(runDir, "mission");

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
  const started = await until("mission start", (state) => isSet(state.missionStarted));
  await send("player_connected", { sessionId, uid, name: "Verify Agent" });
  const joined = await until("player connection", (state) => isSet(ourPresence(state)?.connected));
  await send("player_disconnected", { sessionId, uid });
  const left = await until("player disconnection", (state) => isSet(ourPresence(state)?.disconnected));
  await send("mission_ended", { sessionId, duration: 42 });
  const ended = await until("mission end", (state) => isSet(state.missionEnded) && state.durationSeconds === "42");
  await new Promise((resolve) => setTimeout(resolve, QUIET_SECONDS * 1000));
  const presence = ourPresence(ended);
  const result = {
    runId,
    sessionId,
    listenerPort: LISTENER_PORT,
    sent,
    started,
    joined,
    left,
    ended,
    secondsUntilVisible: timings,
    commandWindowSeconds: `from mission_started until ${QUIET_SECONDS}s after the mission end was visible`,
    commandsPushedToGame: commands,
    otherListenerRequests: otherRequests,
    lookupErrors,
    pass: started.mission === "verify_mission" && started.map === "VR" && presence?.name === "Verify Agent" && isSet(presence?.disconnected) && ended.durationSeconds === "42" && commands.length === 0,
  };
  writeFileSync(join(evidence, "result.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ pass: result.pass, sessionId, secondsUntilVisible: timings, commandsPushedToGame: commands.length, evidence }));
  process.exitCode = result.pass ? 0 : 1;
} catch (error) {
  writeFileSync(join(evidence, "result.json"), JSON.stringify({ runId, sessionId, sent, secondsUntilVisible: timings, commandsPushedToGame: commands, otherListenerRequests: otherRequests, lookupErrors, pass: false, error: String(error) }, null, 2));
  console.error(String(error));
  process.exitCode = 1;
} finally {
  listener.close();
}

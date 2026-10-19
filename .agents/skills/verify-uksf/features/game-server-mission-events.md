# Game-server mission events

The UKSF Arma extension reports what happens on a game server. The API records each mission as a mission session that the stats tooling reads.

## Sub-features

- `mission_started` with `sessionId`, `mission`, and `map`: creates or updates the `missionSessions` record and sets `missionStarted`. When `X-Api-Port` matches a configured game server, `GameServerProcessManager.Sessions.cs` sets that server's `CurrentMissionSessionId` to the session. `mission_ended` clears it only when it names the same session; otherwise the current id stays (`GameServerEventHandler.Sessions.cs`, `HandleMissionLifecycleEvent`).
- `player_connected` with `sessionId`, `uid`, and `name`, and `player_disconnected` with `sessionId` and `uid`: add and close a `playerPresence` entry.
- `mission_ended` with `sessionId` and `duration`: sets `missionEnded` and `durationSeconds`.
- A `mission_started` for a session that already has `missionEnded` is ignored: it answers 202, changes nothing, and logs `Ignoring mission_started for session '<id>': it already ended or predates the server process` (in `<run>/api.log` the quotes appear as `\u0027`). Run `v20261019175000-850fa629e0596187` replayed it by hand after the drive, with evidence in `<run>/evidence/mission-restart/result.json`. On a configured game server it is also ignored when its `X-Enqueued-At` predates the server process. A `mission_started` without `mission` or `map` creates or updates no `missionSessions` record, but on a configured game server it can still become the server's `CurrentMissionSessionId` (`GameServerEventHandler.Sessions.cs`, `GameServerProcessManager.Sessions.cs`, `RecordMissionSessionAsync`). The drive posts each session once, so it does not reach these paths. On the drive's unconfigured port 47999, the ended-session path and the missing `mission` or `map` path are reachable, and only the ended-session path has been replayed. The `X-Enqueued-At` and `CurrentMissionSessionId` paths need a configured game server.
- `mission_ended`, `persistence_save`, and `shutdown_*` are handled before the answer (`GameServerEventsController.cs`). Success answers 200. A handling failure answers 503 so the extension retries. A rejected `persistence_save` answers 200, or 422 when the request carries `X-Uksf-Protocol: 2`. Every other event answers 202 and is handled in the background. An API before `03f7cf80` also queues `mission_ended` and answers 202, so the mission drive fails on it and names that cause.
- Other event types: `server_status`, `shutdown_*`, `mission_stats`, `performance`, `persistence_save`, and the NPC events `npc_register`, `npc_turn`, `npc_utterance`, and `npc_ack`.

## Entry points

- `api:POST /gameservers/events`
- `game:mission_started`
- `game:player_connected`
- `game:player_disconnected`
- `game:mission_ended`


## How to get to it

- The Arma extension on a game server posts each event to `POST /gameservers/events` on the same host. No user drives it, and no API read endpoint exposes mission sessions. The arma-mission-stats tooling reads them from Mongo.

## Driving it with HTTP replay

1. Start a listener on `127.0.0.1:47999` that records every request. It stands in for the game, which receives API commands at `POST http://127.0.0.1:<X-Api-Port>/command`.
2. Check that no `gameServers` record uses port 47999 (`verify-data gameserver-port 47999`), then post each event with header `X-Api-Port: 47999`. `mission_ended` must answer 200. The other three posts must answer 202.
   `["mission_started",[["sessionId","verify-<run-id>"],["mission","verify_mission"],["map","VR"]]]`
3. Poll `verify-data mission verify-<run-id>` until `missionStarted` is set. Then post `player_connected` with a dummy Steam id and the name Verify Agent, and poll until its presence entry has `connected`.
4. Post `player_disconnected` and poll until that entry has `disconnected`. Post `mission_ended` with `duration` 42 and poll until `missionEnded` is set and `durationSeconds` is 42.
5. Wait ten seconds and check the listener. A mission with no NPCs pushes no commands. The window covers only the time from `mission_started` to ten seconds after the end is visible.

Evidence: every posted body and its HTTP status, the four session states that satisfied the `started`, `joined`, `left` and `ended` steps, the lookup errors, and the commands the listener received, in `<run>/evidence/mission/result.json`. A run that fails a check after all four steps keeps the four states and sets `pass` to false. A run that throws before the end keeps no session states, and records the error text with the other fields.

## Gotchas

- The endpoint is loopback-only. Post to `127.0.0.1`, not the machine's network address.
- SQF strings double their quotes. Numbers are bare.
- `durationSeconds` reads back as the string `42` from `verify-data`.
- Each event handler finds the session with `FindFirst`, which filters in Mongo through the `sessionId` index. Against the remote `devLocal`, an event shows in Mongo within a few seconds, usually in under one. The driver still waits up to 180 seconds per step and records `secondsUntilVisible`.
- A Go tool on iultron (`Go-http-client/1.1`, probably moshi-hook port discovery) sometimes sends `GET /` to a new local listener within seconds of it opening, and most runs see none. Example: on 2026-10-11 one run recorded two, about 5 seconds after `mission_started`. Only `POST /command` is a game command. The driver records other requests separately as `otherListenerRequests`.
- NPC events need a mission with registered NPCs, and NPC broker features that are off in `devLocal`. They are not mapped yet.

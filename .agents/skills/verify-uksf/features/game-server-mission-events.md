# Game-server mission events

The UKSF Arma extension reports what happens on a game server. The API records each mission as a mission session that the stats tooling reads.

## Sub-features

- `mission_started` with `sessionId`, `mission`, and `map`: creates or updates the `missionSessions` record and sets `missionStarted`. When `X-Api-Port` matches a configured game server, it also sets that server's current session.
- `player_connected` with `sessionId`, `uid`, and `name`, and `player_disconnected` with `sessionId` and `uid`: add and close a `playerPresence` entry.
- `mission_ended` with `sessionId` and `duration`: sets `missionEnded` and `durationSeconds`.
- The endpoint answers 202 and handles the event in the background, except `persistence_save`, which it handles before it answers 200.
- Other event types: `server_status`, `shutdown_*`, `mission_stats`, `performance`, `persistence_save`, and the NPC events `npc_register`, `npc_turn`, `npc_utterance`, and `npc_ack`.

## How to get to it

- The Arma extension on a game server posts each event to `POST /gameservers/events` on the same host. No user drives it, and no API read endpoint exposes mission sessions. The arma-mission-stats tooling reads them from Mongo.

## Driving it with HTTP replay

1. Start a listener on `127.0.0.1:47999` that records every request. It stands in for the game, which receives API commands at `POST http://127.0.0.1:<X-Api-Port>/command`.
2. Post each event with header `X-Api-Port: 47999`. Use port 47999 so that no configured game server matches it.
   `["mission_started",[["sessionId","verify-<run-id>"],["mission","verify_mission"],["map","VR"]]]`
3. Poll `verify-data mission verify-<run-id>` until `missionStarted` is set. Then post `player_connected` with a dummy Steam id, and poll until the uid appears in `players`.
4. Post `player_disconnected` and `mission_ended` with `duration` 42. Poll until `missionEnded` is set.
5. Wait two seconds and check the listener. A mission with no NPCs pushes no commands.

Evidence: every posted body and its HTTP status, each polled session state, and the commands the listener received, in `result.json`.

## Gotchas

- The endpoint is loopback-only. Post to `127.0.0.1`, not the machine's network address.
- SQF strings double their quotes. Numbers are bare.
- `durationSeconds` reads back as the string `42` from `verify-data`.
- Each event handler finds the session with `GetSingle(Func)`, which streams the whole `missionSessions` collection to the API and filters it there. Against the remote `devLocal`, one event can take 20 to 60 seconds to show in Mongo, so the driver waits up to 180 seconds per step and records `secondsUntilVisible`.
- A Go tool on iultron (`Go-http-client/1.1`, probably moshi-hook port discovery) sends `GET /` to any new local listener within seconds. Only `POST /command` is a game command. The driver records other requests separately as `otherListenerRequests`.
- NPC events need a mission with registered NPCs, and NPC broker features that are off in `devLocal`. They are not mapped yet.

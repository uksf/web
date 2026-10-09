---
name: verify-uksf
description: Drive the real UKSF website, API, and the API's Arma game-server surface on a local verify-mode instance against devLocal, and capture proof. Use to verify a web or API change the way a user or the game does it - sign-up, sign-in, game-server events - before you call it done.
---

# Verify UKSF

This skill starts its own UKSF API and web dev server, drives them the way a user or the Arma extension does, and keeps the evidence. It never drives an instance it did not start.

- Web checkout: the repo that holds this skill (`UKSF_WEB_DIR` overrides it).
- API checkout: `~/Workspace/uksf/api` (`UKSF_API_DIR` overrides it). It must hold the gitignored `UKSF.Api/appsettings.Development.json`, which points at the shared `devLocal` Mongo database, and it must include API commit `a61e4070` or later, which keeps verify-mode logs out of Mongo. The doctor fails on an older API.
- Run state and evidence: `~/.uksf-verify/runs/<run-id>/` (`UKSF_VERIFY_HOME` overrides the root).
- Host: macOS (iultron). It needs the .NET 10 SDK in `~/.dotnet`, bun in `~/.bun/bin`, `node_modules` installed in the web checkout (`bun install`; a symlinked `node_modules` breaks Angular's CSS imports), and Google Chrome. Set `PLAYWRIGHT_CHROME_PATH` to use another Chrome build.

The feature map is in `features/README.md`. Read it before you drive anything.

## Launch

```bash
S=.agents/skills/verify-uksf/scripts
$S/uksf-verify.sh up
```

`up` takes the lock `$TMPDIR/uksf-verify.lock` atomically and writes the run id and the canonical `UKSF_VERIFY_HOME` into it, so a second `up` refuses while a run is active, whatever its home. It refuses when a package declared in `package.json` is missing from the web checkout's `node_modules` (run `bun install --frozen-lockfile` there), when port 5500 or 4200 is in use, or when an environment variable overrides API configuration (`appSettings__*`, `ConnectionStrings__*`, `Kestrel__*`, `ASPNETCORE_URLS`). The run id is `v<UTC timestamp>-<4 hex>`. It copies the API settings file to `<run>/settings.json` (mode 600) and records its hash, so every database lookup and the cleanup use exactly the configuration the API started with. It records a source id for both checkouts (a git tree hash of the working tree, written through a temporary index, so it covers binary, untracked, and deleted files), builds the API into `<run>/api-bin`, then starts:

- the API with `ASPNETCORE_ENVIRONMENT=Development`, `UKSF_VERIFY_MODE=1`, and `UKSF_VERIFY_EMAIL_DIR=<run>/email`. Verify mode runs no migrations, creates no scheduled jobs or indexes, and starts no Teamspeak, Discord, scheduler, queued builds, backups, game-server recovery, or NPC workers. It writes its own logs to stdout as `verify-log {json}` lines in `<run>/api.log`, not to Mongo, and prints `verify mode: database <name> at <host>:<port>`. Mail goes to `.eml` files in the run's `email` folder. The Discord client cannot connect in Development or verify mode.
- the web dev server (`ng serve --port 4200`) in its own process group, recorded at launch.

If any step fails, `up` runs `down` before it exits.

Ready signals: the API log line `Application started`, and HTTP 200 from `http://localhost:4200/`. A fresh `up` took 1 minute 54 seconds on 2026-10-09 with the API build included.

## Doctor

```bash
$S/uksf-verify.sh doctor
```

Run it after `up`, and again whenever a result looks wrong. Every line must be `PASS`:

- this run owns the lock, the API settings file is unchanged, the API process (by PID and start time) holds port 5500, and the run's web process group (by leader start time) holds port 4200 and serves this web checkout;
- the API and web source ids still match the ones recorded at `up`;
- the API log shows both verify-mode skip lines and no Discord connection;
- `GET /accounts` without a token is rejected with 401 (the sign-up drive proves that a valid sign-in works);
- the database the API itself reports is `devLocal` on the server named in the settings file;
- in a snapshot of the API's connections, every remote end is a Mongo server address on the Mongo port, and every loopback end is this run's port 5500 or 4200.

If a line fails, run `down`, fix the cause, and start again. Do not drive a run that failed its doctor.

## Drive

Each driver takes the run directory, the run id, and the scripts directory, and writes `result.json` plus screenshots or payloads under `<run>/evidence/<feature>/`. Each exits 0 only when its proof holds.

```bash
export PATH="$HOME/.dotnet:$PATH" DOTNET_ROOT="$HOME/.dotnet"
R=$($S/uksf-verify.sh dir); ID=$($S/uksf-verify.sh run-id)
node $S/drive-signup.mjs "$R" "$ID" "$PWD/$S"
node $S/drive-mission.mjs "$R" "$ID" "$PWD/$S"
```

Each driver checks that its run folder is the active one, takes a lease in `<run>/drivers/<pid>`, reserves its evidence folder atomically (an existing folder refuses the drive), runs `uksf-verify.sh owned <run-id>`, checks that none of the records cleanup would delete exist yet (the account and its confirmation codes, or the mission session and its player stats), and only then adds their kind to `<run>/owned`. Database lookups use `<run>/settings.json`, not the current `UKSF_API_DIR` or settings file. The mission driver re-runs `owned` before every event it posts.

- `drive-signup.mjs` uses Playwright against the web UI. Run it from the web checkout root so it loads the repo's Playwright.
- `drive-mission.mjs` replays game-server events into `POST /gameservers/events` exactly as the Arma extension sends them, and runs a fake game listener on port 47999 (`UKSF_VERIFY_LISTENER_PORT`) that records every command the API pushes back. It refuses a port that any `gameServers` record in `devLocal` uses.
- `verify-data.cs` reads the run's records from `devLocal`: `dotnet run $S/verify-data.cs -- $R/settings.json account <email>`, `mission <session-id>`, or `gameserver-port <port>`.

For a feature with no driver yet, follow its recipe in `features/` and save the same kind of evidence by hand.

## Evidence

- Drive the real user path: the web UI for a user feature, the extension's HTTP contract for a game feature. Do not call internal setters or test-only endpoints.
- Capture the action and the resulting state: a screenshot at each step, and the database record that the step produced.
- Check side effects next to what is visible: the account state in Mongo, the email file, the mission session, the commands pushed to the game.
- Verify mode is not a dry run. It skips the integrations listed under Launch, and everything else runs for real against `devLocal`.

Evidence stays in `<run>/evidence/` after cleanup. Quote its path in your report.

## Data

- `devLocal` holds copies of the real units, ranks, and accounts. A run may read them as-is.
- A run creates only records tagged with its run id: the account `verify+<run-id>@uksf-verify.invalid` with password `Verify-<run-id>-pw` and its confirmation code, and the mission session `verify-<run-id>` with any player stats for it. Verify mode writes no log records to Mongo.
- Never change shared records, feature flags, or variables in `devLocal`.

## Cleanup

```bash
$S/uksf-verify.sh down
```

`down` refuses unless the lock exists and belongs to this home's active run, and only one `down` runs per run (`<run>/teardown`). It waits up to 300 seconds for live driver leases, and refuses while any remain. It signals the API only while its PID has the recorded start time, and the web process group only while its leader has the recorded start time, and it checks that identity again before any forced kill. If a member of the web process group survives, or its leader is gone while members remain, `down` fails and keeps the run so you can stop them and retry. It never matches processes by name. It then removes only the record kinds listed in `<run>/owned` (an account and its confirmation codes, or a mission session and its player stats) and writes the counts to `<run>/evidence/cleanup.json`. If cleanup fails, `down` exits non-zero and keeps the run active, so run it again to retry. On success it deletes `<run>/api-bin` and `<run>/settings.json` (which holds secrets) and releases the lock. Run `down` after every attempt, including failed ones.

## Arma beyond event replay

Event replay covers the API side of the game contract. For behaviour that needs the real game (SQF, extension loading, visuals), use the `arma-dev-test-server` skill on ultron.

## Upkeep

Keep this skill and `features/` true to the app with the `maintain-verification-skill` skill. Change them in the same commit as the code they describe.

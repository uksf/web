---
name: verify-uksf
description: Drive the real UKSF website, API, and the API's Arma game-server surface on a local verify-mode instance against devLocal, and capture proof. Use to verify a web or API change the way a user or the game does it - sign-up, sign-in, game-server events - before you call it done.
---

# Verify UKSF

This skill starts its own UKSF API and web dev server, drives them the way a user or the Arma extension does, and keeps the evidence. It never drives an instance it did not start.

- Web checkout: the repo that holds this skill (`UKSF_WEB_DIR` overrides it).
- API checkout: `~/Workspace/uksf/api` (`UKSF_API_DIR` overrides it). It must hold the gitignored `UKSF.Api/appsettings.Development.json`, which points at the shared `devLocal` Mongo database.
- Run state and evidence: `~/.uksf-verify/runs/<run-id>/` (`UKSF_VERIFY_HOME` overrides the root).
- Host: macOS (iultron). It needs the .NET 10 SDK in `~/.dotnet`, bun in `~/.bun/bin`, `node_modules` installed in the web checkout (`bun install`; a symlinked `node_modules` breaks Angular's CSS imports), and Google Chrome. Set `PLAYWRIGHT_CHROME_PATH` to use another Chrome build.

The feature map is in `features/README.md`. Read it before you drive anything.

## Launch

```bash
S=.agents/skills/verify-uksf/scripts
$S/uksf-verify.sh up
```

`up` refuses to start when a run is already active or when port 5500 or 4200 is in use. It builds the API checkout into `~/.uksf-verify/api-bin`, then starts:

- the API with `ASPNETCORE_ENVIRONMENT=Development`, `UKSF_VERIFY_MODE=1`, and `UKSF_VERIFY_EMAIL_DIR=<run>/email`. Verify mode runs no migrations, creates no scheduled jobs, and starts no Teamspeak, Discord, scheduler, queued builds, backups, game-server recovery, or NPC workers. Mail goes to `.eml` files in the run's `email` folder. The Discord client cannot connect in Development or verify mode.
- the web dev server (`ng serve --port 4200`) in the web checkout.

Ready signals: the API log line `Application started`, and HTTP 200 from `http://localhost:4200/`. A fresh `up` takes about 20 seconds with a warm build.

## Doctor

```bash
$S/uksf-verify.sh doctor
```

Run it after `up`, and again whenever a result looks wrong. Every line must be `PASS`:

- the API process is alive and holds port 5500, and the web process holds port 4200 and serves this web checkout;
- the API runs the commit that is checked out;
- the API log shows both verify-mode skip lines and no Discord connection;
- `GET /accounts` without a token answers 401;
- the database is `devLocal` and answers a ping;
- every outbound API connection goes to the Mongo port.

If a line fails, run `down`, fix the cause, and start again. Do not drive a run that failed its doctor.

## Drive

Each driver takes the run directory, the run id, and the scripts directory, and writes `result.json` plus screenshots or payloads under `<run>/evidence/<feature>/`. Each exits 0 only when its proof holds.

```bash
export UKSF_API_DIR=~/Workspace/uksf/api PATH="$HOME/.dotnet:$PATH" DOTNET_ROOT="$HOME/.dotnet"
R=$($S/uksf-verify.sh dir); ID=$($S/uksf-verify.sh run-id)
node $S/drive-signup.mjs "$R" "$ID" "$PWD/$S"
node $S/drive-mission.mjs "$R" "$ID" "$PWD/$S"
```

- `drive-signup.mjs` uses Playwright against the web UI. Run it from the web checkout root so it loads the repo's Playwright.
- `drive-mission.mjs` replays game-server events into `POST /gameservers/events` exactly as the Arma extension sends them, and runs a fake game listener on port 47999 (`UKSF_VERIFY_LISTENER_PORT`) that records every command the API pushes back.
- `verify-data.cs` reads the run's records from `devLocal`: `dotnet run $S/verify-data.cs -- $UKSF_API_DIR account <email>` or `mission <session-id>`.

For a feature with no driver yet, follow its recipe in `features/` and save the same kind of evidence by hand.

## Evidence

- Drive the real user path: the web UI for a user feature, the extension's HTTP contract for a game feature. Do not call internal setters or test-only endpoints.
- Capture the action and the resulting state: a screenshot at each step, and the database record that the step produced.
- Check side effects next to what is visible: the account state in Mongo, the email file, the mission session, the commands pushed to the game.
- Verify mode is not a dry run. It skips the integrations listed under Launch, and everything else runs for real against `devLocal`.

Evidence stays in `<run>/evidence/` after cleanup. Quote its path in your report.

## Data

- `devLocal` holds copies of the real units, ranks, and accounts. A run may read them as-is.
- A run creates only records tagged with its run id: the account `verify+<run-id>@uksf-verify.invalid` with password `Verify-<run-id>-pw`, and the mission session `verify-<run-id>`.
- Never change shared records, feature flags, or variables in `devLocal`.

## Cleanup

```bash
$S/uksf-verify.sh down
```

`down` stops the API process and the web server's process group by the PIDs it recorded, never by process name. It then removes the run's tagged records from `devLocal` (accounts, confirmation codes, audit logs, mission sessions, player mission stats) and writes the counts to `<run>/evidence/cleanup.json`. Run `down` after every attempt, including failed ones.

## Arma beyond event replay

Event replay covers the API side of the game contract. For behaviour that needs the real game (SQF, extension loading, visuals), use the `arma-dev-test-server` skill on ultron.

## Upkeep

Keep this skill and `features/` true to the app with the `maintain-verification-skill` skill. Change them in the same commit as the code they describe.

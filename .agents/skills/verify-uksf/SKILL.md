---
name: verify-uksf
description: Drive the real UKSF website, API, and the API's Arma game-server surface on a local verify-mode instance against devLocal, and capture proof. Use to verify a web or API change the way a user or the game does it - sign-up, sign-in, game-server events - before you call it done.
---

# Verify UKSF

This skill starts its own UKSF API and web dev server, drives them the way a user or the Arma extension does, and keeps the evidence. It never drives an instance it did not start.

- Web checkout: the repo that holds this skill (`UKSF_WEB_DIR` overrides it).
- API checkout: `~/Workspace/uksf/api` (`UKSF_API_DIR` overrides it). Use the same letter case every time: the .NET build cache stores absolute paths, and mixing `UKSF/api` with `uksf/api` fails the build with missing project references. It must hold the gitignored `UKSF.Api/appsettings.Development.json`, which points at the shared `devLocal` Mongo database, and it must include API commit `a61e4070` or later, which keeps verify-mode logs out of Mongo. The doctor fails on an older API.
- Run state and evidence: `~/.uksf-verify/runs/<run-id>/` (`UKSF_VERIFY_HOME` overrides the root).
- Host: macOS (iultron). It needs the .NET 10 SDK in `~/.dotnet`, bun in `~/.bun/bin`, `node_modules` installed in the web checkout (`bun install`; on 2026-10-11 a `node_modules` symlinked to another worktree's built `styles.css` without errors, checked through `up`, `doctor` and `down` only, with no driver run), and Google Chrome. Set `PLAYWRIGHT_CHROME_PATH` to use another Chrome build.

The feature map is in `features/README.md`. Read it before you drive anything.

## Launch

```bash
S=.agents/skills/verify-uksf/scripts
$S/uksf-verify.sh up
```

`up` takes the lock `$TMPDIR/uksf-verify.lock` atomically and writes the run id and the canonical `UKSF_VERIFY_HOME` into it, so a second `up` refuses while a run is active, whatever its home. It refuses when the web checkout has no `package.json`, when a package declared in `package.json` is missing from the web checkout's `node_modules` (run `bun install --frozen-lockfile` there), when port 5500 or 4200 is in use, or when an environment variable overrides API configuration (`appSettings__*`, `ConnectionStrings__*`, `Kestrel__*`, `ASPNETCORE_URLS`), or when `UKSF_FEATURE_OFF` contains `NOTIFICATIONS` (it overrides `UKSF_FEATURE_ON`). The run id is `v<UTC timestamp>-<16 random hex>`, so runs on different machines are very unlikely to collide. It copies the API settings file to `<run>/settings.json` (mode 600) and records its hash, so every database lookup and the cleanup use exactly the configuration the API started with. It records a source id for both checkouts (a git tree hash of the working tree, written through a temporary index, so it covers binary, untracked, and deleted files), builds the API into `<run>/api-bin`, then starts:

- the API with `ASPNETCORE_ENVIRONMENT=Development`, `UKSF_VERIFY_MODE=1`, `UKSF_FEATURE_ON=NOTIFICATIONS` (honoured only by an API that has the seam, which forces notifications on for this process alone), and `UKSF_VERIFY_EMAIL_DIR=<run>/email`. An API with the seam also keeps `TEAMSPEAK` and `DISCORD` off in verify mode whatever the stored flags say. Verify mode runs no migrations, creates no startup scheduled jobs or indexes, loads no existing scheduled jobs, and starts no Teamspeak, Discord, queued builds, backups, game-server recovery, or NPC workers. Sign-up still creates and schedules the confirmation code's expiry job (see Data). It writes its own logs to stdout as `verify-log {json}` lines in `<run>/api.log`, not to Mongo, and prints `verify mode: database <name> at <host>:<port>`. Mail goes to `.eml` files in the run's `email` folder. The Discord client cannot connect in Development or verify mode.
- the web dev server (`ng serve --port 4200`) in its own process group, recorded at launch.

`up` runs every refusal check after it takes the lock and before it creates the run folder. A refusal or other failure before the run is recorded as current releases the lock, deletes the run folder, and leaves another run's lock alone. If writing the run id into the lock fails, the lock stays; remove `$LOCK` by hand after checking no run holds it. Once `up` has recorded the run as current, a failed step runs `down` before `up` exits. A refusal before the lock, such as another active run, changes nothing.

Ready signals: the API log line `Application started`, and HTTP 200 from `http://localhost:4200/`. A cold `up` that builds the API takes a few minutes, and a warm .NET build cache brings it under a minute. `up` waits up to 120 seconds for the API to start (after the build) and then up to 240 seconds for the web server.

## Doctor

```bash
$S/uksf-verify.sh doctor
```

Run it after `up`, and again whenever a result looks wrong. Every `PASS` or `FAIL` line must be `PASS`. The two lines that start `API reports database:` and `API connections now:` are informational: they print what the next check compares, and that check passes or fails:

- this run owns the lock, the API settings file is unchanged, the API process (by PID and start time) holds port 5500, and the run's web process group (by leader start time) holds port 4200 and serves this web checkout;
- the API and web source ids still match the ones recorded at `up`;
- the API log shows both verify-mode skip lines and no Discord connection;
- `GET /accounts` without a token is rejected with 401 (the sign-up drive proves that a valid sign-in works);
- the database the API itself reports is `devLocal` on the server named in the settings file;
- in a snapshot of the API's connections, every remote end is a Mongo server address on the Mongo port, and every loopback end is this run's port 5500 or 4200.

If a line fails, run `down`, fix the cause, and start again. Do not drive a run that failed its doctor.

## Drive

Each driver takes the run directory, the run id, and the scripts directory, and writes `result.json` plus screenshots or payloads under its own folder in `<run>/evidence/`: `signup` and `application-details` for `drive-signup.mjs`, `mission` for `drive-mission.mjs`. Each exits 0 only when its proof holds.

```bash
export PATH="$HOME/.dotnet:$PATH" DOTNET_ROOT="$HOME/.dotnet"
R=$($S/uksf-verify.sh dir); ID=$($S/uksf-verify.sh run-id)
node $S/drive-signup.mjs "$R" "$ID" "$PWD/$S" --details
node $S/drive-mission.mjs "$R" "$ID" "$PWD/$S"
```

Each driver checks that its run folder is the active one, takes a lease in `<run>/drivers/<pid>`, reserves its evidence folder atomically (an existing folder refuses the drive), runs `uksf-verify.sh owned <run-id>`, checks that none of the records cleanup would delete exist yet (the account, its confirmation codes, and its funnel events; the account's application, comment threads, notifications, and unit memberships; or the mission session and its player stats), and only then adds their kind to `<run>/owned`. The sign-up drive pins the account by the id in the create response and writes it, the confirmation code id, and at the end the funnel event ids to `<run>/account-writes.json`. Database lookups use `<run>/settings.json`, not the current `UKSF_API_DIR` or settings file. The mission driver re-runs `owned` before every event it posts.

- `drive-signup.mjs` uses Playwright against the web UI. Run it from the web checkout root so it loads the repo's Playwright. With `--details` it also seeds the comms fields through `POST /accounts/verify/comms` and submits the application Details step.
- `drive-mission.mjs` replays game-server events into `POST /gameservers/events` exactly as the Arma extension sends them, and runs a fake game listener on port 47999 (`UKSF_VERIFY_LISTENER_PORT`) that records every command the API pushes back. It refuses a port that any `gameServers` record in `devLocal` uses.
- `verify-data.cs` reads the run's records from `devLocal`: `dotnet run $S/verify-data.cs -- $R/settings.json account <email> [<account-id>]`, `application <account-id> <email>`, `funnel <run-id>`, `mission <session-id>`, or `gameserver-port <port>`. `verify-cleanup.cs` is the cleanup `down` runs. `verify-data.cs` exits 2 with its usage message when the settings file does not exist or the arguments are invalid. `verify-cleanup.cs` exits 2 when it has fewer than three arguments or the settings file does not exist, 3 when the settings name a database other than `devLocal`, and 4 for a malformed run id or an unknown record kind.

For a feature with no driver yet, follow its recipe in `features/` and save the same kind of evidence by hand.

## Evidence

- Drive the real user path: the web UI for a user feature, the extension's HTTP contract for a game feature. Do not call internal setters or write records behind the API. The one exception is a verify-mode-only API endpoint for a prerequisite a local run cannot reach, such as `POST /accounts/verify/comms` for the Teamspeak, Steam, and Discord links.
- Capture the action and the resulting state: a screenshot at each step, and the database record that the step produced.
- Check side effects next to what is visible: the account state in Mongo, the email file, the mission session, the commands pushed to the game.
- Verify mode is not a dry run. It skips the integrations listed under Launch, and everything else runs for real against `devLocal`.

Evidence stays in `<run>/evidence/` after cleanup. Quote its path in your report.

## Data

- `devLocal` holds copies of the real units, ranks, and accounts. A run may read them as-is.
- A run creates only records tagged with its run id or recorded by id: the account `verify+<run-id>@uksf-verify.invalid` with password `Verify-<run-id>-pw`, pinned by its id in `<run>/account-writes.json`, with its confirmation code and the code's expiry record in `scheduledJobs` (applying the code consumes both, so a finished sign-up leaves none to count on 2026-10-09); the application funnel events with `visitorId` `verify-<run-id>`; the comment threads and notifications its application submit wrote (`<run>/application-writes.json`); and the mission session `verify-<run-id>` with its player stats, mission stats, and raw mission events. Verify mode writes no log records to Mongo.
- The run owns the account it created, by id, and every record whose only subject is that account, such as a recruiter's notification linking to it. The rules are in `features/application-details.md` under Data.
- Never change shared records, feature flags, or variables in `devLocal`.

## Cleanup

```bash
$S/uksf-verify.sh down
```

`down` refuses unless the lock exists and belongs to this home's active run, and only one `down` runs per run (`<run>/teardown`). It waits up to 300 seconds for live driver leases, and refuses while any remain. `up` holds a lease in `<run>/drivers/` from creating the run folder until the run is up, so a `down` during startup waits instead of releasing the lock under it. It signals the API only while its PID has the recorded start time, and the web process group only while its leader has the recorded start time, and it checks that identity again before any forced kill. If a member of the web process group survives, or its leader is gone while members remain, `down` fails and keeps the run so you can stop them and retry. It never matches processes by name. It then counts the records of each kind listed in `<run>/owned` (an account and its confirmation codes, its funnel events, its application's comment threads and notifications, or a mission session with its player stats, mission stats, and raw mission events) into `<run>/evidence/cleanup-dry-run.json`. It deletes and recounts every child record first, deletes the account by id and email only when every child recount is zero, then recounts the account, and writes the removed counts and the recounts to `<run>/evidence/cleanup.json`. A recount above zero fails `down`. It refuses when the account exists but its id was never recorded, when an application's threads are not exactly the recorded ones, or when the run's API minted a thread the manifest does not record. When a failed submit leaves comment threads that no attached application references, cleanup deletes none of them, and `down` exits 7 and prints the candidate ids for a person to check (see `features/application-details.md`). If cleanup fails for any other reason, `down` exits 1 and keeps the run active, so run it again to retry; a retry works with the account already gone. On success it deletes `<run>/api-bin` and `<run>/settings.json` (which holds secrets) and releases the lock. Run `down` after every attempt, including failed ones.

## Base versus head

`verify-pr` drives the PR base and the PR head one after the other, with `scripts/verify-side.sh` for each side and `scripts/api-worktree.sh` for API checkouts. Run `--help` on either for the full flags. The lock allows one run at a time, so never start the second side before the first has finished: `verify-side.sh` only returns after `down`, the lock check, and the port checks.

`verify-side.sh --web-dir D --scripts-dir D --home D [--api-dir D] [--side N] --drive signup|details|mission` runs up, doctor, the drives in order, then `down`. Every prerequisite is chained with `&&`, so no drive ever runs after a failed `up` or doctor. Name `signup` and `details` together and only `details` runs, because it includes sign-up and sign-in and two drives cannot share a run. Each side needs its own `--home`, so its evidence folder stays separate.

Exit codes: 0 all passed, down clean, no lock, every port free; 1 up, doctor, or a drive failed after a clean `down`, or cleanup reported no recount (`cleanupRemaining: null`), or a lock or listener remains, or a port could not be inspected, or bad input; 2 `down` failed (including the cleanup inside a failed `up`), the run and lock are kept, and the shell-quoted retry command is printed. The last line is always JSON, on every exit path after the arguments are read. With `jq` on PATH and `verify-side-lib.sh` beside the script, `--help` prints the usage and exits 0 with no JSON. The normal line holds: side, run id, evidence path, `up` and `doctor`, each drive's result, `notes` (the reason for a drive's failure, and `notificationMail: unsupported` on a passing Details drive against an API without the seam), `cleanupRemaining`, lock, ports (`free`, `listening` or `error`), `downExit`, exit code, reason, retry. It needs `jq` and `lsof`. Without `jq`, or when building the normal line fails, it prints a fixed line with only `side`, `up`, `doctor`, `drives`, `exitCode` and `reason`, and exits non-zero. A `details` pass needs the driver's own `application-details/result.json` with `pass: true` and every Details check true; a harness that accepts `--details` but ran no Details checks is recorded as a fail. Quote that line and the evidence path in the verdict. Stop at the first non-zero side; do not remove worktrees until both sides exit 0.

Web worktrees are plain `git worktree add --detach` checkouts followed by `bun install --frozen-lockfile` in each. API worktrees use `api-worktree.sh add <sha> <path>` (the path must be lower case apart from a leading `$HOME`; copies the gitignored settings with mode 600) and `api-worktree.sh remove <path>` (deletes the copy, then the worktree; `--dry-run` shows the plan). Remove every worktree only after both sides tear down cleanly.

Every recipe keeps each side's run home under `$V`. To keep the homes somewhere else, set `V` to that folder.

Web PR: base and head web worktrees, the head's scripts on both sides, the same API checkout.

```bash
W=~/Workspace/uksf/web; P=~/.worktrees/web; B=<base-sha>; H=<head-sha>; V=~/.uksf-verify-pr
web_sides() {
  local side
  for side in base head; do
    $S/verify-side.sh --side $side --web-dir $P/vs-$side --scripts-dir $S --home $V/$side --drive details || return "$?"
  done
}
git -C $W fetch origin &&
mkdir -p $V &&
git -C $W worktree add --detach $P/vs-base $B && git -C $W worktree add --detach $P/vs-head $H &&
(cd $P/vs-base && bun install --frozen-lockfile) && (cd $P/vs-head && bun install --frozen-lockfile) &&
S=$P/vs-head/.agents/skills/verify-uksf/scripts &&
web_sides && git -C $W worktree remove $P/vs-base && git -C $W worktree remove $P/vs-head
```

Rerun that function shape for every drive the PR needs, with the same drives on both sides. The removals run only after both sides return 0; `|| return "$?"` keeps the failing side's status, where `|| break` would turn it into 0. After a stop, nothing is removed.

API PR: an API worktree per side, one web checkout shared by both, `--api-dir` per side. The API base must include `a61e4070` or its squash on main, `ed06088b`; `api-worktree.sh add` refuses a base without either.

```bash
W=~/Workspace/uksf/web; P=~/.worktrees/web; A=~/.worktrees/api; WEB=<web-sha>; B=<api-base-sha>; H=<api-head-sha>; V=~/.uksf-verify-pr
api_sides() {
  local side
  for side in base head; do
    $S/verify-side.sh --side api-$side --api-dir $A/vs-$side --web-dir $P/vs-web --scripts-dir $S --home $V/api-$side --drive signup || return "$?"
  done
}
git -C $W fetch origin &&
mkdir -p $V $A &&
git -C $W worktree add --detach $P/vs-web $WEB &&
(cd $P/vs-web && bun install --frozen-lockfile) &&
S=$P/vs-web/.agents/skills/verify-uksf/scripts &&
$S/api-worktree.sh add $B $A/vs-base && $S/api-worktree.sh add $H $A/vs-head &&
api_sides &&
$S/api-worktree.sh remove $A/vs-base && $S/api-worktree.sh remove $A/vs-head && git -C $W worktree remove $P/vs-web
```

Run Details as its own side with its own `--home`, because a single run cannot hold both sign-up and Details.

`remove` refuses a path that `add` did not create (no ownership marker), the main API checkout, a directory inside a worktree, and a settings file that is not the copy `add` made. Run it with `--dry-run` first to see the same checks without changes.

Harness comparison: when the PR changes this skill's scripts, the web or API variants exercise only the head's harness, so a harness regression is invisible. Pin one product checkout (`--web-dir` and `--api-dir` identical on both runs) and vary only `--scripts-dir`: once with the base's scripts, once with the head's, each with its own `--home`, one at a time. The head's `verify-side.sh` runs both; only the harness it points at differs. `verify-side.sh` reports every drive as `unsupported` and starts no run when the harness's `verify-cleanup.cs` lacks the recount (`remainingChecks[`), because that harness cannot prove its records are gone. Harnesses before the cleanup recount, such as `7cb6d74b`, cannot be compared.

```bash
W=~/Workspace/uksf/web; P=~/.worktrees/web; B=<base-sha>; H=<head-sha>; V=~/.uksf-verify-pr
harness_sides() {
  local label
  for label in base head; do
    $S/verify-side.sh --side harness-$label --web-dir $P/vs-head --scripts-dir $P/vs-$label/.agents/skills/verify-uksf/scripts --home $V/harness-$label --drive signup || return "$?"
  done
}
git -C $W fetch origin &&
mkdir -p $V &&
git -C $W worktree add --detach $P/vs-base $B && git -C $W worktree add --detach $P/vs-head $H &&
(cd $P/vs-base && bun install --frozen-lockfile) && (cd $P/vs-head && bun install --frozen-lockfile) &&
S=$P/vs-head/.agents/skills/verify-uksf/scripts &&
[ "$(git -C $P/vs-base rev-parse HEAD)" = "$(git -C $W rev-parse $B)" ] &&
[ "$(git -C $P/vs-head rev-parse HEAD)" = "$(git -C $W rev-parse $H)" ] &&
harness_sides && git -C $W worktree remove $P/vs-base && git -C $W worktree remove $P/vs-head
```

A drive that passes with the base harness and fails with the head harness is a regression, `FAIL`. A claim about the harness that cannot be compared is unverified, and unverified is `FAIL` when the PR's done-bar depends on it. Saying so in the verdict does not turn it into a pass. A base harness that lacks a requested drive (the `7cb6d74b` scripts have no Details drive) makes `verify-side.sh` report that drive as `unsupported`, exit 1, and start no run; that claim is then unverified for the base.

Old harnesses can leave records behind: `7cb6d74b` and earlier never tag the browser's random funnel visitor id, so their `down` reports `cleanupRemaining: null`, `verify-side.sh` exits 1, and the run's `applicationFunnelEvents` stay in devLocal. Report their ids and leave them; deleting records the run cannot prove it owns needs a person's decision.

Never publish raw `api.log`: it contains auth tokens. Quote evidence files (`result.json`, `cleanup.json`) instead.

After a stop, read the message, fix the cause, run `down` with that side's `UKSF_VERIFY_HOME` if it did not finish (exit 2 prints the exact command), and remove worktrees by hand.

## Arma beyond event replay

Event replay covers the API side of the game contract. For behaviour that needs the real game (SQF, extension loading, visuals), use the `arma-dev-test-server` skill on ultron.

## Upkeep

Keep this skill and `features/` true to the app with the `maintain-verification-skill` skill. Change them in the same commit as the code they describe.

## Entry-point coverage

`scripts/surface.mjs` lists every entry point from source: Angular routes (`web:`), API controller endpoints read from the API repository at a Git ref (`api:`), SignalR hubs (`hub:`), and game event types from `GameServerEventHandler.cs` (`game:`). Each id must appear in one feature file's `## Entry points` or in `features/unmapped.md`. Check it from this checkout:

```bash
node .agents/skills/verify-uksf/scripts/surface.mjs --api-repo ~/Workspace/uksf/api --api-ref origin/main \
  | node ~/.pi/agent/skills/maintain-verification-skill/scripts/surface-check.mjs .agents/skills/verify-uksf/features
```

Web ids include redirect routes and the `**` route, because a user can open those URLs. Exit 0 means every id is claimed. Exit 1 prints the `unclaimed` and `stale` ids. Exit 2 means a missing input (no `node_modules`, no `dotnet`, a bad API ref) or a declaration the readers do not enumerate exactly. `scripts/surface-lib.mjs` reads Angular routes with the TypeScript compiler. `scripts/surface-api.cs` reads the API with the Roslyn C# parser, so comments and strings never count. It accepts one controller shape only: a public, non-partial, non-generic `*Controller` class that derives directly from `ControllerBase` or `Controller`, has a class `[Route]`, and has a verb attribute on every public method. It refuses every other class that MVC could discover. It also refuses using aliases on routing types, custom routing attributes, `[action]` tokens, non-literal or named-argument templates, `MapHub` declared in source, ids with whitespace or control characters, and `#if`-disabled code. Test both with `node --test .agents/skills/verify-uksf/scripts/surface-lib.test.mjs .agents/skills/verify-uksf/scripts/surface-api.test.mjs`. Run `git -C <api repo> fetch` first when the ref is `origin/main`.

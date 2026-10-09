# UKSF feature map

This map lists what a user or the game does with UKSF, how they reach it, and how to drive it. It is the source for verification: a proof that drives one entry point is incomplete when a feature file lists others.

## Baseline

- A run started with `scripts/uksf-verify.sh up` and a doctor that reports `healthy`.
- Shared `devLocal` data: real units, ranks, and accounts, read as-is.
- Run data: the account `verify+<run-id>@uksf-verify.invalid` (password `Verify-<run-id>-pw`, name Verify Agent, display name `Agent.V`) and the mission session `verify-<run-id>`. `down` removes both.

## Driving conventions

- Web: Playwright with Google Chrome headless, viewport 1280 by 900, from the web checkout root. Prefer `autocomplete` attributes, label text, and component tags (`app-button`, `app-header-bar`) over coordinates.
- Game: HTTP replay to `POST http://127.0.0.1:5500/gameservers/events` with the extension's wire format: an SQF `str()` array `["<type>",[["key",value],...]]`, header `X-Api-Port` (the game listener port), and header `X-Enqueued-At`. The endpoint accepts loopback callers only.
- Data checks: `dotnet run scripts/verify-data.cs -- <run>/settings.json account <email>` or `mission <session-id>`.

## Proof rules

- Drive the user path. Capture each step and the state it produced.
- Check the side effect in `devLocal` next to the visible result.
- Save evidence under `<run>/evidence/<feature>/` and quote the path.

## Features

- [application-signup.md](application-signup.md): a new recruit creates an account, confirms the email, and reaches the Communications step. Driver: `drive-signup.mjs`.
- [sign-in.md](sign-in.md): an existing account signs in with email and password. Driver: `drive-signup.mjs`, after the sign-up.
- [game-server-mission-events.md](game-server-mission-events.md): the Arma extension reports a mission start, player presence, and mission end. Driver: `drive-mission.mjs`.

## Known local failures

- None. The home page's picture endpoint (`GET /instagram`) reads a configured `E:\Workspace\UKSF\homepagepictures` path that exists only on ultron. With the path absent it answers 200 with `[]` and logs no error. It does not affect the mapped features.

## Not yet mapped

Passkey sign-up and sign-in, the application Details step and its submission, recruitment review, the personnel roster, units, operations and campaigns, documents, modpack builds, admin pages, NPC events and the commands the API pushes to the game, persistence saves, and mission stats events.

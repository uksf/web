# Application Details step

A confirmed applicant with Teamspeak, Steam, and Discord connected writes about themselves and submits the application to the recruiters.

## Sub-features

- The step shows three required text areas ("How much experience do you have playing Arma?", "Other units - have you ever been in an Arma unit? Which?", "Personal background - tell us a little about yourself"), a military experience checkbox, role preference checkboxes, and a "Where did you hear about UKSF?" dropdown. Submit stays disabled until the form is valid.
- Submit calls `POST /accounts/{id}/application` (`CreateApplicationCommand` in the API). It creates two comment threads, stores the answers and an application in state `Waiting` with a recruiter on the account, sets the role to `Applicant` and the rank to `Candidate`, adds one service record entry, and adds notifications for the applicant, the assigned recruiter, and every other recruiter lead. It does not add the account to any unit.
- After the submit the page shows "Application Submitted", an Edit Application form, and the Application Chat. The display name becomes `Cdt.Agent.V`.
- `PUT /accounts/{id}/application` updates the answers from the Edit Application form. It is not driven yet.

## How to get to it

- `/application` (header **Apply**, sidebar **Application**) for a signed-in account whose email is confirmed and whose Teamspeak, Steam, and Discord are connected. The progress bar highlights "Details".
- A local run cannot connect real Teamspeak, Steam, or Discord accounts. In verify mode the API offers `POST /accounts/verify/comms` (API `79d153a5` or later), which sets `teamspeakIdentities [-1]`, `steamname verify-<accountId>`, and `discordId verify-<accountId>` on the caller's own account through the account cache. Outside verify mode it answers 404 (API source and tests). Without a token it answers 401.

## Driving it with Playwright

`drive-signup.mjs <run> <run-id> <scripts> --details` drives the sign-up, then this step, then the sign-in.

1. Check that the run account has no application, comment threads, notifications, or unit memberships (`verify-data application <email>`), write `<run>/application-writes.json` with the account id and the total unit member count, and add `application` to `<run>/owned`.
2. Read `access_token` from the page's localStorage and post `POST http://localhost:5500/accounts/verify/comms` with it. It must answer 200 with the three seeded values.
3. Reload the page and wait for `app-application-details`.
4. Fill the three text areas by label, check the "NCO" checkbox, open the dropdown in `app-application-details`, and pick the `mat-option` "Friend". Wait for the Submit `button` to be enabled.
5. Click Submit. Wait for `app-application-edit` and the text "Your application has been successfully submitted".
6. Poll `verify-data application <email>` until the comment threads, notifications, and funnel events have stayed the same for 5 seconds, then record their ids in `<run>/application-writes.json`.

Evidence: screenshots `05-details-form`, `06-details-filled`, and `07-submitted` in `<run>/evidence/signup/`, the seed response in `<run>/evidence/application-details/comms-seed.json`, and the before and after records with the checks in `<run>/evidence/application-details/result.json`. The checks also look for the `Application submitted for Cdt.Agent.V.` audit line in `<run>/api.log`.

## Data

The submit writes to shared `devLocal`. On 2026-10-09 one submit wrote:

| Collection | Records | Cleanup |
|---|---|---|
| `accounts` | the run account: answers, `application`, `rank`, `roleAssignment`, one `serviceRecord` entry, the seeded comms fields | deleted with the account |
| `commentThreads` | 2, the ids in the account's `application.recruiterCommentThread` and `application.applicationCommentThread` | deleted by recorded id, only when the id is one of the account's two thread ids |
| `notifications` | 3: one owned by the applicant, two owned by real recruiter accounts with link `/recruitment/<accountId>` | deleted by recorded id, only when the record is owned by the account or links to `/recruitment/<accountId>` |
| `applicationFunnelEvents` | 6 for the whole drive, the last one `application_submitted` | deleted by `visitorId` `verify-<run-id>`, which the driver sets before the page loads |
| `units` | none | cleanup refuses when the manifest records a unit membership |

`down` writes the dry-run counts to `<run>/evidence/cleanup-dry-run.json` before it deletes anything, then writes the removed counts, a recount that must be zero for every owned kind, and the total unit member count before and after to `<run>/evidence/cleanup.json`. A non-zero recount fails `down`.

## Gotchas

- In verify mode no notification leaves the machine. Mail goes to `<run>/email`. Teamspeak messages go only to Teamspeak clients connected to this local API, and there are none. The Discord client refuses in verify mode. `devLocal` also has `FEATURE_NOTIFICATIONS`, `FEATURE_TEAMSPEAK`, and `FEATURE_DISCORD` set to false, so the 2026-10-09 runs sent no notification mail at all.
- The notifications are written after the submit answers, so read them only once they stop changing.
- The application is submitted once per account. Run `down` and `up` to drive it again.

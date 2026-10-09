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

1. Check that the run account (pinned by the id in `<run>/account-writes.json`) has no application, comment threads, notifications, service record entries, or unit memberships, and that its API has minted no comment threads (`verify-data application <account-id> <email>`). Write `<run>/application-writes.json` with the account id and the total unit member count, and add `application` to `<run>/owned`.
2. Read `access_token` from the page's localStorage and post `POST http://localhost:5500/accounts/verify/comms` with it. It must answer 200 with the three seeded values.
3. Reload the page and wait for `app-application-details`.
4. Fill the three text areas by label, check the "NCO" checkbox, open the dropdown in `app-application-details`, and pick the `mat-option` "Friend". Wait for the Submit `button` to be enabled.
5. Click Submit. Wait for `app-application-edit` and the text "Your application has been successfully submitted".
6. Poll `verify-data application <account-id> <email>` for up to 60 seconds until the notification owners are exactly the expected set, then check again 3 seconds later. The expected set is the applicant, the assigned recruiter, and every lead in the chain of command of the unit named by the `UNIT_ID_RECRUITMENT` variable, minus accounts that are missing or discharged (`CreateApplicationCommand.AssignAndNotify`, `NotificationsService.AddNotificationAsync`). The API writes them without awaiting, so a submit can succeed with some missing.
7. Record the thread and notification ids in `<run>/application-writes.json` with `complete: true`.

The checks require every submitted answer (Arma experience, other units, personal background, reference, role preference), state `Waiting`, rank `Candidate` and role `Applicant`, exactly one service record entry, a recruiter id with its "You have been assigned" notification, both comment thread documents present and exactly equal to the threads the run's API minted, and no unit membership.

Evidence: screenshots `05-details-form`, `06-details-filled`, and `07-submitted` in `<run>/evidence/signup/`, the seed response in `<run>/evidence/application-details/comms-seed.json`, and the before and after records with the checks in `<run>/evidence/application-details/result.json`. The checks also look for the `Application submitted for Cdt.Agent.V.` audit line in `<run>/api.log`.

## Data

The submit writes to shared `devLocal`. On 2026-10-09 one submit wrote:

| Collection | Records | Cleanup |
|---|---|---|
| `accounts` | the run account: answers, `application`, `rank`, `roleAssignment`, one `serviceRecord` entry, the seeded comms fields | deleted with the account |
| `commentThreads` | 2, the ids in the account's `application.recruiterCommentThread` and `application.applicationCommentThread` | deleted by recorded id; the recorded ids must equal the application's threads and include every thread the run's API minted |
| `notifications` | 3: one owned by the applicant, two owned by real recruiter accounts with link `/recruitment/<accountId>` | every notification owned by the account id or linking to `/recruitment/<accountId>` |
| `applicationFunnelEvents` | 6 for the whole drive, the last one `application_submitted` | deleted by recorded id and `visitorId` `verify-<run-id>`; the recount covers every event with that `visitorId` |
| `units` | none | cleanup refuses when the manifest records a unit membership |

Ownership: the run owns the account it created, pinned by the account id from the create response (the `sid` claim of the returned token), not by email. A record whose only subject is that account is owned by the run, so a notification owned by or linking to that account is deleted with it; leaving it would orphan it. Every account delete and account-scoped query filters on the id and the email together.

Threads from a failed submit: the API saves both threads before it attaches them to the account (`CreateApplicationCommand.cs:32-53`), so they cannot be found from the account. Every id the run's API mints carries that process's 5-byte ObjectId random value, which the account id carries too. Cleanup treats a comment thread as minted by the run when its `_id` is no older than the account id and shares those bytes, and refuses when one is not recorded. If the drive could not run that lookup, it marks the manifest `orphanRisk` and `down` exits 7 with what to delete by hand.

`down` writes the dry-run counts to `<run>/evidence/cleanup-dry-run.json` before it deletes anything. It deletes and recounts every child record first, and deletes the account last, only when every child recount is zero, then recounts the account by id and by email. `<run>/evidence/cleanup.json` holds the removed counts, the recounts, and the total unit member count before and after. A non-zero recount fails `down`. A retry after a partial failure needs only the manifests, not the account document, and succeeds when nothing is left.

## Gotchas

- What verify mode enforces, per channel:
  - Email: written as `.eml` files to `<run>/email`, never sent over SMTP (`SmtpClientContext`).
  - Discord: the client refuses to connect in verify mode.
  - Teamspeak: the integration does not start in verify mode. Sending is gated by the `FEATURE_TEAMSPEAK` flag, not by verify mode.
  - SignalR: a new notification is pushed to its owner's group on this local API, so only browsers connected to this local API receive it. A real recruiter signed in to it would.
- Observed on 2026-10-09, not enforced: `devLocal` had `FEATURE_NOTIFICATIONS`, `FEATURE_TEAMSPEAK`, and `FEATURE_DISCORD` set to false, no browser but the drive's was connected, and the runs wrote no notification mail. The notification email path has not been exercised.
- The notifications are written after the submit answers, so wait for the expected owners, not for the first one.
- The application is submitted once per account. Run `down` and `up` to drive it again.

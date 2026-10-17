# Application Details step

A confirmed applicant with Teamspeak, Steam, and Discord connected writes about themselves and submits the application to the recruiters.

## Sub-features

- The step shows three required text areas ("How much experience do you have playing Arma?", "Other units - have you ever been in an Arma unit? Which?", "Personal background - tell us a little about yourself"), a military experience checkbox, role preference checkboxes, and a "Where did you hear about UKSF?" dropdown. Submit stays disabled until the form is valid.
- Submit calls `POST /accounts/{id}/application` (`CreateApplicationCommand` in the API). It creates two comment threads, stores the answers and an application in state `Waiting` with a recruiter on the account, sets the role to `Applicant` and the rank to `Candidate`, adds one service record entry, and adds notifications for the applicant, the assigned recruiter, and every other recruiter lead. It does not add the account to any unit.
- After the submit the page shows "Application Submitted", an Edit Application form, and the Application Chat. The display name becomes `Cdt.Agent.V`.
- `PUT /accounts/{id}/application` updates the answers from the Edit Application form. It is not driven yet.

## Entry points

- `web:/application`
- `api:POST /accounts/{id}/application`
- `api:POST /accounts/verify/comms` (verify mode only)
- `api:GET /auth/refresh`
- `api:GET /accounts`
- `api:GET /version`
- `hub:UtilityHub`
- `api:GET /notifications`
- `hub:NotificationHub`
- `hub:AccountHub`
- `api:POST /application/analytics/event`
- `api:GET /commentthread/{id}`
- `api:GET /commentthread/canpost/{id}`
- `hub:CommentThreadHub`

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
7. Record the application's thread ids, the threads the run's API minted (`candidateThreads`), and the notification ids in `<run>/application-writes.json` with `complete: true`.

The checks require every submitted answer (Arma experience, other units, personal background, reference, role preference), state `Waiting`, rank `Candidate` and role `Applicant`, exactly one service record entry, a recruiter id with its "You have been assigned" notification, both comment thread documents present and exactly equal to the threads that carry the run's API ObjectId bytes, and no unit membership.

Evidence: screenshots `05-details-form`, `06-details-filled`, and `07-submitted` in `<run>/evidence/signup/`, the seed response in `<run>/evidence/application-details/comms-seed.json`, and the before and after records with the checks in `<run>/evidence/application-details/result.json`. The checks also look for the `Application submitted for Cdt.Agent.V.` audit line in `<run>/api.log`.

## Data

The submit writes to shared `devLocal`. On 2026-10-09 one submit wrote:

| Collection | Records | Cleanup |
|---|---|---|
| `accounts` | the run account: answers, `application`, `rank`, `roleAssignment`, one `serviceRecord` entry, the seeded comms fields | deleted with the account |
| `commentThreads` | 2, the ids in the account's `application.recruiterCommentThread` and `application.applicationCommentThread` | deleted only by the ids the account's attached application references, which must equal the recorded ids; cleanup refuses when a thread carrying the run's API ObjectId bytes is not among them |
| `notifications` | 3: one owned by the applicant, two owned by real recruiter accounts with link `/recruitment/<accountId>` | every notification owned by the account id or linking to `/recruitment/<accountId>` |
| `applicationFunnelEvents` | 6 for the whole drive, the last one `application_submitted` | deleted by recorded id and `visitorId` `verify-<run-id>`; the recount covers every event with that `visitorId` |
| `units` | none | cleanup refuses when the manifest records a unit membership |

Ownership: the run owns the account it created, pinned by the account id from the create response (the `sid` claim of the returned token), not by email. A record whose only subject is that account is owned by the run, so a notification owned by or linking to that account is deleted with it; leaving it would orphan it. The sign-up preflight finds the account by email only. Cleanup first looks the account up by email only and refuses when that finds an account other than the pinned id. The owner check, the dry-run count, and the account delete filter on the id and the email together. The check that the id is not taken by another email uses the id alone. The final account recount matches the id or the email.

Threads from a failed submit: the API saves both threads before it attaches them to the account (`CreateApplicationCommand.cs:43-47` creates them, `:61-75` attaches them), so a failed submit can leave threads the account does not reference. A thread is deletable only when the account's attached application references it. Every id the run's API mints carries that process's 5-byte ObjectId random value, which the account id carries too, but any other request served by the same API process shares those bytes and another process can collide, so a match is only a candidate. When the drive fails, the finaliser records matches in `candidateThreads`. If no application is attached and a candidate exists, or the lookup itself failed, it sets `orphanRisk`. Cleanup deletes no thread then: `down` exits 7, prints the candidate ids still present, and keeps the run. Check each candidate by hand, delete only the ones this run created by exact id, remove `orphanRisk` from the manifest, and run `down` again. Without an attached application, cleanup also exits 7 when any candidate or recorded thread still exists. Every other cleanup failure exits 1.

`down` writes the dry-run counts to `<run>/evidence/cleanup-dry-run.json` before it deletes anything. It deletes and recounts every child record first, and deletes the account last, only when every child recount is zero, then recounts the account by id and by email. `<run>/evidence/cleanup.json` holds the removed counts, the recounts, and the total unit member count before and after. A non-zero recount fails `down`. A retry after a partial failure needs only the manifests, not the account document, and succeeds when nothing is left.

## Gotchas

- What verify mode enforces, per channel:
  - Email: written as `.eml` files to `<run>/email`, never sent over SMTP (`SmtpClientContext`).
  - Discord: the client refuses to connect in verify mode, and an API with the seam also treats `DISCORD` as off whatever is stored.
  - Teamspeak: an API with the seam treats `TEAMSPEAK` as off in verify mode whatever the stored `FEATURE_TEAMSPEAK` says, so no message procedure is sent. An API without the seam still sends through its own local hub when the stored flag is true.
  - SignalR: a new notification is pushed to its owner's group on this local API, so only browsers connected to this local API receive it. A real recruiter signed in to it would.
- Notification mail: `up` starts the API with `UKSF_FEATURE_ON=NOTIFICATIONS`. A verify-mode API that has that seam (API `a8da4a9c` or later) forces only `FEATURE_NOTIFICATIONS` on for this process, ignores every other feature name, and logs `verify mode: features forced on: NOTIFICATIONS`. The shared `devLocal` flags stay as they are, so the Dev API is unaffected, and `FEATURE_TEAMSPEAK` and `FEATURE_DISCORD` cannot be forced on. With the seam the submit writes one `.eml` per notified account that has `notificationsEmail` on, subject `UKSF Notification`, into `<run>/email`. The drive derives the expected recipients from `devLocal` (the notified owners with that setting on), matches them to the new `.eml` files by a hash of the address, and checks `notificationMailExact` and `notificationMailSubjects`. `result.json` holds the masked addresses (`B***@g***.com`) only. The `.eml` files hold the full addresses of real recruiters, so do not publish `<run>/email`. `UKSF_FEATURE_OFF` wins over `UKSF_FEATURE_ON`, so `up` refuses when `UKSF_FEATURE_OFF` contains `NOTIFICATIONS`. Against an API without the seam the harness cannot confirm force-on, so mail is unchecked, not absent: the drive reports `notificationMail.status` as `unsupported` with the count of `.eml` files that appeared after the Details drive started (`emlProduced`, not asserted; the sign-up code mail is not counted), adds neither check, and its other checks still decide `pass`. It repeats the status as `notificationMailStatus` at the top of `result.json`, and `verify-side.sh` puts `notificationMail: unsupported` in the drive's `notes`. A pass with unsupported mail is unverified for any mail claim; under `verify-pr` that claim is a `FAIL` when the done-bar depends on it.
- Observed on 2026-10-09 before the seam, not enforced: `devLocal` had `FEATURE_NOTIFICATIONS`, `FEATURE_TEAMSPEAK`, and `FEATURE_DISCORD` set to false, and no browser other than the drive's was connected.
- The notifications are written after the submit answers, so wait for the expected owners, not for the first one.
- The application is submitted once per account. Run `down` and `up` to drive it again.

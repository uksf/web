# Application sign-up

A visitor applies to join UKSF. The first three steps create an account and confirm its email address.

## Sub-features

- Information step: the joining requirements, with a Next button.
- Identity step: email, password and confirmation (or a passkey), first and last name, date of birth, and nation of residence. Next creates the account through `POST /accounts/create` and signs the visitor in.
- Email Confirmation step: the API mails a 24-character code. Entering it calls `POST /accounts/code`, sets the account's `membershipState` from `Unconfirmed` (0) to `Confirmed` (1), and moves to the Communications step.
- Resend: the "Resend Code" button calls `POST /accounts/resend-email-code`.

## How to get to it

- Header button **Apply**, or the sidebar entry **Application**, or the route `/application`.
- A signed-in account that has not finished its application lands on the same page at its current step.

## Driving it with Playwright

1. Open `/application` and wait for the text "Application to join UKSF".
2. Click the last `app-button` with text "Next" inside `app-application-info`.
3. Click "Use a password instead". Fill `input[type=email]`, both `input[autocomplete="new-password"]`, `given-name`, `family-name`, `bday-day`, `bday-month`, and `bday-year`.
4. Click the visible input of `app-dropdown` in `app-application-identity`, type "United Kingdom", and click the matching `mat-option`.
5. Click "Next" in `app-application-identity`. Wait for the field labelled "Enter confirmation code".
6. Read the code from the newest `.eml` in `<run>/email` whose `To:` header is the run's email. The body is base64-encoded HTML. The code is the only 24-character hex string.
7. Fill the code. The field submits itself at 24 characters. Wait for `app-application-communications`.

Evidence: a screenshot after steps 1, 4, 5, and 7, the `.eml` path, and `verify-data account` output before and after the code.

## Gotchas

- The identity step opens in passkey mode. Headless Chrome has no authenticator, so use the password path.
- Mongo stores `membershipState` as a number. `verify-data account` prints the enum name.
- The email address must be unused. A second sign-up in the same run fails, so run `down` and `up` before you repeat it.
- The Communications step needs Teamspeak, which verify mode does not start. The plain drive stops there. With `--details` the driver seeds the comms fields and continues into [application-details.md](application-details.md).
- The application pages post funnel events to `POST /application/analytics/event` (`applicationFunnelEvents`): `info_page_view`, `info_page_next`, `info_page_duration`, `account_created`, and `email_confirmed`. The driver sets their `visitorId` to `verify-<run-id>` and `down` deletes them.

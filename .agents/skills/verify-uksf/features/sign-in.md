# Sign-in

A member or applicant signs in to the website.

## Sub-features

- Email and password sign-in through `POST /auth/login`, which returns a token the web app stores.
- Passkey sign-in through `POST /auth/passkey/options` and `POST /auth/passkey`.
- After a password sign-in, the app tries to save a passkey without a prompt (`PasskeyService.upgradeAfterPasswordSignIn`, called from `login.component.ts`). It acts only when the browser reports `conditionalCreate` and `GET /passkeys` lists none, then calls `POST /passkeys/options/automatic` and `POST /passkeys`. Every failure is silent and the sign-in continues. Those endpoints are listed in [unmapped.md](unmapped.md), and this path is not driven.
- Password reset through `POST /auth/passwordReset` and the emailed code.
- After sign-in, the header shows the account's display name.

## Entry points

- `web:/login`
- `web:/home`
- `api:POST /auth/login`
- `api:GET /auth/refresh`
- `api:GET /accounts`
- `api:GET /version`
- `hub:UtilityHub`
- `api:GET /notifications`
- `hub:NotificationHub`
- `hub:AccountHub`
- `api:GET /teamspeak/onlineAccounts`
- `api:GET /instagram`
- `hub:TeamspeakClientsHub`

## How to get to it

- The header **Sign in** button (it also carries a `person` icon; at the smallest mobile width the control is icon-only), or the route `/login`. A page that needs an account redirects to plain `/login` and stores the destination in localStorage key `auth_redirect_url` (`src/app/core/services/authentication/redirect.service.ts`). After sign-in the app goes to that destination, or to `/home` when none is stored.

## Driving it with Playwright

1. In a new browser context, open `/login`.
2. Fill `app-login input[type=email]` with the email and `app-login input[type=password]` with the password.
3. Click the `app-button` in `app-login` whose text is exactly "Sign in". The other button is "Sign in with a passkey".
4. Wait for the URL to reach `/home`, then for `app-header-bar`.
5. Check that the header text contains the display name. For the run account it is `Agent.V`, or `Cdt.Agent.V` when sign-in runs after the Details submit. The driver checks that the header contains `Agent.V`, which matches both.

Evidence: a screenshot of the signed-in page and the header text check in `result.json`.

## Gotchas

- Without a stored redirect, an account that has not finished its application still lands on `/home`. **Apply** resumes the application at its current step.
- The email field has `autocomplete="username webauthn"`. The repo's `e2e/auth.setup.ts` selects `app-login input[type="email"]` and the "Sign in" button, the same elements as this recipe.
- Passkey and password reset are not driven yet. Password reset mail lands in `<run>/email` like the sign-up code.

# Sign-in

A member or applicant signs in to the website.

## Sub-features

- Email and password sign-in through `POST /auth/login`, which returns a token the web app stores.
- Passkey sign-in through `POST /auth/passkey/options` and `POST /auth/passkey`.
- Password reset through `POST /auth/passwordReset` and the emailed code.
- After sign-in, the header shows the account's display name.

## How to get to it

- The account icon in the header, or the route `/login`. A page that needs an account redirects there with a `redirect` query parameter.

## Driving it with Playwright

1. In a new browser context, open `/login`.
2. Fill `app-login input[type=email]` with the email and `app-login input[type=password]` with the password.
3. Click the `app-button` in `app-login` whose text is exactly "Sign in". The other button is "Sign in with a passkey".
4. Wait for the URL to reach `/home` or `/application`, then for `app-header-bar`.
5. Check that the header text contains the display name. For the run account it is `Agent.V`.

Evidence: a screenshot of the signed-in page and the header text check in `result.json`.

## Gotchas

- An account that has not finished its application is sent to `/application`, not `/home`.
- The email field has `autocomplete="username webauthn"`. The repo's `e2e/auth.setup.ts` still waits for `autocomplete="username"` and a "Login" button, so that setup no longer matches the page.
- Passkey and password reset are not driven yet. Password reset mail lands in `<run>/email` like the sign-up code.

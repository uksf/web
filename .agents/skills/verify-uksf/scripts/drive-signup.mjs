import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const [runDir, runId, scripts] = process.argv.slice(2);
if (!runDir || !runId || !scripts) {
  console.error("usage: drive-signup.mjs <run-dir> <run-id> <scripts-dir>");
  process.exit(2);
}

const require = createRequire(join(process.cwd(), "package.json"));
const { chromium } = require("playwright");

const evidence = join(runDir, "evidence", "signup");
const emailDir = join(runDir, "email");
const email = `verify+${runId}@uksf-verify.invalid`;
const password = `Verify-${runId}-pw`;
const steps = [];
let activePage;

async function shot(page, name) {
  const path = join(evidence, `${String(steps.length + 1).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path, fullPage: true });
  steps.push({ step: name, url: page.url(), screenshot: path });
}

function emailBody(raw) {
  const split = raw.search(/\r?\n\r?\n/);
  const headers = raw.slice(0, split);
  const body = raw.slice(split).trim();
  if (/^content-transfer-encoding:\s*base64/im.test(headers)) return Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8");
  if (/^content-transfer-encoding:\s*quoted-printable/im.test(headers)) return body.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return body;
}

async function confirmationCode() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    for (const file of readdirSync(emailDir).filter((name) => name.endsWith(".eml"))) {
      const raw = readFileSync(join(emailDir, file), "utf8");
      if (!new RegExp(`^To:.*${email.replace(/[+.]/g, "\\$&")}`, "im").test(raw)) continue;
      const code = emailBody(raw).match(/\b[0-9a-f]{24}\b/);
      if (code) return { code: code[0], file };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no confirmation email for ${email} in ${emailDir}`);
}

function account() {
  const output = execFileSync("dotnet", ["run", join(scripts, "verify-data.cs"), "--", process.env.UKSF_API_DIR, "account", email], { encoding: "utf8" });
  return JSON.parse(output.trim().split("\n").pop());
}

execFileSync("mkdir", ["-p", evidence]);
const chromePath = process.env.PLAYWRIGHT_CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ executablePath: chromePath, args: ["--headless=new", "--no-first-run", "--no-default-browser-check"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
activePage = page;
try {
  await page.goto("http://localhost:4200/application");
  await page.getByText("Application to join UKSF").waitFor();
  await shot(page, "information");

  await page.locator("app-application-info app-button", { hasText: "Next" }).last().click();
  await page.getByText("Use a password instead").waitFor();
  await page.getByText("Use a password instead").click();
  await page.locator("app-application-identity input[type=email]").fill(email);
  const passwords = page.locator('app-application-identity input[autocomplete="new-password"]');
  await passwords.nth(0).fill(password);
  await passwords.nth(1).fill(password);
  await page.locator('input[autocomplete="given-name"]').fill("Verify");
  await page.locator('input[autocomplete="family-name"]').fill("Agent");
  await page.locator('input[autocomplete="bday-day"]').fill("1");
  await page.locator('input[autocomplete="bday-month"]').fill("1");
  await page.locator('input[autocomplete="bday-year"]').fill("1990");
  const nation = page.locator("app-application-identity app-dropdown input:not([hidden])").first();
  await nation.click();
  await nation.fill("United Kingdom");
  await page.locator("mat-option", { hasText: "United Kingdom" }).first().click();
  await shot(page, "identity-filled");

  await page.locator("app-application-identity app-button", { hasText: "Next" }).click();
  await page.getByLabel("Enter confirmation code").waitFor({ timeout: 30_000 });
  await shot(page, "email-confirmation");
  const before = account();

  const { code, file } = await confirmationCode();
  await page.getByLabel("Enter confirmation code").fill(code);
  await page.locator("app-application-communications").waitFor({ timeout: 30_000 });
  await shot(page, "communications");
  const after = account();

  const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const signIn = await fresh.newPage();
  activePage = signIn;
  await signIn.goto("http://localhost:4200/login");
  await signIn.locator("app-login input[type=email]").fill(email);
  await signIn.locator("app-login input[type=password]").fill(password);
  await signIn.locator("app-login app-button").filter({ hasText: /^\s*Sign in\s*$/ }).click();
  await signIn.waitForURL(/\/(home|application)/, { timeout: 30_000 });
  await signIn.locator("app-header-bar").waitFor();
  const signedInAs = (await signIn.locator("app-header-bar").innerText()).includes("Agent.V");
  await shot(signIn, "signed-in");
  await fresh.close();

  const result = {
    runId,
    email,
    emailFile: join(emailDir, file),
    accountAfterCreate: before,
    accountAfterCode: after,
    signedInAs: signedInAs ? "Agent.V" : null,
    pass: before.found && before.membershipState === "Unconfirmed" && after.membershipState === "Confirmed" && signedInAs,
    steps,
  };
  writeFileSync(join(evidence, "result.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ pass: result.pass, before: before.membershipState, after: after.membershipState, signedIn: signedInAs, evidence }));
  process.exitCode = result.pass ? 0 : 1;
} catch (error) {
  await shot(activePage, "failure").catch(() => {});
  writeFileSync(join(evidence, "result.json"), JSON.stringify({ runId, email, pass: false, error: String(error), steps }, null, 2));
  console.error(String(error));
  process.exitCode = 1;
} finally {
  await browser.close();
}

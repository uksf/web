import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { driveDetails } from "./details-step.mjs";
import { data as lookup, driverArguments, holdLease, recordOwnership, requireOwned, reserveEvidence } from "./verify-lib.mjs";

const { runDir, runId, scripts } = driverArguments("drive-signup.mjs");
const require = createRequire(join(process.cwd(), "package.json"));
const { chromium } = require("playwright");

const WEB = "http://localhost:4200";
const withDetails = process.argv[5] === "--details";
const evidence = join(runDir, "evidence", "signup");
const detailsEvidence = join(runDir, "evidence", "application-details");
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
  const recipient = new RegExp(`^To:.*${email.replace(/[+.]/g, "\\$&")}`, "im");
  while (Date.now() < deadline) {
    const messages = readdirSync(emailDir)
      .filter((name) => name.endsWith(".eml"))
      .map((name) => ({ name, modified: statSync(join(emailDir, name)).mtimeMs }))
      .sort((a, b) => b.modified - a.modified);
    for (const { name } of messages) {
      const raw = readFileSync(join(emailDir, name), "utf8");
      if (!recipient.test(raw)) continue;
      const code = emailBody(raw).match(/\b[0-9a-f]{24}\b/);
      if (code) return { code: code[0], file: join(emailDir, name) };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no confirmation email for ${email} in ${emailDir}`);
}

function account() {
  const found = lookup(runDir, scripts, ["account", email], 60_000);
  if (!found.ok) throw new Error(`account lookup failed: ${found.error}`);
  return found.value;
}

holdLease(runDir);
reserveEvidence(evidence);
if (withDetails) reserveEvidence(detailsEvidence);
requireOwned(scripts, runId);
const preflight = account();
if (preflight.found || preflight.confirmationCodes !== 0 || preflight.funnelEvents !== 0) throw new Error(`refusing: ${email}, its confirmation codes, or its funnel events already exist in devLocal (${JSON.stringify(preflight)})`);
recordOwnership(runDir, "account");
recordOwnership(runDir, "funnel");

const chromePath = process.env.PLAYWRIGHT_CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ executablePath: chromePath, args: ["--headless=new", "--no-first-run", "--no-default-browser-check"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.addInitScript((visitorId) => localStorage.setItem("uksf_visitor_id", visitorId), `verify-${runId}`);
activePage = page;
try {
  await page.goto(`${WEB}/application`);
  await page.getByText("Application to join UKSF").waitFor();
  await shot(page, "information");

  await page.locator("app-application-info app-button", { hasText: "Next" }).last().click();
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

  requireOwned(scripts, runId);
  await page.locator("app-application-identity app-button", { hasText: "Next" }).click();
  await page.getByLabel("Enter confirmation code").waitFor({ timeout: 30_000 });
  await shot(page, "email-confirmation");
  const before = account();

  const { code, file } = await confirmationCode();
  await page.getByLabel("Enter confirmation code").fill(code);
  await page.locator("app-application-communications").waitFor({ timeout: 30_000 });
  await shot(page, "communications");
  const after = account();

  let details;
  if (withDetails) {
    details = await driveDetails({ page, runDir, runId, scripts, email, evidence: detailsEvidence, shot });
    console.log(JSON.stringify({ feature: "application-details", pass: details.pass, checks: details.checks, evidence: detailsEvidence }));
  }

  const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await fresh.addInitScript((visitorId) => localStorage.setItem("uksf_visitor_id", visitorId), `verify-${runId}`);
  const signIn = await fresh.newPage();
  activePage = signIn;
  await signIn.goto(`${WEB}/login`);
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
    emailFile: file,
    accountAfterCreate: before,
    accountAfterCode: after,
    signedInAs: signedInAs ? "Agent.V" : null,
    details: details ? { pass: details.pass, result: join(detailsEvidence, "result.json") } : undefined,
    pass: before.found && before.membershipState === "Unconfirmed" && after.membershipState === "Confirmed" && signedInAs && (!details || details.pass),
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

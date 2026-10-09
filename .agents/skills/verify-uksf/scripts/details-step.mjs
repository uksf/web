import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { data as lookup, recordOwnership, requireOwned } from "./verify-lib.mjs";

const API = "http://localhost:5500";
const ANSWERS = {
  arma: "Verify agent: three years of Arma 3 milkshake missions.",
  units: "Verify agent: none.",
  background: "Verify agent: scripted background written by the verify-uksf details drive.",
  reference: "Friend",
  role: "NCO",
};

function query(runDir, scripts, args) {
  const found = lookup(runDir, scripts, args, 60_000);
  if (!found.ok) throw new Error(`${args[0]} lookup failed: ${found.error}`);
  return found.value;
}

function manifest(runDir, accountId, recorded, complete) {
  writeFileSync(
    join(runDir, "application-writes.json"),
    JSON.stringify({ accountId, complete, commentThreads: recorded.commentThreads ?? [], notifications: recorded.notifications ?? [], units: recorded.units ?? [], unitMembersTotal: recorded.unitMembersTotal }, null, 2),
  );
}

async function seedComms(page) {
  const token = await page.evaluate(() => localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token"));
  if (!token) throw new Error("no access token in the signed-in page");
  const response = await fetch(`${API}/accounts/verify/comms`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000) });
  return { status: response.status, body: await response.json().catch(() => null) };
}

async function settledApplication(runDir, scripts, email) {
  let previous;
  let stableSince = 0;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const current = query(runDir, scripts, ["application", email]);
    const key = JSON.stringify([current.commentThreads, current.notifications, current.units, current.funnelEvents]);
    if (current.notifications.length > 0 && key === previous) {
      if (Date.now() - stableSince >= 5_000) return current;
    } else {
      previous = key;
      stableSince = Date.now();
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("the submit's writes did not settle within 30 seconds");
}

function mailRecipients(runDir) {
  const folder = join(runDir, "email");
  return readdirSync(folder)
    .filter((name) => name.endsWith(".eml"))
    .map((name) => ({ file: join(folder, name), to: readFileSync(join(folder, name), "utf8").match(/^To:\s*(.*)$/im)?.[1]?.trim() }));
}

async function steps({ page, runDir, runId, scripts, email, evidence, shot }) {
  const checks = {};
  const before = query(runDir, scripts, ["application", email]);
  checks.preflightClean = before.found && !before.applicationState && before.commentThreads.length === 0 && before.notifications.length === 0 && before.units.length === 0;
  if (!checks.preflightClean) throw new Error(`refusing: ${email} already has application writes (${JSON.stringify(before)})`);
  manifest(runDir, before.accountId, { unitMembersTotal: before.unitMembersTotal }, false);
  recordOwnership(runDir, "application");
  const mailBefore = mailRecipients(runDir).length;

  requireOwned(scripts, runId);
  const seeded = await seedComms(page);
  checks.commsSeeded = seeded.status === 200 && seeded.body?.id === before.accountId && seeded.body?.teamspeakIdentities?.join() === "-1" && seeded.body?.steamname === `verify-${before.accountId}` && seeded.body?.discordId === `verify-${before.accountId}`;
  writeFileSync(join(evidence, "comms-seed.json"), JSON.stringify(seeded, null, 2));
  await page.reload();
  await page.locator("app-application-details").waitFor({ timeout: 30_000 });
  checks.progressOnDetails = (await page.locator(".progress-container .box.enabled").innerText()).trim() === "Details";
  await shot(page, "details-form");

  await page.getByLabel("How much experience do you have playing Arma?").fill(ANSWERS.arma);
  await page.getByLabel("Other units - have you ever been in an Arma unit? Which?").fill(ANSWERS.units);
  await page.getByLabel("Personal background - tell us a little about yourself").fill(ANSWERS.background);
  await page.getByRole("checkbox", { name: ANSWERS.role }).check();
  await page.locator("app-application-details app-dropdown input:not([hidden])").first().click();
  await page.locator("mat-option", { hasText: ANSWERS.reference }).first().click();
  const submit = page.locator("app-application-details app-button", { hasText: "Submit" }).locator("button");
  checks.submitEnabled = await submit.and(page.locator(":enabled")).waitFor({ timeout: 10_000 }).then(() => true, () => false);
  await shot(page, "details-filled");

  requireOwned(scripts, runId);
  await submit.click();
  await page.locator("app-application-edit").waitFor({ timeout: 30_000 });
  await page.getByText("Your application has been successfully submitted").waitFor();
  await shot(page, "submitted");

  const after = await settledApplication(runDir, scripts, email);
  manifest(runDir, after.accountId, after, true);

  checks.stateWaiting = after.applicationState === "Waiting";
  checks.answersStored = after.armaExperience === ANSWERS.arma && after.reference === ANSWERS.reference && after.rolePreferences.join() === ANSWERS.role;
  checks.candidateApplicant = after.rank === "Candidate" && after.roleAssignment === "Applicant";
  checks.twoCommentThreads = after.commentThreads.length === 2;
  checks.notificationsRecorded = after.notifications.length > 0;
  checks.noUnitMembershipsAdded = after.units.length === 0 && after.unitMembersTotal === before.unitMembersTotal;
  checks.submitFunnelEvent = after.funnelEvents.some((event) => event.event === "application_submitted");
  const mail = mailRecipients(runDir).slice(mailBefore);
  const apiLog = readFileSync(join(runDir, "api.log"), "utf8");
  checks.auditLogged = apiLog.split("\n").some((line) => line.startsWith("verify-log ") && line.includes('"type":"AuditLog"') && line.includes('"message":"Application submitted for Cdt.Agent.V.'));
  checks.discordRefused = !/discord (connected|ready)/i.test(apiLog);

  const result = { runId, email, seeded, before, after, notificationMail: mail, checks, pass: Object.values(checks).every(Boolean) };
  writeFileSync(join(evidence, "result.json"), JSON.stringify(result, null, 2));
  return result;
}

export async function driveDetails(args) {
  const { runDir, scripts, email } = args;
  try {
    return await steps(args);
  } finally {
    try {
      const recorded = JSON.parse(readFileSync(join(runDir, "application-writes.json"), "utf8"));
      if (!recorded.complete) {
        const current = query(runDir, scripts, ["application", email]);
        if (current.found) manifest(runDir, current.accountId, { ...current, unitMembersTotal: recorded.unitMembersTotal }, true);
      }
    } catch {}
  }
}

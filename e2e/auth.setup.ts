import { test as setup, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
  throw new Error('TEST_EMAIL and TEST_PASSWORD must be set in .env.test');
}

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await page.goto('/login');

  const form = page.locator('app-login');
  await form.locator('input[type="email"]').fill(process.env.TEST_EMAIL!);
  await form.locator('input[type="password"]').fill(process.env.TEST_PASSWORD!);
  await form.locator('app-button').filter({ hasText: /^\s*Sign in\s*$/ }).click();

  await page.waitForURL(/\/(home|application)/, { timeout: 30000 });
  await expect(page.locator('app-header-bar')).toBeVisible();

  await page.context().storageState({ path: authFile });
});

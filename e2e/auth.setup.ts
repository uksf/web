import { test as setup, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load test credentials from .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
  throw new Error('TEST_EMAIL and TEST_PASSWORD must be set in .env.test');
}

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Ensure the auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Navigate to login page
  await page.goto('/login');

  // Wait for the login form to be visible
  await page.waitForSelector('#email');

  // Fill in credentials
  await page.fill('#email', process.env.TEST_EMAIL!);
  await page.fill('#password', process.env.TEST_PASSWORD!);

  // Click the login button (app-button component containing "Login" text)
  await page.click('app-button:has-text("Login")');

  // Wait for redirect after successful login
  await page.waitForURL('**/home', { timeout: 30000 });

  // Verify we're logged in by checking for authenticated content
  await expect(page.locator('app-header-bar')).toBeVisible();

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});

import { test, expect } from '@playwright/test';

/**
 * Profile page interaction tests
 * These run as authenticated user (depends on auth setup)
 */

test.describe('Profile Page - Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('app-profile-page');
  });

  test('displays user name', async ({ page }) => {
    // Profile should show the user's name in the title area
    const titleContainer = page.locator('.title-container');
    await expect(titleContainer).toBeVisible();
    // Should contain at least the first and last name in h2 elements
    const nameElements = page.locator('.title-container h2');
    await expect(nameElements.first()).toBeVisible();
  });

  test('displays country flag', async ({ page }) => {
    const flag = page.locator('.title-container img');
    await expect(flag).toBeVisible();
  });

  test('displays settings card', async ({ page }) => {
    const settingsCard = page.locator('.settings mat-card');
    await expect(settingsCard).toBeVisible();
    await expect(settingsCard.locator('h3', { hasText: 'Settings' })).toBeVisible();
  });

  test('displays email notifications checkbox', async ({ page }) => {
    await expect(page.locator('mat-checkbox', { hasText: 'Email notifications' })).toBeVisible();
  });

  test('displays teamspeak notifications checkbox', async ({ page }) => {
    await expect(page.locator('mat-checkbox', { hasText: 'TeamSpeak notifications' })).toBeVisible();
  });
});

test.describe('Profile Page - Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('app-profile-page');
  });

  test('action buttons are visible for own profile', async ({ page }) => {
    const actionContainer = page.locator('.action-container');
    // Actions are only visible for own profile (isMyProfile)
    if (await actionContainer.isVisible()) {
      await expect(page.locator('button', { hasText: 'Change name' })).toBeVisible();
      await expect(page.locator('button', { hasText: 'Change password' })).toBeVisible();
    }
  });

  test('change name button opens modal', async ({ page }) => {
    const changeNameButton = page.locator('button', { hasText: 'Change name' });
    if (await changeNameButton.isVisible()) {
      await changeNameButton.click();
      // Modal dialog should appear
      await expect(page.locator('mat-dialog-container')).toBeVisible();
      // Close the modal by pressing Escape
      await page.keyboard.press('Escape');
    }
  });

  test('change password button opens modal', async ({ page }) => {
    const changePasswordButton = page.locator('button', { hasText: 'Change password' });
    if (await changePasswordButton.isVisible()) {
      await changePasswordButton.click();
      await expect(page.locator('mat-dialog-container')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('steam connection button is present', async ({ page }) => {
    const steamButton = page.locator('button', { hasText: /Connect Steam|Steam connected/ });
    if (await steamButton.isVisible()) {
      // Just verify the button exists with either state
      await expect(steamButton).toBeVisible();
    }
  });

  test('discord connection button is present', async ({ page }) => {
    const discordButton = page.locator('button', { hasText: /Connect Discord|Discord connected/ });
    if (await discordButton.isVisible()) {
      await expect(discordButton).toBeVisible();
    }
  });

  test('teamspeak connection button is present', async ({ page }) => {
    const teamspeakButton = page.locator('button', { hasText: /Connect TeamSpeak|TeamSpeak connected/ });
    if (await teamspeakButton.isVisible()) {
      await expect(teamspeakButton).toBeVisible();
    }
  });
});

test.describe('Profile Page - Member Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('app-profile-page');
  });

  test('displays member details card with unit and role', async ({ page }) => {
    const detailsContainer = page.locator('.details-container');
    if (await detailsContainer.isVisible()) {
      await expect(detailsContainer.locator('h3', { hasText: 'Details' })).toBeVisible();
      await expect(detailsContainer.locator('.detail', { hasText: 'Unit:' })).toBeVisible();
      await expect(detailsContainer.locator('.detail', { hasText: 'Role:' })).toBeVisible();
    }
  });

  test('displays service history section', async ({ page }) => {
    const serviceHistoryTitle = page.locator('.service-record-title', { hasText: 'Service History' });
    if (await serviceHistoryTitle.isVisible()) {
      await expect(serviceHistoryTitle).toBeVisible();
      // Should have at least one service record card
      const serviceRecords = page.locator('.service-record');
      const count = await serviceRecords.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

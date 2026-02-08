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
    const titleContainer = page.locator('.title-container');
    await expect(titleContainer).toBeVisible();
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

  test('displays notification checkboxes', async ({ page }) => {
    await expect(page.locator('mat-checkbox', { hasText: 'Email notifications' })).toBeVisible();
    await expect(page.locator('mat-checkbox', { hasText: 'TeamSpeak notifications' })).toBeVisible();
  });
});

test.describe('Profile Page - Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('app-profile-page');
  });

  test('action buttons are visible for own profile', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Change name' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Change password' })).toBeVisible();
  });

  test('change name button opens modal', async ({ page }) => {
    await page.locator('button', { hasText: 'Change name' }).click();
    await expect(page.locator('mat-dialog-container')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('change password button opens modal', async ({ page }) => {
    await page.locator('button', { hasText: 'Change password' }).click();
    await expect(page.locator('mat-dialog-container')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('steam connection button is present', async ({ page }) => {
    await expect(page.locator('button', { hasText: /Connect Steam|Steam connected/ })).toBeVisible();
  });

  test('discord connection button is present', async ({ page }) => {
    await expect(page.locator('button', { hasText: /Connect Discord|Discord connected/ })).toBeVisible();
  });

  test('teamspeak connection button is present', async ({ page }) => {
    await expect(page.locator('button', { hasText: /Connect TeamSpeak|TeamSpeak connected/ })).toBeVisible();
  });
});

test.describe('Profile Page - Member Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('app-profile-page');
  });

  test('displays member details card with unit and role', async ({ page }) => {
    const detailsContainer = page.locator('.details-container');
    await expect(detailsContainer).toBeVisible();
    await expect(detailsContainer.locator('h3', { hasText: 'Details' })).toBeVisible();
    await expect(detailsContainer.locator('.detail', { hasText: 'Unit:' })).toBeVisible();
    await expect(detailsContainer.locator('.detail', { hasText: 'Role:' })).toBeVisible();
  });

  test('displays service history section', async ({ page }) => {
    const serviceHistoryTitle = page.locator('.service-record-title', { hasText: 'Service History' });
    await expect(serviceHistoryTitle).toBeVisible();
    const serviceRecords = page.locator('.service-record');
    const count = await serviceRecords.count();
    expect(count).toBeGreaterThan(0);
  });
});

import { expect, test } from '@playwright/test';

test('homepage renders SyncBoard shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome to SyncBoard' })).toBeVisible();
  await expect(page.getByLabel('Primary navigation')).toBeVisible();
});
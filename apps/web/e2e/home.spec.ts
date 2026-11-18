import { expect, test } from '@playwright/test';

test('protected dashboard redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Sign in to SyncBoard' })).toBeVisible();
});
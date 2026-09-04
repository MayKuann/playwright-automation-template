import { expect, test } from '@playwright/test';

/**
 * Copy this file, rename it to describe the feature, then remove `.skip`.
 * Keep one clear user behaviour and one meaningful assertion per test.
 */
test.describe.skip('Feature name', () => {
  test('shows the expected result when the user completes an action', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByRole('heading', { name: /success/i })).toBeVisible();
  });
});

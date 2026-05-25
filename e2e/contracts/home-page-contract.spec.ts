import { test, expect } from '@playwright/test';

test.describe('Home page — UI contract conformance', () => {
  test('renders the page successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.*/);
  });

  test('has a visible heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();
  });

  test('status code is 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response!.status()).toBe(200);
  });
});

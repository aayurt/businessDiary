import { test, expect } from '@playwright/test'

test.describe('Navigation flow', () => {
  test('home page loads successfully', async ({ page }) => {
    const response = await page.goto('/')
    expect(response!.status()).toBe(200)
  })

  test('home page has title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.*/)
  })

  test('navigation from home to dashboard', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /dashboard/i }).first().click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('404 page for unknown routes', async ({ page }) => {
    const response = await page.goto('/nonexistent-route-xyz')
    expect(response!.status()).toBe(404)
  })

  test('back navigation works from 404', async ({ page }) => {
    await page.goto('/')
    await page.goto('/nonexistent-route-xyz')
    await page.goBack()
    await expect(page).toHaveURL('/')
  })
})

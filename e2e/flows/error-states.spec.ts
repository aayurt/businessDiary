import { test, expect } from '@playwright/test'

test.describe('Error states', () => {
  test('returns 404 for unknown routes', async ({ page }) => {
    const response = await page.goto('/nonexistent-route', { waitUntil: 'networkidle' })
    expect(response?.status()).toBe(404)
  })

  test('returns 404 for nested unknown routes', async ({ page }) => {
    const response = await page.goto('/dashboard/unknown-page', { waitUntil: 'networkidle' })
    expect(response?.status()).toBe(404)
  })

  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/api/analytics/summary', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    const errorState = page.locator('text=Failed to load dashboard')
    await expect(errorState).toBeVisible()
  })

  test('shows retry button on API failure', async ({ page }) => {
    await page.route('**/api/analytics/summary', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    const retryBtn = page.locator('button:has-text("Retry")')
    await expect(retryBtn).toBeVisible()
  })

  test('handles network error gracefully', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.abort('connectionrefused')
    })
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    const errorElement = page.locator('text=Failed to load dashboard')
    await expect(errorElement).toBeVisible()
  })
})

test.describe('Loading states', () => {
  test('shows loading skeleton on dashboard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'commit' })
    const skeleton = page.locator('.animate-pulse').first()
    await expect(skeleton).toBeVisible()
  })

  test('loading state disappears after data loads', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    const skeleton = page.locator('.animate-pulse')
    await expect(skeleton).toHaveCount(0)
  })

  test('dashboard loading page has skeleton structure', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'commit' })
    const skeletonCards = page.locator('.rounded-lg.border.p-4')
    await expect(skeletonCards).toHaveCount(4)
  })
})

test.describe('Empty states', () => {
  test('shows empty state when no activity exists', async ({ page }) => {
    await page.route('**/api/analytics/activity-feed', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) })
    })
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    const emptyText = page.locator('text=No recent activity')
    await expect(emptyText).toBeVisible()
  })

  test('shows empty state for top voted when no votes', async ({ page }) => {
    await page.route('**/api/analytics/top-voted', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) })
    })
    await page.goto('/dashboard', { waitUntil: 'networkidle' })
    const emptyText = page.locator('text=No entries with votes yet')
    await expect(emptyText).toBeVisible()
  })
})

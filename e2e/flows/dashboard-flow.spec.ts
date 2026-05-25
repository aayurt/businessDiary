import { test, expect } from '@playwright/test'

test.describe('Dashboard flow', () => {
  test('dashboard page loads and shows loading state initially', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/loading dashboard data/i)).toBeVisible({ timeout: 5000 })
  })

  test('dashboard page renders with title after loading', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /investor dashboard/i })).toBeVisible({ timeout: 15000 })
  })

  test('dashboard has stat cards with data', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/total entries/i)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/total votes/i)).toBeVisible()
    await expect(page.getByText(/comments/i)).toBeVisible()
    await expect(page.getByText(/investment interests/i)).toBeVisible()
  })

  test('dashboard has export button', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible({ timeout: 15000 })
  })

  test('dashboard has refresh button', async ({ page }) => {
    await page.goto('/dashboard')
    const refreshButtons = page.getByRole('button').filter({ has: page.locator('.lucide-refresh-cw, svg') })
    await expect(refreshButtons.first()).toBeVisible({ timeout: 15000 })
  })

  test('dashboard shows budget summary', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/total budget/i)).toBeVisible({ timeout: 15000 })
  })

  test('dashboard sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard')
    await expect(page.getByText('Next.js App')).toBeVisible({ timeout: 10000 })
  })
})

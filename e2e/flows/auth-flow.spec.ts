import { test, expect } from '@playwright/test'

test.describe('Auth flow', () => {
  test('sign-in page renders correctly', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('sign-up page renders correctly', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('sign-in form validates required fields', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/email.*required|invalid/i).or(page.getByText(/password.*required/i))).toBeVisible()
  })

  test('navigation to sign up from sign in', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/\/auth\/signup/)
  })

  test('navigation to sign in from sign up', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/auth\/signin/)
  })
})

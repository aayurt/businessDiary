import { test, expect } from '@playwright/test'

test.describe('Voting flow', () => {
  test('vote button renders with correct structure', async ({ page }) => {
    await page.goto('/')
    const voteSection = page.locator('[data-testid="vote-button"]').first()
    await expect(voteSection).toBeVisible()
  })

  test('upvote and downvote buttons exist', async ({ page }) => {
    await page.goto('/')
    const upvoteBtn = page.locator('[data-testid="vote-up"]').first()
    const downvoteBtn = page.locator('[data-testid="vote-down"]').first()
    await expect(upvoteBtn).toBeVisible()
    await expect(downvoteBtn).toBeVisible()
  })

  test('vote buttons display current score', async ({ page }) => {
    await page.goto('/')
    const score = page.locator('[data-testid="vote-score"]').first()
    await expect(score).toBeVisible()
    const scoreText = await score.textContent()
    expect(scoreText).not.toBeNull()
  })

  test('vote buttons are disabled when not authenticated', async ({ page }) => {
    await page.goto('/')
    const upvoteBtn = page.locator('[data-testid="vote-up"]').first()
    await expect(upvoteBtn).toBeDisabled()
  })

  test('vote section exists on entry pages', async ({ page }) => {
    await page.goto('/')
    const voteWidget = page.locator('.flex.items-center.gap-1').first()
    await expect(voteWidget).toBeVisible()
  })
})

test.describe('Vote button component', () => {
  test('displays ArrowUp and ArrowDown icons', async ({ page }) => {
    await page.goto('/')
    const upSvg = page.locator('[data-testid="vote-up"] svg').first()
    const downSvg = page.locator('[data-testid="vote-down"] svg').first()
    await expect(upSvg).toBeVisible()
    await expect(downSvg).toBeVisible()
  })

  test('shows numeric score between vote buttons', async ({ page }) => {
    await page.goto('/')
    const score = page.locator('[data-testid="vote-score"]').first()
    const text = await score.textContent()
    expect(text).toMatch(/^-?\d+$/)
  })
})

import { test, expect } from '@playwright/test'

test.describe('Markdown Editor flow', () => {
  test('markdown editor placeholder renders on page', async ({ page }) => {
    await page.goto('/')
    const editor = page.locator('[data-testid="md-editor"]').first()
    await expect(editor).toBeVisible()
  })

  test('markdown editor has textarea for input', async ({ page }) => {
    await page.goto('/')
    const textarea = page.locator('[data-testid="md-textarea"]').first()
    await expect(textarea).toBeVisible()
  })

  test('can type into markdown editor', async ({ page }) => {
    await page.goto('/')
    const textarea = page.locator('[data-testid="md-textarea"]').first()
    await textarea.fill('# Hello World')
    const value = await textarea.inputValue()
    expect(value).toContain('# Hello World')
  })

  test('editor supports markdown syntax', async ({ page }) => {
    await page.goto('/')
    const textarea = page.locator('[data-testid="md-textarea"]').first()
    await textarea.fill('**bold** *italic* `code`')
    const value = await textarea.inputValue()
    expect(value).toBe('**bold** *italic* `code`')
  })

  test('editor renders with correct default height', async ({ page }) => {
    await page.goto('/')
    const editor = page.locator('[data-testid="md-editor"]').first()
    const height = await editor.getAttribute('data-height')
    expect(height).toBe('400')
  })

  test('multiple editors can exist on same page', async ({ page }) => {
    await page.goto('/')
    const editors = page.locator('[data-testid="md-editor"]')
    const count = await editors.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

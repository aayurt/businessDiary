import { test, expect, type BrowserContext } from '@playwright/test'
import crypto from 'crypto'

type AuthCookies = Awaited<ReturnType<BrowserContext['cookies']>>

test.describe('Editor: preview sync & save behavior', () => {
  test.describe.configure({ timeout: 120000 })
  const email = `test-${crypto.randomUUID().slice(0, 8)}@e2e.test`
  const password = 'TestPass123!'
  const projectName = 'E2E Test Project'
  const fileName = 'E2E Test File'

  let projectId: string
  let fileId: string
  let authCookies: AuthCookies

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000)
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    // Sign up
    const signupRes = await page.request.post('/api/auth/signup', {
      data: { name: 'E2E Tester', email, password },
    })
    expect(signupRes.status()).toBe(201)

    // Sign in
    await page.goto('/auth/signin', { waitUntil: 'networkidle' })
    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.click('button[type="submit"]')

    // Wait for sign-in to complete and verify session
    await page.waitForFunction(
      () => document.body?.innerText?.includes('Auth: Signed in as'),
      { timeout: 30000 },
    )
    await page.waitForTimeout(1000)

    // Save cookies after sign-in (with retry to handle race conditions)
    for (let attempt = 0; attempt < 3; attempt++) {
      authCookies = await page.context().cookies()
      if (authCookies.some(c => c.name === 'authjs.session-token')) break
      await page.waitForTimeout(500)
    }
    expect(authCookies.some(c => c.name === 'authjs.session-token')).toBeTruthy()

    // Create project using in-page fetch (cookies are set)
    const projectResult = await page.evaluate(async (name) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      return { status: res.status, body: await res.json() }
    }, projectName)
    expect(projectResult.status).toBe(201)
    projectId = projectResult.body.data.id

    const fileResult = await page.evaluate(async ({ pid, title, content }) => {
      const res = await fetch(`/api/files/projects/${pid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      return { status: res.status, body: await res.json() }
    }, { pid: projectId, title: fileName, content: '# Initial Content\n\nHello world' })
    expect(fileResult.status).toBe(201)
    fileId = fileResult.body.data.id

    await ctx.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies(authCookies)
  })

  test('preview updates live when typing in the editor (desktop split view)', async ({ page }) => {
    await page.goto(`/editor/${fileId}`)
    await page.waitForSelector('[aria-label="editable markdown"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    const editorInput = page.locator('[contenteditable="true"]').first()
    await expect(editorInput).toBeVisible({ timeout: 5000 })

    await expect(page.getByText('Hello world').first()).toBeVisible({ timeout: 5000 })

    await editorInput.click()
    await editorInput.pressSequentially('  fresh preview', { delay: 15 })
    await page.waitForTimeout(500)

    await expect(page.getByText('fresh preview').first()).toBeVisible({ timeout: 5000 })
  })

  test('Save button saves and shows Saved status', async ({ page }) => {
    await page.goto(`/editor/${fileId}`)
    await page.waitForSelector('[aria-label="editable markdown"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    const editorInput = page.locator('[contenteditable="true"]').first()
    await expect(editorInput).toBeVisible({ timeout: 5000 })

    await editorInput.click()
    await editorInput.fill('')
    await editorInput.pressSequentially('# Saved Content', { delay: 20 })

    await expect(page.locator('header').getByText('Unsaved')).toBeVisible({ timeout: 5000 })

    await page.click('button:has-text("Save")')

    await expect(page.locator('header .text-green-600')).toBeVisible({ timeout: 15000 })
  })

  test('Cmd+S saves and shows Saved indicator', async ({ page }) => {
    await page.goto(`/editor/${fileId}`)
    await page.waitForSelector('[aria-label="editable markdown"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    const editorInput = page.locator('[contenteditable="true"]').first()
    await expect(editorInput).toBeVisible({ timeout: 5000 })

    await editorInput.click()
    await editorInput.fill('')
    await editorInput.pressSequentially('Cmd+S test', { delay: 20 })
    await expect(page.locator('header').getByText('Unsaved')).toBeVisible({ timeout: 5000 })

    await page.keyboard.press('Meta+s')
    await expect(page.locator('header .text-green-600')).toBeVisible({ timeout: 15000 })
  })

  test('autosave fires after idle and shows Saved', async ({ page }) => {
    await page.goto(`/editor/${fileId}`)
    await page.waitForSelector('[aria-label="editable markdown"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    const editorInput = page.locator('[contenteditable="true"]').first()
    await expect(editorInput).toBeVisible({ timeout: 5000 })

    await editorInput.click()
    await editorInput.fill('')
    await editorInput.pressSequentially('Autosave test content', { delay: 20 })

    await expect(page.locator('header').getByText('Unsaved')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('header .text-green-600')).toBeVisible({ timeout: 20000 })
  })

  test('preview updates on mobile via tab switch', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`/editor/${fileId}`)
    await page.waitForSelector('[aria-label="editable markdown"]', { state: 'attached', timeout: 15000 })
    await page.waitForTimeout(2000)

    const editorInput = page.locator('.lg\\:hidden [contenteditable="true"]').first()
    await expect(editorInput).toBeVisible({ timeout: 5000 })

    await editorInput.click()
    await editorInput.pressSequentially('  mobile sync', { delay: 15 })

    await page.getByRole('tab', { name: /preview/i }).click()

    // Wait for the visible preview tabpanel to contain the text
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('[role="tabpanel"]:not([hidden])')
        return panel?.textContent?.includes('mobile sync')
      },
      { timeout: 10000 },
    )
  })

  test('confidence score slider and display exist and save via editor persists', async ({ page }) => {
    await page.goto(`/editor/${fileId}`)
    await page.waitForSelector('[aria-label="editable markdown"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    const slider = page.locator('[role="slider"]')
    await expect(slider).toBeVisible({ timeout: 3000 })

    await expect(page.locator('aside').getByText(/%/)).toBeVisible({ timeout: 3000 })

    const editorInput = page.locator('[contenteditable="true"]').first()
    await editorInput.click()
    await editorInput.fill('')
    await editorInput.pressSequentially('Confidence save test', { delay: 20 })
    await page.keyboard.press('Meta+s')
    await expect(page.locator('header .text-green-600')).toBeVisible({ timeout: 15000 })

    const fileCheck = await page.request.get(`/api/files/${fileId}`)
    const fileData = await fileCheck.json()
    expect(fileData.data.content).toContain('Confidence save test')
  })
})

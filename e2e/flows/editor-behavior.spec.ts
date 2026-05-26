import { test, expect, type Page, type BrowserContext } from '@playwright/test'
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

  async function signIn(page: Page) {
    await page.goto('/auth/signin')
    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.click('button[type="submit"]')
    // Next.js router.push doesn't trigger Playwright navigation events,
    // so wait for a sign-out button or "Signed in as" text to appear
    await page.waitForFunction(
      () => {
        const body = document.body?.innerText || ''
        return body.includes('Sign out') || body.includes('Signed in')
      },
      { timeout: 25000 },
    )
  }

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    // Sign up
    const signupRes = await page.request.post('/api/auth/signup', {
      data: { name: 'E2E Tester', email, password },
    })
    expect(signupRes.status()).toBe(201)

    // Sign in with retry — server may be slow under parallel load
    let signedIn = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await signIn(page)
        signedIn = true
        break
      } catch {
        if (attempt === 3) throw new Error('Sign in failed after 3 attempts')
        await page.waitForTimeout(2000)
      }
    }

    // Save cookies for reuse across tests
    authCookies = await page.context().cookies()

    // Create project
    const projectRes = await page.request.post('/api/projects', {
      data: { name: projectName },
    })
    expect(projectRes.status()).toBe(201)
    projectId = (await projectRes.json()).data.id

    // Create file
    const fileRes = await page.request.post(`/api/files/projects/${projectId}`, {
      data: { title: fileName, content: '# Initial Content\n\nHello world' },
    })
    expect(fileRes.status()).toBe(201)
    fileId = (await fileRes.json()).data.id

    await ctx.close()
  })

  // Inject auth cookies before each test so they start authenticated
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies(authCookies)
  })

  test('preview updates live when typing in the editor (desktop split view)', async ({ page }) => {
    await page.goto(`/editor/${fileId}`)
    await page.waitForSelector('[aria-label="editable markdown"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Desktop editable editor
    const editorInput = page.locator('[contenteditable="true"]').first()
    await expect(editorInput).toBeVisible({ timeout: 5000 })

    // Desktop preview (read-only, has aria-readonly)
    const previewPane = page.locator('[aria-readonly="true"]').first()
    await expect(previewPane).toBeVisible({ timeout: 5000 })

    // Verify initial content in preview
    await expect(previewPane).toContainText('Hello world')

    // Type new markdown
    await editorInput.click()
    await editorInput.fill('')
    await editorInput.pressSequentially('# New Heading\n\nNew paragraph content', { delay: 20 })
    await page.waitForTimeout(500)

    // Preview should update (validates the fix for the preview bug)
    await expect(previewPane).toContainText('New Heading')
    await expect(previewPane).toContainText('New paragraph content')
    await expect(previewPane).not.toContainText('Hello world')
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
    // Autosave debounce 1.5s + network
    await expect(page.locator('header .text-green-600')).toBeVisible({ timeout: 20000 })
  })

  test('preview updates on mobile via tab switch', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`/editor/${fileId}`)
    await page.waitForSelector('[aria-label="editable markdown"]', { state: 'attached', timeout: 15000 })
    await page.waitForTimeout(2000)

    // Mobile editor is inside the lg:hidden section
    const editorInput = page.locator('.lg\\:hidden [contenteditable="true"]').first()
    await expect(editorInput).toBeVisible({ timeout: 5000 })

    await editorInput.click()
    await editorInput.fill('')
    await editorInput.pressSequentially('Mobile preview content', { delay: 20 })

    // Switch to Preview tab
    await page.getByRole('tab', { name: /preview/i }).click()
    await page.waitForTimeout(1000)

    const mobilePreview = page.locator('.lg\\:hidden [aria-readonly="true"]')
    await expect(mobilePreview).toContainText('Mobile preview content')
  })

  test('confidence score slider and display exist and save via editor persists', async ({ page }) => {
    await page.goto(`/editor/${fileId}`)
    await page.waitForSelector('[aria-label="editable markdown"]', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Confidence slider exists
    const slider = page.locator('[role="slider"]')
    await expect(slider).toBeVisible({ timeout: 3000 })

    // Confidence display shows a percentage
    await expect(page.locator('aside').getByText(/%/)).toBeVisible({ timeout: 3000 })

    // Type in editor and save — this verifies the full save cycle
    const editorInput = page.locator('[contenteditable="true"]').first()
    await editorInput.click()
    await editorInput.fill('')
    await editorInput.pressSequentially('Confidence save test', { delay: 20 })
    await page.keyboard.press('Meta+s')
    await expect(page.locator('header .text-green-600')).toBeVisible({ timeout: 15000 })

    // Verify the save persisted via API
    const fileCheck = await page.request.get(`/api/files/${fileId}`)
    const fileData = await fileCheck.json()
    expect(fileData.data.content).toContain('Confidence save test')
  })
})

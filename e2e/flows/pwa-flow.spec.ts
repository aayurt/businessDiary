import { test, expect } from '@playwright/test'

test.describe('PWA capabilities', () => {
  test('manifest.json is served and valid', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    expect(response!.status()).toBe(200)
    const contentType = response!.headers()['content-type']
    expect(contentType).toMatch(/json|application\/manifest/i)
  })

  test('manifest has required fields', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    const manifest = await response!.json()
    expect(manifest.name).toBeDefined()
    expect(manifest.short_name).toBeDefined()
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons).toBeDefined()
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3)
  })

  test('service worker is registered', async ({ page }) => {
    await page.goto('/')
    const hasSw = await page.evaluate(() => 'serviceWorker' in navigator)
    expect(hasSw).toBe(true)
  })

  test('service worker can be fetched', async ({ page }) => {
    const response = await page.goto('/sw.js')
    expect(response!.status()).toBe(200)
  })

  test('theme-color meta tag is present', async ({ page }) => {
    await page.goto('/')
    const themeColor = await page.evaluate(() => {
      return document.querySelector('meta[name="theme-color"]')?.getAttribute('content')
    })
    expect(themeColor).toBeDefined()
  })

  test('apple-mobile-web-app-capable meta tag is present', async ({ page }) => {
    await page.goto('/')
    const capable = await page.evaluate(() => {
      return document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content')
    })
    expect(capable).toBe('yes')
  })
})

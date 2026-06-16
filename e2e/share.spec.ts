import { expect, test } from '@playwright/test'

test('falls back to copying when native sharing is rejected', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => { throw new DOMException('Blocked', 'NotAllowedError') },
    })
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: async (value: string) => { sessionStorage.setItem('copied-link', value) },
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'SKIP TO ARCHIVE' }).click()
  await page.getByRole('button', { name: 'SHARE THE NIGHT' }).click()

  await expect(page.getByText('LINK COPIED', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('copied-link'))).toBe(
    'http://127.0.0.1:4174',
  )
})

test('offers a selectable link when every share route fails', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'SKIP TO ARCHIVE' }).click()
  await page.getByRole('button', { name: 'SHARE THE NIGHT' }).click()

  await expect(page.getByText('COPY THIS LINK', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Public link to copy')).toHaveValue('http://127.0.0.1:4174')
})

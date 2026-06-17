import { expect, test } from '@playwright/test'
import { collectPageErrors } from './helpers'

test('archive and ticket remain inside the desktop viewport', async ({ page }) => {
  const errors = collectPageErrors(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'SKIP TO ARCHIVE' }).click()

  await expect(page.getByText('CHOOSE YOUR EDITION')).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('downloads front, back and vertical two-sided ticket images', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'SKIP TO ARCHIVE' }).click()

  for (const side of ['FRONT', 'BACK', 'BOTH'] as const) {
    await page.getByText('KEEP THIS TICKET', { exact: true }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: side, exact: true }).click(),
    ])
    await expect(download.suggestedFilename()).toContain(`-${side.toLowerCase()}-ticket.png`)
  }
})

test('reveals each album catalog while keeping three featured tracks actionable', async ({ page }) => {
  const errors = collectPageErrors(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'SKIP TO ARCHIVE' }).click()

  const firstAlbum = page.getByLabel('The 1975 track listing')
  await expect(firstAlbum.locator('.archive-index__featured-tracks button')).toHaveCount(3)
  await firstAlbum.hover()
  await expect(firstAlbum.locator('.archive-index__catalog')).toBeVisible()
  await expect(firstAlbum.locator('.archive-index__catalog li')).toHaveCount(16)

  await firstAlbum.locator('.archive-index__featured-tracks button').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(errors).toEqual([])
})

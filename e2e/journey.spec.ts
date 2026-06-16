import { expect, test } from '@playwright/test'
import { collectPageErrors, seedInterlude, seedLivePrelude } from './helpers'

test('the prologue is usable with reduced motion', async ({ page }) => {
  const errors = collectPageErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  await expect(page.getByRole('button', { name: /ENTER/i }).first()).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('live preview shows the full setlist before the first act', async ({ page }) => {
  const errors = collectPageErrors(page)
  await seedLivePrelude(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'At Their Very Best' })).toBeVisible()
  await expect(page.getByLabel('Virtual concert directory').locator('li')).toHaveCount(7)
  await expect(page.getByText('Happiness', { exact: true })).toBeVisible()
  await expect(page.getByText('When We Are Together', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.getByRole('button', { name: /Enter act 6: The Sound/ }).click()
  await expect(page.getByRole('button', { name: /START THE PULSE/ })).toBeVisible()
  await expect(page.getByText('The Sound', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Live video controls')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('stage transition lands on the live preview instead of the first act', async ({ page }) => {
  const errors = collectPageErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedInterlude(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'At Their Very Best' })).toBeVisible()
  await expect(page.getByLabel('Virtual concert directory').locator('li')).toHaveCount(7)
  await expect(page.getByRole('button', { name: /LIGHT THE HOUSE/ })).toHaveCount(0)

  await page.getByRole('button', { name: /ENTER AT THEIR VERY BEST/ }).click()
  await expect(page.getByRole('button', { name: /LIGHT THE HOUSE/ })).toBeVisible()
  expect(errors).toEqual([])
})

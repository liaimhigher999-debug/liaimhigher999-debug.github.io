import { expect, test } from '@playwright/test'
import { collectPageErrors, seedTour } from './helpers'

test('seeks accurately and preserves time when switching quality', async ({ page }) => {
  const errors = collectPageErrors(page)
  await seedTour(page)
  await page.goto('/')

  await page.getByRole('button', { name: /LIGHT THE HOUSE/ }).click()
  const video = page.locator('video.tour-stage__live-video')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.duration)).toBeGreaterThan(200)
  await page.mouse.move(600, 700)

  const progress = page.getByLabel('Live video progress')
  await expect(progress).toBeEnabled()
  await progress.fill('120')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(119)
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeLessThan(122)

  await page.mouse.move(650, 700)
  await page.mouse.move(780, 965)
  await expect(page.getByLabel('Live video controls')).toHaveClass(/is-visible/)
  const standardQuality = page.getByRole('button', { name: '720P' })
  await expect(standardQuality).toBeEnabled()
  await standardQuality.click()
  await expect.poll(() => video.getAttribute('src')).toContain('/web/720/01-happiness.mp4')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(119)

  await page.keyboard.press('Space')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true)
  expect(errors).toEqual([])
})

test('reveals controls on pointer movement without horizontal overflow', async ({ page }) => {
  await seedTour(page)
  await page.goto('/')
  await page.getByRole('button', { name: /LIGHT THE HOUSE/ }).click()
  await page.mouse.move(700, 700)

  await expect(page.getByLabel('Live video controls')).toHaveClass(/is-visible/)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('supports transport, volume, locking, screen pause and exit', async ({ page }) => {
  const errors = collectPageErrors(page)
  await seedTour(page)
  await page.goto('/')
  await page.getByRole('button', { name: /LIGHT THE HOUSE/ }).click()

  const video = page.locator('video.tour-stage__live-video')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.duration)).toBeGreaterThan(200)
  await page.mouse.move(650, 700)
  await page.getByLabel('Live video progress').fill('60')

  await page.getByRole('button', { name: 'Rewind 10 seconds' }).click()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(49)
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeLessThan(52)

  await page.getByRole('button', { name: 'Forward 10 seconds' }).click()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(59)
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeLessThan(62)

  await page.getByLabel('Live video volume').fill('0.35')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.volume)).toBeCloseTo(0.35, 2)

  await video.click({ position: { x: 500, y: 300 } })
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true)
  await video.click({ position: { x: 500, y: 300 } })
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false)

  await page.mouse.move(650, 700)
  await page.getByRole('button', { name: 'Lock video controls' }).click()
  await expect(page.getByRole('button', { name: 'Unlock video controls' })).toBeVisible()
  await expect(page.getByLabel('Live video progress')).toBeDisabled()

  await page.getByRole('button', { name: 'Unlock video controls' }).click()
  await expect(page.getByLabel('Live video progress')).toBeEnabled()
  await page.getByRole('button', { name: 'Exit live video' }).click()

  await expect(page.getByRole('button', { name: /LIGHT THE HOUSE/ })).toBeEnabled()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true)
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeLessThan(0.25)
  expect(errors).toEqual([])
})

test('restores a playing act to its waiting state after refresh', async ({ page }) => {
  await seedTour(page)
  await page.goto('/')
  await page.getByRole('button', { name: /LIGHT THE HOUSE/ }).click()
  await expect(page.locator('video.tour-stage__live-video')).toBeVisible()

  await page.reload()

  await expect(page.getByRole('button', { name: /LIGHT THE HOUSE/ })).toBeEnabled()
  await expect(page.getByLabel('Live video controls')).toHaveCount(0)
})

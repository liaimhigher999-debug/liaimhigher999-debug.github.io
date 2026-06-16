import type { Page } from '@playwright/test'

export const tourState = {
  phase: 'tour',
  activeEraIndex: 4,
  unlockedEraIndexes: [0, 1, 2, 3, 4],
  exploredClues: {},
  activeTourIndex: 0,
  archiveUnlocked: false,
  hasCompletedFirstRun: true,
  explorationOrder: [],
  completedAt: null,
  journeyId: 'FR-20260615-TEST01',
}

export const livePreludeState = {
  ...tourState,
  phase: 'livePrelude',
  activeTourIndex: 0,
}

export const interludeState = {
  ...tourState,
  phase: 'interlude',
  activeTourIndex: 0,
  hasCompletedFirstRun: false,
}

export const seedTour = async (page: Page) => {
  await page.addInitScript((state) => {
    localStorage.setItem('the1975:journey:v1', JSON.stringify({ version: 1, state }))
  }, tourState)
}

export const seedLivePrelude = async (page: Page) => {
  await page.addInitScript((state) => {
    localStorage.setItem('the1975:journey:v1', JSON.stringify({ version: 1, state }))
  }, livePreludeState)
}

export const seedInterlude = async (page: Page) => {
  await page.addInitScript((state) => {
    localStorage.setItem('the1975:journey:v1', JSON.stringify({ version: 1, state }))
  }, interludeState)
}

export const collectPageErrors = (page: Page) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText
    if (errorText && !errorText.includes('ERR_ABORTED')) {
      errors.push(`${request.method()} ${request.url()}: ${errorText}`)
    }
  })
  return errors
}

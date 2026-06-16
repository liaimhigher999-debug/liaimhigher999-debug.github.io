import { describe, expect, it } from 'vitest'
import { createInitialExperience } from './experience'
import {
  JOURNEY_STORAGE_KEY,
  TICKET_THEME_STORAGE_KEY,
  loadJourney,
  loadTicketTheme,
  saveJourney,
  saveTicketTheme,
  type StorageLike,
} from './persistence'

const memoryStorage = (): StorageLike & { values: Map<string, string> } => {
  const values = new Map<string, string>()

  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

describe('journey persistence', () => {
  it('round-trips a versioned journey snapshot', () => {
    const storage = memoryStorage()
    const state = {
      ...createInitialExperience('FR-20260612-ABC123'),
      phase: 'tour' as const,
      activeTourIndex: 3,
      explorationOrder: [{ eraYear: '2013', clueId: 'cover' }],
    }

    saveJourney(storage, state)

    expect(JSON.parse(storage.values.get(JOURNEY_STORAGE_KEY) ?? '{}')).toMatchObject({
      version: 1,
      state: { journeyId: 'FR-20260612-ABC123', activeTourIndex: 3 },
    })
    expect(loadJourney(storage)).toEqual(state)
  })

  it('falls back cleanly when stored data is malformed', () => {
    const storage = memoryStorage()
    storage.setItem(JOURNEY_STORAGE_KEY, '{not-json')

    expect(loadJourney(storage)).toBeNull()
    expect(storage.getItem(JOURNEY_STORAGE_KEY)).toBeNull()
  })

  it('restores the live preview phase', () => {
    const storage = memoryStorage()
    const state = {
      ...createInitialExperience('FR-20260612-ABC123'),
      phase: 'livePrelude' as const,
      activeEraIndex: 4,
      unlockedEraIndexes: [0, 1, 2, 3, 4],
    }

    saveJourney(storage, state)

    expect(loadJourney(storage)).toMatchObject({
      phase: 'livePrelude',
      activeTourIndex: 0,
    })
  })

  it('rejects an unsupported version or invalid phase', () => {
    const storage = memoryStorage()
    storage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify({ version: 9, state: {} }))
    expect(loadJourney(storage)).toBeNull()

    storage.setItem(
      JOURNEY_STORAGE_KEY,
      JSON.stringify({ version: 1, state: { ...createInitialExperience('FR-1'), phase: 'playing' } }),
    )
    expect(loadJourney(storage)).toBeNull()
  })

  it('persists only one of the five supported ticket themes', () => {
    const storage = memoryStorage()
    saveTicketTheme(storage, '2020')

    expect(storage.getItem(TICKET_THEME_STORAGE_KEY)).toBe('2020')
    expect(loadTicketTheme(storage)).toBe('2020')

    storage.setItem(TICKET_THEME_STORAGE_KEY, 'future')
    expect(loadTicketTheme(storage)).toBeNull()
  })
})

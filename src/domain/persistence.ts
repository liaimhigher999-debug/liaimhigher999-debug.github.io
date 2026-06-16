import type { FanProfile } from '../data/types'
import type { TicketThemeId } from './ticket'
import { eras } from '../data/eras'
import { tourScenes } from '../data/experience'
import type { ExperiencePhase, ExperienceState } from './experience'

export const JOURNEY_STORAGE_KEY = 'the1975:journey:v1'
export const FAN_STORAGE_KEY = 'the1975:fan:v1'
export const TICKET_THEME_STORAGE_KEY = 'the1975:ticket:v1'

export type StorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>

const phases: ExperiencePhase[] = ['prologue', 'eras', 'interlude', 'livePrelude', 'tour', 'signature', 'archive']

const readJson = (storage: StorageLike, key: string) => {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) as unknown : null
  } catch {
    storage.removeItem(key)
    return null
  }
}

export const loadJourney = (storage: StorageLike): ExperienceState | null => {
  const value = readJson(storage, JOURNEY_STORAGE_KEY)
  if (!value || typeof value !== 'object') {
    return null
  }

  const snapshot = value as { version?: unknown; state?: unknown }
  const state = snapshot.state as Partial<ExperienceState> | undefined
  if (
    snapshot.version !== 1 ||
    !state ||
    !phases.includes(state.phase as ExperiencePhase) ||
    typeof state.activeEraIndex !== 'number' ||
    typeof state.activeTourIndex !== 'number' ||
    !Array.isArray(state.unlockedEraIndexes) ||
    !state.exploredClues ||
    !Array.isArray(state.explorationOrder) ||
    typeof state.journeyId !== 'string' ||
    !/^FR-\d{8}-[A-Z0-9]{6}$/.test(state.journeyId) ||
    state.activeEraIndex < 0 ||
    state.activeEraIndex >= eras.length ||
    state.activeTourIndex < 0 ||
    state.activeTourIndex >= tourScenes.length ||
    !state.unlockedEraIndexes.every(
      (index) => Number.isInteger(index) && index >= 0 && index < eras.length,
    ) ||
    !Object.values(state.exploredClues).every(
      (clues) => Array.isArray(clues) && clues.every((clueId) => typeof clueId === 'string'),
    ) ||
    !state.explorationOrder.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        typeof entry.eraYear === 'string' &&
        typeof entry.clueId === 'string',
    ) ||
    typeof state.archiveUnlocked !== 'boolean' ||
    typeof state.hasCompletedFirstRun !== 'boolean' ||
    (state.completedAt !== null && typeof state.completedAt !== 'string')
  ) {
    storage.removeItem(JOURNEY_STORAGE_KEY)
    return null
  }

  return state as ExperienceState
}

export const saveJourney = (storage: StorageLike, state: ExperienceState) => {
  storage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify({ version: 1, state }))
}

export const loadFanProfile = (storage: StorageLike): FanProfile => {
  const value = readJson(storage, FAN_STORAGE_KEY)
  if (!value || typeof value !== 'object') {
    return { name: null, anonymous: false }
  }

  const profile = value as Partial<FanProfile>
  return {
    name: typeof profile.name === 'string' ? profile.name.slice(0, 24) : null,
    anonymous: profile.anonymous === true,
  }
}

export const saveFanProfile = (storage: StorageLike, profile: FanProfile) => {
  storage.setItem(FAN_STORAGE_KEY, JSON.stringify(profile))
}

const ticketThemeIds: TicketThemeId[] = ['2013', '2016', '2018', '2020', '2022']

export const loadTicketTheme = (storage: StorageLike): TicketThemeId | null => {
  const value = storage.getItem(TICKET_THEME_STORAGE_KEY)
  return ticketThemeIds.includes(value as TicketThemeId) ? value as TicketThemeId : null
}

export const saveTicketTheme = (storage: StorageLike, themeId: TicketThemeId) => {
  storage.setItem(TICKET_THEME_STORAGE_KEY, themeId)
}

import { eras } from '../data/eras'
import { tourScenes } from '../data/experience'

export type ExperiencePhase =
  | 'prologue'
  | 'eras'
  | 'interlude'
  | 'livePrelude'
  | 'tour'
  | 'signature'
  | 'archive'

export type ExplorationEntry = {
  eraYear: string
  clueId: string
}

export type ExperienceState = {
  phase: ExperiencePhase
  activeEraIndex: number
  unlockedEraIndexes: number[]
  exploredClues: Record<string, string[]>
  activeTourIndex: number
  archiveUnlocked: boolean
  hasCompletedFirstRun: boolean
  explorationOrder: ExplorationEntry[]
  completedAt: string | null
  journeyId: string
}

export type ExperienceAction =
  | { type: 'ENTER_EXPERIENCE' }
  | { type: 'EXPLORE_CLUE'; clueId: string }
  | { type: 'ADVANCE_ERA' }
  | { type: 'ENTER_LIVE_PRELUDE' }
  | { type: 'ENTER_TOUR'; tourIndex?: number }
  | { type: 'VISIT_ERA'; eraIndex: number }
  | { type: 'ADVANCE_TOUR'; completedAt?: string }
  | { type: 'SUBMIT_SIGNATURE' }
  | { type: 'GO_BACK' }
  | { type: 'SKIP_TO_ARCHIVE' }
  | { type: 'RESTART_EXPERIENCE'; journeyId?: string }

export const createJourneyId = (now = new Date(), random = Math.random) => {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = Math.floor(random() * 0xffffff)
    .toString(36)
    .toUpperCase()
    .padStart(6, '0')
    .slice(-6)

  return `FR-${date}-${suffix}`
}

export const createInitialExperience = (journeyId = createJourneyId()): ExperienceState => ({
  phase: 'prologue',
  activeEraIndex: 0,
  unlockedEraIndexes: [0],
  exploredClues: {},
  activeTourIndex: 0,
  archiveUnlocked: false,
  hasCompletedFirstRun: false,
  explorationOrder: [],
  completedAt: null,
  journeyId,
})

export const isEraGateOpen = (state: ExperienceState) => {
  const year = eras[state.activeEraIndex]?.year
  return year ? (state.exploredClues[year]?.length ?? 0) >= 2 : false
}

export const experienceReducer = (
  state: ExperienceState,
  action: ExperienceAction,
): ExperienceState => {
  switch (action.type) {
    case 'ENTER_EXPERIENCE':
      return { ...state, phase: 'eras' }
    case 'EXPLORE_CLUE': {
      if (state.phase !== 'eras') {
        return state
      }

      const year = eras[state.activeEraIndex]?.year
      if (!year) {
        return state
      }

      const explored = state.exploredClues[year] ?? []
      if (explored.includes(action.clueId)) {
        return state
      }

      return {
        ...state,
        exploredClues: {
          ...state.exploredClues,
          [year]: [...explored, action.clueId],
        },
        explorationOrder: [...state.explorationOrder, { eraYear: year, clueId: action.clueId }],
      }
    }
    case 'ADVANCE_ERA': {
      if (state.phase !== 'eras' || !isEraGateOpen(state)) {
        return state
      }

      const nextEraIndex = state.activeEraIndex + 1
      if (nextEraIndex >= eras.length) {
        return { ...state, phase: 'interlude', activeTourIndex: 0 }
      }

      return {
        ...state,
        activeEraIndex: nextEraIndex,
        unlockedEraIndexes: state.unlockedEraIndexes.includes(nextEraIndex)
          ? state.unlockedEraIndexes
          : [...state.unlockedEraIndexes, nextEraIndex],
      }
    }
    case 'ENTER_LIVE_PRELUDE':
      return state.phase === 'interlude'
        ? { ...state, phase: 'livePrelude', activeTourIndex: 0 }
        : state
    case 'ENTER_TOUR':
      if (state.phase !== 'livePrelude') {
        return state
      }

      {
        const tourIndex = action.tourIndex ?? 0
        return Number.isInteger(tourIndex) && tourIndex >= 0 && tourIndex < tourScenes.length
          ? { ...state, phase: 'tour', activeTourIndex: tourIndex }
          : state
      }
    case 'VISIT_ERA':
      return state.unlockedEraIndexes.includes(action.eraIndex)
        ? { ...state, phase: 'eras', activeEraIndex: action.eraIndex }
        : state
    case 'ADVANCE_TOUR': {
      if (state.phase !== 'tour') {
        return state
      }

      if (state.activeTourIndex >= tourScenes.length - 1) {
        return {
          ...state,
          phase: 'signature',
          completedAt: action.completedAt ?? state.completedAt,
        }
      }

      return { ...state, activeTourIndex: state.activeTourIndex + 1 }
    }
    case 'SUBMIT_SIGNATURE':
      return state.phase === 'signature'
        ? {
            ...state,
            phase: 'archive',
            archiveUnlocked: true,
            hasCompletedFirstRun: true,
          }
        : state
    case 'GO_BACK': {
      if (!state.hasCompletedFirstRun) {
        return state
      }

      if (state.phase === 'archive') {
        return {
          ...state,
          phase: 'tour',
          activeTourIndex: tourScenes.length - 1,
        }
      }

      if (state.phase === 'tour') {
        if (state.activeTourIndex > 0) {
          return { ...state, activeTourIndex: state.activeTourIndex - 1 }
        }

        return { ...state, phase: 'livePrelude', activeTourIndex: 0 }
      }

      if (state.phase === 'livePrelude') {
        return {
          ...state,
          phase: 'eras',
          activeEraIndex: eras.length - 1,
        }
      }

      if (state.phase === 'eras' && state.activeEraIndex > 0) {
        return { ...state, activeEraIndex: state.activeEraIndex - 1 }
      }

      if (state.phase === 'eras' && state.activeEraIndex === 0) {
        return { ...state, phase: 'prologue' }
      }

      return state
    }
    case 'SKIP_TO_ARCHIVE':
      return {
        ...state,
        phase: 'archive',
        archiveUnlocked: true,
        unlockedEraIndexes: eras.map((_, index) => index),
      }
    case 'RESTART_EXPERIENCE':
      return createInitialExperience(action.journeyId)
    default:
      return state
  }
}

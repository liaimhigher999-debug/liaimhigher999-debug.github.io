import { describe, expect, it } from 'vitest'
import { msgLiveTracklist, tourScenes } from '../data/experience'
import {
  createInitialExperience,
  experienceReducer,
  isEraGateOpen,
} from './experience'

const msgLiveTitles = [
  'Happiness',
  "If You're Too Shy (Let Me Know)",
  "It's Not Living (If It's Not With You)",
  'Paris',
  'Robbers',
  'The Sound',
  'When We Are Together',
]

const msgChapterTitles = [
  'Happiness',
  "If You're Too Shy",
  "It's Not Living",
  'Paris',
  'Robbers',
  'The Sound',
  'When We Are Together',
]

const msgAlbumYears = ['2022', '2020', '2018', '2016', '2013', '2016', '2022']

const msgEntranceEffects = [
  'happiness-lights',
  'too-shy-screen',
  'not-living-browser',
  'paris-window',
  'robbers-flash',
  'sound-finale',
  'together-afterglow',
]

const msgVideoFilenames = [
  '01-happiness.mp4',
  '02-if-youre-too-shy.mp4',
  '03-its-not-living.mp4',
  '04-paris.mp4',
  '05-robbers.mp4',
  '06-the-sound.mp4',
  '07-when-we-are-together.mp4',
]

const msgBvids = [
  'BV1Lej36qE3j',
  'BV1dYj36TEBs',
  'BV1dYj36TESJ',
  'BV1tDj36dExq',
  'BV1mDj36REnd',
  'BV1u2j36bEsM',
  'BV1u2j36bExX',
]

const exploreTwoClues = (state: ReturnType<typeof createInitialExperience>) => {
  const withFirst = experienceReducer(state, { type: 'EXPLORE_CLUE', clueId: 'cover' })
  return experienceReducer(withFirst, { type: 'EXPLORE_CLUE', clueId: 'lyrics' })
}

const completeAllEras = () => {
  let state = experienceReducer(createInitialExperience(), { type: 'ENTER_EXPERIENCE' })

  for (let eraIndex = 0; eraIndex < 5; eraIndex += 1) {
    state = exploreTwoClues(state)
    state = experienceReducer(state, { type: 'ADVANCE_ERA' })
  }

  return state
}

const enterTour = (state: ReturnType<typeof createInitialExperience>) =>
  experienceReducer(
    experienceReducer(state, { type: 'ENTER_LIVE_PRELUDE' }),
    { type: 'ENTER_TOUR' },
  )

const completeJourney = () => {
  let state = enterTour(completeAllEras())

  for (let sceneIndex = 0; sceneIndex < tourScenes.length; sceneIndex += 1) {
    state = experienceReducer(state, {
      type: 'ADVANCE_TOUR',
      completedAt: '2026-06-12T20:00:00.000Z',
    })
  }

  return experienceReducer(state, { type: 'SUBMIT_SIGNATURE' })
}

describe('layered-room experience state', () => {
  it('keeps the selected Madison Square Garden live tracklist intact', () => {
    expect(msgLiveTracklist).toEqual(msgLiveTitles)
    expect(new Set(msgLiveTracklist).size).toBe(msgLiveTracklist.length)
  })

  it('condenses the Madison Square Garden live sequence into seven video scenes', () => {
    expect(tourScenes.map((scene) => scene.title)).toEqual(msgChapterTitles)
    expect(tourScenes.flatMap((scene) => scene.tracks)).toEqual(msgLiveTracklist)
  })

  it('covers all five album eras in the seven-scene live sequence', () => {
    expect(tourScenes.map((scene) => scene.albumYear)).toEqual(msgAlbumYears)
    expect(new Set(tourScenes.map((scene) => scene.albumYear))).toEqual(
      new Set(['2013', '2016', '2018', '2020', '2022']),
    )
  })

  it('defines local mp4 video, Bilibili embeds and entrance effect data for each live scene', () => {
    expect(tourScenes.map((scene) => scene.entranceEffect)).toEqual(msgEntranceEffects)
    expect(tourScenes.map((scene) => scene.liveVideo.sources.high.split('/').slice(-1)[0])).toEqual(msgVideoFilenames)
    expect(tourScenes.map((scene) => scene.liveVideo.embed?.bvid)).toEqual(msgBvids)
    expect(tourScenes.every((scene) => scene.liveVideo.sources.high.includes('/1080/'))).toBe(true)
    expect(tourScenes.every((scene) => scene.liveVideo.sources.standard.includes('/720/'))).toBe(true)
    expect(tourScenes.every((scene) => scene.liveVideo.enabled)).toBe(true)
    expect(tourScenes.every((scene) => scene.liveVideo.kind === 'video')).toBe(true)
    expect(tourScenes.every((scene) => scene.liveVideo.embed?.provider === 'bilibili')).toBe(true)
    expect(tourScenes.every((scene) => scene.liveVideo.embed?.src.startsWith('https://player.bilibili.com/'))).toBe(true)
    expect(tourScenes.every((scene) => scene.liveVideo.sources.high.endsWith('.mp4'))).toBe(true)
    expect(tourScenes.every((scene) => scene.liveVideo.sources.standard.endsWith('.mp4'))).toBe(true)
    expect(tourScenes.every((scene) => scene.liveVideo.poster.endsWith('.jpg'))).toBe(true)
    expect(tourScenes.every((scene) => !scene.liveVideo.sources.high.includes('D:\\'))).toBe(true)
    expect(tourScenes.every((scene) => !('audioCueId' in scene))).toBe(true)
  })

  it('uses When We Are Together as the closing quote before the archive', () => {
    expect(tourScenes[tourScenes.length - 1]).toMatchObject({
      title: 'When We Are Together',
      closingQuote: {
        body: 'The only time I feel I might get better is when we are together.',
        lines: ['The only time I feel I might get better', 'is when we are together.'],
        source: 'When We Are Together',
      },
    })
  })

  it('starts at the prologue with only the first era unlocked', () => {
    expect(createInitialExperience()).toMatchObject({
      phase: 'prologue',
      activeEraIndex: 0,
      unlockedEraIndexes: [0],
      activeTourIndex: 0,
      archiveUnlocked: false,
      explorationOrder: [],
    })
  })

  it('keeps the next era locked until two distinct clues are explored', () => {
    let state = experienceReducer(createInitialExperience(), { type: 'ENTER_EXPERIENCE' })
    state = experienceReducer(state, { type: 'EXPLORE_CLUE', clueId: 'cover' })
    state = experienceReducer(state, { type: 'EXPLORE_CLUE', clueId: 'cover' })

    expect(isEraGateOpen(state)).toBe(false)
    expect(experienceReducer(state, { type: 'ADVANCE_ERA' }).activeEraIndex).toBe(0)

    state = experienceReducer(state, { type: 'EXPLORE_CLUE', clueId: 'lyrics' })

    expect(isEraGateOpen(state)).toBe(true)
    expect(state.explorationOrder).toEqual([
      { eraYear: '2013', clueId: 'cover' },
      { eraYear: '2013', clueId: 'lyrics' },
    ])
    expect(experienceReducer(state, { type: 'ADVANCE_ERA' })).toMatchObject({
      activeEraIndex: 1,
      unlockedEraIndexes: [0, 1],
    })
  })

  it('allows revisiting unlocked albums without losing exploration progress', () => {
    let state = experienceReducer(createInitialExperience(), { type: 'ENTER_EXPERIENCE' })
    state = exploreTwoClues(state)
    state = experienceReducer(state, { type: 'ADVANCE_ERA' })
    state = experienceReducer(state, { type: 'VISIT_ERA', eraIndex: 0 })

    expect(state.activeEraIndex).toBe(0)
    expect(state.exploredClues['2013']).toEqual(['cover', 'lyrics'])
  })

  it('enters the stage interlude after the fifth album room', () => {
    expect(completeAllEras()).toMatchObject({
      phase: 'interlude',
      activeTourIndex: 0,
      unlockedEraIndexes: [0, 1, 2, 3, 4],
    })
  })

  it('enters the live preview only from the stage interlude', () => {
    const initial = createInitialExperience('FR-TEST')
    const interlude = {
      ...initial,
      phase: 'interlude' as const,
      activeTourIndex: 4,
    }

    expect(experienceReducer(interlude, { type: 'ENTER_LIVE_PRELUDE' })).toMatchObject({
      phase: 'livePrelude',
      activeTourIndex: 0,
    })
    expect(experienceReducer(initial, { type: 'ENTER_LIVE_PRELUDE' })).toEqual(initial)
  })

  it('enters the first live scene only from the live preview', () => {
    const initial = createInitialExperience('FR-TEST')
    const livePrelude = {
      ...initial,
      phase: 'livePrelude' as const,
      activeTourIndex: 4,
    }

    expect(experienceReducer(livePrelude, { type: 'ENTER_TOUR' })).toMatchObject({
      phase: 'tour',
      activeTourIndex: 0,
    })
    expect(experienceReducer(initial, { type: 'ENTER_TOUR' })).toEqual(initial)
  })

  it('can enter a selected live scene from the live preview', () => {
    const livePrelude = {
      ...createInitialExperience('FR-TEST'),
      phase: 'livePrelude' as const,
    }

    expect(experienceReducer(livePrelude, { type: 'ENTER_TOUR', tourIndex: 4 })).toMatchObject({
      phase: 'tour',
      activeTourIndex: 4,
    })
    expect(experienceReducer(livePrelude, { type: 'ENTER_TOUR', tourIndex: 99 })).toEqual(livePrelude)
  })

  it('collects a signature after the final tour scene before opening the archive', () => {
    let state = enterTour(completeAllEras())

    for (let sceneIndex = 0; sceneIndex < tourScenes.length - 1; sceneIndex += 1) {
      state = experienceReducer(state, { type: 'ADVANCE_TOUR' })
      expect(state.phase).toBe('tour')
    }

    state = experienceReducer(state, { type: 'ADVANCE_TOUR', completedAt: '2026-06-12T20:00:00.000Z' })

    expect(state).toMatchObject({
      phase: 'signature',
      activeTourIndex: tourScenes.length - 1,
      completedAt: '2026-06-12T20:00:00.000Z',
      archiveUnlocked: false,
    })

    state = experienceReducer(state, { type: 'SUBMIT_SIGNATURE' })

    expect(state).toMatchObject({
      phase: 'archive',
      archiveUnlocked: true,
      hasCompletedFirstRun: true,
    })
  })

  it('does not go backward before the first full journey is complete', () => {
    let state = experienceReducer(createInitialExperience(), { type: 'ENTER_EXPERIENCE' })

    expect(experienceReducer(state, { type: 'GO_BACK' })).toEqual(state)

    state = completeAllEras()

    expect(experienceReducer(state, { type: 'GO_BACK' })).toEqual(state)
  })

  it('goes back through unlocked scenes after the first full journey is complete', () => {
    let state = completeJourney()

    expect(state).toMatchObject({
      phase: 'archive',
      activeTourIndex: tourScenes.length - 1,
      hasCompletedFirstRun: true,
    })

    state = experienceReducer(state, { type: 'GO_BACK' })

    expect(state).toMatchObject({
      phase: 'tour',
      activeTourIndex: tourScenes.length - 1,
    })

    state = experienceReducer(state, { type: 'GO_BACK' })

    expect(state).toMatchObject({
      phase: 'tour',
      activeTourIndex: tourScenes.length - 2,
    })

    for (let sceneIndex = 0; sceneIndex < tourScenes.length - 1; sceneIndex += 1) {
      state = experienceReducer(state, { type: 'GO_BACK' })
    }

    expect(state).toMatchObject({
      phase: 'livePrelude',
      activeTourIndex: 0,
    })
  })

  it('can return to the prologue after the first full journey is complete', () => {
    let state = completeJourney()

    state = experienceReducer(state, { type: 'GO_BACK' })

    for (let sceneIndex = 0; sceneIndex <= tourScenes.length; sceneIndex += 1) {
      state = experienceReducer(state, { type: 'GO_BACK' })
    }

    for (let eraIndex = 0; eraIndex < 5; eraIndex += 1) {
      state = experienceReducer(state, { type: 'GO_BACK' })
    }

    expect(state).toMatchObject({
      phase: 'prologue',
      activeEraIndex: 0,
      hasCompletedFirstRun: true,
    })
  })

  it('replays the stage interlude when returning to BFIAFL after a completed journey', () => {
    let state = completeJourney()

    state = experienceReducer(state, { type: 'GO_BACK' })
    for (let sceneIndex = 0; sceneIndex <= tourScenes.length; sceneIndex += 1) {
      state = experienceReducer(state, { type: 'GO_BACK' })
    }

    expect(state).toMatchObject({
      phase: 'eras',
      activeEraIndex: 4,
      hasCompletedFirstRun: true,
    })
    expect(experienceReducer(state, { type: 'ADVANCE_ERA' })).toMatchObject({
      phase: 'interlude',
      hasCompletedFirstRun: true,
    })
  })

  it('supports an explicit archive skip for returning visitors', () => {
    expect(
      experienceReducer(createInitialExperience(), { type: 'SKIP_TO_ARCHIVE' }),
    ).toMatchObject({
      phase: 'archive',
      archiveUnlocked: true,
      hasCompletedFirstRun: false,
      unlockedEraIndexes: [0, 1, 2, 3, 4],
    })
  })
})

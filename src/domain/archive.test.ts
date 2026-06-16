import { describe, expect, it } from 'vitest'
import { eras } from '../data/eras'
import { buildArchiveHash, findTrack, parseArchiveHash } from './archive'

describe('archive hash contract', () => {
  it('builds a shareable hash from an era and track slug', () => {
    expect(buildArchiveHash('2018', 'love-it-if-we-made-it')).toBe(
      '#archive/2018/love-it-if-we-made-it',
    )
  })

  it('parses a valid archive hash', () => {
    expect(parseArchiveHash('#archive/2022/about-you')).toEqual({
      eraId: '2022',
      trackSlug: 'about-you',
    })
  })

  it('rejects malformed archive hashes', () => {
    expect(parseArchiveHash('#archive/2022')).toBeNull()
    expect(parseArchiveHash('#not-archive/2022/about-you')).toBeNull()
  })
})

describe('curated track data', () => {
  it('contains three curated tracks for each of the five eras', () => {
    expect(eras).toHaveLength(5)
    expect(eras.every((era) => era.tracks.length === 3)).toBe(true)
  })

  it('keeps the complete standard album sequence behind each curated trio', () => {
    expect(eras.map((era) => era.tracklist.length)).toEqual([16, 17, 15, 22, 11])

    for (const era of eras) {
      expect(new Set(era.tracklist).size).toBe(era.tracklist.length)
      expect(era.tracklist[0]).toBe('The 1975')
    }
  })

  it('gives every album room five valid, distinct clues', () => {
    for (const era of eras) {
      expect(era.clues).toHaveLength(5)
      expect(new Set(era.clues.map(({ id }) => id)).size).toBe(5)
      expect(
        era.clues.every(({ trackSlug }) => era.tracks.some(({ slug }) => slug === trackSlug)),
      ).toBe(true)
    }
  })

  it('uses the requested private curation for the five eras', () => {
    expect(eras.map((era) => era.tracks.map(({ title }) => title))).toEqual([
      ['Robbers', 'Chocolate', 'fallingforyou'],
      ['The Sound', 'Paris', 'Nana'],
      ["It's Not Living (If It's Not With You)", 'TOOTIMETOOTIMETOOTIME', 'Sincerity Is Scary'],
      ["If You're Too Shy (Let Me Know)", 'Guys', 'Roadkill'],
      ['Happiness', "I'm In Love With You", 'About You'],
    ])
  })

  it('uses a deep blue palette for the final era', () => {
    expect(eras[eras.length - 1]?.theme).toMatchObject({
      key: 'stage',
      accent: '#9cc7e8',
      background: '#06162b',
    })
  })

  it('keeps album rooms free of disruption overlays', () => {
    expect(eras.every((era) => !('disruption' in era))).toBe(true)
  })

  it('finds a curated track by era and slug', () => {
    const result = findTrack(eras, '2016', 'the-sound')

    expect(result?.era.year).toBe('2016')
    expect(result?.track.title).toBe('The Sound')
    expect(result?.track.featured).toBe(true)
  })

  it('does not find a track under the wrong era', () => {
    expect(findTrack(eras, '2013', 'the-sound')).toBeNull()
  })
})

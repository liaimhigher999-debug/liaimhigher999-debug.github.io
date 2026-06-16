import type { Era, Track } from '../data/types'

export type ArchiveLocation = {
  eraId: string
  trackSlug: string
}

export const buildArchiveHash = (eraId: string, trackSlug: string) =>
  `#archive/${encodeURIComponent(eraId)}/${encodeURIComponent(trackSlug)}`

export const parseArchiveHash = (hash: string): ArchiveLocation | null => {
  const match = hash.match(/^#archive\/([^/]+)\/([^/]+)$/)

  if (!match) {
    return null
  }

  return {
    eraId: decodeURIComponent(match[1]),
    trackSlug: decodeURIComponent(match[2]),
  }
}

export const findTrack = (
  eras: Era[],
  eraId: string,
  trackSlug: string,
): { era: Era; track: Track } | null => {
  const era = eras.find(({ year }) => year === eraId)
  const track = era?.tracks.find(({ slug }) => slug === trackSlug)

  return era && track ? { era, track } : null
}

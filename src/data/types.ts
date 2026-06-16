export type PlatformLinks = {
  spotify: string
  appleMusic: string
  youtube: string
}

export type Track = {
  title: string
  slug: string
  featured: boolean
  excerpt: string
  note: string
  links: PlatformLinks
}

export type MediaAsset = {
  kind: 'image' | 'video'
  sources: {
    high: string
    standard: string
  }
  embed?: {
    provider: 'bilibili'
    bvid: string
    page: number
    src: string
  }
  poster: string
  enabled: boolean
  alt: string
}

export type AlbumYear = '2013' | '2016' | '2018' | '2020' | '2022'

export type ExplorationClue = {
  id: 'cover' | 'lyrics' | 'signal' | 'fragment' | 'tape'
  type: 'cover' | 'lyrics' | 'signal' | 'fragment' | 'tape'
  kicker: string
  title: string
  body: string
  trackSlug: string
}

export type TourEntranceEffect =
  | 'happiness-lights'
  | 'too-shy-screen'
  | 'not-living-browser'
  | 'paris-window'
  | 'robbers-flash'
  | 'sound-finale'
  | 'together-afterglow'

export type TourScene = {
  id: string
  order: number
  albumYear: AlbumYear
  title: string
  song: string
  tracks: string[]
  subtitle: string
  copy: string
  visual:
    | 'house-lights'
    | 'stairwell'
    | 'objects'
    | 'television'
    | 'roof'
    | 'fog'
    | 'grass'
    | 'crowd'
    | 'flashback'
    | 'finale'
  triggerLabel: string
  entranceEffect: TourEntranceEffect
  liveVideo: MediaAsset
  closingQuote?: {
    kicker: string
    body: string
    lines?: string[]
    source: string
  }
}

export type EraTheme = {
  key: 'mono' | 'rose' | 'network' | 'signal' | 'stage'
  accent: string
  background: string
  foreground: string
}

export type Era = {
  year: string
  title: string
  shortTitle: string
  chapter: string
  releaseDate: string
  coverUrl: string
  officialUrl: string
  intro: string
  reflection: string
  theme: EraTheme
  tracks: Track[]
  tracklist: string[]
  clues: ExplorationClue[]
}

export type FanProfile = {
  name: string | null
  anonymous: boolean
}

export type AssetCredit = {
  label: string
  source: string
  note: string
}

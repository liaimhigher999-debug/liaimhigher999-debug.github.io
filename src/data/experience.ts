import type { MediaAsset, TourScene } from './types'
import { appEnvironment } from '../env'

const liveVideo = (filename: string, alt: string): MediaAsset => {
  const webPrefix = appEnvironment.mediaBaseUrl.startsWith('/') ? '/web' : ''
  return {
    kind: 'video',
    sources: {
      high: `${appEnvironment.mediaBaseUrl}${webPrefix}/1080/${filename}`,
      standard: `${appEnvironment.mediaBaseUrl}${webPrefix}/720/${filename}`,
    },
    poster: `${appEnvironment.mediaBaseUrl}/posters/${filename.replace(/\.mp4$/, '.jpg')}`,
    enabled: true,
    alt,
  }
}

export const msgLiveTracklist = [
  'Happiness',
  "If You're Too Shy (Let Me Know)",
  "It's Not Living (If It's Not With You)",
  'Paris',
  'Robbers',
  'The Sound',
  'When We Are Together',
] as const

const tourScene = (scene: TourScene): TourScene => scene

export const tourScenes: TourScene[] = [
  tourScene({
    id: 'happiness-lights',
    order: 1,
    albumYear: '2022',
    title: 'Happiness',
    song: 'Happiness',
    tracks: ['Happiness'],
    subtitle: 'BFIAFL / HOUSE LIGHTS / 08:43',
    copy:
      'The last album room opens first: warm lamps, loose bodies, and a stage that feels like a living room becoming real.',
    visual: 'house-lights',
    triggerLabel: 'LIGHT THE HOUSE',
    entranceEffect: 'happiness-lights',
    liveVideo: liveVideo('01-happiness.mp4', 'Happiness live at Madison Square Garden'),
  }),
  tourScene({
    id: 'too-shy-screen',
    order: 2,
    albumYear: '2020',
    title: "If You're Too Shy",
    song: "If You're Too Shy (Let Me Know)",
    tracks: ["If You're Too Shy (Let Me Know)"],
    subtitle: 'NOACF / CAMERA FEED / 1:03:31',
    copy:
      'A camera feed becomes the door: desire delayed by screens until the blue-pink signal floods the room.',
    visual: 'television',
    triggerLabel: 'OPEN THE CAMERA',
    entranceEffect: 'too-shy-screen',
    liveVideo: liveVideo('02-if-youre-too-shy.mp4', "If You're Too Shy live at Madison Square Garden"),
  }),
  tourScene({
    id: 'not-living-browser',
    order: 3,
    albumYear: '2018',
    title: "It's Not Living",
    song: "It's Not Living (If It's Not With You)",
    tracks: ["It's Not Living (If It's Not With You)"],
    subtitle: 'ABIIOR / ONLINE, ALWAYS / 1:17:02',
    copy:
      'Bright browser chrome and notification static crack open a pop song about dependence, repetition, and losing the thread.',
    visual: 'objects',
    triggerLabel: 'FOLLOW THE NOTICE',
    entranceEffect: 'not-living-browser',
    liveVideo: liveVideo('03-its-not-living.mp4', "It's Not Living live at Madison Square Garden"),
  }),
  tourScene({
    id: 'paris-window',
    order: 4,
    albumYear: '2016',
    title: 'Paris',
    song: 'Paris',
    tracks: ['Paris'],
    subtitle: 'ILIWYS / PINK WINDOW / 1:22:06',
    copy:
      'The room cools into neon rain: a beautiful excuse to leave, or at least to imagine somewhere else again.',
    visual: 'fog',
    triggerLabel: 'OPEN THE WINDOW',
    entranceEffect: 'paris-window',
    liveVideo: liveVideo('04-paris.mp4', 'Paris live at Madison Square Garden'),
  }),
  tourScene({
    id: 'robbers-flash',
    order: 5,
    albumYear: '2013',
    title: 'Robbers',
    song: 'Robbers',
    tracks: ['Robbers'],
    subtitle: 'THE 1975 / BLACK-AND-WHITE MYTH / 1:27:38',
    copy:
      'The first record comes back as flashbulb memory: a doorframe, a getaway romance, and the crowd singing the old film alive.',
    visual: 'flashback',
    triggerLabel: 'TAKE THE FLASH',
    entranceEffect: 'robbers-flash',
    liveVideo: liveVideo('05-robbers.mp4', 'Robbers live at Madison Square Garden'),
  }),
  tourScene({
    id: 'the-sound-finale',
    order: 6,
    albumYear: '2016',
    title: 'The Sound',
    song: 'The Sound',
    tracks: ['The Sound'],
    subtitle: 'ILIWYS / SMASH HIT / 1:47:10',
    copy:
      'The late-set peak turns self-awareness into a crowd pulse: every room, screen, window, and memory hits the same beat.',
    visual: 'finale',
    triggerLabel: 'START THE PULSE',
    entranceEffect: 'sound-finale',
    liveVideo: liveVideo('06-the-sound.mp4', 'The Sound live at Madison Square Garden'),
  }),
  tourScene({
    id: 'together-afterglow',
    order: 7,
    albumYear: '2022',
    title: 'When We Are Together',
    song: 'When We Are Together',
    tracks: ['When We Are Together'],
    subtitle: 'BFIAFL / AFTERGLOW PORCH / 49:51',
    copy:
      'After the pulse, the house lets the crowd step outside: grass, porch light, and a gentler final room about staying near someone when the noise falls away.',
    visual: 'grass',
    triggerLabel: 'STEP OUTSIDE',
    entranceEffect: 'together-afterglow',
    liveVideo: liveVideo('07-when-we-are-together.mp4', 'When We Are Together live at Madison Square Garden'),
    closingQuote: {
      kicker: 'AFTER THE LAST SONG',
      body: 'The only time I feel I might get better is when we are together.',
      lines: ['The only time I feel I might get better', 'is when we are together.'],
      source: 'When We Are Together',
    },
  }),
]

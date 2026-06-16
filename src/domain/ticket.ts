import type { Era, FanProfile } from '../data/types'
import type { ExperienceState } from './experience'

export type TicketData = {
  admitOne: string
  signalsOpened: number
  signalsTotal: number
  deepestEra: string
  finalSong: string
  completedDate: string
  journeyId: string
}

export type TicketThemeId = '2013' | '2016' | '2018' | '2020' | '2022'

export type TicketTheme = {
  id: TicketThemeId
  edition: string
  label: string
  caption: string
  reverseTitle: string
  reverseNote: string
  reverseMark: string
  background: string
  foreground: string
  accent: string
  muted: string
}

export const ticketThemes: TicketTheme[] = [
  {
    id: '2013',
    edition: '01',
    label: 'THE 1975',
    caption: 'AFTER DARK',
    reverseTitle: 'ROMANCE / ESCAPE / AFTER DARK',
    reverseNote: 'A BLACK RECTANGLE. A ROAD WITH NO ENDING.',
    reverseMark: 'THE CITY NEVER SLEEPS.',
    background: '#080808',
    foreground: '#f4f1ec',
    accent: '#f5f5f2',
    muted: '#878581',
  },
  {
    id: '2016',
    edition: '02',
    label: 'ILIWYS',
    caption: 'NEON ROMANCE',
    reverseTitle: 'PINK DOES NOT MEAN SIMPLE',
    reverseNote: 'BEAUTY CAN GLOW AND STILL ACHE.',
    reverseMark: 'A NEON PROMISE, LEFT ON.',
    background: '#f0a7b8',
    foreground: '#fff8f7',
    accent: '#ffb2c5',
    muted: '#8f5362',
  },
  {
    id: '2018',
    edition: '03',
    label: 'ABIIOR',
    caption: 'ONLINE, ALWAYS',
    reverseTitle: 'CONNECTION IS NOT CLOSENESS',
    reverseNote: 'STAY HUMAN WHILE THE INTERFACE REFRESHES.',
    reverseMark: 'STATUS: PRESENT / SIGNAL: UNSTABLE',
    background: '#f0f1ee',
    foreground: '#121722',
    accent: '#2367df',
    muted: '#667083',
  },
  {
    id: '2020',
    edition: '04',
    label: 'NOACF',
    caption: 'TOO MANY TABS',
    reverseTitle: 'NO FINAL VERSION',
    reverseNote: 'CONTRADICTION IS PART OF THE RECORD.',
    reverseMark: 'KEEP THE TAB OPEN.',
    background: '#d7d4cb',
    foreground: '#11130e',
    accent: '#d9ff4f',
    muted: '#68675f',
  },
  {
    id: '2022',
    edition: '05',
    label: 'BFIAFL',
    caption: 'BACK IN THE ROOM',
    reverseTitle: 'SINCERITY, STAGED',
    reverseNote: 'PERFORMANCE CAN STILL TELL THE TRUTH.',
    reverseMark: 'THE ROOM REMEMBERS WHO WAS HERE.',
    background: '#06162b',
    foreground: '#e6f2ff',
    accent: '#9cc7e8',
    muted: '#718dab',
  },
]

const getTicketTheme = (themeId: TicketThemeId) =>
  ticketThemes.find(({ id }) => id === themeId) ?? ticketThemes[0]

export const getTicketEditionNumber = (ticket: TicketData, themeId: TicketThemeId) => {
  const theme = getTicketTheme(themeId)
  return `ED. ${theme.edition} / ${ticket.journeyId}-${theme.id.slice(-2)}`
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const createTicketBackground = (theme: TicketTheme) => {
  const backgrounds: Record<TicketThemeId, { defs: string; fill: string }> = {
    '2013': {
      defs: `<linearGradient id="room-2013" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#040404"/><stop offset=".58" stop-color="#121212"/><stop offset="1" stop-color="#050505"/></linearGradient>`,
      fill: 'url(#room-2013)',
    },
    '2016': {
      defs: `<linearGradient id="room-2016" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#df91a6"/><stop offset=".5" stop-color="#f0a7b8"/><stop offset="1" stop-color="#d9859d"/></linearGradient>`,
      fill: 'url(#room-2016)',
    },
    '2018': {
      defs: `<pattern id="room-2018-grid" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="${theme.background}"/><path d="M48 0H0V48" fill="none" stroke="${theme.accent}" stroke-opacity=".12"/></pattern>`,
      fill: 'url(#room-2018-grid)',
    },
    '2020': {
      defs: `<pattern id="room-2020-lines" width="88" height="88" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><rect width="88" height="88" fill="${theme.background}"/><line x1="0" y1="0" x2="0" y2="88" stroke="${theme.foreground}" stroke-opacity=".07"/></pattern>`,
      fill: 'url(#room-2020-lines)',
    },
    '2022': {
      defs: `<linearGradient id="room-2022" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#06162b"/><stop offset=".55" stop-color="#123b68"/><stop offset="1" stop-color="#071b34"/></linearGradient>`,
      fill: 'url(#room-2022)',
    },
  }

  return backgrounds[theme.id]
}

export const deriveTicketData = (
  state: ExperienceState,
  profile: FanProfile,
  eraList: Era[],
): TicketData => {
  const counts = new Map(eraList.map((era) => [era.year, state.exploredClues[era.year]?.length ?? 0]))
  const highest = Math.max(0, ...counts.values())
  const tiedYears = new Set(
    [...counts.entries()].filter(([, count]) => count === highest && count > 0).map(([year]) => year),
  )
  const latestTiedYear = [...state.explorationOrder]
    .reverse()
    .find(({ eraYear }) => tiedYears.has(eraYear))?.eraYear
  const deepest = eraList.find(({ year }) => year === latestTiedYear)
  const completedDate = state.completedAt
    ? state.completedAt.slice(0, 10).replace(/-/g, '.')
    : state.journeyId.slice(3, 11).replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')

  return {
    admitOne: profile.anonymous || !profile.name?.trim() ? 'ANONYMOUS' : profile.name.trim().slice(0, 24),
    signalsOpened: Object.values(state.exploredClues).reduce((total, clues) => total + clues.length, 0),
    signalsTotal: eraList.reduce((total, era) => total + era.clues.length, 0),
    deepestEra: deepest ? `${deepest.year} / ${deepest.shortTitle}` : 'NO ERA CLAIMED',
    finalSong: 'WHEN WE ARE TOGETHER',
    completedDate,
    journeyId: state.journeyId,
  }
}

export const createTicketSvg = (ticket: TicketData, themeId: TicketThemeId) => {
  const theme = getTicketTheme(themeId)
  const background = createTicketBackground(theme)
  const name = escapeXml(ticket.admitOne)
  const deepestEra = escapeXml(ticket.deepestEra)
  const journeyId = escapeXml(ticket.journeyId)
  const decoration = {
    '2013': `
      <rect x="38" y="38" width="1124" height="554" fill="none" stroke="${theme.accent}" stroke-opacity=".52"/>
      <rect x="806" y="104" width="276" height="190" fill="#050505" fill-opacity=".72" stroke="${theme.foreground}" stroke-width="4"/>
      <rect x="826" y="124" width="236" height="150" fill="none" stroke="${theme.muted}"/>
      <text x="944" y="190" text-anchor="middle" font-family="Georgia,serif" font-size="46" fill="${theme.foreground}">THE</text>
      <text x="944" y="248" text-anchor="middle" font-family="Georgia,serif" font-size="58" fill="${theme.foreground}">1975</text>`,
    '2016': `
      <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${theme.foreground}" stroke-width="5"/>
      <line x1="748" y1="40" x2="748" y2="590" stroke="${theme.foreground}" stroke-opacity=".48"/>
      <rect x="812" y="108" width="270" height="176" fill="none" stroke="${theme.foreground}" stroke-width="3"/>
      <rect x="832" y="128" width="230" height="136" fill="#fff8f7" fill-opacity=".1" stroke="${theme.foreground}" stroke-opacity=".5"/>
      <text x="947" y="218" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="54" fill="${theme.foreground}">ILIWYS</text>`,
    '2018': `
      <rect x="38" y="38" width="1124" height="554" fill="none" stroke="${theme.foreground}"/>
      <rect x="790" y="98" width="302" height="200" fill="${theme.background}" fill-opacity=".88" stroke="${theme.foreground}" stroke-width="2"/>
      <rect x="790" y="98" width="302" height="34" fill="${theme.foreground}"/>
      <circle cx="812" cy="115" r="5" fill="${theme.background}"/><circle cx="830" cy="115" r="5" fill="${theme.background}"/><circle cx="848" cy="115" r="5" fill="${theme.accent}"/>
      <path d="M826 164H1058M826 194H1014M826 224H1042" stroke="${theme.muted}" stroke-width="3"/>
      <text x="941" y="272" text-anchor="middle" font-family="Georgia,serif" font-size="44" fill="${theme.accent}">ABIIOR</text>`,
    '2020': `
      <rect x="36" y="36" width="1128" height="558" fill="none" stroke="${theme.foreground}" stroke-width="3"/>
      <g transform="translate(790 108) rotate(3)"><rect width="292" height="72" fill="${theme.accent}"/><text x="146" y="46" text-anchor="middle" font-family="monospace" font-size="22" fill="${theme.foreground}">NO FINAL VERSION</text></g>
      <g transform="translate(824 198) rotate(-4)"><rect width="258" height="96" fill="${theme.foreground}"/><text x="129" y="60" text-anchor="middle" font-family="Georgia,serif" font-size="44" fill="${theme.background}">NOACF</text></g>`,
    '2022': `
      <rect x="0" y="0" width="1200" height="72" fill="#020b15"/><rect x="0" y="558" width="1200" height="72" fill="#020b15"/>
      <rect x="54" y="94" width="1092" height="442" fill="none" stroke="${theme.accent}" stroke-opacity=".54"/>
      <path d="M760 84L1088 84L970 324L820 324Z" fill="${theme.accent}" fill-opacity=".1"/>
      <rect x="806" y="112" width="276" height="184" fill="#06162b" fill-opacity=".58" stroke="${theme.foreground}" stroke-width="3"/>
      <rect x="826" y="132" width="236" height="144" fill="none" stroke="${theme.muted}"/>
      <text x="944" y="222" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="50" fill="${theme.foreground}">BFIAFL</text>`,
  }[theme.id]

  return `<svg xmlns="http://www.w3.org/2000/svg" data-ticket-theme="${theme.id}" data-ticket-side="front" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>${background.defs}</defs>
  <rect width="1200" height="630" fill="${theme.background}"/>
  <rect width="1200" height="630" fill="${background.fill}"/>
  ${decoration}
  <g fill="${theme.foreground}">
    <text x="76" y="105" font-family="monospace" font-size="17" letter-spacing="4">THE 1975 / FIVE ROOMS / SEVEN ACTS</text>
    <text x="76" y="148" font-family="monospace" font-size="14" letter-spacing="3" fill="${theme.muted}">${theme.id} / ${theme.caption}</text>
    <text x="76" y="230" font-family="monospace" font-size="16" letter-spacing="3">ADMIT ONE</text>
    <text x="76" y="320" font-family="Georgia,serif" font-size="82">${name}</text>
    <line x1="76" y1="350" x2="650" y2="350" stroke="${theme.accent}" stroke-width="2"/>
    <text x="76" y="404" font-family="monospace" font-size="17">SIGNALS OPENED: ${ticket.signalsOpened} / ${ticket.signalsTotal}</text>
    <text x="76" y="444" font-family="monospace" font-size="17">DEEPEST ROOM: ${deepestEra}</text>
    <text x="76" y="484" font-family="monospace" font-size="17">FINAL SONG: ${ticket.finalSong}</text>
    <text x="76" y="552" font-family="monospace" font-size="15">${ticket.completedDate} / ${journeyId}</text>
    <text x="1124" y="552" text-anchor="end" font-family="monospace" font-size="15">${getTicketEditionNumber(ticket, theme.id)}</text>
  </g>
</svg>`
}

export const createTicketBackSvg = (ticket: TicketData, themeId: TicketThemeId) => {
  const theme = getTicketTheme(themeId)
  const background = createTicketBackground(theme)
  const editionNumber = getTicketEditionNumber(ticket, theme.id)
  const titleLayout: Record<TicketThemeId, { lines: string[]; size: number }> = {
    '2013': { lines: ['ROMANCE / ESCAPE', 'AFTER DARK'], size: 58 },
    '2016': { lines: ['PINK DOES NOT', 'MEAN SIMPLE'], size: 62 },
    '2018': { lines: ['CONNECTION IS NOT', 'CLOSENESS'], size: 60 },
    '2020': { lines: ['NO FINAL VERSION'], size: 70 },
    '2022': { lines: ['SINCERITY, STAGED'], size: 70 },
  }
  const title = titleLayout[theme.id]
  const titleStartY = title.lines.length === 1 ? 278 : 238
  const titleText = title.lines
    .map((line, index) => `<tspan x="600" y="${titleStartY + index * 68}">${escapeXml(line)}</tspan>`)
    .join('')
  const dividerY = title.lines.length === 1 ? 322 : 348
  const noteY = dividerY + 58
  const markY = noteY + 58

  return `<svg xmlns="http://www.w3.org/2000/svg" data-ticket-theme="${theme.id}" data-ticket-side="back" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>${background.defs}</defs>
  <rect width="1200" height="630" fill="${theme.background}"/>
  <rect width="1200" height="630" fill="${background.fill}"/>
  <rect x="42" y="42" width="1116" height="546" fill="none" stroke="${theme.foreground}" stroke-opacity=".34"/>
  <rect x="70" y="70" width="1060" height="490" fill="none" stroke="${theme.accent}" stroke-opacity=".48"/>
  <text x="92" y="120" font-family="monospace" font-size="16" letter-spacing="4" fill="${theme.muted}">${theme.id} / ${theme.label} / REVERSE</text>
  <rect x="930" y="92" width="166" height="58" fill="none" stroke="${theme.accent}" stroke-opacity=".72"/>
  <text x="1013" y="128" text-anchor="middle" font-family="monospace" font-size="16" letter-spacing="2" fill="${theme.foreground}">${theme.label}</text>
  <text text-anchor="middle" font-family="Georgia,serif" font-size="${title.size}" fill="${theme.foreground}">${titleText}</text>
  <line x1="300" y1="${dividerY}" x2="900" y2="${dividerY}" stroke="${theme.accent}" stroke-width="3"/>
  <text x="600" y="${noteY}" text-anchor="middle" font-family="monospace" font-size="20" letter-spacing="1.5" fill="${theme.foreground}">${escapeXml(theme.reverseNote)}</text>
  <text x="600" y="${markY}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="31" fill="${theme.muted}">${escapeXml(theme.reverseMark)}</text>
  <text x="92" y="530" font-family="monospace" font-size="15" fill="${theme.foreground}">${escapeXml(ticket.admitOne)} / ${escapeXml(ticket.completedDate)}</text>
  <text x="1108" y="530" text-anchor="end" font-family="monospace" font-size="15" fill="${theme.foreground}">${editionNumber}</text>
</svg>`
}

const innerSvg = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')

export const createTicketKeepsakeSvg = (ticket: TicketData, themeId: TicketThemeId) => {
  const theme = getTicketTheme(themeId)
  const front = innerSvg(createTicketSvg(ticket, themeId))
  const back = innerSvg(createTicketBackSvg(ticket, themeId))

  return `<svg xmlns="http://www.w3.org/2000/svg" data-ticket-theme="${themeId}" width="1260" height="1260" viewBox="0 0 1260 1260">
    <rect width="1260" height="1260" fill="${theme.background}"/>
    <svg data-ticket-side="front" x="30" y="0" width="1200" height="630" viewBox="0 0 1200 630">${front}</svg>
    <svg data-ticket-side="back" x="30" y="630" width="1200" height="630" viewBox="0 0 1200 630">${back}</svg>
  </svg>`
}

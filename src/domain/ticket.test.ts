import { describe, expect, it } from 'vitest'
import { eras } from '../data/eras'
import { createInitialExperience } from './experience'
import {
  createTicketKeepsakeSvg,
  createTicketSvg,
  deriveTicketData,
  getTicketEditionNumber,
  ticketThemes,
} from './ticket'

describe('personal journey ticket', () => {
  it('derives signal count and uses the latest explored era to break a tie', () => {
    const state = {
      ...createInitialExperience('FR-20260612-ABC123'),
      completedAt: '2026-06-12T20:00:00.000Z',
      exploredClues: {
        '2013': ['cover', 'lyrics'],
        '2016': ['cover', 'lyrics'],
      },
      explorationOrder: [
        { eraYear: '2013', clueId: 'cover' },
        { eraYear: '2013', clueId: 'lyrics' },
        { eraYear: '2016', clueId: 'cover' },
        { eraYear: '2016', clueId: 'lyrics' },
      ],
    }

    expect(deriveTicketData(state, { name: 'Maya', anonymous: false }, eras)).toMatchObject({
      admitOne: 'Maya',
      signalsOpened: 4,
      signalsTotal: 25,
      deepestEra: '2016 / ILIWYS',
      journeyId: 'FR-20260612-ABC123',
      finalSong: 'WHEN WE ARE TOGETHER',
      completedDate: '2026.06.12',
    })
  })

  it('uses ANONYMOUS when the visitor stays unnamed', () => {
    const ticket = deriveTicketData(
      createInitialExperience('FR-20260612-DEF456'),
      { name: null, anonymous: true },
      eras,
    )

    expect(ticket.admitOne).toBe('ANONYMOUS')
  })

  it('escapes visitor text in the downloadable SVG', () => {
    const ticket = deriveTicketData(
      createInitialExperience('FR-20260612-XYZ789'),
      { name: '<b>&x</b>', anonymous: false },
      eras,
    )

    const svg = createTicketSvg(ticket, '2013')

    expect(svg).toContain('&lt;b&gt;&amp;x&lt;/b&gt;')
    expect(svg).not.toContain('<b>')
    expect(svg).toContain('THE 1975 / FIVE ROOMS / SEVEN ACTS')
  })

  it('offers one distinct printable ticket theme for each album era', () => {
    expect(ticketThemes.map((theme) => theme.id)).toEqual(['2013', '2016', '2018', '2020', '2022'])
    expect(new Set(ticketThemes.map((theme) => theme.background)).size).toBe(5)
    expect(ticketThemes.map(({ background, foreground, accent }) => ({ background, foreground, accent }))).toEqual([
      { background: '#080808', foreground: '#f4f1ec', accent: '#f5f5f2' },
      { background: '#f0a7b8', foreground: '#fff8f7', accent: '#ffb2c5' },
      { background: '#f0f1ee', foreground: '#121722', accent: '#2367df' },
      { background: '#d7d4cb', foreground: '#11130e', accent: '#d9ff4f' },
      { background: '#06162b', foreground: '#e6f2ff', accent: '#9cc7e8' },
    ])

    const ticket = deriveTicketData(
      createInitialExperience('FR-20260612-STYLES'),
      { name: 'Maya', anonymous: false },
      eras,
    )

    ticketThemes.forEach((theme) => {
      const svg = createTicketSvg(ticket, theme.id)
      expect(svg).toContain(`data-ticket-theme="${theme.id}"`)
      expect(svg).toContain(theme.background)
      expect(svg).toContain(theme.foreground)
      expect(getTicketEditionNumber(ticket, theme.id)).toContain(theme.edition)
    })
  })

  it('creates a two-sided keepsake with a designed archive note on the reverse', () => {
    const ticket = deriveTicketData(
      createInitialExperience('FR-20260612-BACK01'),
      { name: 'Maya', anonymous: false },
      eras,
    )

    const keepsake = createTicketKeepsakeSvg(ticket, '2022')

    expect(keepsake).toContain('width="1260"')
    expect(keepsake).toContain('height="1260"')
    expect(keepsake).toContain('data-ticket-side="front"')
    expect(keepsake).toContain('data-ticket-side="back"')
    expect(keepsake).toContain('y="630"')
    expect(keepsake).toContain('PERFORMANCE CAN STILL TELL THE TRUTH.')
  })

  it('keeps exported decorations inside their own visual zones', () => {
    const ticket = deriveTicketData(
      createInitialExperience('FR-20260612-SAFE01'),
      { name: 'Archer', anonymous: false },
      eras,
    )

    ticketThemes.forEach((theme) => {
      const front = createTicketSvg(ticket, theme.id)
      expect(front).not.toContain('stop-color="#ffffff"')
      expect(front).toContain(theme.label)
    })
  })
})

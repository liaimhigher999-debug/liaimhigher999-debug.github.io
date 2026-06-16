import { describe, expect, it, vi } from 'vitest'
import { buildShareUrl, copyText, shareNight, type ShareEnvironment } from './share'

const environment = (overrides: Partial<ShareEnvironment> = {}): ShareEnvironment => ({
  isSecureContext: true,
  location: {
    origin: 'http://127.0.0.1:5173',
    pathname: '/five-rooms/',
  },
  share: vi.fn(async () => undefined),
  clipboardWrite: vi.fn(async () => undefined),
  legacyCopy: vi.fn(() => true),
  ...overrides,
})

describe('night sharing', () => {
  it('uses the configured public site URL without a trailing slash', () => {
    expect(buildShareUrl(environment(), 'https://the1975.example/night/')).toBe(
      'https://the1975.example/night',
    )
  })

  it('shares through the native share sheet when available', async () => {
    const env = environment()

    await expect(
      shareNight(env, {
        title: 'The Night You Were Here',
        text: 'THE 1975 / MAYA / FR-1',
        url: 'https://the1975.example',
      }),
    ).resolves.toBe('shared')

    expect(env.clipboardWrite).not.toHaveBeenCalled()
  })

  it('falls back to clipboard when native sharing is rejected', async () => {
    const env = environment({
      share: vi.fn(async () => {
        throw new DOMException('Blocked', 'NotAllowedError')
      }),
    })

    await expect(
      shareNight(env, { title: 'Night', text: 'Ticket', url: 'https://the1975.example' }),
    ).resolves.toBe('copied')

    expect(env.clipboardWrite).toHaveBeenCalledWith('https://the1975.example')
  })

  it('falls back to legacy copy when clipboard writing fails', async () => {
    const env = environment({
      share: undefined,
      clipboardWrite: vi.fn(async () => {
        throw new Error('Clipboard denied')
      }),
    })

    await expect(copyText(env, 'https://the1975.example')).resolves.toBe(true)
    expect(env.legacyCopy).toHaveBeenCalledWith('https://the1975.example')
  })

  it('reports a user-cancelled share without copying', async () => {
    const env = environment({
      share: vi.fn(async () => {
        throw new DOMException('Cancelled', 'AbortError')
      }),
    })

    await expect(
      shareNight(env, { title: 'Night', text: 'Ticket', url: 'https://the1975.example' }),
    ).resolves.toBe('cancelled')

    expect(env.clipboardWrite).not.toHaveBeenCalled()
    expect(env.legacyCopy).not.toHaveBeenCalled()
  })

  it('returns failed when every automatic route is unavailable', async () => {
    const env = environment({
      isSecureContext: false,
      share: undefined,
      clipboardWrite: undefined,
      legacyCopy: vi.fn(() => false),
    })

    await expect(
      shareNight(env, { title: 'Night', text: 'Ticket', url: 'https://the1975.example' }),
    ).resolves.toBe('failed')
  })
})

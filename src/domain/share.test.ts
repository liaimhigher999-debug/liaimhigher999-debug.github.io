import { describe, expect, it, vi } from 'vitest'
import { copyText, type ShareEnvironment } from './share'

const environment = (overrides: Partial<ShareEnvironment> = {}): ShareEnvironment => ({
  isSecureContext: true,
  clipboardWrite: vi.fn(async () => undefined),
  legacyCopy: vi.fn(() => true),
  ...overrides,
})

describe('copy link utilities', () => {
  it('falls back to legacy copy when clipboard writing fails', async () => {
    const env = environment({
      clipboardWrite: vi.fn(async () => {
        throw new Error('Clipboard denied')
      }),
    })

    await expect(copyText(env, 'https://the1975.example')).resolves.toBe(true)
    expect(env.legacyCopy).toHaveBeenCalledWith('https://the1975.example')
  })
})

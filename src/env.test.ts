import { describe, expect, it } from 'vitest'
import { resolveAppEnvironment, validateReleaseEnvironment } from './env'

describe('application environment', () => {
  it('uses local media paths during development', () => {
    expect(resolveAppEnvironment({ DEV: true, PROD: false })).toEqual({
      mediaBaseUrl: '/assets/user-media/video/msg',
      publicSiteUrl: undefined,
    })
  })

  it('normalizes configured public and media URLs', () => {
    expect(resolveAppEnvironment({
      DEV: false,
      PROD: true,
      VITE_MEDIA_BASE_URL: 'https://media.example/live/v1/',
      VITE_PUBLIC_SITE_URL: 'https://example.com/',
    })).toEqual({
      mediaBaseUrl: 'https://media.example/live/v1',
      publicSiteUrl: 'https://example.com',
    })
  })

  it('rejects missing or insecure release URLs', () => {
    expect(() => validateReleaseEnvironment({})).toThrow(/VITE_PUBLIC_SITE_URL/)
    expect(() => validateReleaseEnvironment({
      VITE_PUBLIC_SITE_URL: 'http://example.com',
      VITE_MEDIA_BASE_URL: 'https://media.example',
    })).toThrow(/HTTPS/)
  })

  it('accepts complete HTTPS release URLs', () => {
    expect(validateReleaseEnvironment({
      VITE_PUBLIC_SITE_URL: 'https://example.com/',
      VITE_MEDIA_BASE_URL: 'https://media.example/live/v1/',
    })).toEqual({
      mediaBaseUrl: 'https://media.example/live/v1',
      publicSiteUrl: 'https://example.com',
    })
  })
})

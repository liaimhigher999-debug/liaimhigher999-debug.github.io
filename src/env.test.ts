import { describe, expect, it } from 'vitest'
import { resolveAppEnvironment, validateReleaseEnvironment } from './env'

describe('application environment', () => {
  it('uses local media paths during development', () => {
    expect(resolveAppEnvironment({ DEV: true, PROD: false })).toEqual({
      mediaBaseUrl: '/assets/user-media/video/msg',
      publicSiteUrl: undefined,
      liveVideoProvider: 'local',
    })
  })

  it('uses Bilibili embeds by default during production builds', () => {
    expect(resolveAppEnvironment({ DEV: false, PROD: true })).toEqual({
      mediaBaseUrl: '/assets/user-media/video/msg',
      publicSiteUrl: undefined,
      liveVideoProvider: 'bilibili',
    })
  })

  it('normalizes configured public and media URLs', () => {
    expect(resolveAppEnvironment({
      DEV: false,
      PROD: true,
      VITE_MEDIA_BASE_URL: 'https://media.example/live/v1/',
      VITE_PUBLIC_SITE_URL: 'https://example.com/',
      VITE_LIVE_VIDEO_PROVIDER: 'local',
    })).toEqual({
      mediaBaseUrl: 'https://media.example/live/v1',
      publicSiteUrl: 'https://example.com',
      liveVideoProvider: 'local',
    })
  })

  it('rejects missing or insecure release URLs', () => {
    expect(() => validateReleaseEnvironment({})).toThrow(/VITE_PUBLIC_SITE_URL/)
    expect(() => validateReleaseEnvironment({
      VITE_PUBLIC_SITE_URL: 'http://example.com',
      VITE_MEDIA_BASE_URL: 'https://media.example',
    })).toThrow(/HTTPS/)
  })

  it('accepts complete HTTPS release URLs for local production media', () => {
    expect(validateReleaseEnvironment({
      VITE_PUBLIC_SITE_URL: 'https://example.com/',
      VITE_MEDIA_BASE_URL: 'https://media.example/live/v1/',
      VITE_LIVE_VIDEO_PROVIDER: 'local',
    })).toEqual({
      mediaBaseUrl: 'https://media.example/live/v1',
      publicSiteUrl: 'https://example.com',
      liveVideoProvider: 'local',
    })
  })

  it('does not require a media base URL for Bilibili release builds', () => {
    expect(validateReleaseEnvironment({
      VITE_PUBLIC_SITE_URL: 'https://example.com/',
    })).toEqual({
      mediaBaseUrl: '/assets/user-media/video/msg',
      publicSiteUrl: 'https://example.com',
      liveVideoProvider: 'bilibili',
    })
  })
})

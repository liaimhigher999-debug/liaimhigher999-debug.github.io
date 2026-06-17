type EnvironmentInput = {
  DEV?: boolean
  PROD?: boolean
  VITE_MEDIA_BASE_URL?: string
  VITE_PUBLIC_SITE_URL?: string
  VITE_LIVE_VIDEO_PROVIDER?: string
  VITE_FIXED_VIDEO_QUALITY?: string
}

export type AppEnvironment = {
  mediaBaseUrl: string
  publicSiteUrl?: string
  liveVideoProvider: 'local' | 'bilibili'
  fixedVideoQuality?: 'high'
}

const normalizeUrl = (value?: string) => value?.trim().replace(/\/+$/, '') || undefined

const resolveLiveVideoProvider = (environment: EnvironmentInput) => {
  if (environment.DEV) {
    return 'local'
  }

  const configured = environment.VITE_LIVE_VIDEO_PROVIDER?.trim().toLowerCase()
  if (configured === 'local' || configured === 'bilibili') {
    return configured
  }

  return environment.PROD ? 'bilibili' : 'local'
}

const requireHttpsUrl = (name: string, value?: string) => {
  const normalized = normalizeUrl(value)
  if (!normalized) {
    throw new Error(`${name} is required for a production release.`)
  }

  let parsed: URL
  try {
    parsed = new URL(normalized)
  } catch {
    throw new Error(`${name} must be a valid HTTPS URL.`)
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`${name} must use HTTPS.`)
  }

  return normalized
}

export const resolveAppEnvironment = (environment: EnvironmentInput): AppEnvironment => ({
  mediaBaseUrl: normalizeUrl(environment.VITE_MEDIA_BASE_URL) ?? '/assets/user-media/video/msg',
  publicSiteUrl: normalizeUrl(environment.VITE_PUBLIC_SITE_URL),
  liveVideoProvider: resolveLiveVideoProvider(environment),
  fixedVideoQuality: environment.VITE_FIXED_VIDEO_QUALITY?.trim().toLowerCase() === 'high' ? 'high' : undefined,
})

export const validateReleaseEnvironment = (environment: EnvironmentInput): AppEnvironment => {
  const releaseEnvironment = { ...environment, PROD: environment.PROD ?? true }
  const liveVideoProvider = resolveLiveVideoProvider(releaseEnvironment)

  return {
    publicSiteUrl: requireHttpsUrl('VITE_PUBLIC_SITE_URL', environment.VITE_PUBLIC_SITE_URL),
    mediaBaseUrl: liveVideoProvider === 'local'
      ? requireHttpsUrl('VITE_MEDIA_BASE_URL', environment.VITE_MEDIA_BASE_URL)
      : normalizeUrl(environment.VITE_MEDIA_BASE_URL) ?? '/assets/user-media/video/msg',
    liveVideoProvider,
  }
}

export const appEnvironment = resolveAppEnvironment(import.meta.env)

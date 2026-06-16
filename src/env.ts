type EnvironmentInput = {
  DEV?: boolean
  PROD?: boolean
  VITE_MEDIA_BASE_URL?: string
  VITE_PUBLIC_SITE_URL?: string
}

export type AppEnvironment = {
  mediaBaseUrl: string
  publicSiteUrl?: string
}

const normalizeUrl = (value?: string) => value?.trim().replace(/\/+$/, '') || undefined

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
})

export const validateReleaseEnvironment = (environment: EnvironmentInput): AppEnvironment => ({
  publicSiteUrl: requireHttpsUrl('VITE_PUBLIC_SITE_URL', environment.VITE_PUBLIC_SITE_URL),
  mediaBaseUrl: requireHttpsUrl('VITE_MEDIA_BASE_URL', environment.VITE_MEDIA_BASE_URL),
})

export const appEnvironment = resolveAppEnvironment(import.meta.env)

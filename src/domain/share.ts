export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export type NightShareData = {
  title: string
  text: string
  url: string
}

export type ShareEnvironment = {
  isSecureContext: boolean
  location: Pick<Location, 'origin' | 'pathname'>
  share?: (data: ShareData) => Promise<void>
  clipboardWrite?: (text: string) => Promise<void>
  legacyCopy: (text: string) => boolean
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const buildShareUrl = (environment: ShareEnvironment, publicSiteUrl?: string) => {
  const configuredUrl = publicSiteUrl?.trim()
  return trimTrailingSlash(
    configuredUrl || `${environment.location.origin}${environment.location.pathname}`,
  )
}

export const copyText = async (environment: ShareEnvironment, value: string) => {
  if (environment.isSecureContext && environment.clipboardWrite) {
    try {
      await environment.clipboardWrite(value)
      return true
    } catch {
      // Continue to the legacy browser copy path.
    }
  }

  return environment.legacyCopy(value)
}

const isAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'

export const shareNight = async (
  environment: ShareEnvironment,
  shareData: NightShareData,
): Promise<ShareResult> => {
  if (environment.share) {
    try {
      await environment.share(shareData)
      return 'shared'
    } catch (error) {
      if (isAbortError(error)) {
        return 'cancelled'
      }
    }
  }

  return await copyText(environment, shareData.url) ? 'copied' : 'failed'
}

const legacyBrowserCopy = (value: string) => {
  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    input.remove()
  }
}

export const createBrowserShareEnvironment = (): ShareEnvironment => ({
  isSecureContext: window.isSecureContext,
  location: window.location,
  share: navigator.share?.bind(navigator),
  clipboardWrite: navigator.clipboard?.writeText.bind(navigator.clipboard),
  legacyCopy: legacyBrowserCopy,
})

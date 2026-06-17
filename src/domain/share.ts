export type ShareEnvironment = {
  isSecureContext: boolean
  clipboardWrite?: (text: string) => Promise<void>
  legacyCopy: (text: string) => boolean
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
  clipboardWrite: navigator.clipboard?.writeText.bind(navigator.clipboard),
  legacyCopy: legacyBrowserCopy,
})

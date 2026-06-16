export type VideoQuality = 'high' | 'standard'

type ConnectionPreference = {
  effectiveType?: string
  saveData?: boolean
}

export const chooseInitialVideoQuality = (
  connection?: ConnectionPreference,
): VideoQuality => {
  if (connection?.saveData || connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
    return 'standard'
  }

  return 'high'
}

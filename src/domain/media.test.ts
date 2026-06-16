import { describe, expect, it } from 'vitest'
import { chooseInitialVideoQuality } from './media'

describe('live video quality selection', () => {
  it('defaults desktop visitors to the high quality source', () => {
    expect(chooseInitialVideoQuality()).toBe('high')
    expect(chooseInitialVideoQuality({ effectiveType: '4g', saveData: false })).toBe('high')
  })

  it('uses the standard source when data saving is enabled', () => {
    expect(chooseInitialVideoQuality({ effectiveType: '4g', saveData: true })).toBe('standard')
  })

  it('uses the standard source on explicitly slow connections', () => {
    expect(chooseInitialVideoQuality({ effectiveType: '2g', saveData: false })).toBe('standard')
    expect(chooseInitialVideoQuality({ effectiveType: 'slow-2g', saveData: false })).toBe('standard')
  })
})

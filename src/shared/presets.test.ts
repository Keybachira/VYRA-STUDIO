import { describe, expect, it } from 'vitest'
import {
  defaultPresets,
  dimensionsForShape,
  migrateLegacySettings,
  normalizePresets
} from './presets'
import type { CameraPreset } from './types'

describe('defaultPresets', () => {
  it('contains the five documented built-ins with unique ids', () => {
    const ids = defaultPresets.map((p) => p.id)
    expect(ids).toEqual([
      'preset-coding',
      'preset-recording',
      'preset-meeting',
      'preset-gaming',
      'preset-minimal'
    ])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('marks all built-ins as builtin', () => {
    expect(defaultPresets.every((p) => p.builtin)).toBe(true)
  })
})

describe('dimensionsForShape', () => {
  it('keeps squares square', () => {
    expect(dimensionsForShape(300, 'square')).toEqual({ width: 300, height: 300 })
  })

  it('computes 3:4 portrait and 16:9 landscape', () => {
    expect(dimensionsForShape(400, 'vertical-rect')).toEqual({ width: 300, height: 400 })
    expect(dimensionsForShape(320, 'horizontal-rect')).toEqual({ width: 320, height: 180 })
  })

  it('computes pill as a wide, short bubble', () => {
    const { width, height } = dimensionsForShape(240, 'pill')
    expect(width).toBe(240)
    expect(height).toBeLessThan(width / 2)
  })
})

describe('migrateLegacySettings', () => {
  it('maps legacy sizeIndex and shape names to the v2 schema', () => {
    const legacy = {
      shortcuts: { toggleCamera: 'F9' },
      state: {
        shape: 'horizontal-rect',
        sizeIndex: 2,
        borderGradient: 'gradient_01',
        borderWidth: 6,
        isBorderAnimated: true
      }
    }
    const migrated = migrateLegacySettings(legacy)
    expect(migrated).not.toBeNull()
    expect(migrated!.state.size).toBe('lg')
    expect(migrated!.state.shape).toBe('horizontal-rect')
    expect(migrated!.state.border).toEqual({
      gradient: 'gradient_01',
      width: 6,
      animated: true
    })
  })

  it('returns null for blobs without state', () => {
    expect(migrateLegacySettings({})).toBeNull()
    expect(migrateLegacySettings(null as never)).toBeNull()
  })
})

describe('normalizePresets', () => {
  it('drops invalid entries and fills defaults', () => {
    const valid: CameraPreset = {
      id: 'p1',
      name: 'P1',
      shape: 'circle',
      size: 'sm',
      position: 'center',
      rounding: 10,
      opacity: 0.5,
      border: { gradient: 'gold', width: 2, animated: false },
      mirror: false
    }
    const result = normalizePresets([valid, null, { id: 'x' }, 42, 'nope'])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(valid)
  })

  it('applies safe defaults for missing numeric fields', () => {
    const result = normalizePresets([
      { id: 'p', name: 'P', shape: 'rect', size: 'md', position: 'center' }
    ])
    expect(result[0].rounding).toBe(24)
    expect(result[0].opacity).toBe(1)
    expect(result[0].mirror).toBe(true)
    expect(result[0].border).toEqual({ gradient: 'none', width: 4, animated: false })
  })

  it('returns empty for non-arrays', () => {
    expect(normalizePresets(undefined)).toEqual([])
    expect(normalizePresets({})).toEqual([])
  })
})

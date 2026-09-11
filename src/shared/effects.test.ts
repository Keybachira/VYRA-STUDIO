import { describe, expect, it } from 'vitest'
import {
  CAMERA_EFFECTS,
  DEFAULT_EFFECT_ID,
  effectById,
  effectFilter,
  isKnownEffect,
  normalizeEffectId
} from './effects'

describe('camera effects catalog', () => {
  it('exposes a non-empty catalog with unique ids', () => {
    expect(CAMERA_EFFECTS.length).toBeGreaterThan(0)
    const ids = CAMERA_EFFECTS.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses only valid CSS filter functions', () => {
    const allowed = [
      'grayscale',
      'sepia',
      'saturate',
      'brightness',
      'contrast',
      'hue-rotate',
      'blur',
      'opacity'
    ]
    for (const effect of CAMERA_EFFECTS) {
      const fns = [...effect.filter.matchAll(/([a-z-]+)\(/g)].map((m) => m[1])
      for (const fn of fns) {
        expect(allowed, `effect "${effect.id}"`).toContain(fn)
      }
    }
  })

  it('resolves known ids and falls back to none', () => {
    expect(effectFilter('gaming')).toContain('saturate')
    expect(effectFilter('none')).toBe('')
    expect(effectFilter('nope')).toBe('')
    expect(effectFilter(undefined)).toBe('')
    expect(effectById('bw').id).toBe('bw')
    expect(effectById('nope').id).toBe(DEFAULT_EFFECT_ID)
  })

  it('normalizes persisted ids', () => {
    expect(normalizeEffectId('neon')).toBe('neon')
    expect(normalizeEffectId('nope')).toBe('none')
    expect(normalizeEffectId(undefined)).toBe('none')
    expect(isKnownEffect('retro')).toBe(true)
    expect(isKnownEffect(42)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { defaultScenes, normalizeScenes } from './scenes'

const PRESETS = new Set(['preset-gaming', 'preset-coding', 'preset-recording'])

describe('normalizeScenes', () => {
  it('keeps valid scenes pointing at known presets', () => {
    const result = normalizeScenes(
      [{ id: 's1', name: 'Gaming', presetId: 'preset-gaming' }],
      PRESETS
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ id: 's1', name: 'Gaming', presetId: 'preset-gaming' })
  })

  it('drops scenes with dangling preset references', () => {
    const result = normalizeScenes(
      [
        { id: 's1', name: 'Ok', presetId: 'preset-gaming' },
        { id: 's2', name: 'Gone', presetId: 'preset-deleted' },
        { id: 's3', name: 'No preset' },
        null,
        'nope'
      ],
      PRESETS
    )
    expect(result.map((s) => s.id)).toEqual(['s1'])
  })

  it('returns empty for non-arrays', () => {
    expect(normalizeScenes(undefined, PRESETS)).toEqual([])
    expect(normalizeScenes({}, PRESETS)).toEqual([])
  })

  it('default scenes reference known builtin presets', () => {
    const builtinIds = new Set([
      'preset-coding',
      'preset-recording',
      'preset-meeting',
      'preset-gaming',
      'preset-minimal'
    ])
    for (const scene of defaultScenes) {
      expect(builtinIds.has(scene.presetId)).toBe(true)
    }
    expect(normalizeScenes(defaultScenes, builtinIds)).toHaveLength(defaultScenes.length)
  })
})

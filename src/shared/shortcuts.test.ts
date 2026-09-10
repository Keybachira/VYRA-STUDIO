import { describe, expect, it } from 'vitest'
import { SHORTCUT_DEFINITIONS, defaultShortcuts, normalizeShortcuts } from './shortcuts'
import type { ShortcutMap } from './types'

describe('shortcut registry', () => {
  it('has a default for every definition and unique actions', () => {
    const actions = SHORTCUT_DEFINITIONS.map((d) => d.action)
    expect(new Set(actions).size).toBe(actions.length)
    expect(Object.keys(defaultShortcuts).sort()).toEqual([...actions].sort())
    expect(SHORTCUT_DEFINITIONS.every((d) => d.default.length > 0)).toBe(true)
  })

  it('defaults the documented global combos', () => {
    expect(defaultShortcuts.commandPalette).toBe('Ctrl+Space')
    expect(defaultShortcuts.toggleCamera).toBe('F9')
    expect(defaultShortcuts.startRecording).toBe('F10')
    expect(defaultShortcuts.screenshot).toBe('F8')
  })
})

describe('normalizeShortcuts', () => {
  it('falls back to defaults for unknown input', () => {
    expect(normalizeShortcuts(undefined)).toEqual(defaultShortcuts)
    expect(normalizeShortcuts(null)).toEqual(defaultShortcuts)
    expect(normalizeShortcuts('nope')).toEqual(defaultShortcuts)
  })

  it('keeps known actions and drops unknown ones', () => {
    const result = normalizeShortcuts({
      toggleCamera: 'F7',
      startRecording: ''
    } as ShortcutMap)
    expect(result.toggleCamera).toBe('F7')
    // empty string is still a string → kept as "unbound"
    expect(result.startRecording).toBe('')
  })
})

import { describe, expect, it } from 'vitest'
import { buildCombo, matchLocalShortcut } from './match-local-shortcut'

const SHORTCUTS = {
  sizeSm: '2',
  mirror: 'Alt+N',
  alwaysOnTop: 'Alt+T',
  topLeft: 'Alt+Q',
  // globals must never match here — main handles them
  toggleCamera: 'F9',
  commandPalette: 'Ctrl+Space'
}

describe('buildCombo', () => {
  it('formats modifier combos', () => {
    expect(
      buildCombo({ ctrlKey: true, altKey: false, shiftKey: false, metaKey: false, key: 'n' })
    ).toBe('CmdOrCtrl+n')
    expect(
      buildCombo({ ctrlKey: false, altKey: true, shiftKey: true, metaKey: false, key: 'N' })
    ).toBe('Alt+Shift+n')
  })

  it('keeps named keys verbatim', () => {
    expect(
      buildCombo({ ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, key: 'F9' })
    ).toBe('F9')
  })
})

describe('matchLocalShortcut', () => {
  it('matches bare single-key bindings', () => {
    expect(
      matchLocalShortcut(
        { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, key: '2' },
        SHORTCUTS
      )
    ).toBe('sizeSm')
  })

  it('matches modifier bindings case-insensitively', () => {
    expect(
      matchLocalShortcut(
        { ctrlKey: false, altKey: true, shiftKey: false, metaKey: false, key: 'N' },
        SHORTCUTS
      )
    ).toBe('mirror')
  })

  it('never matches global actions even if the combo matches', () => {
    expect(
      matchLocalShortcut(
        { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false, key: ' ' },
        SHORTCUTS
      )
    ).toBeNull()
    expect(
      matchLocalShortcut(
        { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, key: 'F9' },
        SHORTCUTS
      )
    ).toBeNull()
  })

  it('returns null for unmatched combos', () => {
    expect(
      matchLocalShortcut(
        { ctrlKey: true, altKey: true, shiftKey: true, metaKey: true, key: 'z' },
        SHORTCUTS
      )
    ).toBeNull()
  })
})

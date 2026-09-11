/**
 * VYRA Studio — shortcut registry.
 * Central definition of every keyboard action, its default binding and
 * where it applies (global = even when VYRA is unfocused).
 */

import type { ShortcutAction, ShortcutMap } from './types'

export interface ShortcutDefinition {
  action: ShortcutAction
  default: string
  global: boolean
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { action: 'commandPalette', default: 'Ctrl+Space', global: true },
  { action: 'toggleCamera', default: 'F9', global: true },
  { action: 'startRecording', default: 'F10', global: true },
  { action: 'screenshot', default: 'F8', global: true },
  { action: 'micMute', default: 'Alt+M', global: true },
  { action: 'mirror', default: 'Alt+N', global: false },
  { action: 'alwaysOnTop', default: 'Alt+T', global: false },
  { action: 'sizeXs', default: '1', global: false },
  { action: 'sizeSm', default: '2', global: false },
  { action: 'sizeMd', default: '3', global: false },
  { action: 'sizeLg', default: '4', global: false },
  { action: 'sizeFullscreen', default: '5', global: false },
  { action: 'preset1', default: 'Alt+1', global: true },
  { action: 'preset2', default: 'Alt+2', global: true },
  { action: 'preset3', default: 'Alt+3', global: true },
  { action: 'scene1', default: 'F5', global: true },
  { action: 'scene2', default: 'F6', global: true },
  { action: 'scene3', default: 'F7', global: true },
  { action: 'topLeft', default: 'Alt+Q', global: false },
  { action: 'topRight', default: 'Alt+E', global: false },
  { action: 'leftMiddle', default: 'Alt+A', global: false },
  { action: 'center', default: 'Alt+S', global: false },
  { action: 'rightMiddle', default: 'Alt+D', global: false },
  { action: 'bottomLeft', default: 'Alt+Z', global: false },
  { action: 'bottomRight', default: 'Alt+C', global: false }
]

export const defaultShortcuts: ShortcutMap = Object.fromEntries(
  SHORTCUT_DEFINITIONS.map((d) => [d.action, d.default])
) as ShortcutMap

/** Keep only valid actions; fall back to defaults for missing/invalid entries. */
export function normalizeShortcuts(raw: unknown): ShortcutMap {
  const out = { ...defaultShortcuts }
  if (raw && typeof raw === 'object') {
    for (const def of SHORTCUT_DEFINITIONS) {
      const val = (raw as Record<string, unknown>)[def.action]
      if (typeof val === 'string') out[def.action] = val
    }
  }
  return out
}

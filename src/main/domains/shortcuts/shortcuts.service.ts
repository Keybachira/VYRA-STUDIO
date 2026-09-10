/**
 * VYRA Studio — shortcut engine (main process).
 * Two layers:
 *  - global: registered with Electron globalShortcut (work system-wide)
 *  - local: forwarded to the focused camera window as keydown-equivalent actions
 */

import { globalShortcut } from 'electron'
import { settings } from '../settings/settings.service'
import { SHORTCUT_DEFINITIONS } from '../../../shared/shortcuts'
import type { ShortcutAction } from '../../../shared/types'

export type ShortcutHandler = (action: ShortcutAction) => void

let handler: ShortcutHandler = (): void => undefined

export function setShortcutHandler(next: ShortcutHandler): void {
  handler = next
}

export function registerGlobalShortcuts(): void {
  for (const def of SHORTCUT_DEFINITIONS) {
    if (!def.global) continue
    const accelerator = settings.shortcuts[def.action]
    if (!accelerator) continue
    try {
      globalShortcut.register(accelerator, () => handler(def.action))
    } catch (err) {
      console.warn(`[vyra] failed to register global shortcut ${accelerator}:`, err)
    }
  }
}

export function reRegisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
  registerGlobalShortcuts()
}

export function unregisterFocusShortcuts(): void {
  // Local (focus-scoped) shortcuts are handled in the renderer; nothing to do here.
}

/** Resolve a keydown in the camera window to an action, if it matches a local shortcut. */
export function matchLocalShortcut(
  event: { ctrlKey: boolean; altKey: boolean; shiftKey: boolean; metaKey: boolean; key: string },
  shortcuts: Record<string, string>
): ShortcutAction | null {
  const parts: string[] = []
  if (event.ctrlKey || event.metaKey) parts.push('CmdOrCtrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  parts.push(key)
  const combo = parts.join('+')

  for (const def of SHORTCUT_DEFINITIONS) {
    if (def.global) continue
    if (shortcuts[def.action] === combo) return def.action
  }
  // Bare keys (e.g. "1".."5") compare directly
  for (const def of SHORTCUT_DEFINITIONS) {
    if (def.global) continue
    if (shortcuts[def.action] === key) return def.action
  }
  return null
}

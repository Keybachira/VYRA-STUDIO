/**
 * VYRA Studio — local shortcut matcher (renderer side).
 * Pure function: resolves a KeyboardEvent-like input to a shortcut action.
 * Only matches focus-scoped (non-global) actions — globals are handled in main.
 */

export interface LocalShortcutInput {
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  metaKey: boolean
  key: string
}

const GLOBAL_ACTIONS = new Set([
  'toggleCamera',
  'commandPalette',
  'startRecording',
  'screenshot',
  'micMute',
  'preset1',
  'preset2',
  'preset3'
])

export function buildCombo(input: LocalShortcutInput): string {
  const parts: string[] = []
  if (input.ctrlKey || input.metaKey) parts.push('CmdOrCtrl')
  if (input.altKey) parts.push('Alt')
  if (input.shiftKey) parts.push('Shift')
  const key = input.key.length === 1 ? input.key.toLowerCase() : input.key
  parts.push(key)
  return parts.join('+')
}

export function matchLocalShortcut(
  input: LocalShortcutInput,
  shortcuts: Record<string, string>
): string | null {
  const combo = buildCombo(input)
  const bare = input.key.length === 1 ? input.key.toLowerCase() : input.key
  const normCombo = combo.toLowerCase()
  const normBare = bare.toLowerCase()

  for (const [action, accelerator] of Object.entries(shortcuts)) {
    if (GLOBAL_ACTIONS.has(action)) continue
    const norm = accelerator.toLowerCase()
    if (norm === normCombo || norm === normBare) return action
  }
  return null
}

/**
 * VYRA Studio — Scenes (one-key look switching).
 * A scene is a named pointer to a camera preset; applying it is instant.
 * Pure functions only: no Electron imports, fully unit-testable.
 */

export interface Scene {
  id: string
  name: string
  presetId: string
  builtin?: boolean
}

export const defaultScenes: Scene[] = [
  { id: 'scene-gaming', name: 'Gaming', presetId: 'preset-gaming', builtin: true },
  { id: 'scene-coding', name: 'Coding', presetId: 'preset-coding', builtin: true },
  { id: 'scene-recording', name: 'Recording', presetId: 'preset-recording', builtin: true }
]

/**
 * Defensive normalization when loading user scenes from disk.
 * Drops scenes with missing fields or dangling preset references.
 */
export function normalizeScenes(raw: unknown, validPresetIds: Set<string>): Scene[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((s): s is Scene => {
      if (!s || typeof s !== 'object') return false
      const scene = s as Partial<Scene>
      return (
        typeof scene.id === 'string' &&
        typeof scene.name === 'string' &&
        typeof scene.presetId === 'string' &&
        validPresetIds.has(scene.presetId)
      )
    })
    .map((s) => ({
      id: s.id,
      name: s.name,
      presetId: s.presetId,
      ...(s.builtin !== undefined ? { builtin: s.builtin } : {})
    }))
}

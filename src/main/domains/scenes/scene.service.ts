/**
 * VYRA Studio — scene service (main process).
 * Scenes are named pointers to presets; applying one swaps the whole look.
 */

import { settings, saveSettings } from '../settings/settings.service'
import { applyPresetById, createPreset } from '../presets/preset.service'
import { defaultScenes } from '../../../shared/scenes'
import type { Scene } from '../../../shared/types'

export function listScenes(): Scene[] {
  return settings.scenes
}

export function getActiveScene(): Scene | null {
  return settings.scenes.find((s) => s.id === settings.activeSceneId) ?? null
}

/** Apply a scene: swap to its preset and remember the scene as active. */
export function applySceneById(id: string): boolean {
  const scene = settings.scenes.find((s) => s.id === id)
  if (!scene) return false
  if (!applyPresetById(scene.presetId)) return false
  settings.activeSceneId = id
  saveSettings()
  return true
}

/** Keep the active scene in sync when a preset is applied directly. */
export function syncSceneForPreset(presetId: string): void {
  settings.activeSceneId = settings.scenes.find((s) => s.presetId === presetId)?.id ?? ''
  saveSettings()
}

/** Capture the current look as a new preset and wrap it in a scene. */
export function createScene(name: string): Scene | null {
  const preset = createPreset({ name: `${name} look` })
  const scene: Scene = {
    id: `scene-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || 'My scene',
    presetId: preset.id,
    builtin: false
  }
  settings.scenes.push(scene)
  saveSettings()
  return scene
}

export function deleteScene(id: string): boolean {
  const scene = settings.scenes.find((s) => s.id === id)
  if (!scene || scene.builtin) return false
  settings.scenes = settings.scenes.filter((s) => s.id !== id)
  if (settings.activeSceneId === id) {
    settings.activeSceneId = settings.scenes[0]?.id ?? ''
  }
  saveSettings()
  return true
}

/** Drop scenes whose preset no longer exists (e.g. after preset deletion). */
export function pruneScenesForPresets(validPresetIds: Set<string>): void {
  const before = settings.scenes.length
  settings.scenes = settings.scenes.filter((s) => validPresetIds.has(s.presetId))
  if (!settings.scenes.some((s) => s.id === settings.activeSceneId)) {
    settings.activeSceneId = settings.scenes[0]?.id ?? ''
  }
  if (settings.scenes.length !== before) saveSettings()
}

export function resetScenes(): void {
  settings.scenes = defaultScenes.map((s) => ({ ...s }))
  settings.activeSceneId = settings.scenes[0]?.id ?? ''
  saveSettings()
}

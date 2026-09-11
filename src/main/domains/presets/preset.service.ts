/**
 * VYRA Studio — preset service (main process).
 * CRUD over user presets; built-ins are protected from deletion.
 */

import { settings, saveSettings } from '../settings/settings.service'
import type { CameraPreset } from '../../../shared/types'
import { normalizeEffectId } from '../../../shared/effects'

export function listPresets(): CameraPreset[] {
  return settings.presets
}

export function getActivePreset(): CameraPreset | null {
  return settings.presets.find((p) => p.id === settings.activePresetId) ?? null
}

export function applyPresetById(id: string): boolean {
  const preset = settings.presets.find((p) => p.id === id)
  if (!preset) return false
  settings.activePresetId = id
  settings.camera.shape = preset.shape
  settings.camera.size = preset.size
  settings.camera.rounding = preset.rounding
  settings.camera.opacity = preset.opacity
  settings.camera.isMirrored = preset.mirror
  settings.camera.border = { ...preset.border }
  settings.camera.effect = normalizeEffectId(preset.effect)
  saveSettings()
  return true
}

export function createPreset(partial: Partial<CameraPreset>): CameraPreset {
  const preset: CameraPreset = {
    id: `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: partial.name?.trim() || 'My preset',
    shape: partial.shape ?? settings.camera.shape,
    size: partial.size ?? settings.camera.size,
    position: partial.position ?? 'bottom-right',
    rounding: partial.rounding ?? settings.camera.rounding,
    opacity: partial.opacity ?? settings.camera.opacity,
    border: partial.border ?? { ...settings.camera.border },
    mirror: partial.mirror ?? settings.camera.isMirrored ?? true,
    effect: normalizeEffectId(partial.effect ?? settings.camera.effect),
    builtin: false
  }
  settings.presets.push(preset)
  saveSettings()
  return preset
}

export function updatePreset(id: string, patch: Partial<CameraPreset>): boolean {
  const preset = settings.presets.find((p) => p.id === id)
  if (!preset) return false
  if (preset.builtin && patch.name !== undefined) {
    // Built-ins may not be renamed: rename applies to duplicates only.
    delete patch.name
  }
  Object.assign(preset, patch)
  saveSettings()
  return true
}

export function duplicatePreset(id: string): CameraPreset | null {
  const source = settings.presets.find((p) => p.id === id)
  if (!source) return null
  return createPreset({ ...source, name: `${source.name} copy`, builtin: false })
}

export function deletePreset(id: string): boolean {
  const preset = settings.presets.find((p) => p.id === id)
  if (!preset || preset.builtin) return false
  settings.presets = settings.presets.filter((p) => p.id !== id)
  if (settings.activePresetId === id) {
    settings.activePresetId = settings.presets[0]?.id ?? ''
  }
  // Cascade: scenes pointing at the deleted preset are removed.
  settings.scenes = settings.scenes.filter((s) => s.presetId !== id)
  if (!settings.scenes.some((s) => s.id === settings.activeSceneId)) {
    settings.activeSceneId = settings.scenes[0]?.id ?? ''
  }
  saveSettings()
  return true
}

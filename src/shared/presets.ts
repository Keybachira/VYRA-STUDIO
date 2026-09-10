/**
 * VYRA Studio — default presets + serialization/normalization helpers.
 * Pure functions only: no Electron imports, fully unit-testable.
 */

import type { CameraPreset, CameraRuntimeState } from './types'

export const BUILTIN_PRESETS: Omit<CameraPreset, 'id'>[] & { id?: string }[] = []

export const defaultPresets: CameraPreset[] = [
  {
    id: 'preset-coding',
    name: 'Coding',
    shape: 'rounded-rect',
    size: 'sm',
    position: 'bottom-right',
    rounding: 24,
    opacity: 1,
    border: { gradient: 'none', width: 4, animated: false },
    mirror: true,
    builtin: true
  },
  {
    id: 'preset-recording',
    name: 'Recording',
    shape: 'rounded-rect',
    size: 'lg',
    position: 'bottom-right',
    rounding: 32,
    opacity: 1,
    border: { gradient: 'gold', width: 4, animated: false },
    mirror: true,
    builtin: true
  },
  {
    id: 'preset-meeting',
    name: 'Meeting',
    shape: 'circle',
    size: 'md',
    position: 'top-right',
    rounding: 24,
    opacity: 1,
    border: { gradient: 'silver', width: 4, animated: false },
    mirror: true,
    builtin: true
  },
  {
    id: 'preset-gaming',
    name: 'Gaming',
    shape: 'rounded-rect',
    size: 'md',
    position: 'bottom-left',
    rounding: 24,
    opacity: 1,
    border: { gradient: 'gold', width: 6, animated: true },
    mirror: true,
    builtin: true
  },
  {
    id: 'preset-minimal',
    name: 'Minimal',
    shape: 'circle',
    size: 'xs',
    position: 'bottom-right',
    rounding: 24,
    opacity: 0.95,
    border: { gradient: 'none', width: 2, animated: false },
    mirror: true,
    builtin: true
  }
]

export const SIZES: Record<string, number> = { xs: 220, sm: 300, md: 450, lg: 600 }

export function dimensionsForShape(size: number, shape: string): { width: number; height: number } {
  let w = size
  let h = size
  if (shape === 'vertical-rect') {
    w = Math.round(size * (3 / 4))
    h = size
  } else if (shape === 'horizontal-rect') {
    w = size
    h = Math.round(size * (9 / 16))
  } else if (shape === 'pill') {
    w = size
    h = Math.round(size / 2.4)
  }
  return { width: w, height: h }
}

/** Migrate a legacy Floating Head Cam settings blob into the VYRA v2 schema. */
export function migrateLegacySettings(data: {
  shortcuts?: Record<string, string>
  state?: Record<string, unknown>
}): { shortcuts: Record<string, string>; state: Record<string, unknown> } | null {
  if (!data || typeof data !== 'object') return null
  if (!data.state) return null

  const s = data.state as Record<string, unknown>
  const legacySize = (s.sizeIndex as number) ?? 0
  const sizeMap: Record<number, string> = {
    0: 'sm',
    1: 'md',
    2: 'lg',
    3: 'sidebar',
    4: 'fullscreen'
  }
  const legacyShape = (s.shape as string) ?? 'circle'
  const shapeMap: Record<string, string> = {
    circle: 'circle',
    square: 'square',
    'vertical-rect': 'vertical-rect',
    'horizontal-rect': 'horizontal-rect'
  }

  return {
    shortcuts: data.shortcuts ?? {},
    state: {
      ...s,
      size: sizeMap[legacySize] ?? 'sm',
      shape: shapeMap[legacyShape] ?? 'circle',
      opacity: 1,
      border: {
        gradient: (s.borderGradient as string) ?? 'none',
        width: (s.borderWidth as number) ?? 4,
        animated: (s.isBorderAnimated as boolean) ?? false
      }
    }
  }
}

/** Defensive normalization when loading user presets from disk. */
export function normalizePresets(raw: unknown): CameraPreset[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((p): p is CameraPreset => {
      if (!p || typeof p !== 'object') return false
      const preset = p as Partial<CameraPreset>
      return (
        typeof preset.id === 'string' &&
        typeof preset.name === 'string' &&
        typeof preset.shape === 'string' &&
        typeof preset.size === 'string' &&
        typeof preset.position === 'string'
      )
    })
    .map((p) => ({
      ...p,
      rounding: typeof p.rounding === 'number' ? p.rounding : 24,
      opacity: typeof p.opacity === 'number' ? p.opacity : 1,
      mirror: typeof p.mirror === 'boolean' ? p.mirror : true,
      border: {
        gradient: p.border?.gradient ?? 'none',
        width: typeof p.border?.width === 'number' ? p.border.width : 4,
        animated: typeof p.border?.animated === 'boolean' ? p.border.animated : false
      }
    }))
}

export const defaultCameraState: Omit<CameraRuntimeState, 'devices' | 'isRecording'> = {
  selectedDeviceId: '',
  isMirrored: true,
  shape: 'circle',
  size: 'sm',
  rounding: 24,
  alwaysOnTop: true,
  opacity: 1,
  border: { gradient: 'none', width: 4, animated: false },
  language: 'en',
  cameraScreenId: '',
  recordingScreenId: '',
  sidebarWidthPercentage: 35,
  sidebarPosition: 'right'
}

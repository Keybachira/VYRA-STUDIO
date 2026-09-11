/**
 * VYRA Studio — real-time camera effects catalog.
 * Pure CSS-filter effects: GPU-composited, zero-copy, safe on modest hardware.
 * Pure functions only: no Electron imports, fully unit-testable.
 */

export interface CameraEffect {
  /** Stable id persisted in settings + presets. */
  id: string
  /** CSS `filter` value applied to the <video> element. Empty = no-op. */
  filter: string
  /** Whether to paint a subtle vignette overlay on top of the video. */
  vignette?: boolean
}

export const CAMERA_EFFECTS: CameraEffect[] = [
  { id: 'none', filter: '' },
  { id: 'natural', filter: 'saturate(1.08) contrast(1.04)' },
  { id: 'studio', filter: 'brightness(1.08) contrast(1.06) saturate(1.12)' },
  { id: 'cinematic', filter: 'contrast(1.12) saturate(0.85) sepia(0.18)', vignette: true },
  { id: 'gaming', filter: 'contrast(1.15) saturate(1.35)' },
  { id: 'bright', filter: 'brightness(1.2) saturate(1.05)' },
  { id: 'dark', filter: 'brightness(0.85) contrast(1.1)' },
  { id: 'bw', filter: 'grayscale(1) contrast(1.05)' },
  { id: 'retro', filter: 'sepia(0.45) contrast(1.05) brightness(1.02)' },
  { id: 'neon', filter: 'saturate(1.8) contrast(1.2)' },
  { id: 'warm', filter: 'sepia(0.25) saturate(1.35) contrast(1.02)' },
  { id: 'cold', filter: 'hue-rotate(15deg) saturate(1.1) contrast(1.05)' }
]

export const EFFECT_IDS: string[] = CAMERA_EFFECTS.map((e) => e.id)

export const DEFAULT_EFFECT_ID = 'none'

export function isKnownEffect(id: unknown): id is string {
  return typeof id === 'string' && EFFECT_IDS.includes(id)
}

/** Resolve an effect id to its definition; unknown ids fall back to `none`. */
export function effectById(id: unknown): CameraEffect {
  return CAMERA_EFFECTS.find((e) => e.id === id) ?? CAMERA_EFFECTS[0]
}

/** CSS `filter` value for an effect id ('' for none/unknown). */
export function effectFilter(id: unknown): string {
  return effectById(id).filter
}

/** Normalize a persisted effect id; unknown values become `none`. */
export function normalizeEffectId(id: unknown): string {
  return isKnownEffect(id) ? id : DEFAULT_EFFECT_ID
}

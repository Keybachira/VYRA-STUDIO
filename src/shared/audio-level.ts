/**
 * VYRA Studio — mic level math for VYRA Pulse.
 * Pure functions only: no browser/Electron imports, fully unit-testable.
 */

/** RMS of a byte time-domain buffer (128 = silence) normalized to 0..1. */
export function rmsLevel(data: ArrayLike<number>): number {
  if (data.length === 0) return 0
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128
    sum += v * v
  }
  // Speech rarely exceeds ~0.3 RMS; expand so normal voice spans the range.
  return Math.min(1, Math.sqrt(sum / data.length) * 3)
}

/**
 * One-pole smoothing with separate attack/release coefficients.
 * Fast attack follows voice onsets; slow release gives the glow a soft decay.
 */
export function smoothLevel(prev: number, target: number): number {
  const clamped = Math.min(1, Math.max(0, target))
  const k = clamped > prev ? 0.5 : 0.08
  return prev + (clamped - prev) * k
}

/** CSS glow for a pulse level 0..1 over a base border color. */
export function pulseGlow(level: number, color = '255, 219, 0'): string {
  const l = Math.min(1, Math.max(0, level))
  const spread = Math.round(4 + l * 26)
  const alpha = (0.12 + l * 0.75).toFixed(2)
  const brightness = (1 + l * 0.5).toFixed(2)
  return `box-shadow: 0 0 ${spread}px rgba(${color}, ${alpha}); filter: brightness(${brightness});`
}

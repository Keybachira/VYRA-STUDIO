import { describe, expect, it } from 'vitest'
import { pulseGlow, rmsLevel, smoothLevel } from './audio-level'

function sine(amplitude: number, n = 512): Uint8Array {
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    out[i] = Math.round(128 + amplitude * Math.sin((i / n) * Math.PI * 4))
  }
  return out
}

describe('rmsLevel', () => {
  it('returns 0 for silence and empty buffers', () => {
    expect(rmsLevel(new Uint8Array(512).fill(128))).toBe(0)
    expect(rmsLevel(new Uint8Array(0))).toBe(0)
  })

  it('scales with amplitude and clamps to 1', () => {
    const quiet = rmsLevel(sine(10))
    const loud = rmsLevel(sine(100))
    expect(quiet).toBeGreaterThan(0)
    expect(loud).toBeGreaterThan(quiet)
    expect(rmsLevel(sine(127))).toBeLessThanOrEqual(1)
  })
})

describe('smoothLevel', () => {
  it('attacks fast and releases slow', () => {
    const attack = smoothLevel(0, 1)
    const release = smoothLevel(1, 0)
    expect(attack).toBeGreaterThan(0.4)
    expect(release).toBeGreaterThan(0.9)
  })

  it('clamps out-of-range targets', () => {
    expect(smoothLevel(0.5, 42)).toBeLessThanOrEqual(1)
    expect(smoothLevel(0.5, -42)).toBeGreaterThanOrEqual(0)
  })
})

describe('pulseGlow', () => {
  it('grows spread and alpha with level', () => {
    const low = pulseGlow(0)
    const high = pulseGlow(1)
    expect(high).toContain('30px')
    expect(low).toContain('4px')
    expect(high).not.toBe(low)
  })
})

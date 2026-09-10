import { describe, expect, it } from 'vitest'
import { GRADIENTS, getGradient } from './colors'

describe('getGradient', () => {
  it('resolves palette keys to CSS values', () => {
    expect(getGradient('gold')).toBe(GRADIENTS.gold)
    expect(getGradient('blue')).toBe(GRADIENTS.blue)
  })

  it('passes raw CSS through untouched', () => {
    const raw = 'linear-gradient(45deg, #111111, #222222)'
    expect(getGradient(raw)).toBe(raw)
  })

  it('returns transparent for none', () => {
    expect(getGradient('none')).toBe('transparent')
  })

  it('builds a conic gradient for animated linear gradients', () => {
    const animated = getGradient('gold', true)
    expect(animated).toContain('conic-gradient(from var(--spin-angle, 0deg)')
    expect(animated).toContain('#FFDB00')
  })

  it('does not animate custom two-stop gradients with identical ends', () => {
    const raw = 'linear-gradient(45deg, #AAAAAA 0%, #AAAAAA 100%)'
    const animated = getGradient(raw, true)
    expect(animated).toContain('conic-gradient')
  })
})

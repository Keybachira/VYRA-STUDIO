/**
 * VYRA Studio — border gradient palette.
 * Keeps the same `getGradient` contract the camera renderer consumes
 * (including animated conic-gradient support), with a VYRA-curated palette.
 */

export const GRADIENTS = {
  none: 'transparent',
  gold: 'linear-gradient(45deg, #FFDB00 0%, #E8B900 100%)',
  blue: 'linear-gradient(45deg, #3E6FE0 0%, #1E3799 100%)',
  silver: 'linear-gradient(45deg, #FFFFFF 0%, #8A9099 100%)',
  ember: 'linear-gradient(45deg, #FF6B4A 0%, #C22E1D 100%)',
  violet: 'linear-gradient(45deg, #9B6BFF 0%, #4A1FB8 100%)',
  mint: 'linear-gradient(45deg, #4AE3A0 0%, #128C7E 100%)'
} as const

export type GradientKey = keyof typeof GRADIENTS

export function getGradient(key: string, isAnimated = false): string {
  let val = key
  if (key in GRADIENTS) {
    val = GRADIENTS[key as GradientKey]
  }

  if (isAnimated && val.startsWith('linear-gradient')) {
    const match = val.match(/^linear-gradient\([^,]+,\s*(.*)\)$/)
    if (match && match[1]) {
      const colors = match[1].match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/gi)
      if (colors && colors.length > 0) {
        let finalColors = [...colors]
        if (finalColors[0].toLowerCase() !== finalColors[finalColors.length - 1].toLowerCase()) {
          finalColors = [...finalColors, ...finalColors.slice(0, -1).reverse()]
        }
        return `conic-gradient(from var(--spin-angle, 0deg), ${finalColors.join(', ')})`
      }
    }
  }

  return val
}

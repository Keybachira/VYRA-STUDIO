/**
 * VYRA Studio — brand asset generator.
 * Renders the vector logo system into every raster asset the app needs:
 *   build/icon.png            512px app icon
 *   build/icon.ico            multi-size Windows icon
 *   resources/icon.png        256px (linux window icon / generic)
 *   resources/tray.png        16px tray
 *   resources/tray@2x.png     32px tray (retina)
 *   resources/tray-rec.png    16px tray, recording state
 *   resources/tray-rec@2x.png 32px tray, recording state
 *
 * Usage: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const brandDir = path.join(root, 'brand')
const buildDir = path.join(root, 'build')
const resDir = path.join(root, 'resources')

const logoSvg = fs.readFileSync(path.join(brandDir, 'logo.svg'), 'utf8')
const logoMarkSvg = fs.readFileSync(path.join(brandDir, 'logo-mark.svg'), 'utf8')

const renderPng = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()

const writePng = async (svg, size, outPath) => {
  const png = await renderPng(svg, size)
  fs.writeFileSync(outPath, png)
  console.log(`  wrote ${path.relative(root, outPath)} (${size}x${size})`)
}

// Recording state: red dot overlay on the tray mark
const recBadgeSvg = (size) => {
  const dot = Math.round(size * 0.42)
  const pad = Math.round(size * 0.06)
  return logoMarkSvg.replace(
    '</svg>',
    `<circle cx="${size - dot / 2 - pad}" cy="${size - dot / 2 - pad}" r="${dot / 2}" fill="#FF453A" stroke="#0A0B0D" stroke-width="${Math.max(1, Math.round(size * 0.03))}"/></svg>`
  )
}

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

// Minimal ICO container: PNG-embedded entries (valid on all modern Windows)
function buildIco(pngBuffers) {
  const count = pngBuffers.length
  const headerSize = 6 + count * 16
  const totalSize = headerSize + pngBuffers.reduce((sum, b) => sum + b.length, 0)
  const ico = Buffer.alloc(totalSize)
  ico.writeUInt16LE(0, 0)
  ico.writeUInt16LE(1, 2)
  ico.writeUInt16LE(count, 4)
  let offset = headerSize
  pngBuffers.forEach((png, i) => {
    const size = ICO_SIZES[i]
    const entry = 6 + i * 16
    ico.writeUInt8(size === 256 ? 0 : size, entry)
    ico.writeUInt8(size === 256 ? 0 : size, entry + 1)
    ico.writeUInt8(0, entry + 2)
    ico.writeUInt8(0, entry + 3)
    ico.writeUInt16LE(1, entry + 4)
    ico.writeUInt16LE(32, entry + 6)
    ico.writeUInt32LE(png.length, entry + 8)
    ico.writeUInt32LE(offset, entry + 12)
    png.copy(ico, offset)
    offset += png.length
  })
  return ico
}

async function main() {
  fs.mkdirSync(buildDir, { recursive: true })
  fs.mkdirSync(resDir, { recursive: true })

  console.log('VYRA Studio — generating brand assets...')
  await writePng(logoSvg, 512, path.join(buildDir, 'icon.png'))
  await writePng(logoSvg, 256, path.join(resDir, 'icon.png'))

  const icoPngs = await Promise.all(ICO_SIZES.map((s) => renderPng(logoSvg, s)))
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), buildIco(icoPngs))
  console.log('  wrote build/icon.ico (multi-size)')

  await writePng(logoMarkSvg, 16, path.join(resDir, 'tray.png'))
  await writePng(logoMarkSvg, 32, path.join(resDir, 'tray@2x.png'))
  await writePng(recBadgeSvg(16), 16, path.join(resDir, 'tray-rec.png'))
  await writePng(recBadgeSvg(32), 32, path.join(resDir, 'tray-rec@2x.png'))

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

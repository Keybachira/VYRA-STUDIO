/**
 * VYRA Studio — camera engine (main process).
 * Owns camera power state and camera window geometry. The renderer renders
 * video; all OS-level decisions (window size/position/visibility) live here.
 */

import { BrowserWindow, screen } from 'electron'
import { cameraRuntime, saveSettings, settings } from '../settings/settings.service'
import { dimensionsForShape, SIZES } from '../../../shared/presets'
import type { SnapPosition } from '../../../shared/types'

let positionSaveTimer: ReturnType<typeof setTimeout> | null = null

export function getIsCameraOn(): boolean {
  return cameraRuntime.isCameraOn
}

export function setIsCameraOn(value: boolean): void {
  cameraRuntime.isCameraOn = value
}

export function isCameraWindow(win: BrowserWindow): boolean {
  return win.webContents.getURL().includes('index.html') && !win.webContents.getURL().includes('#/')
}

export function cameraWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows().filter(
    (win) =>
      !win.webContents.getURL().includes('#/settings') &&
      !win.webContents.getURL().includes('#/palette') &&
      !win.webContents.getURL().includes('#/worker') &&
      !win.webContents.getURL().includes('#/countdown')
  )
}

export function getCameraDimensions(): { width: number; height: number } {
  const shape = settings.camera.shape
  const size = settings.camera.size

  const displays = screen.getAllDisplays()
  const display =
    displays.find((d) => d.id.toString() === settings.camera.cameraScreenId) ??
    screen.getPrimaryDisplay()
  const workArea = display.workAreaSize
  const maxW = Math.max(160, workArea.width * 0.92)
  const maxH = Math.max(160, workArea.height * 0.88)
  const clamp = (w: number, h: number): { w: number; h: number } => {
    if (w <= maxW && h <= maxH) return { w, h }
    const scale = Math.min(maxW / w, maxH / h)
    return { w: Math.round(w * scale), h: Math.round(h * scale) }
  }

  const borderWidth = settings.camera.border.width
  const hasBorder = size !== 'fullscreen' && settings.camera.border.gradient !== 'none'

  if (size === 'fullscreen') {
    return { width: display.workArea.width, height: display.workArea.height }
  }
  if (size === 'sidebar') {
    const pct = settings.camera.sidebarWidthPercentage
    const w = Math.round(workArea.width * (pct / 100))
    const h = workArea.height
    const c = clamp(w, h)
    return { width: c.w, height: c.h }
  }

  const base = SIZES[size] ?? SIZES.sm
  const { width: w, height: h } = dimensionsForShape(base, shape)
  const inner = clamp(w, h)

  if (hasBorder) {
    const totalW = inner.w + borderWidth * 2
    const totalH = inner.h + borderWidth * 2
    const c = clamp(totalW, totalH)
    if (c.w !== totalW || c.h !== totalH) {
      const inner2 = clamp(totalW - borderWidth * 2, totalH - borderWidth * 2)
      return {
        width: Math.max(120, inner2.w) + borderWidth * 2,
        height: Math.max(120, inner2.h) + borderWidth * 2
      }
    }
    return { width: totalW, height: totalH }
  }

  return { width: inner.w, height: inner.h }
}

/** Compute screen coordinates for a snap position on the target display. */
export function snapToPosition(pos: SnapPosition): { x: number; y: number } {
  const displays = screen.getAllDisplays()
  const display =
    displays.find((d) => d.id.toString() === settings.camera.cameraScreenId) ??
    screen.getPrimaryDisplay()
  const { width: w, height: h } = getCameraDimensions()
  const wa = display.workArea
  const margin = 12

  const xMap: Record<SnapPosition, number> = {
    'top-left': wa.x + margin,
    'top-center': wa.x + (wa.width - w) / 2,
    'top-right': wa.x + wa.width - w - margin,
    'center-left': wa.x + margin,
    center: wa.x + (wa.width - w) / 2,
    'center-right': wa.x + wa.width - w - margin,
    'bottom-left': wa.x + margin,
    'bottom-center': wa.x + (wa.width - w) / 2,
    'bottom-right': wa.x + wa.width - w - margin
  }
  const yMap: Record<SnapPosition, number> = {
    'top-left': wa.y + margin,
    'top-center': wa.y + margin,
    'top-right': wa.y + margin,
    'center-left': wa.y + (wa.height - h) / 2,
    center: wa.y + (wa.height - h) / 2,
    'center-right': wa.y + (wa.height - h) / 2,
    'bottom-left': wa.y + wa.height - h - margin,
    'bottom-center': wa.y + wa.height - h - margin,
    'bottom-right': wa.y + wa.height - h - margin
  }
  return { x: Math.round(xMap[pos]), y: Math.round(yMap[pos]) }
}

/** Linux-only: real window move/resize (other platforms use the overlay DOM approach). */
export function moveCameraWindow(x: number, y: number): void {
  if (process.platform !== 'linux') return
  cameraWindows().forEach((win) => {
    if (!win.isDestroyed()) win.setPosition(Math.round(x), Math.round(y))
  })
}

export function resizeCameraWindow(width: number, height: number, x?: number, y?: number): void {
  if (process.platform !== 'linux') return
  cameraWindows().forEach((win) => {
    if (win.isDestroyed()) return
    const [curX, curY] = win.getPosition()
    win.setBounds({
      x: x ?? curX,
      y: y ?? curY,
      width: Math.round(width),
      height: Math.round(height)
    })
  })
}

export function applyCameraSizeToWindow(): void {
  if (process.platform !== 'linux') return
  const dims = getCameraDimensions()
  resizeCameraWindow(dims.width, dims.height)
}

export function moveCameraToScreen(screenId: string): void {
  const displays = screen.getAllDisplays()
  const display = displays.find((d) => d.id.toString() === screenId) ?? screen.getPrimaryDisplay()
  settings.camera.cameraScreenId = display.id.toString()
  const { bounds } = display

  cameraWindows().forEach((win) => {
    if (win.isDestroyed()) return
    if (process.platform === 'linux') {
      const dims = getCameraDimensions()
      win.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: dims.width,
        height: dims.height
      })
    } else {
      win.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      })
    }
    win.webContents.send('screen-changed', {
      width: bounds.width,
      height: bounds.height
    })
  })
}

export function rememberCameraPosition(x: number, y: number): void {
  settings.camera.x = x
  settings.camera.y = y
  if (positionSaveTimer) clearTimeout(positionSaveTimer)
  positionSaveTimer = setTimeout(() => {
    positionSaveTimer = null
    saveSettings()
  }, 300)
}

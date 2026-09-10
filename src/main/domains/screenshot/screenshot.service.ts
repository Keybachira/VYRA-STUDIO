/**
 * VYRA Studio — screenshot service (main process).
 * Captures the target display via desktopCapturer and writes a PNG to the
 * configured folder. The camera bubble compositing (picture-in-picture style)
 * is requested from the camera renderer, which knows its own geometry.
 */

import { app, desktopCapturer, ipcMain, screen } from 'electron'
import fs from 'fs'
import path from 'path'
import { settings, saveSettings } from '../settings/settings.service'

export function getScreenshotFolder(): string {
  const fallback = app.getPath('pictures')
  try {
    const configured =
      typeof settings.screenshot.folder === 'string' ? settings.screenshot.folder : ''
    if (configured) {
      fs.mkdirSync(configured, { recursive: true })
      fs.accessSync(configured, fs.constants.W_OK)
      return configured
    }
  } catch (err) {
    console.warn(
      `Screenshot folder "${String(settings.screenshot.folder)}" is unavailable, falling back to "${fallback}":`,
      err instanceof Error ? err.message : err
    )
  }
  fs.mkdirSync(fallback, { recursive: true })
  return fallback
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

export async function captureScreen(displayId?: string): Promise<string | null> {
  const displays = screen.getAllDisplays()
  const display =
    displays.find((d) => d.id.toString() === (displayId ?? settings.camera.recordingScreenId)) ??
    screen.getPrimaryDisplay()
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: display.size.width, height: display.size.height }
  })
  const source = sources.find((s) => s.display_id === String(display.id)) ?? sources[0]
  if (!source) return null
  const image = source.thumbnail.toPNG()
  const folder = getScreenshotFolder()
  const filePath = path.join(folder, `VYRA-${timestamp()}.png`)
  fs.writeFileSync(filePath, image)
  return filePath
}

export async function captureCameraFrame(
  dataUrl: string,
  includeCamera: boolean
): Promise<string | null> {
  if (!includeCamera) return null
  if (!dataUrl.startsWith('data:image/png;base64,')) return null
  const base64 = dataUrl.slice('data:image/png;base64,'.length)
  const folder = getScreenshotFolder()
  const filePath = path.join(folder, `VYRA-cam-${timestamp()}.png`)
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))
  return filePath
}

export function setupScreenshotIPC(): void {
  ipcMain.handle('screenshot-save-camera-frame', async (_, dataUrl: string) => {
    try {
      const filePath = await captureCameraFrame(dataUrl, true)
      return { success: true, filePath }
    } catch (err) {
      console.error('[vyra] camera frame capture failed:', err)
      return { success: false, error: err instanceof Error ? err.message : 'unknown' }
    }
  })

  ipcMain.handle('screenshot-take', async () => {
    try {
      const filePath = await captureScreen()
      return { success: !!filePath, filePath }
    } catch (err) {
      console.error('[vyra] screenshot failed:', err)
      return { success: false, error: err instanceof Error ? err.message : 'unknown' }
    }
  })

  ipcMain.handle('choose-screenshot-folder', async () => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({
      title: 'Screenshot folder',
      defaultPath: getScreenshotFolder(),
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    settings.screenshot.folder = result.filePaths[0]
    saveSettings()
    return result.filePaths[0]
  })

  ipcMain.handle('open-path', async (_, target: string) => {
    const { shell } = await import('electron')
    if (target === 'recordings') {
      const { getRecordingTargetFolder } = await import('../recording/recording.service')
      shell.openPath(getRecordingTargetFolder())
      return
    }
    if (target === 'screenshots') {
      shell.openPath(getScreenshotFolder())
      return
    }
    if (target === 'settings') {
      shell.openPath(app.getPath('userData'))
    }
  })
}

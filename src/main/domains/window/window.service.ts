/**
 * VYRA Studio — window management (main process).
 * Camera overlay (transparent, always-on-top), Settings, Command Palette,
 * and the hidden Recording Worker window.
 */

import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import winIcon from '../../../../build/icon.ico?asset'
import { t } from '../../../shared/i18n'
import { getIsCameraOn, rememberCameraPosition } from '../camera/camera.service'
import { settings } from '../settings/settings.service'

let _settingsWindow: BrowserWindow | null = null
let _paletteWindow: BrowserWindow | null = null
let _recordingWorker: BrowserWindow | null = null

export function getSettingsWindow(): BrowserWindow | null {
  return _settingsWindow
}

export function getPaletteWindow(): BrowserWindow | null {
  return _paletteWindow
}

export function getRecordingWorker(): BrowserWindow | null {
  return _recordingWorker
}

type WindowCallbacks = {
  onFocus: (win: BrowserWindow) => void
  onBlur: () => void
}

function resolveAssetUrl(hash: string): { url: string; file: boolean } {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    return { url: process.env['ELECTRON_RENDERER_URL'] + hash, file: false }
  }
  return { url: join(__dirname, '../renderer/index.html'), file: true }
}

export function createSettingsWindow(): void {
  if (_settingsWindow && !_settingsWindow.isDestroyed()) {
    _settingsWindow.focus()
    return
  }
  const isMac = process.platform === 'darwin'
  const workArea = screen.getPrimaryDisplay().workAreaSize
  const initWidth = Math.min(640, Math.max(360, workArea.width - 40))
  const initHeight = Math.min(720, Math.max(500, workArea.height - 80))
  _settingsWindow = new BrowserWindow({
    width: initWidth,
    height: initHeight,
    minWidth: 360,
    minHeight: 500,
    title: t('settings.title', settings.camera.language),
    transparent: isMac,
    backgroundColor: isMac ? '#00000000' : '#0A0B0D',
    resizable: true,
    maximizable: true,
    ...(isMac
      ? { vibrancy: 'under-window', visualEffectState: 'active', titleBarStyle: 'hiddenInset' }
      : {
          icon: winIcon,
          titleBarStyle: 'hidden',
          titleBarOverlay: { color: '#0A0B0D', symbolColor: '#FFFFFF', height: 36 }
        }),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      autoplayPolicy: 'no-user-gesture-required',
      devTools: false
    }
  })
  const target = resolveAssetUrl('#/settings')
  if (target.file) {
    _settingsWindow.loadFile(target.url, { hash: '/settings' })
  } else {
    _settingsWindow.loadURL(target.url)
  }
  _settingsWindow.on('closed', () => {
    _settingsWindow = null
  })
}

export function createPaletteWindow(): void {
  if (_paletteWindow && !_paletteWindow.isDestroyed()) {
    _paletteWindow.focus()
    return
  }
  const display = screen.getPrimaryDisplay()
  const width = 560
  const height = 420
  _paletteWindow = new BrowserWindow({
    width,
    height,
    x: Math.round(display.workArea.x + (display.workArea.width - width) / 2),
    y: Math.round(display.workArea.y + display.workArea.height * 0.22),
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: false
    }
  })
  _paletteWindow.setAlwaysOnTop(true, 'screen-saver')
  const target = resolveAssetUrl('#/palette')
  if (target.file) {
    _paletteWindow.loadFile(target.url, { hash: '/palette' })
  } else {
    _paletteWindow.loadURL(target.url)
  }
  _paletteWindow.on('closed', () => {
    _paletteWindow = null
  })
  _paletteWindow.once('ready-to-show', () => {
    _paletteWindow?.show()
    _paletteWindow?.focus()
  })
}

export function togglePaletteWindow(): void {
  if (_paletteWindow && !_paletteWindow.isDestroyed()) {
    if (_paletteWindow.isVisible()) {
      _paletteWindow.hide()
      return
    }
    _paletteWindow.show()
    _paletteWindow.focus()
    return
  }
  createPaletteWindow()
}

export function createRecordingWorker(): void {
  if (_recordingWorker && !_recordingWorker.isDestroyed()) return
  _recordingWorker = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      autoplayPolicy: 'no-user-gesture-required',
      backgroundThrottling: false,
      devTools: false
    }
  })
  const target = resolveAssetUrl('#/worker')
  if (target.file) {
    _recordingWorker.loadFile(target.url, { hash: '/worker' })
  } else {
    _recordingWorker.loadURL(target.url)
  }
  _recordingWorker.on('closed', () => {
    _recordingWorker = null
  })
}

function buildCameraWindow(): BrowserWindow {
  const displays = screen.getAllDisplays()
  const selected =
    displays.find((d) => d.id.toString() === settings.camera.cameraScreenId) ??
    screen.getPrimaryDisplay()
  const { bounds } = selected

  const isLinux = process.platform === 'linux'
  const width = isLinux ? 300 : bounds.width
  const height = isLinux ? 300 : bounds.height
  const startX = isLinux ? (settings.camera.x ?? bounds.x) : bounds.x
  const startY = isLinux ? (settings.camera.y ?? bounds.y) : bounds.y

  const mainWindow = new BrowserWindow({
    width,
    height,
    x: startX,
    y: startY,
    title: 'VYRA Camera',
    useContentSize: true,
    show: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    roundedCorners: false,
    ...(process.platform === 'win32' ? { icon: winIcon } : {}),
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      autoplayPolicy: 'no-user-gesture-required',
      backgroundThrottling: false,
      devTools: false
    }
  })
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  if (!isLinux) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true })
  }
  mainWindow.on('ready-to-show', () => {
    if (getIsCameraOn()) mainWindow.show()
  })
  mainWindow.on('focus', () => {
    if (process.platform === 'darwin') app?.focus?.({ steal: true })
    callbacksRef.onFocus(mainWindow)
  })
  mainWindow.on('blur', () => {
    callbacksRef.onBlur()
  })
  mainWindow.on('moved', () => {
    const [x, y] = mainWindow.getPosition()
    rememberCameraPosition(x, y)
  })
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  const target = resolveAssetUrl('')
  if (target.file) {
    mainWindow.loadFile(target.url)
  } else {
    mainWindow.loadURL(target.url)
  }
  return mainWindow
}

const callbacksRef: WindowCallbacks = {
  onFocus: (): void => undefined,
  onBlur: (): void => undefined
}

export function createWindow(callbacks: WindowCallbacks): void {
  callbacksRef.onFocus = callbacks.onFocus
  callbacksRef.onBlur = callbacks.onBlur
  buildCameraWindow()
}

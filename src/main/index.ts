/**
 * VYRA Studio — main process entry.
 */

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import {
  app,
  BrowserWindow,
  desktopCapturer,
  dialog,
  ipcMain,
  screen,
  session,
  shell,
  systemPreferences
} from 'electron'
import { autoUpdater } from 'electron-updater'
import { APP_ID, APP_NAME, APP_REPO } from '../shared/brand'
import { t } from '../shared/i18n'
import type { ShortcutAction } from '../shared/types'
import {
  getCameraDimensions,
  getIsCameraOn,
  moveCameraToScreen,
  moveCameraWindow,
  rememberCameraPosition,
  resizeCameraWindow,
  setIsCameraOn,
  snapToPosition
} from './domains/camera/camera.service'
import { showCountdown } from './domains/recording/countdown.service'
import { setOnRecordingAborted, setupRecordingIPC } from './domains/recording/recording.service'
import {
  applyPresetById,
  createPreset,
  deletePreset,
  duplicatePreset,
  listPresets,
  updatePreset
} from './domains/presets/preset.service'
import {
  applySceneById,
  createScene,
  deleteScene,
  syncSceneForPreset
} from './domains/scenes/scene.service'
import { loadSettings, saveSettings, settings } from './domains/settings/settings.service'
import {
  reRegisterGlobalShortcuts,
  registerGlobalShortcuts,
  setShortcutHandler
} from './domains/shortcuts/shortcuts.service'
import { initTray, setTrayActions, updateTray } from './domains/tray/tray.service'
import {
  createRecordingWorker,
  createSettingsWindow,
  createWindow,
  getPaletteWindow,
  getRecordingWorker,
  getSettingsWindow,
  togglePaletteWindow
} from './domains/window/window.service'
import { setupScreenshotIPC } from './domains/screenshot/screenshot.service'
import { resetSection } from './domains/settings/settings.service'
import type { SnapPosition } from '../shared/types'

const windowCallbacks = {
  onFocus: (): void => undefined,
  onBlur: (): void => undefined
}

// ── Command bus ─────────────────────────────────────────────────────────────
// One entry point for every user-facing action (tray, palette, shortcuts, CLI).
// Omarchy daemon/CLI (Phase 5) will call these same functions.

async function startRecordingFlow(): Promise<void> {
  if (settings.camera.isRecording) {
    const worker = getRecordingWorker()
    worker?.webContents.send('stop-recording')
    return
  }
  await showCountdown(settings.camera.recordingScreenId || undefined)
  const worker = getRecordingWorker()
  if (worker && worker.webContents) {
    worker.webContents.send('start-recording', {
      resolution: settings.recording.resolution,
      fps: settings.recording.fps,
      encoder: settings.recording.encoder,
      systemAudioVolume: settings.recording.systemAudioVolume,
      microphoneAudioVolume: settings.recording.microphoneAudioVolume,
      selectedMicrophoneId: settings.recording.selectedMicrophoneId
    })
  }
}

function takeScreenshot(): void {
  ipcMain.emit('vyra-screenshot-request')
}

function toggleCamera(): void {
  const newState = !getIsCameraOn()
  setIsCameraOn(newState)
  const sw = getSettingsWindow()
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win === sw || win === getPaletteWindow() || win === getRecordingWorker()) return
    if (newState) {
      win.show()
    } else {
      setTimeout(() => {
        if (!getIsCameraOn()) win.hide()
      }, 300)
    }
    win.webContents.send('power-state', newState)
  })
  updateTray()
}

function showCamera(): void {
  if (!getIsCameraOn()) toggleCamera()
}

function hideCamera(): void {
  if (getIsCameraOn()) toggleCamera()
}

function toggleMicMute(): void {
  settings.audio.micMuted = !settings.audio.micMuted
  saveSettings()
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('sync-recording', { micMuted: settings.audio.micMuted })
  })
  updateTray()
}

function applyPreset(id: string): void {
  if (applyPresetById(id)) {
    syncSceneForPreset(id)
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('sync-camera', { ...settings.camera })
      win.webContents.send('set-camera-position', snapPositionFromPreset())
    })
    updateTray()
  }
}

function applyScene(id: string): void {
  if (applySceneById(id)) {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('sync-camera', { ...settings.camera })
      win.webContents.send('set-camera-position', snapPositionFromPreset())
    })
    updateTray()
  }
}

function snapPositionFromPreset(): SnapPosition {
  const preset = listPresets().find((p) => p.id === settings.activePresetId)
  return (preset?.position ?? 'bottom-right') as SnapPosition
}

function handleAction(action: ShortcutAction): void {
  switch (action) {
    case 'toggleCamera':
      toggleCamera()
      break
    case 'commandPalette':
      togglePaletteWindow()
      break
    case 'startRecording':
      void startRecordingFlow()
      break
    case 'screenshot':
      takeScreenshot()
      break
    case 'micMute':
      toggleMicMute()
      break
    case 'mirror':
      settings.camera.isMirrored = !settings.camera.isMirrored
      saveSettings()
      broadcastCamera()
      break
    case 'alwaysOnTop':
      settings.camera.alwaysOnTop = !settings.camera.alwaysOnTop
      saveSettings()
      BrowserWindow.getAllWindows().forEach((win) => {
        win.setAlwaysOnTop(settings.camera.alwaysOnTop, 'screen-saver')
      })
      broadcastCamera()
      break
    case 'sizeXs':
    case 'sizeSm':
    case 'sizeMd':
    case 'sizeLg':
    case 'sizeFullscreen': {
      const map: Record<string, string> = {
        sizeXs: 'xs',
        sizeSm: 'sm',
        sizeMd: 'md',
        sizeLg: 'lg',
        sizeFullscreen: 'fullscreen'
      }
      settings.camera.size = map[action] as typeof settings.camera.size
      saveSettings()
      broadcastCamera()
      applyCameraSizeToWindows()
      break
    }
    case 'preset1':
    case 'preset2':
    case 'preset3': {
      const idx = action === 'preset1' ? 0 : action === 'preset2' ? 1 : 2
      const preset = listPresets()[idx]
      if (preset) applyPreset(preset.id)
      break
    }
    case 'scene1':
    case 'scene2':
    case 'scene3': {
      const idx = action === 'scene1' ? 0 : action === 'scene2' ? 1 : 2
      const scene = settings.scenes[idx]
      if (scene) applyScene(scene.id)
      break
    }
    case 'topLeft':
    case 'topRight':
    case 'leftMiddle':
    case 'center':
    case 'rightMiddle':
    case 'bottomLeft':
    case 'bottomRight': {
      const posMap: Record<string, SnapPosition> = {
        topLeft: 'top-left',
        topRight: 'top-right',
        leftMiddle: 'center-left',
        center: 'center',
        rightMiddle: 'center-right',
        bottomLeft: 'bottom-left',
        bottomRight: 'bottom-right'
      }
      moveCameraToSnap(posMap[action])
      break
    }
  }
}

function moveCameraToSnap(pos: SnapPosition): void {
  const { x, y } = snapToPosition(pos)
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('set-camera-position', pos)
  })
  rememberCameraPosition(x, y)
  if (process.platform === 'linux') {
    moveCameraWindow(x, y)
  }
}

function broadcastCamera(): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('sync-camera', { ...settings.camera })
  })
}

function applyCameraSizeToWindows(): void {
  const dims = getCameraDimensions()
  if (process.platform === 'linux') {
    resizeCameraWindow(dims.width, dims.height)
  }
  broadcastCamera()
}

// ── App lifecycle ───────────────────────────────────────────────────────────

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('disable-color-correct-rendering')
app.commandLine.appendSwitch('disable-renderer-backgrounding')

function handleShortcutAction(action: ShortcutAction): void {
  handleAction(action)
}

app.whenReady().then(() => {
  const loginSettings = app.getLoginItemSettings()
  setIsCameraOn(!loginSettings.wasOpenedAtLogin)
  loadSettings()
  settings.camera.isRecording = false

  if (process.platform === 'darwin') {
    app.dock?.hide()
  }

  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(true))
  session.defaultSession.setPermissionCheckHandler(() => true)
  session.defaultSession.setDisplayMediaRequestHandler(
    (_request, callback) => {
      desktopCapturer
        .getSources({ types: ['screen'] })
        .then((sources) => {
          if (!sources.length) {
            callback({})
            return
          }
          const primaryDisplay = screen.getPrimaryDisplay()
          let targetSource = sources.find(
            (s) => s.display_id === String(settings.camera.recordingScreenId)
          )
          if (!targetSource) {
            targetSource =
              sources.find((s) => s.display_id === String(primaryDisplay.id)) ?? sources[0]
          }
          if (process.platform === 'darwin' || process.platform === 'win32') {
            callback({ video: targetSource, audio: 'loopback' })
          } else {
            callback({ video: targetSource })
          }
        })
        .catch((err) => {
          console.error('Error getting sources in setDisplayMediaRequestHandler:', err)
          callback({})
        })
    },
    { useSystemPicker: false }
  )

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const scriptSrc = is.dev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self'"
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [scriptSrc]
      }
    })
  })

  electronApp.setAppUserModelId(APP_ID)
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  app.on('web-contents-created', (_, webContents) => {
    webContents.on('before-input-event', (event, input) => {
      if (
        input.key === 'F12' ||
        (input.control && input.shift && input.key.toLowerCase() === 'i') ||
        (input.meta && input.shift && input.key.toLowerCase() === 'i')
      ) {
        event.preventDefault()
      }
    })
  })

  // ── Services ──────────────────────────────────────────────────────────────
  initTray()
  setTrayActions({
    toggleCamera,
    showCamera,
    hideCamera,
    toggleRecording: (): void => void startRecordingFlow(),
    screenshot: takeScreenshot,
    toggleMicMute,
    applyPreset,
    applyScene,
    openPalette: togglePaletteWindow
  })
  setShortcutHandler(handleShortcutAction)
  updateTray()

  registerGlobalShortcuts()
  setOnRecordingAborted(() => {
    settings.camera.isRecording = false
    saveSettings()
    updateTray()
  })
  setupRecordingIPC()
  setupScreenshotIPC()

  // Screenshot request bus: main → camera renderer captures camera frame; main captures screen.
  ipcMain.on('vyra-screenshot-request', () => {
    const camWin = BrowserWindow.getAllWindows().find(
      (w) => w !== getSettingsWindow() && w !== getPaletteWindow() && w !== getRecordingWorker()
    )
    if (settings.screenshot.includeCamera && camWin && getIsCameraOn()) {
      camWin.webContents.send('vyra-capture-camera-frame')
    }
    void import('./domains/screenshot/screenshot.service').then(async (mod) => {
      const filePath = await mod.captureScreen()
      if (!filePath) {
        console.warn('[vyra] screenshot capture returned no image')
      }
    })
  })

  // ── Typed IPC surface ─────────────────────────────────────────────────────
  ipcMain.handle('get-initial-state', () => ({
    ...settings,
    isCameraOn: getIsCameraOn()
  }))
  ipcMain.handle('get-shortcuts', () => settings.shortcuts)
  ipcMain.handle('get-presets', () => listPresets())
  ipcMain.handle('get-displays', () => {
    return screen.getAllDisplays().map((d) => ({
      id: d.id.toString(),
      label: d.label || `Display ${d.id}`,
      bounds: d.bounds
    }))
  })
  ipcMain.handle('get-screen-sources', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] })
    return sources.map((s) => ({ id: s.id, name: s.name, display_id: s.display_id }))
  })

  ipcMain.handle('check-media-permission', async (_, mediaType: 'camera' | 'microphone') => {
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus(mediaType)
      if (status === 'granted') return 'granted'
      const success = await systemPreferences.askForMediaAccess(mediaType)
      return success ? 'granted' : 'denied'
    }
    return 'granted'
  })

  ipcMain.handle('check-screen-permission', async () => {
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('screen')
      if (status !== 'granted') {
        try {
          await desktopCapturer.getSources({ types: ['screen'] })
        } catch {
          return systemPreferences.getMediaAccessStatus('screen')
        }
        return systemPreferences.getMediaAccessStatus('screen')
      }
      return status
    }
    return 'granted'
  })

  ipcMain.handle('open-system-settings', async (_, type: 'camera' | 'microphone' | 'screen') => {
    try {
      if (process.platform === 'darwin') {
        if (type === 'camera')
          shell.openExternal(
            'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera'
          )
        else if (type === 'microphone')
          shell.openExternal(
            'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone'
          )
        else if (type === 'screen')
          shell.openExternal(
            'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
          )
      } else if (process.platform === 'win32') {
        if (type === 'camera') shell.openExternal('ms-settings:privacy-webcam')
        else if (type === 'microphone') shell.openExternal('ms-settings:privacy-microphone')
      }
    } catch (err) {
      console.error('[vyra] failed to open system settings:', err)
    }
  })

  ipcMain.handle('choose-recording-folder', async () => {
    const result = await dialog.showOpenDialog(getSettingsWindow() as BrowserWindow, {
      title: t('settings.recording.folder', settings.camera.language),
      defaultPath: settings.recording.folder || app.getPath('videos'),
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    settings.recording.folder = result.filePaths[0]
    saveSettings()
    return result.filePaths[0]
  })

  // Camera mutations from renderer (settings page / camera window)
  ipcMain.on('update-camera', (_, patch: Record<string, unknown>) => {
    const allowed = new Set([
      'selectedDeviceId',
      'isMirrored',
      'shape',
      'size',
      'rounding',
      'alwaysOnTop',
      'opacity',
      'border',
      'effect',
      'language',
      'cameraScreenId',
      'recordingScreenId',
      'sidebarWidthPercentage',
      'sidebarPosition'
    ])
    for (const key of Object.keys(patch)) {
      if (allowed.has(key)) {
        ;(settings.camera as unknown as Record<string, unknown>)[key] = patch[key]
      }
    }
    saveSettings()
    broadcastCamera()
    updateTray()
    if (patch.cameraScreenId) moveCameraToScreen(patch.cameraScreenId as string)
    if (patch.size) applyCameraSizeToWindows()
  })

  ipcMain.on('update-recording', (_, patch: Record<string, unknown>) => {
    const allowed = new Set([
      'folder',
      'resolution',
      'fps',
      'encoder',
      'mode',
      'systemAudioVolume',
      'microphoneAudioVolume',
      'selectedMicrophoneId'
    ])
    for (const key of Object.keys(patch)) {
      if (allowed.has(key)) {
        ;(settings.recording as unknown as Record<string, unknown>)[key] = patch[key]
      }
    }
    saveSettings()
  })

  ipcMain.on('update-screenshot', (_, patch: Record<string, unknown>) => {
    const allowed = new Set(['folder', 'includeCamera'])
    for (const key of Object.keys(patch)) {
      if (allowed.has(key)) {
        ;(settings.screenshot as unknown as Record<string, unknown>)[key] = patch[key]
      }
    }
    saveSettings()
  })

  ipcMain.on('update-shortcut', (_, action: string, accelerator: string) => {
    if (action in settings.shortcuts) {
      settings.shortcuts[action as ShortcutAction] = accelerator
      saveSettings()
      reRegisterGlobalShortcuts()
      updateTray()
    }
  })

  ipcMain.on('reset-settings', (_, section: string) => {
    resetSection(section)
    broadcastCamera()
    updateTray()
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('settings-reset', settings)
    })
  })

  ipcMain.on('sync-camera-position', (_, x: number, y: number) => {
    rememberCameraPosition(x, y)
  })

  ipcMain.on('set-camera-position', (_, pos: string) => {
    moveCameraToSnap(pos as SnapPosition)
  })

  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    if (process.platform === 'linux') return
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (options) {
        win.setIgnoreMouseEvents(ignore, options)
      } else {
        win.setIgnoreMouseEvents(ignore)
      }
    }
  })

  ipcMain.on('move-camera-window', (_, x: number, y: number) => {
    moveCameraWindow(x, y)
    rememberCameraPosition(x, y)
  })

  ipcMain.on('resize-camera-window', (_, width: number, height: number, x?: number, y?: number) => {
    resizeCameraWindow(width, height, x, y)
  })

  ipcMain.on('open-palette', () => togglePaletteWindow())
  ipcMain.on('close-palette', () => getPaletteWindow()?.hide())
  ipcMain.on('palette-run-action', (_, action: string) => {
    getPaletteWindow()?.hide()
    handleAction(action as ShortcutAction)
  })
  ipcMain.on('palette-apply-preset', (_, id: string) => {
    getPaletteWindow()?.hide()
    applyPreset(id)
  })

  ipcMain.on('open-settings', () => createSettingsWindow())
  ipcMain.on('close-window', () => app.quit())

  ipcMain.on('recording-started', () => {
    settings.camera.isRecording = true
    saveSettings()
    updateTray()
  })
  ipcMain.on('recording-stopped', () => {
    settings.camera.isRecording = false
    saveSettings()
    updateTray()
  })
  ipcMain.on('recording-permission-denied', (_, payload) => {
    settings.camera.isRecording = false
    saveSettings()
    updateTray()
    BrowserWindow.getAllWindows().forEach((w) => {
      if (w !== getRecordingWorker()) {
        w.webContents.send('recording-permission-denied', payload)
      }
    })
  })

  // Presets CRUD from settings page
  ipcMain.handle('presets-create', (_, partial) => createPreset(partial))
  ipcMain.handle('presets-update', (_, id, patch) => updatePreset(id, patch))
  ipcMain.handle('presets-duplicate', (_, id) => duplicatePreset(id))
  ipcMain.handle('presets-delete', (_, id) => deletePreset(id))
  ipcMain.on('presets-apply', (_, id: string) => applyPreset(id))
  ipcMain.on('presets-capture', (_, name: string) => {
    const preset = createPreset({ name })
    applyPreset(preset.id)
  })

  // Scenes from settings page / tray / palette
  ipcMain.handle('scenes-create', (_, name: string) => createScene(name))
  ipcMain.handle('scenes-delete', (_, id: string) => deleteScene(id))
  ipcMain.on('scenes-apply', (_, id: string) => applyScene(id))

  // Devices reported by the camera renderer
  ipcMain.on('sync-devices', (_, devices) => {
    settings.camera.devices = Array.isArray(devices) ? devices : []
    updateTray()
  })

  // ── Windows ───────────────────────────────────────────────────────────────
  windowCallbacks.onFocus = (): void => registerGlobalShortcuts()
  windowCallbacks.onBlur = (): void => reRegisterGlobalShortcuts()
  createWindow(windowCallbacks)
  createRecordingWorker()

  // Auto-update (kept from original; silent, tray-notified)
  autoUpdater.on('update-downloaded', () => {
    updateTray()
  })
  if (app.isPackaged && (process.platform !== 'linux' || process.env.APPIMAGE)) {
    autoUpdater.checkForUpdates().catch((err: unknown) => {
      console.warn('Auto-update check failed:', err instanceof Error ? err.message : err)
    })
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

void APP_NAME
void APP_REPO

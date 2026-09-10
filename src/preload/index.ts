/**
 * VYRA Studio — preload bridge.
 * Exposes a minimal, typed API. No Node APIs leak into the renderer.
 */

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getInitialState: (): Promise<unknown> => ipcRenderer.invoke('get-initial-state'),
  getShortcuts: (): Promise<unknown> => ipcRenderer.invoke('get-shortcuts'),
  getPresets: (): Promise<unknown> => ipcRenderer.invoke('get-presets'),
  getDisplays: (): Promise<unknown> => ipcRenderer.invoke('get-displays'),
  getScreenSources: (): Promise<unknown> => ipcRenderer.invoke('get-screen-sources'),

  checkMediaPermission: (mediaType: 'camera' | 'microphone'): Promise<string> =>
    ipcRenderer.invoke('check-media-permission', mediaType),
  checkScreenPermission: (): Promise<string> => ipcRenderer.invoke('check-screen-permission'),
  openSystemSettings: (type: 'camera' | 'microphone' | 'screen'): Promise<void> =>
    ipcRenderer.invoke('open-system-settings', type),

  updateCamera: (patch: Record<string, unknown>): void => ipcRenderer.send('update-camera', patch),
  updateRecording: (patch: Record<string, unknown>): void =>
    ipcRenderer.send('update-recording', patch),
  updateScreenshot: (patch: Record<string, unknown>): void =>
    ipcRenderer.send('update-screenshot', patch),
  updateShortcut: (action: string, accelerator: string): void =>
    ipcRenderer.send('update-shortcut', action, accelerator),
  resetSettings: (section?: string): void => ipcRenderer.send('reset-settings', section),

  syncCameraPosition: (x: number, y: number): void =>
    ipcRenderer.send('sync-camera-position', x, y),
  setCameraPosition: (pos: string): void => ipcRenderer.send('set-camera-position', pos),
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }): void =>
    ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  moveCameraWindow: (x: number, y: number): void => ipcRenderer.send('move-camera-window', x, y),
  resizeCameraWindow: (width: number, height: number, x?: number, y?: number): void =>
    ipcRenderer.send('resize-camera-window', width, height, x, y),

  syncDevices: (devices: { deviceId: string; label: string }[]): void =>
    ipcRenderer.send('sync-devices', devices),

  chooseRecordingFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('choose-recording-folder'),
  chooseScreenshotFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('choose-screenshot-folder'),
  openPath: (target: 'recordings' | 'screenshots' | 'settings'): Promise<void> =>
    ipcRenderer.invoke('open-path', target),

  presetsCreate: (partial: unknown): Promise<unknown> =>
    ipcRenderer.invoke('presets-create', partial),
  presetsUpdate: (id: string, patch: unknown): Promise<boolean> =>
    ipcRenderer.invoke('presets-update', id, patch),
  presetsDuplicate: (id: string): Promise<unknown> => ipcRenderer.invoke('presets-duplicate', id),
  presetsDelete: (id: string): Promise<boolean> => ipcRenderer.invoke('presets-delete', id),
  presetsApply: (id: string): void => ipcRenderer.send('presets-apply', id),
  presetsCapture: (name: string): void => ipcRenderer.send('presets-capture', name),

  paletteRunAction: (action: string): void => ipcRenderer.send('palette-run-action', action),
  paletteApplyPreset: (id: string): void => ipcRenderer.send('palette-apply-preset', id),
  closePalette: (): void => ipcRenderer.send('close-palette'),

  recordingStart: (payload: unknown): Promise<boolean> =>
    ipcRenderer.invoke('recording-start', payload),
  recordingChunk: (chunk: ArrayBuffer): void => ipcRenderer.send('recording-chunk', chunk),
  recordingStop: (): Promise<unknown> => ipcRenderer.invoke('recording-stop'),
  recordingStarted: (): void => ipcRenderer.send('recording-started'),
  recordingStopped: (): void => ipcRenderer.send('recording-stopped'),
  recordingPermissionDenied: (payload: { screen: boolean; mic: boolean }): void =>
    ipcRenderer.send('recording-permission-denied', payload),

  screenshotTake: (): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('screenshot-take'),
  screenshotSaveCameraFrame: (
    dataUrl: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('screenshot-save-camera-frame', dataUrl),

  openSettings: (): void => ipcRenderer.send('open-settings'),
  quitApp: (): void => ipcRenderer.send('close-window'),

  on: (channel: string, listener: (...args: unknown[]) => void): (() => void) => {
    const wrapped = (_event: unknown, ...args: unknown[]): void => listener(...args)
    ipcRenderer.on(channel, wrapped)
    return (): void => {
      ipcRenderer.removeListener(channel, wrapped)
    }
  }
}

export type VyraApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('vyra', api)
  } catch (error) {
    console.error(error)
  }
} else {
  ;(window as unknown as Record<string, unknown>).electron = electronAPI
  ;(window as unknown as Record<string, unknown>).vyra = api
}

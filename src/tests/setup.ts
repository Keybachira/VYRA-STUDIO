/**
 * VYRA Studio — test setup.
 * The renderer talks exclusively to `window.vyra`; tests install a mock bridge.
 */

import { vi } from 'vitest'
import '@testing-library/jest-dom'

const listenerRegistry = new Map<string, Set<(...args: unknown[]) => void>>()

export const mockVyra = {
  getInitialState: vi.fn(async () => ({
    version: 2,
    camera: {
      selectedDeviceId: '',
      isMirrored: true,
      shape: 'circle',
      size: 'sm',
      rounding: 24,
      alwaysOnTop: true,
      opacity: 1,
      border: { gradient: 'none', width: 4, animated: false, pulse: false },
      effect: 'none',
      language: 'en',
      cameraScreenId: '',
      recordingScreenId: '',
      sidebarWidthPercentage: 35,
      sidebarPosition: 'right',
      devices: [],
      isRecording: false
    },
    recording: {
      folder: '',
      resolution: '1080p',
      fps: '60',
      encoder: 'libx264',
      mode: 'screen',
      systemAudioVolume: 50,
      microphoneAudioVolume: 100,
      selectedMicrophoneId: 'default'
    },
    screenshot: { folder: '', includeCamera: true },
    audio: { micMuted: false },
    shortcuts: {},
    presets: [],
    activePresetId: '',
    scenes: [],
    activeSceneId: '',
    isCameraOn: true
  })),
  getShortcuts: vi.fn(async () => ({})),
  getPresets: vi.fn(async () => []),
  getDisplays: vi.fn(async () => []),
  getScreenSources: vi.fn(async () => []),
  checkMediaPermission: vi.fn(async () => 'granted'),
  checkScreenPermission: vi.fn(async () => 'granted'),
  openSystemSettings: vi.fn(),
  updateCamera: vi.fn(),
  updateRecording: vi.fn(),
  updateScreenshot: vi.fn(),
  updateShortcut: vi.fn(),
  resetSettings: vi.fn(),
  syncCameraPosition: vi.fn(),
  setCameraPosition: vi.fn(),
  setIgnoreMouseEvents: vi.fn(),
  moveCameraWindow: vi.fn(),
  resizeCameraWindow: vi.fn(),
  syncDevices: vi.fn(),
  chooseRecordingFolder: vi.fn(async () => null),
  chooseScreenshotFolder: vi.fn(async () => null),
  openPath: vi.fn(),
  presetsCreate: vi.fn(async () => ({})),
  presetsUpdate: vi.fn(async () => true),
  presetsDuplicate: vi.fn(async () => ({})),
  presetsDelete: vi.fn(async () => true),
  presetsApply: vi.fn(),
  presetsCapture: vi.fn(),
  scenesCreate: vi.fn(async () => ({})),
  scenesDelete: vi.fn(async () => true),
  scenesApply: vi.fn(),
  paletteRunAction: vi.fn(),
  paletteApplyPreset: vi.fn(),
  closePalette: vi.fn(),
  recordingStart: vi.fn(async () => true),
  recordingChunk: vi.fn(),
  recordingStop: vi.fn(async () => ({ success: true })),
  recordingStarted: vi.fn(),
  recordingStopped: vi.fn(),
  recordingPermissionDenied: vi.fn(),
  screenshotTake: vi.fn(async () => ({ success: true })),
  screenshotSaveCameraFrame: vi.fn(async () => ({ success: true })),
  openSettings: vi.fn(),
  quitApp: vi.fn(),
  on: vi.fn((channel: string, listener: (...args: unknown[]) => void) => {
    if (!listenerRegistry.has(channel)) listenerRegistry.set(channel, new Set())
    listenerRegistry.get(channel)!.add(listener)
    return (): void => {
      listenerRegistry.get(channel)?.delete(listener)
    }
  })
}

export function emitVyraEvent(channel: string, ...args: unknown[]): void {
  listenerRegistry.get(channel)?.forEach((listener) => listener(...args))
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { vyra: typeof mockVyra }).vyra = mockVyra
}

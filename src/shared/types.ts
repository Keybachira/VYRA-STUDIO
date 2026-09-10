/**
 * VYRA Studio — central type system.
 * All cross-process (main ⇄ renderer) data shapes live here.
 */

// ── Camera ──────────────────────────────────────────────────────────────────

export type CameraShape =
  'circle' | 'rounded-rect' | 'rect' | 'square' | 'pill' | 'vertical-rect' | 'horizontal-rect'

export type CameraSize = 'xs' | 'sm' | 'md' | 'lg' | 'sidebar' | 'fullscreen'

/** 9-point snap grid + free positioning. */
export type SnapPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface CameraDevice {
  deviceId: string
  kind?: string
  label: string
  groupId?: string
}

export interface BorderConfig {
  gradient: string
  width: number
  animated: boolean
}

// ── Presets ─────────────────────────────────────────────────────────────────

export interface CameraPreset {
  id: string
  name: string
  shape: CameraShape
  size: CameraSize
  position: SnapPosition
  rounding: number
  opacity: number
  border: BorderConfig
  mirror: boolean
  builtin?: boolean
}

// ── Recording / Screenshot ──────────────────────────────────────────────────

export type RecordingMode = 'screen' | 'camera' | 'screen+camera'

export interface RecordingConfig {
  folder: string
  resolution: string
  fps: string
  encoder: string
  mode: RecordingMode
  systemAudioVolume: number
  microphoneAudioVolume: number
  selectedMicrophoneId: string
}

export interface ScreenshotConfig {
  folder: string
  includeCamera: boolean
}

// ── Audio ───────────────────────────────────────────────────────────────────

export interface AudioConfig {
  micMuted: boolean
}

// ── Shortcuts ───────────────────────────────────────────────────────────────

export type ShortcutAction =
  | 'toggleCamera'
  | 'commandPalette'
  | 'startRecording'
  | 'screenshot'
  | 'micMute'
  | 'mirror'
  | 'alwaysOnTop'
  | 'sizeXs'
  | 'sizeSm'
  | 'sizeMd'
  | 'sizeLg'
  | 'sizeFullscreen'
  | 'preset1'
  | 'preset2'
  | 'preset3'
  | 'topLeft'
  | 'topRight'
  | 'leftMiddle'
  | 'center'
  | 'rightMiddle'
  | 'bottomLeft'
  | 'bottomRight'

export type ShortcutMap = Record<ShortcutAction, string>

// ── App state / settings ────────────────────────────────────────────────────

export type AppLanguage = 'en' | 'pt'

export interface CameraRuntimeState {
  devices: CameraDevice[]
  selectedDeviceId: string
  isMirrored: boolean
  shape: CameraShape
  size: CameraSize
  rounding: number
  alwaysOnTop: boolean
  opacity: number
  border: BorderConfig
  language: AppLanguage
  cameraScreenId: string
  recordingScreenId: string
  sidebarWidthPercentage: number
  sidebarPosition: 'left' | 'right'
  isRecording: boolean
  /** Last free-form window position (platform-dependent meaning). */
  x?: number
  y?: number
}

export interface AppSettings {
  version: 2
  camera: CameraRuntimeState
  recording: RecordingConfig
  screenshot: ScreenshotConfig
  audio: AudioConfig
  shortcuts: ShortcutMap
  presets: CameraPreset[]
  activePresetId: string
}

// ── IPC payloads ────────────────────────────────────────────────────────────

export interface DisplayInfo {
  id: string
  label: string
  bounds: { x: number; y: number; width: number; height: number }
}

export type MainToRendererEvent =
  | 'power-state'
  | 'sync-camera'
  | 'sync-recording'
  | 'sync-settings'
  | 'settings-reset'
  | 'recording-permission-denied'
  | 'recording-error'
  | 'start-recording'
  | 'stop-recording'
  | 'set-camera-position'
  | 'screen-changed'

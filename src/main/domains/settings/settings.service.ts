/**
 * VYRA Studio — settings persistence (main process).
 * Schema v2 with automatic migration from the legacy Floating Head Cam layout.
 */

import { app } from 'electron'
import fs from 'fs'
import { execSync } from 'child_process'
import { cpus } from 'os'
import { join } from 'path'
import {
  defaultCameraState,
  defaultPresets,
  migrateLegacySettings,
  normalizePresets
} from '../../../shared/presets'
import { defaultScenes, normalizeScenes } from '../../../shared/scenes'
import { normalizeEffectId } from '../../../shared/effects'
import { defaultShortcuts, normalizeShortcuts } from '../../../shared/shortcuts'
import type { AppSettings, CameraDevice } from '../../../shared/types'

function getGpuName(): string {
  try {
    return execSync('wmic path win32_VideoController get name', {
      encoding: 'utf8',
      stdio: 'pipe'
    }).toLowerCase()
  } catch {
    return ''
  }
}

function getCpuModel(): string {
  try {
    return cpus()[0]?.model?.toLowerCase() || ''
  } catch {
    return ''
  }
}

function getBestEncoderDefault(): string {
  if (process.platform === 'darwin') return 'h264_videotoolbox'
  if (process.platform === 'win32') {
    const gpuInfo = getGpuName()
    if (gpuInfo.includes('nvidia')) return 'h264_nvenc'
    if (gpuInfo.includes('amd') || gpuInfo.includes('radeon')) return 'h264_amf'
    if (gpuInfo.includes('intel')) return 'h264_qsv'
    const cpuModel = getCpuModel()
    if (cpuModel.includes('intel')) return 'h264_qsv'
    if (cpuModel.includes('amd')) return 'h264_amf'
  }
  return 'libx264'
}

export function defaultSettings(): AppSettings {
  const language = app.getLocale().startsWith('pt') ? 'pt' : 'en'
  return {
    version: 2,
    camera: {
      ...defaultCameraState,
      language,
      devices: [] as CameraDevice[],
      isRecording: false
    },
    recording: {
      folder: '',
      resolution: '1080p',
      fps: '60',
      encoder: getBestEncoderDefault(),
      mode: 'screen',
      systemAudioVolume: 50,
      microphoneAudioVolume: 100,
      selectedMicrophoneId: 'default'
    },
    screenshot: {
      folder: '',
      includeCamera: true
    },
    audio: {
      micMuted: false
    },
    shortcuts: { ...defaultShortcuts },
    presets: defaultPresets.map((p) => ({ ...p, border: { ...p.border } })),
    activePresetId: 'preset-coding',
    scenes: defaultScenes.map((s) => ({ ...s })),
    activeSceneId: 'scene-coding'
  }
}

export let settings: AppSettings = defaultSettings()

/** Live camera state used by tray/shortcuts; kept separate to avoid stale device lists. */
export const cameraRuntime = {
  isCameraOn: true,
  devices: [] as CameraDevice[]
}

export function settingsFilePath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function loadSettings(): void {
  const path = settingsFilePath()
  if (!fs.existsSync(path)) return
  try {
    const raw = JSON.parse(fs.readFileSync(path, 'utf-8'))
    const migrated = raw && raw.version === 2 ? raw : migrateLegacySettings(raw)
    if (!migrated) return

    settings = defaultSettings()
    // Native v2 snapshot (written by saveSettings): restore sections directly.
    if (raw && raw.version === 2) {
      const cam = (raw.camera ?? {}) as Record<string, unknown>
      const assign = <K extends keyof typeof settings.camera>(
        key: K,
        value: unknown,
        validate: (v: unknown) => boolean
      ): void => {
        if (validate(value)) settings.camera[key] = value as never
      }
      const isString = (v: unknown): v is string => typeof v === 'string'
      const isNumber = (v: unknown): v is number => typeof v === 'number'
      const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean'
      assign('selectedDeviceId', cam.selectedDeviceId, isString)
      assign('isMirrored', cam.isMirrored, isBoolean)
      assign('shape', cam.shape, isString)
      assign('size', cam.size, isString)
      assign('rounding', cam.rounding, isNumber)
      assign('alwaysOnTop', cam.alwaysOnTop, isBoolean)
      assign('opacity', cam.opacity, isNumber)
      assign('language', cam.language, isString)
      assign('cameraScreenId', cam.cameraScreenId, isString)
      assign('recordingScreenId', cam.recordingScreenId, isString)
      assign('sidebarWidthPercentage', cam.sidebarWidthPercentage, isNumber)
      assign('sidebarPosition', cam.sidebarPosition, isString)
      if (cam.border && typeof cam.border === 'object') {
        const b = cam.border as Record<string, unknown>
        settings.camera.border = {
          gradient: typeof b.gradient === 'string' ? b.gradient : 'none',
          width: typeof b.width === 'number' ? b.width : 4,
          animated: typeof b.animated === 'boolean' ? b.animated : false,
          pulse: typeof b.pulse === 'boolean' ? b.pulse : false
        }
      }
      settings.camera.effect = normalizeEffectId(cam.effect)
      if (typeof cam.x === 'number') settings.camera.x = cam.x
      if (typeof cam.y === 'number') settings.camera.y = cam.y
      const rec = (raw.recording ?? {}) as Record<string, unknown>
      for (const key of [
        'folder',
        'resolution',
        'fps',
        'encoder',
        'mode',
        'systemAudioVolume',
        'microphoneAudioVolume',
        'selectedMicrophoneId'
      ] as const) {
        if (rec[key] !== undefined) {
          ;(settings.recording as unknown as Record<string, unknown>)[key] = rec[key]
        }
      }
      const shot = (raw.screenshot ?? {}) as Record<string, unknown>
      if (shot.folder !== undefined) settings.screenshot.folder = shot.folder as string
      if (typeof shot.includeCamera === 'boolean') {
        settings.screenshot.includeCamera = shot.includeCamera
      }
      const audio = (raw.audio ?? {}) as Record<string, unknown>
      if (typeof audio.micMuted === 'boolean') settings.audio.micMuted = audio.micMuted
    }
    if (migrated.state) {
      const s = migrated.state as Record<string, unknown>
      // Legacy flat keys
      settings.camera.selectedDeviceId = (s.selectedDeviceId as string) ?? ''
      settings.camera.isMirrored = (s.isMirrored as boolean) ?? settings.camera.isMirrored
      settings.camera.shape = (s.shape as AppSettings['camera']['shape']) ?? settings.camera.shape
      settings.camera.size = (s.size as AppSettings['camera']['size']) ?? settings.camera.size
      settings.camera.rounding = (s.rounding as number) ?? settings.camera.rounding
      settings.camera.alwaysOnTop = (s.alwaysOnTop as boolean) ?? settings.camera.alwaysOnTop
      settings.camera.opacity = (s.opacity as number) ?? settings.camera.opacity
      if (s.border && typeof s.border === 'object') {
        const b = s.border as Record<string, unknown>
        settings.camera.border = {
          gradient: (b.gradient as string) ?? 'none',
          width: (b.width as number) ?? 4,
          animated: (b.animated as boolean) ?? false,
          pulse: (b.pulse as boolean) ?? false
        }
      }
      settings.camera.language =
        (s.language as AppSettings['camera']['language']) ?? settings.camera.language
      settings.camera.cameraScreenId = (s.cameraScreenId as string) ?? ''
      settings.camera.recordingScreenId = (s.recordingScreenId as string) ?? ''
      settings.camera.sidebarWidthPercentage =
        (s.sidebarWidthPercentage as number) ?? settings.camera.sidebarWidthPercentage
      settings.camera.sidebarPosition =
        (s.sidebarPosition as AppSettings['camera']['sidebarPosition']) ?? 'right'
      settings.camera.x = s.x as number | undefined
      settings.camera.y = s.y as number | undefined
      if (typeof s.isRecording === 'boolean') settings.camera.isRecording = s.isRecording

      settings.recording.folder = (s.recordingFolder as string) ?? ''
      settings.recording.resolution = (s.recordingResolution as string) ?? '1080p'
      settings.recording.fps = (s.recordingFps as string) ?? '60'
      settings.recording.encoder = (s.recordingEncoder as string) ?? settings.recording.encoder
      settings.recording.systemAudioVolume = (s.systemAudioVolume as number) ?? 50
      settings.recording.microphoneAudioVolume = (s.microphoneAudioVolume as number) ?? 100
      settings.recording.selectedMicrophoneId = (s.selectedMicrophoneId as string) ?? 'default'
    }
    if (migrated.shortcuts) settings.shortcuts = normalizeShortcuts(migrated.shortcuts)
    if (Array.isArray(migrated.presets)) settings.presets = normalizePresets(migrated.presets)
    if (typeof migrated.activePresetId === 'string')
      settings.activePresetId = migrated.activePresetId
    const presetIds = new Set(settings.presets.map((p) => p.id))
    if (Array.isArray(migrated.scenes)) {
      const loaded = normalizeScenes(migrated.scenes, presetIds)
      if (loaded.length > 0) settings.scenes = loaded
    }
    if (
      typeof migrated.activeSceneId === 'string' &&
      settings.scenes.some((s) => s.id === migrated.activeSceneId)
    ) {
      settings.activeSceneId = migrated.activeSceneId
    }
    if (!settings.scenes.some((s) => s.id === settings.activeSceneId)) {
      settings.activeSceneId = settings.scenes[0]?.id ?? ''
    }
  } catch (err) {
    console.warn('[vyra] failed to load settings, using defaults:', err)
    settings = defaultSettings()
  }
}

export function saveSettings(): void {
  try {
    const path = settingsFilePath()
    const snapshot: AppSettings = {
      ...settings,
      camera: { ...settings.camera, devices: [], isRecording: settings.camera.isRecording }
    }
    fs.writeFileSync(path, JSON.stringify(snapshot, null, 2))
  } catch (err) {
    console.error('[vyra] failed to save settings:', err)
  }
}

export function resetSection(section: string): void {
  const fresh = defaultSettings()
  switch (section) {
    case 'appearance':
      settings.camera.shape = fresh.camera.shape
      settings.camera.rounding = fresh.camera.rounding
      settings.camera.opacity = fresh.camera.opacity
      settings.camera.border = { ...fresh.camera.border }
      break
    case 'camera':
      settings.camera.isMirrored = fresh.camera.isMirrored
      settings.camera.alwaysOnTop = fresh.camera.alwaysOnTop
      break
    case 'recording':
      settings.recording = { ...fresh.recording }
      break
    case 'audio':
      settings.audio = { ...fresh.audio }
      break
    case 'shortcuts':
      settings.shortcuts = { ...fresh.shortcuts }
      break
    case 'presets':
      settings.presets = fresh.presets.map((p) => ({ ...p, border: { ...p.border } }))
      settings.activePresetId = fresh.activePresetId
      settings.scenes = fresh.scenes.map((s) => ({ ...s }))
      settings.activeSceneId = fresh.activeSceneId
      break
    default:
      settings = fresh
  }
  saveSettings()
}

/**
 * VYRA Studio — system tray.
 * Camera, presets, recording, screenshot, microphone, settings, quit.
 */

import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron'
import { autoUpdater } from 'electron-updater'
import trayIcon from '../../../../resources/tray.png?asset'
import trayRecIcon from '../../../../resources/tray-rec.png?asset'
import { t } from '../../../shared/i18n'
import { APP_NAME } from '../../../shared/brand'
import type { CameraPreset, CameraDevice } from '../../../shared/types'
import { getIsCameraOn } from '../camera/camera.service'
import { settings } from '../settings/settings.service'
import { createSettingsWindow } from '../window/window.service'

let tray: Tray | null = null
let _updateReady = false

export interface TrayActions {
  toggleCamera: () => void
  showCamera: () => void
  hideCamera: () => void
  toggleRecording: () => void
  screenshot: () => void
  toggleMicMute: () => void
  applyPreset: (id: string) => void
  openPalette: () => void
}

let actions: TrayActions = {
  toggleCamera: (): void => undefined,
  showCamera: (): void => undefined,
  hideCamera: (): void => undefined,
  toggleRecording: (): void => undefined,
  screenshot: (): void => undefined,
  toggleMicMute: (): void => undefined,
  applyPreset: (): void => undefined,
  openPalette: (): void => undefined
}

export function setTrayActions(next: TrayActions): void {
  actions = next
}

export function setUpdateReady(value: boolean): void {
  _updateReady = value
}

export function initTray(): void {
  const image = nativeImage.createFromPath(trayIcon as unknown as string)
  tray = new Tray(image)
  tray.setToolTip(APP_NAME)
}

export function updateTray(): void {
  if (!tray) return
  const lang = settings.camera.language
  const isRecording = settings.camera.isRecording
  const micMuted = settings.audio.micMuted

  const recImage = nativeImage.createFromPath(trayRecIcon as unknown as string)
  tray.setImage(isRecording ? recImage : nativeImage.createFromPath(trayIcon as unknown as string))

  const cameraItems = cameraRuntimeDevices().map((device: CameraDevice) => ({
    label: device.label || 'Camera',
    type: 'radio' as const,
    checked: device.deviceId === settings.camera.selectedDeviceId,
    click: (): void => {
      settings.camera.selectedDeviceId = device.deviceId
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send('sync-camera', { selectedDeviceId: device.deviceId })
      })
    }
  }))
  const presetItems = settings.presets.slice(0, 8).map((preset: CameraPreset) => ({
    label: preset.name,
    type: 'radio' as const,
    checked: preset.id === settings.activePresetId,
    click: (): void => actions.applyPreset(preset.id)
  }))

  const menu = Menu.buildFromTemplate([
    {
      label: getIsCameraOn() ? t('tray.turnOff', lang) : t('tray.turnOn', lang),
      click: (): void => actions.toggleCamera()
    },
    { type: 'separator' },
    {
      label: isRecording ? t('tray.recording.stop', lang) : t('tray.recording.start', lang),
      click: (): void => actions.toggleRecording()
    },
    { label: t('tray.screenshot', lang), click: (): void => actions.screenshot() },
    {
      label: micMuted ? t('tray.micUnmute', lang) : t('tray.micMute', lang),
      click: (): void => actions.toggleMicMute()
    },
    { type: 'separator' },
    {
      label: t('tray.presets', lang),
      submenu: [
        ...presetItems,
        ...(cameraItems.length > 0
          ? [
              { type: 'separator' as const },
              {
                label: 'Cameras',
                enabled: false
              },
              ...cameraItems
            ]
          : [])
      ]
    },
    { type: 'separator' },
    { label: t('tray.open', lang), click: (): void => actions.openPalette() },
    { label: t('tray.settings', lang), click: (): void => createSettingsWindow() },
    ...(_updateReady
      ? [
          { type: 'separator' as const },
          {
            label: t('tray.settings', lang) + ' — update ready',
            click: (): void => autoUpdater.quitAndInstall()
          }
        ]
      : []),
    { type: 'separator' },
    { label: t('tray.quit', lang), click: (): void => app.quit() }
  ])
  tray.setContextMenu(menu)
}

function cameraRuntimeDevices(): CameraDevice[] {
  return settings.camera.devices ?? []
}

export function getTrayForTests(): Tray | null {
  return tray
}

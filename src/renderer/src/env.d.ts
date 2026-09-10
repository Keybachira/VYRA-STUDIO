import type { ElectronAPI } from '@electron-toolkit/preload'

type Unsubscribe = () => void

declare global {
  interface Window {
    electron: ElectronAPI
    vyra: {
      getInitialState(): Promise<import('../../shared/types').AppSettings & { isCameraOn: boolean }>
      getShortcuts(): Promise<Record<string, string>>
      getPresets(): Promise<import('../../shared/types').CameraPreset[]>
      getDisplays(): Promise<
        {
          id: string
          label: string
          bounds: { x: number; y: number; width: number; height: number }
        }[]
      >
      getScreenSources(): Promise<{ id: string; name: string; display_id: string }[]>
      checkMediaPermission(mediaType: 'camera' | 'microphone'): Promise<string>
      checkScreenPermission(): Promise<string>
      openSystemSettings(type: 'camera' | 'microphone' | 'screen'): Promise<void>
      updateCamera(patch: Record<string, unknown>): void
      updateRecording(patch: Record<string, unknown>): void
      updateScreenshot(patch: Record<string, unknown>): void
      updateShortcut(action: string, accelerator: string): void
      resetSettings(section?: string): void
      syncCameraPosition(x: number, y: number): void
      setCameraPosition(pos: string): void
      setIgnoreMouseEvents(ignore: boolean, options?: { forward: boolean }): void
      moveCameraWindow(x: number, y: number): void
      resizeCameraWindow(width: number, height: number, x?: number, y?: number): void
      syncDevices(devices: { deviceId: string; label: string }[]): void
      chooseRecordingFolder(): Promise<string | null>
      chooseScreenshotFolder(): Promise<string | null>
      openPath(target: 'recordings' | 'screenshots' | 'settings'): Promise<void>
      presetsCreate(partial: unknown): Promise<unknown>
      presetsUpdate(id: string, patch: unknown): Promise<boolean>
      presetsDuplicate(id: string): Promise<unknown>
      presetsDelete(id: string): Promise<boolean>
      presetsApply(id: string): void
      presetsCapture(name: string): void
      paletteRunAction(action: string): void
      paletteApplyPreset(id: string): void
      closePalette(): void
      recordingStart(payload: unknown): Promise<boolean>
      recordingChunk(chunk: ArrayBuffer): void
      recordingStop(): Promise<unknown>
      recordingStarted(): void
      recordingStopped(): void
      recordingPermissionDenied(payload: { screen: boolean; mic: boolean }): void
      screenshotTake(): Promise<{ success: boolean; filePath?: string; error?: string }>
      screenshotSaveCameraFrame(
        dataUrl: string
      ): Promise<{ success: boolean; filePath?: string; error?: string }>
      openSettings(): void
      quitApp(): void
      on(channel: string, listener: (...args: unknown[]) => void): Unsubscribe
    }
  }
}

export {}

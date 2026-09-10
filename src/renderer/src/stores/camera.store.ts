/**
 * VYRA Studio — camera store (renderer).
 * Mirrors the main-process camera state; renderer components read + patch it.
 */

import { create } from 'zustand'
import type { BorderConfig, CameraShape, CameraSize } from '../../../shared/types'

interface CameraStore {
  devices: { deviceId: string; label: string }[]
  selectedDeviceId: string
  isMirrored: boolean
  shape: CameraShape
  size: CameraSize
  rounding: number
  alwaysOnTop: boolean
  opacity: number
  border: BorderConfig
  powerOn: boolean
  language: 'en' | 'pt'
  cameraScreenId: string
  sidebarWidthPercentage: number
  sidebarPosition: 'left' | 'right'
  initialized: boolean

  setInitialized: (v: boolean) => void
  patch: (partial: Partial<CameraStore>) => void
  setPowerOn: (v: boolean) => void
  commit: () => void
}

let commitTimer: ReturnType<typeof setTimeout> | null = null

export const useCameraStore = create<CameraStore>((set, get) => ({
  devices: [],
  selectedDeviceId: '',
  isMirrored: true,
  shape: 'circle',
  size: 'sm',
  rounding: 24,
  alwaysOnTop: true,
  opacity: 1,
  border: { gradient: 'none', width: 4, animated: false },
  powerOn: false,
  language: 'en',
  cameraScreenId: '',
  sidebarWidthPercentage: 35,
  sidebarPosition: 'right',
  initialized: false,

  setInitialized: (v): void => set({ initialized: v }),
  patch: (partial): void => set(partial),
  setPowerOn: (v): void => set({ powerOn: v }),

  /** Push current camera settings to main (debounced). */
  commit: (): void => {
    if (commitTimer) clearTimeout(commitTimer)
    commitTimer = setTimeout(() => {
      commitTimer = null
      const s = get()
      window.vyra?.updateCamera({
        selectedDeviceId: s.selectedDeviceId,
        isMirrored: s.isMirrored,
        shape: s.shape,
        size: s.size,
        rounding: s.rounding,
        alwaysOnTop: s.alwaysOnTop,
        opacity: s.opacity,
        border: s.border,
        cameraScreenId: s.cameraScreenId,
        sidebarWidthPercentage: s.sidebarWidthPercentage,
        sidebarPosition: s.sidebarPosition
      })
    }, 150)
  }
}))

/** Apply a settings snapshot from main into the store. */
export function hydrateCameraStore(state: {
  camera?: Record<string, unknown>
  isCameraOn?: boolean
}): void {
  const cam = (state.camera ?? {}) as Record<string, unknown>
  useCameraStore.getState().patch({
    selectedDeviceId: (cam.selectedDeviceId as string) ?? '',
    isMirrored: (cam.isMirrored as boolean) ?? true,
    shape: (cam.shape as CameraShape) ?? 'circle',
    size: (cam.size as CameraSize) ?? 'sm',
    rounding: (cam.rounding as number) ?? 24,
    alwaysOnTop: (cam.alwaysOnTop as boolean) ?? true,
    opacity: (cam.opacity as number) ?? 1,
    border: (cam.border as BorderConfig) ?? { gradient: 'none', width: 4, animated: false },
    powerOn: state.isCameraOn ?? false,
    language: (cam.language as 'en' | 'pt') ?? 'en',
    cameraScreenId: (cam.cameraScreenId as string) ?? '',
    sidebarWidthPercentage: (cam.sidebarWidthPercentage as number) ?? 35,
    sidebarPosition: (cam.sidebarPosition as 'left' | 'right') ?? 'right'
  })
}

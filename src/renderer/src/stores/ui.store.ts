/**
 * VYRA Studio — UI store (renderer).
 * Transient UI state: overlays, drag, recording indicators.
 */

import { create } from 'zustand'

interface UiStore {
  isDragging: boolean
  isSnapping: boolean
  recordingError: { code: string; message?: string; stderr?: string } | null
  screenPermissionDenied: boolean
  micPermissionDenied: boolean
  showHud: boolean

  setDragging: (v: boolean) => void
  setSnapping: (v: boolean) => void
  setRecordingError: (err: UiStore['recordingError']) => void
  setScreenPermissionDenied: (v: boolean) => void
  setMicPermissionDenied: (v: boolean) => void
  setShowHud: (v: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  isDragging: false,
  isSnapping: false,
  recordingError: null,
  screenPermissionDenied: false,
  micPermissionDenied: false,
  showHud: true,

  setDragging: (v): void => set({ isDragging: v }),
  setSnapping: (v): void => {
    set({ isSnapping: v })
    if (v) {
      setTimeout(() => set({ isSnapping: false }), 500)
    }
  },
  setRecordingError: (err): void => set({ recordingError: err }),
  setScreenPermissionDenied: (v): void => set({ screenPermissionDenied: v }),
  setMicPermissionDenied: (v): void => set({ micPermissionDenied: v }),
  setShowHud: (v): void => set({ showHud: v })
}))

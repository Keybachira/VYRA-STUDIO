/**
 * VYRA Studio — recording store (renderer).
 */

import { create } from 'zustand'

interface RecordingStore {
  isRecording: boolean
  micMuted: boolean
  elapsedSeconds: number

  setRecording: (v: boolean) => void
  setMicMuted: (v: boolean) => void
  tick: () => void
  reset: () => void
}

export const useRecordingStore = create<RecordingStore>((set) => ({
  isRecording: false,
  micMuted: false,
  elapsedSeconds: 0,

  setRecording: (v): void => set({ isRecording: v, elapsedSeconds: v ? 0 : 0 }),
  setMicMuted: (v): void => set({ micMuted: v }),
  tick: (): void => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
  reset: (): void => set({ elapsedSeconds: 0 })
}))

export function formatRecordingTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

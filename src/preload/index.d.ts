import { ElectronAPI } from '@electron-toolkit/preload'

/**
 * The precise `window.vyra` typing lives in `src/renderer/src/env.d.ts`
 * (single source of truth for the renderer). This file only guarantees the
 * legacy `window.electron` global exists.
 */
declare global {
  interface Window {
    electron: ElectronAPI
  }
}

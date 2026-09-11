/**
 * VYRA Studio — camera window event wiring.
 * Subscribes to main→renderer events and local shortcut keys.
 */

import { useEffect } from 'react'
import { matchLocalShortcut } from './match-local-shortcut'
import { useCameraStore } from '../../../stores/camera.store'
import { useRecordingStore } from '../../../stores/recording.store'
import { useUiStore } from '../../../stores/ui.store'
import type {
  BorderConfig,
  CameraShape,
  CameraSize,
  SnapPosition
} from '../../../../../shared/types'
import { normalizeEffectId } from '../../../../../shared/effects'

interface UseCameraEventsArgs {
  snapTo: (pos: SnapPosition) => void
  applySize: () => void
}

export function useCameraEvents({ snapTo, applySize }: UseCameraEventsArgs): void {
  useEffect(() => {
    const unsubs: (() => void)[] = []

    unsubs.push(
      window.vyra?.on('power-state', (on: unknown) => {
        useCameraStore.getState().setPowerOn(Boolean(on))
      })
    )

    unsubs.push(
      window.vyra?.on('sync-camera', (cam: unknown) => {
        const c = (cam ?? {}) as Record<string, unknown>
        const store = useCameraStore.getState()
        store.patch({
          ...(c.selectedDeviceId !== undefined
            ? { selectedDeviceId: c.selectedDeviceId as string }
            : {}),
          ...(c.isMirrored !== undefined ? { isMirrored: c.isMirrored as boolean } : {}),
          ...(c.shape !== undefined ? { shape: c.shape as CameraShape } : {}),
          ...(c.size !== undefined ? { size: c.size as CameraSize } : {}),
          ...(c.rounding !== undefined ? { rounding: c.rounding as number } : {}),
          ...(c.alwaysOnTop !== undefined ? { alwaysOnTop: c.alwaysOnTop as boolean } : {}),
          ...(c.opacity !== undefined ? { opacity: c.opacity as number } : {}),
          ...(c.border !== undefined ? { border: c.border as BorderConfig } : {}),
          ...(c.effect !== undefined ? { effect: normalizeEffectId(c.effect) } : {}),
          ...(c.language !== undefined ? { language: c.language as 'en' | 'pt' } : {}),
          ...(c.sidebarWidthPercentage !== undefined
            ? { sidebarWidthPercentage: c.sidebarWidthPercentage as number }
            : {}),
          ...(c.sidebarPosition !== undefined
            ? { sidebarPosition: c.sidebarPosition as 'left' | 'right' }
            : {})
        })
        applySize()
      })
    )

    unsubs.push(
      window.vyra?.on('set-camera-position', (pos: unknown) => {
        snapTo(pos as SnapPosition)
      })
    )

    unsubs.push(
      window.vyra?.on('screen-changed', () => {
        applySize()
      })
    )

    unsubs.push(
      window.vyra?.on('sync-recording', (payload: unknown) => {
        const p = (payload ?? {}) as Record<string, unknown>
        if (typeof p.micMuted === 'boolean') {
          useRecordingStore.getState().setMicMuted(p.micMuted)
        }
      })
    )

    unsubs.push(
      window.vyra?.on('sync-setting', (payload: unknown) => {
        const { key, value } = (payload ?? {}) as { key: string; value: unknown }
        if (key === 'isRecording') {
          useRecordingStore.getState().setRecording(value === true)
        }
      })
    )

    unsubs.push(
      window.vyra?.on('recording-permission-denied', (payload: unknown) => {
        const p = (payload ?? {}) as { screen?: boolean; mic?: boolean }
        useUiStore.getState().setScreenPermissionDenied(Boolean(p.screen))
        useUiStore.getState().setMicPermissionDenied(Boolean(p.mic))
      })
    )

    unsubs.push(
      window.vyra?.on('recording-error', (payload: unknown) => {
        const p = (payload ?? {}) as { code: string; message?: string; stderr?: string }
        useUiStore.getState().setRecordingError(p)
      })
    )

    unsubs.push(
      window.vyra?.on('recording-started', () => {
        useUiStore.getState().setRecordingError(null)
      })
    )

    // Local shortcuts (focus-scoped): sizes, positions, mirror, always-on-top
    const handleKeyDown = (e: KeyboardEvent): void => {
      const store = useCameraStore.getState()
      const shortcuts = window.vyraCacheShortcuts ?? {}
      const action = matchLocalShortcut(e, shortcuts)
      if (!action) return
      e.preventDefault()

      const sizeMap: Record<string, CameraSize> = {
        sizeXs: 'xs',
        sizeSm: 'sm',
        sizeMd: 'md',
        sizeLg: 'lg',
        sizeFullscreen: 'fullscreen'
      }
      if (action in sizeMap) {
        store.patch({ size: sizeMap[action] })
        window.vyra?.updateCamera({ size: sizeMap[action] })
        applySize()
        return
      }
      const posMap: Record<string, SnapPosition> = {
        topLeft: 'top-left',
        topRight: 'top-right',
        leftMiddle: 'center-left',
        center: 'center',
        rightMiddle: 'center-right',
        bottomLeft: 'bottom-left',
        bottomRight: 'bottom-right'
      }
      if (action in posMap) {
        snapTo(posMap[action])
        return
      }
      if (action === 'mirror') {
        store.patch({ isMirrored: !store.isMirrored })
        window.vyra?.updateCamera({ isMirrored: !store.isMirrored })
      }
      if (action === 'alwaysOnTop') {
        store.patch({ alwaysOnTop: !store.alwaysOnTop })
        window.vyra?.updateCamera({ alwaysOnTop: !store.alwaysOnTop })
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Cache shortcuts once for the keydown handler
    void window.vyra?.getShortcuts().then((s) => {
      window.vyraCacheShortcuts = s
    })

    return () => {
      unsubs.forEach((u) => u?.())
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [snapTo, applySize])
}

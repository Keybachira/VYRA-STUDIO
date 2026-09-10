import { useState, useEffect } from 'react'

export type PermissionStatus = 'granted' | 'denied' | 'restricted' | 'unknown' | 'not-determined'

export function usePermissions(): {
  cameraPermission: PermissionStatus
  microphonePermission: PermissionStatus
  screenPermission: PermissionStatus
  checkPermissions: () => Promise<void>
} {
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus>('unknown')
  const [microphonePermission, setMicrophonePermission] = useState<PermissionStatus>('unknown')
  const [screenPermission, setScreenPermission] = useState<PermissionStatus>('unknown')

  const checkPermissions = async (): Promise<void> => {
    try {
      const camStatus = await window.vyra.checkMediaPermission('camera')
      setCameraPermission(camStatus as PermissionStatus)

      const micStatus = await window.vyra.checkMediaPermission('microphone')
      setMicrophonePermission(micStatus as PermissionStatus)

      const screenStatus = await window.vyra.checkScreenPermission()
      setScreenPermission(screenStatus as PermissionStatus)
    } catch (err) {
      console.error('Failed to check permissions via IPC', err)
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const camStatus = await window.vyra.checkMediaPermission('camera')
        if (!cancelled) setCameraPermission(camStatus as PermissionStatus)

        const micStatus = await window.vyra.checkMediaPermission('microphone')
        if (!cancelled) setMicrophonePermission(micStatus as PermissionStatus)

        const screenStatus = await window.vyra.checkScreenPermission()
        if (!cancelled) setScreenPermission(screenStatus as PermissionStatus)
      } catch (err) {
        console.error('Failed to check permissions via IPC', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { cameraPermission, microphonePermission, screenPermission, checkPermissions }
}

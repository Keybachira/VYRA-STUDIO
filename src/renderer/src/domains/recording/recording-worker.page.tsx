/**
 * VYRA Studio — hidden recording worker page.
 * Captures screen (+camera PiP, +audio mix) and streams webm chunks to main.
 */

import React, { useEffect } from 'react'
import { useScreenRecorder } from './hooks/use-screen-recorder'

export function RecordingWorkerPage(): React.JSX.Element {
  const { screenPermissionDenied, micPermissionDenied } = useScreenRecorder()

  useEffect(() => {
    const vyra = window.vyra
    if (!vyra) return
    if (screenPermissionDenied || micPermissionDenied) {
      vyra.recordingPermissionDenied({
        screen: screenPermissionDenied,
        mic: micPermissionDenied
      })
    }
  }, [screenPermissionDenied, micPermissionDenied])

  return (
    <div style={{ display: 'none' }}>
      <h1>VYRA Recording Worker</h1>
    </div>
  )
}

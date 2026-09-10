/**
 * VYRA Studio — HUD: tiny status pill on the camera bubble.
 * Shows camera / microphone / recording state without disturbing the video.
 */

import React from 'react'
import { useCameraStore } from '../../../stores/camera.store'
import { useRecordingStore } from '../../../stores/recording.store'
import { useUiStore } from '../../../stores/ui.store'
import { t } from '../../../../../shared/i18n'

export function CameraHud(): React.JSX.Element | null {
  const powerOn = useCameraStore((s) => s.powerOn)
  const language = useCameraStore((s) => s.language)
  const isRecording = useRecordingStore((s) => s.isRecording)
  const micMuted = useRecordingStore((s) => s.micMuted)
  const showHud = useUiStore((s) => s.showHud)

  if (!showHud || !powerOn) return null

  return (
    <div className="vyra-hud" aria-hidden>
      <span className="dot on" />
      <span>CAM</span>
      <span className={`dot ${micMuted ? 'off' : 'on'}`} />
      <span>MIC</span>
      {isRecording && (
        <>
          <span className="dot rec" />
          <span>{t('hud.rec', language)}</span>
        </>
      )}
    </div>
  )
}

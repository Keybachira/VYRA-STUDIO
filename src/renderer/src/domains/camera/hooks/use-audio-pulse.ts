/**
 * VYRA Studio — VYRA Pulse.
 * Drives a glow layer from the microphone level via direct DOM writes
 * (no React state per frame). Silent no-op when the mic is unavailable
 * or the user prefers reduced motion.
 */

import { useEffect, type RefObject } from 'react'
import { rmsLevel, smoothLevel } from '../../../../../shared/audio-level'

interface UseAudioPulseArgs {
  enabled: boolean
  glowRef: RefObject<HTMLDivElement | null>
}

export function useAudioPulse({ enabled, glowRef }: UseAudioPulseArgs): void {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    if (!navigator.mediaDevices?.getUserMedia) return

    let cancelled = false
    let raf = 0
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null

    // Inset glow: the bubble clips overflow, so the ring must live inside.
    const applyGlow = (level: number): void => {
      const el = glowRef.current
      if (!el) return
      const spread = 6 + level * 30
      el.style.boxShadow = `inset 0 0 ${spread.toFixed(1)}px rgba(255, 219, 0, ${(0.1 + level * 0.8).toFixed(2)})`
      el.style.opacity = (0.35 + level * 0.65).toFixed(2)
    }

    const start = async (): Promise<void> => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
        })
      } catch {
        return // Mic denied/unavailable: border simply stays static.
      }
      if (cancelled || stream.getAudioTracks().length === 0) {
        stream?.getTracks().forEach((t) => t.stop())
        return
      }
      ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      const data = new Uint8Array(analyser.fftSize)
      let smooth = 0

      const tick = (): void => {
        if (cancelled) return
        analyser.getByteTimeDomainData(data)
        smooth = smoothLevel(smooth, rmsLevel(data))
        applyGlow(smooth)
        raf = requestAnimationFrame(tick)
      }
      applyGlow(0)
      tick()
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      stream = null
      if (ctx) {
        ctx.close().catch(() => undefined)
        ctx = null
      }
      // Leave the glow layer in its resting state.
      const el = glowRef.current
      if (el) {
        el.style.boxShadow = 'none'
        el.style.opacity = '0'
      }
    }
  }, [enabled, glowRef])
}

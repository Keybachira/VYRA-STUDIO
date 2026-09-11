/**
 * VYRA Studio — floating camera page.
 * Transparent fullscreen overlay: renders the camera bubble, drag, snap, HUD.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getGradient } from '../../../../shared/colors'
import { effectById, effectFilter, normalizeEffectId } from '../../../../shared/effects'
import { dimensionsForShape, SIZES } from '../../../../shared/presets'
import type { SnapPosition } from '../../../../shared/types'
import { useCameraDevices } from './hooks/use-camera-devices'
import { useCameraStream } from './hooks/use-camera-stream'
import { useCameraEvents } from './hooks/use-camera-events'
import { useAudioPulse } from './hooks/use-audio-pulse'
import { PermissionErrorOverlay } from './components/permission-error-overlay'
import { ScreenPermissionErrorOverlay } from './components/screen-permission-error-overlay'
import { MicPermissionErrorOverlay } from './components/mic-permission-error-overlay'
import { RecordingErrorOverlay } from './components/recording-error-overlay'
import { CameraHud } from './components/camera-hud'
import { useCameraStore } from '../../stores/camera.store'
import { useUiStore } from '../../stores/ui.store'

const isLinux =
  typeof navigator !== 'undefined' &&
  (navigator.platform.toLowerCase().includes('linux') ||
    navigator.userAgent.toLowerCase().includes('linux'))

const isWindows =
  typeof navigator !== 'undefined' &&
  (navigator.platform.toLowerCase().includes('win') ||
    navigator.userAgent.toLowerCase().includes('windows'))

function getScreenWidth(): number {
  const vw = window.innerWidth || 0
  const sw = window.screen?.width ?? vw
  const avail = window.screen?.availWidth ?? sw
  return Math.min(vw || avail, isWindows ? avail : sw) || vw || sw
}

function getScreenHeight(): number {
  const vh = window.innerHeight || 0
  const sh = window.screen?.height ?? vh
  const availH = window.screen?.availHeight ?? sh
  return Math.min(vh || availH, isWindows ? availH : sh) || vh || sh
}

function clampToViewport(w: number, h: number, sw: number, sh: number): { w: number; h: number } {
  const maxW = Math.max(160, Math.min(sw * 0.92, sw - 16))
  const maxH = Math.max(160, Math.min(sh * 0.88, sh - 16))
  if (w <= maxW && h <= maxH) return { w, h }
  const scale = Math.min(maxW / w, maxH / h)
  return { w: Math.round(w * scale), h: Math.round(h * scale) }
}

const SNAP_OFFSETS: Record<SnapPosition, { xf: number; yf: number }> = {
  'top-left': { xf: 0, yf: 0 },
  'top-center': { xf: 0.5, yf: 0 },
  'top-right': { xf: 1, yf: 0 },
  'center-left': { xf: 0, yf: 0.5 },
  center: { xf: 0.5, yf: 0.5 },
  'center-right': { xf: 1, yf: 0.5 },
  'bottom-left': { xf: 0, yf: 1 },
  'bottom-center': { xf: 0.5, yf: 1 },
  'bottom-right': { xf: 1, yf: 1 }
}

function computeBubbleGeometry(
  size: string,
  shape: string,
  borderGradient: string,
  borderWidth: number,
  sidebarWidthPercentage: number
): { w: number; h: number } {
  const sw = getScreenWidth()
  const sh = getScreenHeight()

  if (size === 'fullscreen') {
    return { w: isLinux ? sw : window.innerWidth, h: isLinux ? sh : window.innerHeight }
  }
  if (size === 'sidebar') {
    const pct = (sidebarWidthPercentage || 35) / 100
    const w = Math.round((isLinux ? sw : window.innerWidth) * pct)
    const h = isLinux ? sh : window.innerHeight
    return { w, h }
  }

  const base = SIZES[size] ?? SIZES.sm
  const { width, height } = dimensionsForShape(base, shape)
  const clamped = clampToViewport(width, height, sw, sh)

  const hasBorder = borderGradient !== 'none'
  const totalW = hasBorder ? clamped.w + borderWidth * 2 : clamped.w
  const totalH = hasBorder ? clamped.h + borderWidth * 2 : clamped.h
  const clampedTotal = clampToViewport(totalW, totalH, sw, sh)
  if (clampedTotal.w === totalW && clampedTotal.h === totalH) {
    return { w: totalW, h: totalH }
  }
  const inner = clampToViewport(totalW - borderWidth * 2, totalH - borderWidth * 2, sw, sh)
  return { w: Math.max(120, inner.w), h: Math.max(120, inner.h) }
}

function computeSnappedPosition(pos: SnapPosition, w: number, h: number): { x: number; y: number } {
  const margin = 12
  const sw = getScreenWidth()
  const sh = getScreenHeight()
  const { xf, yf } = SNAP_OFFSETS[pos] ?? SNAP_OFFSETS['bottom-right']
  const x = Math.round(xf * (sw - w) + (xf === 0.5 ? 0 : xf === 1 ? -margin : margin))
  const y = Math.round(yf * (sh - h) + (yf === 0.5 ? 0 : yf === 1 ? -margin : margin))
  return { x: Math.max(0, x), y: Math.max(0, y) }
}

export function CameraPage(): React.JSX.Element {
  const camera = useCameraStore()
  const ui = useUiStore()

  const {
    devices,
    selectedDeviceId,
    permissionError: devicesError,
    refreshDevices
  } = useCameraDevices()
  const [streamRetryNonce, setStreamRetryNonce] = useState(0)
  const { videoRef, permissionError: streamError } = useCameraStream(
    selectedDeviceId,
    camera.powerOn,
    streamRetryNonce
  )
  const hasPermissionError = devicesError || streamError

  const [cameraWidth, setCameraWidth] = useState(300)
  const [cameraHeight, setCameraHeight] = useState(300)
  const [cameraX, setCameraX] = useState(0)
  const [cameraY, setCameraY] = useState(0)

  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const currentDragPos = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const pulseGlowRef = useRef<HTMLDivElement | null>(null)
  // Fullscreen click-through overlay: the window swallows every click while
  // mouse capture is on, so track the state and always force it back off.
  const captureRef = useRef(false)

  const setCapture = useCallback((on: boolean) => {
    if (isLinux || !window.vyra) return
    if (captureRef.current === on) return
    captureRef.current = on
    if (on) {
      window.vyra.setIgnoreMouseEvents(false)
    } else {
      window.vyra.setIgnoreMouseEvents(true, { forward: true })
    }
  }, [])

  // Notify main about detected devices
  useEffect(() => {
    window.vyra?.syncDevices(devices.map((d) => ({ deviceId: d.deviceId, label: d.label })))
  }, [devices])

  const applySize = useCallback(() => {
    const { w, h } = computeBubbleGeometry(
      camera.size,
      camera.shape,
      camera.border.gradient,
      camera.border.width,
      camera.sidebarWidthPercentage
    )
    setCameraWidth(w)
    setCameraHeight(h)
    if (isLinux && window.vyra) {
      window.vyra.resizeCameraWindow(w, h)
    } else {
      setCameraX((prev) => Math.min(Math.max(0, prev), window.innerWidth - w))
      setCameraY((prev) => Math.min(Math.max(0, prev), window.innerHeight - h))
    }
  }, [
    camera.size,
    camera.shape,
    camera.border.gradient,
    camera.border.width,
    camera.sidebarWidthPercentage
  ])

  useEffect(() => {
    window.vyra
      ?.getInitialState()
      .then((state) => {
        const cam = state as unknown as {
          camera?: Record<string, unknown>
          isCameraOn?: boolean
        }
        const c = (cam.camera ?? {}) as Record<string, unknown>
        useCameraStore.getState().patch({
          selectedDeviceId: (c.selectedDeviceId as string) ?? '',
          isMirrored: (c.isMirrored as boolean) ?? true,
          shape: (c.shape as typeof camera.shape) ?? 'circle',
          size: (c.size as typeof camera.size) ?? 'sm',
          rounding: (c.rounding as number) ?? 24,
          alwaysOnTop: (c.alwaysOnTop as boolean) ?? true,
          opacity: (c.opacity as number) ?? 1,
          border: (c.border as typeof camera.border) ?? {
            gradient: 'none',
            width: 4,
            animated: false,
            pulse: false
          },
          effect: normalizeEffectId(c.effect),
          language: (c.language as 'en' | 'pt') ?? 'en',
          cameraScreenId: (c.cameraScreenId as string) ?? '',
          sidebarWidthPercentage: (c.sidebarWidthPercentage as number) ?? 35,
          sidebarPosition: (c.sidebarPosition as 'left' | 'right') ?? 'right',
          powerOn: cam.isCameraOn ?? false,
          initialized: true
        })
        if (c.x !== undefined) setCameraX(c.x as number)
        if (c.y !== undefined) setCameraY(c.y as number)
      })
      .catch((err) => console.error('[vyra] initial state load failed:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!camera.initialized) return undefined
    const raf = requestAnimationFrame(applySize)
    return () => cancelAnimationFrame(raf)
  }, [camera.initialized, applySize])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const handleResize = (): void => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(applySize, 120)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (timer) clearTimeout(timer)
    }
  }, [applySize])

  const snapTo = useCallback(
    (pos: SnapPosition) => {
      ui.setSnapping(true)
      const { x, y } = computeSnappedPosition(pos, cameraWidth, cameraHeight)
      setCameraX(x)
      setCameraY(y)
      window.vyra?.syncCameraPosition(x, y)
      if (isLinux) window.vyra?.moveCameraWindow(x, y)
    },
    [cameraWidth, cameraHeight, ui]
  )

  useCameraEvents({ snapTo, applySize })

  const pulseActive =
    camera.border.pulse && camera.powerOn && camera.size !== 'fullscreen' && !hasPermissionError
  useAudioPulse({ enabled: pulseActive, glowRef: pulseGlowRef })

  // ── Drag handling ─────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true
      ui.setDragging(true)
      if (containerRef.current) containerRef.current.style.transition = 'none'
      currentDragPos.current = { x: cameraX, y: cameraY }
      dragOffset.current = isLinux
        ? { x: e.clientX, y: e.clientY }
        : { x: e.clientX - cameraX, y: e.clientY - cameraY }
    },
    [cameraX, cameraY, ui]
  )

  // Safety net: while capturing, the window receives every mousemove.
  // If the cursor is outside the bubble, click-through must be back on —
  // this heals any missed mouseleave (fast moves, drags, forward:true quirks).
  useEffect(() => {
    const handleCaptureGuard = (e: MouseEvent): void => {
      if (!captureRef.current || isDragging.current) return
      const el = containerRef.current
      if (!el) {
        setCapture(false)
        return
      }
      const r = el.getBoundingClientRect()
      const margin = 4
      const inside =
        e.clientX >= r.left - margin &&
        e.clientX <= r.right + margin &&
        e.clientY >= r.top - margin &&
        e.clientY <= r.bottom + margin
      if (!inside) setCapture(false)
    }
    window.addEventListener('mousemove', handleCaptureGuard, true)
    return () => window.removeEventListener('mousemove', handleCaptureGuard, true)
  }, [setCapture])

  // Never hold mouse capture while the bubble is invisible (camera off).
  useEffect(() => {
    if (!camera.powerOn) setCapture(false)
  }, [camera.powerOn, setCapture])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (!isDragging.current) return
      if (isLinux) {
        const newX = e.screenX - dragOffset.current.x
        const newY = e.screenY - dragOffset.current.y
        currentDragPos.current = { x: newX, y: newY }
        window.vyra?.moveCameraWindow(newX, newY)
      } else {
        const newX = Math.min(
          Math.max(0, e.clientX - dragOffset.current.x),
          window.innerWidth - cameraWidth
        )
        const newY = Math.min(
          Math.max(0, e.clientY - dragOffset.current.y),
          window.innerHeight - cameraHeight
        )
        currentDragPos.current = { x: newX, y: newY }
        if (containerRef.current) {
          containerRef.current.style.left = `${newX}px`
          containerRef.current.style.top = `${newY}px`
        }
      }
    }
    const handleMouseUp = (): void => {
      if (isDragging.current) {
        isDragging.current = false
        ui.setDragging(false)
        if (!isLinux && containerRef.current) {
          containerRef.current.style.transition =
            'left 0.4s cubic-bezier(0.16, 1, 0.3, 1), top 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.4s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease'
        }
        setCameraX(currentDragPos.current.x)
        setCameraY(currentDragPos.current.y)
        window.vyra?.syncCameraPosition(currentDragPos.current.x, currentDragPos.current.y)
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [cameraWidth, cameraHeight, ui])

  // ── Screenshot capture of the camera frame ────────────────────────────────
  useEffect(() => {
    const off = window.vyra?.on('vyra-capture-camera-frame', () => {
      const video = videoRef.current
      if (!video || !video.videoWidth) return
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        // Bake the live effect into screenshots.
        try {
          ctx.filter = effectFilter(camera.effect)
        } catch {
          /* older canvas backends ignore filter */
        }
        if (camera.isMirrored) {
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        void window.vyra?.screenshotSaveCameraFrame(dataUrl)
      } catch (err) {
        console.error('[vyra] camera frame capture failed:', err)
      }
    })
    return off
  }, [camera.isMirrored, camera.effect, videoRef])

  const handleDetectionRetry = useCallback((): void => {
    refreshDevices()
    setStreamRetryNonce((n) => n + 1)
  }, [refreshDevices])

  if (!camera.initialized) return <div className="app-container" />

  const isFullscreen = camera.size === 'fullscreen'
  const hasBorder = camera.border.gradient !== 'none' && !isFullscreen
  const radius = isFullscreen
    ? '0'
    : camera.shape === 'circle'
      ? '50%'
      : camera.shape === 'pill'
        ? '999px'
        : `${camera.rounding}px`

  const bubble = (
    <div
      ref={containerRef}
      className="app-container"
      onMouseDown={handleMouseDown}
      onMouseEnter={() => {
        // Invisible bubble must never steal clicks from other apps.
        if (!isDragging.current && camera.powerOn) setCapture(true)
      }}
      onMouseLeave={() => {
        if (!isDragging.current) setCapture(false)
      }}
      style={{
        position: isFullscreen || isLinux ? 'relative' : 'absolute',
        left: isFullscreen || isLinux ? 0 : `${cameraX}px`,
        top: isFullscreen || isLinux ? 0 : `${cameraY}px`,
        width: isLinux ? '100%' : `min(${cameraWidth}px, 92vw)`,
        height: isLinux ? '100%' : `min(${cameraHeight}px, 88vh)`,
        maxWidth: '92vw',
        maxHeight: '88vh',
        pointerEvents: 'auto',
        padding: hasBorder ? `${camera.border.width}px` : '0px',
        borderRadius: radius,
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: camera.powerOn ? camera.opacity : 0,
        transition: ui.isDragging
          ? 'opacity 0.3s ease'
          : 'opacity 0.3s ease, left 0.4s cubic-bezier(0.16, 1, 0.3, 1), top 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.4s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease',
        zIndex: 1
      }}
    >
      {hasBorder && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: getGradient(camera.border.gradient, camera.border.animated),
            borderRadius: 'inherit',
            animation: camera.border.animated ? 'spinBorder 20s linear infinite' : 'none',
            zIndex: -1
          }}
        />
      )}
      {camera.border.pulse && !isFullscreen && !hasPermissionError && (
        <div
          aria-hidden
          ref={pulseGlowRef}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: 0,
            zIndex: 2
          }}
        />
      )}
      <div
        ref={videoWrapRef}
        style={{
          position: 'absolute',
          inset: hasBorder ? `${camera.border.width}px` : 0,
          borderRadius: camera.shape === 'circle' ? '50%' : radius,
          overflow: 'hidden'
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-view"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: camera.isMirrored ? 'scaleX(-1)' : 'scaleX(1)',
            filter: effectFilter(camera.effect) || undefined,
            display: hasPermissionError ? 'none' : 'block'
          }}
        />
        {effectById(camera.effect).vignette && !hasPermissionError && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.42) 100%)'
            }}
          />
        )}
        {camera.powerOn && !hasPermissionError && <CameraHud />}
      </div>
      {hasPermissionError && (
        <PermissionErrorOverlay language={camera.language} onRetry={handleDetectionRetry} />
      )}
      {ui.screenPermissionDenied && !hasPermissionError && (
        <ScreenPermissionErrorOverlay language={camera.language} />
      )}
      {ui.micPermissionDenied && !hasPermissionError && !ui.screenPermissionDenied && (
        <MicPermissionErrorOverlay language={camera.language} />
      )}
      {ui.recordingError &&
        !hasPermissionError &&
        !ui.screenPermissionDenied &&
        !ui.micPermissionDenied && (
          <RecordingErrorOverlay
            code={ui.recordingError.code}
            message={ui.recordingError.message}
            stderr={ui.recordingError.stderr}
            language={camera.language}
            onDismiss={() => ui.setRecordingError(null)}
          />
        )}
    </div>
  )

  if (isLinux || isFullscreen) {
    return <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>{bubble}</div>
  }

  return (
    <div style={{ width: '100vw', height: '100vh', pointerEvents: 'none', position: 'relative' }}>
      {bubble}
    </div>
  )
}

// Keep selectedDeviceId setter referenced (device switching flows through the store)
void useCameraStore.getState().patch

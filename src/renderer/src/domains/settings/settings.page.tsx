/**
 * VYRA Studio — Settings.
 * Categories: General, Camera, Appearance, Recording, Audio, Shortcuts,
 * Presets, Advanced. Compact, keyboard-friendly, no dashboard clutter.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Camera,
  Clapperboard,
  FolderOpen,
  Info,
  Keyboard,
  Layers,
  LayoutTemplate,
  Mic,
  Monitor,
  Palette,
  RotateCcw,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react'
import { t } from '../../../../shared/i18n'
import { GRADIENTS } from '../../../../shared/colors'
import { CAMERA_EFFECTS } from '../../../../shared/effects'
import { SHORTCUT_DEFINITIONS } from '../../../../shared/shortcuts'
import type {
  AppSettings,
  BorderConfig,
  CameraPreset,
  CameraShape,
  CameraSize,
  Scene,
  ShortcutAction
} from '../../../../shared/types'
import { useCameraStore } from '../../stores/camera.store'
import { useAudioDevices } from '../camera/hooks/use-audio-devices'
import { useAudioMeter } from './hooks/use-audio-meter'
import { Toggle } from './components/toggle'
import { PillGroup } from './components/pill-group'
import { SliderRow } from './components/slider-row'

type Tab =
  | 'general'
  | 'camera'
  | 'appearance'
  | 'recording'
  | 'audio'
  | 'shortcuts'
  | 'presets'
  | 'scenes'
  | 'advanced'

const TABS: { key: Tab; icon: React.ReactNode; labelKey: string }[] = [
  { key: 'general', icon: <SettingsIcon size={14} />, labelKey: 'settings.tab.general' },
  { key: 'camera', icon: <Camera size={14} />, labelKey: 'settings.tab.camera' },
  { key: 'appearance', icon: <Palette size={14} />, labelKey: 'settings.tab.appearance' },
  { key: 'recording', icon: <Clapperboard size={14} />, labelKey: 'settings.tab.recording' },
  { key: 'audio', icon: <Mic size={14} />, labelKey: 'settings.tab.audio' },
  { key: 'shortcuts', icon: <Keyboard size={14} />, labelKey: 'settings.tab.shortcuts' },
  { key: 'presets', icon: <LayoutTemplate size={14} />, labelKey: 'settings.tab.presets' },
  { key: 'scenes', icon: <Layers size={14} />, labelKey: 'settings.tab.scenes' },
  { key: 'advanced', icon: <Info size={14} />, labelKey: 'settings.tab.advanced' }
]

const SHAPES: CameraShape[] = [
  'circle',
  'rounded-rect',
  'square',
  'pill',
  'rect',
  'vertical-rect',
  'horizontal-rect'
]
const SIZES: CameraSize[] = ['xs', 'sm', 'md', 'lg', 'sidebar', 'fullscreen']
const POSITIONS = [
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right'
] as const

function encoderOptions(): { value: string; labelKey: string }[] {
  const options = [{ value: 'libx264', labelKey: 'settings.encoder.cpu' }]
  const ua = navigator.userAgent
  if (ua.indexOf('Mac') !== -1) {
    options.push({ value: 'h264_videotoolbox', labelKey: 'settings.encoder.mac' })
  } else if (ua.indexOf('Win') !== -1) {
    options.push(
      { value: 'h264_nvenc', labelKey: 'settings.encoder.nvidia' },
      { value: 'h264_qsv', labelKey: 'settings.encoder.intel' },
      { value: 'h264_amf', labelKey: 'settings.encoder.amd' }
    )
  }
  return options
}

export function SettingsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [snapshot, setSnapshot] = useState<AppSettings | null>(null)
  const [presets, setPresets] = useState<CameraPreset[]>([])

  useEffect(() => {
    void window.vyra
      ?.getInitialState()
      .then((state) => {
        setSnapshot(state as unknown as AppSettings)
        const cam = (state as unknown as { camera?: Record<string, unknown> }).camera ?? {}
        useCameraStore.getState().patch({
          ...(cam.shape !== undefined ? { shape: cam.shape as CameraShape } : {}),
          ...(cam.size !== undefined ? { size: cam.size as CameraSize } : {}),
          ...(cam.isMirrored !== undefined ? { isMirrored: cam.isMirrored as boolean } : {}),
          ...(cam.rounding !== undefined ? { rounding: cam.rounding as number } : {}),
          ...(cam.opacity !== undefined ? { opacity: cam.opacity as number } : {}),
          ...(cam.border !== undefined ? { border: cam.border as BorderConfig } : {}),
          ...(cam.effect !== undefined ? { effect: cam.effect as string } : {}),
          ...(cam.language !== undefined ? { language: cam.language as 'en' | 'pt' } : {}),
          ...(cam.alwaysOnTop !== undefined ? { alwaysOnTop: cam.alwaysOnTop as boolean } : {})
        })
      })
      .catch((err) => console.error('[vyra] settings load failed:', err))
    void window.vyra?.getPresets().then(setPresets)
  }, [])

  const language = snapshot?.camera?.language ?? 'en'

  const refreshPresets = useCallback((): void => {
    void window.vyra?.getPresets().then(setPresets)
  }, [])

  const commitCamera = useCallback((patch: Record<string, unknown>): void => {
    useCameraStore.getState().patch(patch as never)
    window.vyra?.updateCamera(patch)
  }, [])

  const tab = activeTab

  return (
    <div className="vyra-surface vyra-scroll settings-container">
      <style>{`
        .settings-container { width: 100%; height: 100%; overflow-y: auto; padding: 0 24px 20px; display: flex; flex-direction: column; }
        html[data-platform='darwin'] .settings-header { padding-top: 44px; }
        html[data-platform='win32'] .settings-header { padding-right: 140px; }
        .settings-header { -webkit-app-region: drag; cursor: default; user-select: none; padding-top: 16px; }
        .settings-header button, .settings-header input { -webkit-app-region: no-drag; }
      `}</style>

      <div className="settings-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="../../../assets/vyra-mark.svg"
            alt=""
            width={26}
            height={26}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
            {t('settings.title', language)}
          </h1>
          <span style={{ fontSize: 11, color: 'var(--color-faint)', marginTop: 2 }}>
            {t('app.tagline', language)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, margin: '12px 0 18px', flexWrap: 'wrap' }}>
        {TABS.map(({ key, icon, labelKey }) => (
          <button
            key={key}
            className={`vyra-pill ${tab === key ? 'vyra-pill--active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setActiveTab(key)}
          >
            {icon}
            {t(labelKey, language)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tab === 'general' && <GeneralTab language={language} commitCamera={commitCamera} />}
        {tab === 'camera' && <CameraTab language={language} commitCamera={commitCamera} />}
        {tab === 'appearance' && <AppearanceTab language={language} commitCamera={commitCamera} />}
        {tab === 'recording' && <RecordingTab language={language} />}
        {tab === 'audio' && <AudioTab language={language} />}
        {tab === 'shortcuts' && <ShortcutsTab language={language} />}
        {tab === 'presets' && (
          <PresetsTab language={language} presets={presets} refresh={refreshPresets} />
        )}
        {tab === 'scenes' && <ScenesTab language={language} presets={presets} />}
        {tab === 'advanced' && <AdvancedTab language={language} />}
      </div>
    </div>
  )
}

// ── Tabs ────────────────────────────────────────────────────────────────────

function GeneralTab({
  language,
  commitCamera
}: {
  language: 'en' | 'pt'
  commitCamera: (patch: Record<string, unknown>) => void
}): React.JSX.Element {
  return (
    <>
      <div className="vyra-row">
        <span className="vyra-label">{t('settings.language', language)}</span>
        <select
          className="vyra-select"
          style={{ width: 160 }}
          value={language}
          onChange={(e) => commitCamera({ language: e.target.value })}
        >
          <option value="en">English</option>
          <option value="pt">Português</option>
        </select>
      </div>
    </>
  )
}

function CameraTab({
  language,
  commitCamera
}: {
  language: 'en' | 'pt'
  commitCamera: (patch: Record<string, unknown>) => void
}): React.JSX.Element {
  const camera = useCameraStore()
  const [displays, setDisplays] = useState<{ id: string; label: string }[]>([])

  useEffect(() => {
    void window.vyra?.getDisplays().then(setDisplays)
  }, [])

  return (
    <>
      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.cameraMirror', language)}</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <Toggle
            active={camera.isMirrored}
            onChange={(v) => commitCamera({ isMirrored: v })}
            label={t('settings.cameraMirror', language)}
          />
          <Toggle
            active={camera.alwaysOnTop}
            onChange={(v) => commitCamera({ alwaysOnTop: v })}
            label={t('settings.cameraAlwaysOnTop', language)}
          />
        </div>
      </div>

      <SliderRow
        label={t('settings.cameraOpacity', language)}
        min={30}
        max={100}
        value={Math.round(camera.opacity * 100)}
        suffix="%"
        onChange={(v) => commitCamera({ opacity: v / 100 })}
        language={language}
      />

      <div className="vyra-row">
        <span className="vyra-label">{t('settings.cameraScreen', language)}</span>
        <select
          className="vyra-select"
          style={{ width: 220 }}
          value={camera.cameraScreenId}
          onChange={(e) => commitCamera({ cameraScreenId: e.target.value })}
        >
          <option value="">Primary</option>
          {displays.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

function AppearanceTab({
  language,
  commitCamera
}: {
  language: 'en' | 'pt'
  commitCamera: (patch: Record<string, unknown>) => void
}): React.JSX.Element {
  const camera = useCameraStore()
  const border = camera.border

  return (
    <>
      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.shape', language)}</span>
        <PillGroup
          options={SHAPES.map((s) => ({ value: s, label: t(`settings.shape.${s}`, language) }))}
          value={camera.shape}
          onChange={(v) => commitCamera({ shape: v })}
        />
      </div>

      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.size', language)}</span>
        <PillGroup
          options={SIZES.map((s) => ({ value: s, label: t(`settings.size.${s}`, language) }))}
          value={camera.size}
          onChange={(v) => commitCamera({ size: v })}
        />
      </div>

      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.position', language)}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {POSITIONS.map((p) => (
            <button key={p} className="vyra-pill" onClick={() => window.vyra?.setCameraPosition(p)}>
              {t(`settings.position.${p}`, language)}
            </button>
          ))}
        </div>
        <span className="vyra-hint">Free positioning: drag the camera anywhere on screen.</span>
      </div>

      <SliderRow
        label={t('settings.cameraRounding', language)}
        min={0}
        max={64}
        value={camera.rounding}
        suffix="px"
        onChange={(v) => commitCamera({ rounding: v })}
        language={language}
      />

      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.effects', language)}</span>
        <PillGroup
          options={CAMERA_EFFECTS.map((e) => ({
            value: e.id,
            label: t(`settings.effect.${e.id}`, language)
          }))}
          value={camera.effect}
          onChange={(v) => commitCamera({ effect: v })}
        />
      </div>

      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.border', language)}</span>
        <PillGroup
          options={[
            { value: 'none', label: t('settings.border.none', language) },
            ...Object.keys(GRADIENTS)
              .filter((k) => k !== 'none')
              .map((k) => ({ value: k, label: k }))
          ]}
          value={border.gradient}
          onChange={(v) => commitCamera({ border: { ...border, gradient: v } })}
        />
        {border.gradient !== 'none' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SliderRow
              label={t('settings.border.width', language)}
              min={1}
              max={20}
              value={border.width}
              suffix="px"
              onChange={(v) => commitCamera({ border: { ...border, width: v } })}
              language={language}
            />
            <Toggle
              active={border.animated}
              onChange={(v) => commitCamera({ border: { ...border, animated: v } })}
              label={t('settings.border.animated', language)}
            />
          </div>
        )}
        <Toggle
          active={border.pulse}
          onChange={(v) => commitCamera({ border: { ...border, pulse: v } })}
          label={t('settings.border.pulse', language)}
        />
      </div>
    </>
  )
}

function RecordingTab({ language }: { language: 'en' | 'pt' }): React.JSX.Element {
  const [rec, setRec] = useState<AppSettings['recording'] | null>(null)
  const encoders = useMemo(() => encoderOptions(), [])

  useEffect(() => {
    void window.vyra?.getInitialState().then((state) => {
      setRec((state as unknown as AppSettings).recording)
    })
  }, [])

  if (!rec) return <></>

  const patch = (p: Partial<AppSettings['recording']>): void => {
    setRec({ ...rec, ...p })
    window.vyra?.updateRecording(p)
  }

  return (
    <>
      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.recording.mode', language)}</span>
        <PillGroup
          options={[
            { value: 'screen', label: t('settings.recording.mode.screen', language) },
            { value: 'camera', label: t('settings.recording.mode.camera', language) },
            { value: 'screen+camera', label: t('settings.recording.mode.screen+camera', language) }
          ]}
          value={rec.mode}
          onChange={(v) => patch({ mode: v as AppSettings['recording']['mode'] })}
        />
        {rec.mode !== 'screen' && (
          <span className="vyra-hint">
            Camera modes record the camera window via capture; screen capture stays as implemented.
          </span>
        )}
      </div>

      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.recording.resolution', language)}</span>
        <PillGroup
          options={['720p', '1080p', '1440p', '2160p'].map((r) => ({ value: r, label: r }))}
          value={rec.resolution}
          onChange={(v) => patch({ resolution: v })}
        />
      </div>

      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.recording.fps', language)}</span>
        <PillGroup
          options={['30', '60'].map((f) => ({ value: f, label: `${f} FPS` }))}
          value={rec.fps}
          onChange={(v) => patch({ fps: v })}
        />
      </div>

      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.recording.encoder', language)}</span>
        <PillGroup
          options={encoders.map((e) => ({ value: e.value, label: t(e.labelKey, language) }))}
          value={rec.encoder}
          onChange={(v) => patch({ encoder: v })}
        />
      </div>

      <div className="vyra-row">
        <span className="vyra-label">{t('settings.recording.folder', language)}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
          <span
            className="vyra-hint"
            style={{
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={rec.folder}
          >
            {rec.folder || t('settings.recording.folder.default', language)}
          </span>
          <button
            className="vyra-btn"
            onClick={() =>
              void window.vyra?.chooseRecordingFolder().then((f) => f && patch({ folder: f }))
            }
          >
            <FolderOpen size={13} />
            {t('settings.recording.folder.choose', language)}
          </button>
          <button className="vyra-btn" onClick={() => void window.vyra?.openPath('recordings')}>
            <Monitor size={13} />
            {t('settings.recording.browse', language)}
          </button>
        </div>
      </div>
    </>
  )
}

function AudioTab({ language }: { language: 'en' | 'pt' }): React.JSX.Element {
  const { devices } = useAudioDevices()
  const [rec, setRec] = useState<AppSettings['recording'] | null>(null)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    void window.vyra?.getInitialState().then((state) => {
      setRec((state as unknown as AppSettings).recording)
    })
  }, [])

  useEffect(() => {
    let current: MediaStream | null = null
    const micId = rec?.selectedMicrophoneId
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: micId && micId !== 'default' ? { deviceId: { exact: micId } } : true
        })
        current = stream
        setMicStream(stream)
      } catch {
        setMicStream(null)
      }
    })()
    return () => {
      current?.getTracks().forEach((tr) => tr.stop())
    }
  }, [rec?.selectedMicrophoneId])

  const micLevel = useAudioMeter(micStream)

  if (!rec) return <></>

  const patch = (p: Partial<AppSettings['recording']>): void => {
    setRec({ ...rec, ...p })
    window.vyra?.updateRecording(p)
  }

  return (
    <>
      <div className="vyra-row vyra-row--column">
        <span className="vyra-label">{t('settings.audio.microphone', language)}</span>
        <select
          className="vyra-select"
          value={rec.selectedMicrophoneId}
          onChange={(e) => patch({ selectedMicrophoneId: e.target.value })}
        >
          <option value="default">{t('settings.audio.mic.default', language)}</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || d.deviceId.substring(0, 8)}
            </option>
          ))}
        </select>
        <div
          style={{
            height: 6,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${micLevel}%`,
              height: '100%',
              background: micLevel > 85 ? '#ff453a' : micLevel > 60 ? '#ffdb00' : '#34d399',
              transition: 'width 0.1s ease-out, background 0.1s ease-out'
            }}
          />
        </div>
      </div>

      <SliderRow
        label={t('settings.audio.micVolume', language)}
        min={0}
        max={100}
        value={rec.microphoneAudioVolume}
        suffix="%"
        onChange={(v) => patch({ microphoneAudioVolume: v })}
        language={language}
      />
      <SliderRow
        label={t('settings.audio.systemVolume', language)}
        min={0}
        max={100}
        value={rec.systemAudioVolume}
        suffix="%"
        onChange={(v) => patch({ systemAudioVolume: v })}
        language={language}
      />
    </>
  )
}

function ShortcutsTab({ language }: { language: 'en' | 'pt' }): React.JSX.Element {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({})
  const [listening, setListening] = useState<ShortcutAction | null>(null)

  useEffect(() => {
    void window.vyra?.getShortcuts().then(setShortcuts)
    const off = window.vyra?.on('settings-reset', (s: unknown) => {
      const snap = s as AppSettings
      if (snap?.shortcuts) setShortcuts(snap.shortcuts as Record<string, string>)
    })
    return off
  }, [])

  useEffect(() => {
    if (!listening) return
    const handle = (e: KeyboardEvent): void => {
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'Escape') {
        setListening(null)
        return
      }
      const mods = [
        'MetaLeft',
        'MetaRight',
        'ControlLeft',
        'ControlRight',
        'AltLeft',
        'AltRight',
        'ShiftLeft',
        'ShiftRight'
      ]
      if (mods.includes(e.code)) return
      const parts: string[] = []
      if (e.metaKey || e.ctrlKey) parts.push('CmdOrCtrl')
      if (e.altKey) parts.push('Alt')
      if (e.shiftKey) parts.push('Shift')
      const key = e.code.startsWith('Key')
        ? e.code.replace('Key', '')
        : e.code.startsWith('Digit')
          ? e.code.replace('Digit', '')
          : e.code === 'Space'
            ? 'Space'
            : e.key
      parts.push(key)
      const combo = parts.join('+')
      window.vyra?.updateShortcut(listening, combo)
      setShortcuts((prev) => ({ ...prev, [listening]: combo }))
      setListening(null)
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [listening])

  const globalDefs = SHORTCUT_DEFINITIONS.filter((d) => d.global)
  const localDefs = SHORTCUT_DEFINITIONS.filter((d) => !d.global)

  const renderRow = (def: (typeof SHORTCUT_DEFINITIONS)[number]): React.JSX.Element => (
    <div className="vyra-row" key={def.action}>
      <span className="vyra-label" style={{ fontSize: 13.5 }}>
        {def.action
          .replace(/([A-Z])/g, ' $1')
          .replace(/([a-z])(\d)/g, '$1 $2')
          .replace(/^./, (c) => c.toUpperCase())}
        {def.global && (
          <span style={{ fontSize: 10, color: 'var(--color-faint)', marginLeft: 8 }}>global</span>
        )}
      </span>
      <div
        className={`vyra-shortcut-key ${listening === def.action ? 'listening' : ''}`}
        onClick={() => setListening(def.action)}
        role="button"
      >
        {listening === def.action
          ? t('settings.pressKeys', language)
          : shortcuts[def.action] || t('settings.unbound', language)}
        <Keyboard size={13} style={{ opacity: 0.7 }} />
      </div>
    </div>
  )

  return (
    <>
      <span className="vyra-hint" style={{ marginBottom: 4 }}>
        {t('settings.shortcuts.note', language)}
      </span>
      <div className="vyra-section-title">Global</div>
      {globalDefs.map(renderRow)}
      <div className="vyra-section-title" style={{ marginTop: 12 }}>
        In-app (camera focused)
      </div>
      {localDefs.map(renderRow)}
      <button
        className="vyra-btn vyra-btn--danger"
        style={{ alignSelf: 'flex-start', marginTop: 12 }}
        onClick={() => {
          window.vyra?.resetSettings('shortcuts')
          void window.vyra?.getShortcuts().then(setShortcuts)
        }}
      >
        <RotateCcw size={13} />
        {t('settings.reset', language)}
      </button>
    </>
  )
}

function PresetsTab({
  language,
  presets,
  refresh
}: {
  language: 'en' | 'pt'
  presets: CameraPreset[]
  refresh: () => void
}): React.JSX.Element {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    void window.vyra?.getInitialState().then((state) => {
      setActiveId((state as unknown as AppSettings).activePresetId ?? '')
    })
  }, [])

  return (
    <>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="vyra-btn vyra-btn--primary"
          onClick={() => {
            void window.vyra?.presetsCreate({ name: 'My preset' }).then(refresh)
          }}
        >
          <Sparkles size={13} />
          {t('settings.presets.new', language)}
        </button>
        <button
          className="vyra-btn"
          onClick={() => {
            window.vyra?.presetsCapture('Captured preset')
            setTimeout(refresh, 200)
          }}
        >
          {t('settings.presets.capture', language)}
        </button>
      </div>

      {presets.map((p) => (
        <div className="vyra-row" key={p.id}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span className="vyra-label">
              {p.name}
              {p.builtin && (
                <span style={{ fontSize: 10, color: 'var(--color-faint)', marginLeft: 8 }}>
                  built-in
                </span>
              )}
            </span>
            <span className="vyra-hint">
              {t(`settings.shape.${p.shape}`, language)} · {t(`settings.size.${p.size}`, language)}{' '}
              · {t(`settings.position.${p.position}`, language)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              className={`vyra-pill ${activeId === p.id ? 'vyra-pill--active' : ''}`}
              onClick={() => {
                window.vyra?.presetsApply(p.id)
                setActiveId(p.id)
              }}
            >
              Apply
            </button>
            <button
              className="vyra-pill"
              title={t('settings.presets.duplicate', language)}
              onClick={() => void window.vyra?.presetsDuplicate(p.id).then(refresh)}
            >
              ⧉
            </button>
            {!p.builtin && (
              <button
                className="vyra-pill vyra-btn--danger"
                title={t('settings.presets.delete', language)}
                style={{ borderColor: 'rgba(255,69,58,0.4)', color: 'var(--color-danger)' }}
                onClick={() => void window.vyra?.presetsDelete(p.id).then(refresh)}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
      <span className="vyra-hint">{t('settings.presets.builtinHint', language)}</span>
    </>
  )
}

function ScenesTab({
  language,
  presets
}: {
  language: 'en' | 'pt'
  presets: CameraPreset[]
}): React.JSX.Element {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [activeId, setActiveId] = useState('')

  const refresh = useCallback((): void => {
    void window.vyra?.getInitialState().then((state) => {
      const snap = state as unknown as AppSettings
      setScenes(snap.scenes ?? [])
      setActiveId(snap.activeSceneId ?? '')
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const presetName = (id: string): string =>
    presets.find((p) => p.id === id)?.name ?? id

  return (
    <>
      <span className="vyra-hint" style={{ marginBottom: 4 }}>
        {t('settings.scenes.hint', language)}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="vyra-btn vyra-btn--primary"
          onClick={() => {
            void window.vyra?.scenesCreate('My scene').then(refresh)
          }}
        >
          <Sparkles size={13} />
          {t('settings.scenes.new', language)}
        </button>
        <button
          className="vyra-btn"
          onClick={() => {
            void window.vyra?.scenesCreate('Captured scene').then(refresh)
          }}
        >
          {t('settings.scenes.capture', language)}
        </button>
      </div>

      {scenes.map((s, i) => (
        <div className="vyra-row" key={s.id}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span className="vyra-label">
              {s.name}
              {s.builtin && (
                <span style={{ fontSize: 10, color: 'var(--color-faint)', marginLeft: 8 }}>
                  built-in
                </span>
              )}
              {i < 3 && (
                <kbd className="vyra-kbd" style={{ marginLeft: 8 }}>
                  F{5 + i}
                </kbd>
              )}
            </span>
            <span className="vyra-hint">{presetName(s.presetId)}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              className={`vyra-pill ${activeId === s.id ? 'vyra-pill--active' : ''}`}
              onClick={() => {
                window.vyra?.scenesApply(s.id)
                setActiveId(s.id)
              }}
            >
              Apply
            </button>
            {!s.builtin && (
              <button
                className="vyra-pill vyra-btn--danger"
                title={t('settings.scenes.delete', language)}
                style={{ borderColor: 'rgba(255,69,58,0.4)', color: 'var(--color-danger)' }}
                onClick={() => void window.vyra?.scenesDelete(s.id).then(refresh)}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
      <span className="vyra-hint">{t('settings.scenes.builtinHint', language)}</span>
    </>
  )
}

function AdvancedTab({ language }: { language: 'en' | 'pt' }): React.JSX.Element {
  return (
    <>
      <div className="vyra-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="vyra-label">{t('settings.advanced.omarchy', language)}</span>
          <span className="vyra-hint" style={{ maxWidth: 380 }}>
            {t('settings.advanced.omarchy.desc', language)}
          </span>
        </div>
      </div>
      <div className="vyra-row">
        <span className="vyra-label">{t('settings.advanced.openFolder', language)}</span>
        <button className="vyra-btn" onClick={() => void window.vyra?.openPath('settings')}>
          <FolderOpen size={13} />
          Open
        </button>
      </div>
      <div className="vyra-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="vyra-label">{t('settings.advanced.about', language)}</span>
          <span className="vyra-hint">
            VYRA Studio · Your camera. Your space. · All processing is local. No telemetry.
          </span>
        </div>
      </div>
    </>
  )
}

/**
 * VYRA Studio — Command Palette.
 * Fast, keyboard-first: type to filter, arrows to navigate, Enter to run.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Camera,
  Clapperboard,
  FlipHorizontal2,
  Image,
  Mic,
  Pin,
  Search,
  Settings,
  Sparkles
} from 'lucide-react'
import { t } from '../../../../shared/i18n'
import type { AppLanguage, CameraPreset } from '../../../../shared/types'

interface PaletteCommand {
  id: string
  group: string
  label: string
  hint?: string
  icon: React.ReactNode
  run: () => void
}

export function CommandPalettePage(): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [presets, setPresets] = useState<CameraPreset[]>([])
  const [lang, setLang] = useState<AppLanguage>('en')
  const [isRecording, setIsRecording] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // The palette lives in its own frameless window: never show OS scrollbars.
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    inputRef.current?.focus()
    void window.vyra?.getPresets().then((p) => setPresets(p))
    void window.vyra
      ?.getInitialState()
      .then((s) => {
        setLang(s.camera.language ?? 'en')
        setIsRecording(s.camera.isRecording ?? false)
        setIsCameraOn(s.isCameraOn ?? true)
      })
      .catch(() => undefined)
    const offEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') window.vyra?.closePalette()
    }
    window.addEventListener('keydown', offEsc)
    return () => {
      window.removeEventListener('keydown', offEsc)
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  const commands = useMemo<PaletteCommand[]>(() => {
    const iconSize = 15
    return [
      {
        id: 'toggle-camera',
        group: t('palette.group.camera', lang),
        label: isCameraOn ? t('tray.turnOff', lang) : t('tray.turnOn', lang),
        hint: 'camera',
        icon: <Camera size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('toggleCamera')
      },
      {
        id: 'mirror',
        group: t('palette.group.camera', lang),
        label: t('settings.cameraMirror', lang),
        hint: 'camera',
        icon: <FlipHorizontal2 size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('mirror')
      },
      {
        id: 'always-on-top',
        group: t('palette.group.camera', lang),
        label: t('settings.cameraAlwaysOnTop', lang),
        hint: 'camera',
        icon: <Pin size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('alwaysOnTop')
      },
      {
        id: 'start-recording',
        group: t('palette.group.recording', lang),
        label: isRecording
          ? t('tray.recording.stop', lang)
          : t('tray.recording.start', lang),
        hint: 'rec',
        icon: <Clapperboard size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('startRecording')
      },
      {
        id: 'screenshot',
        group: t('palette.group.recording', lang),
        label: t('tray.screenshot', lang),
        hint: 'png',
        icon: <Image size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('screenshot')
      },
      {
        id: 'mic-mute',
        group: t('palette.group.recording', lang),
        label: t('tray.micMute', lang),
        hint: 'audio',
        icon: <Mic size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('micMute')
      },
      {
        id: 'open-settings',
        group: t('palette.group.app', lang),
        label: t('tray.settings', lang),
        icon: <Settings size={iconSize} />,
        run: (): void => {
          window.vyra?.closePalette()
          window.vyra?.openSettings()
        }
      },
      ...presets.slice(0, 6).map((preset) => ({
        id: `preset-${preset.id}`,
        group: t('palette.group.presets', lang),
        label: preset.name,
        hint: 'preset',
        icon: <Sparkles size={iconSize} />,
        run: (): void => window.vyra?.paletteApplyPreset(preset.id)
      }))
    ]
  }, [presets, lang, isRecording, isCameraOn])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) =>
      `${c.label} ${c.group} ${c.hint ?? ''}`.toLowerCase().includes(q)
    )
  }, [commands, query])

  // Reset selection when the query changes (adjust-state-during-render pattern).
  const [prevQuery, setPrevQuery] = useState(query)
  if (prevQuery !== query) {
    setPrevQuery(query)
    setActiveIndex(0)
  }

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, filtered.length])

  const runCommand = (cmd: PaletteCommand | undefined): void => {
    if (!cmd) return
    cmd.run()
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runCommand(filtered[activeIndex])
    }
  }

  let lastGroup = ''

  return (
    <div className="vyra-palette-backdrop">
      <div className="vyra-palette" role="dialog" aria-label="VYRA command palette">
        <div className="vyra-palette-brand">
          <span className="vyra-palette-dot" />
          <span>VYRA</span>
        </div>
        <div className="vyra-palette-search">
          <Search size={16} className="vyra-palette-search-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('palette.placeholder', lang)}
            spellCheck={false}
          />
          <kbd className="vyra-kbd">esc</kbd>
        </div>
        <div className="vyra-palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="vyra-palette-empty">{t('palette.empty', lang)}</div>
          )}
          {filtered.map((cmd, i) => {
            const showGroup = cmd.group !== lastGroup
            lastGroup = cmd.group
            const isActive = i === activeIndex
            return (
              <React.Fragment key={cmd.id}>
                {showGroup && <div className="vyra-palette-group">{cmd.group}</div>}
                <button
                  ref={isActive ? activeRef : undefined}
                  className={`vyra-palette-item ${isActive ? 'vyra-palette-item--active' : ''}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => runCommand(cmd)}
                >
                  <span className="vyra-palette-icon">{cmd.icon}</span>
                  <span className="vyra-palette-label">{cmd.label}</span>
                  {isActive && <span className="vyra-palette-return">↵</span>}
                </button>
              </React.Fragment>
            )
          })}
        </div>
        <div className="vyra-palette-footer">
          <span>
            <kbd className="vyra-kbd">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="vyra-kbd">↵</kbd> run
          </span>
          <span>
            <kbd className="vyra-kbd">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}

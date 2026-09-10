/**
 * VYRA Studio — Command Palette.
 * Fast, keyboard-first: type to filter, arrows to navigate, Enter to run.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Camera,
  CameraOff,
  Circle,
  Clapperboard,
  Eye,
  EyeOff,
  Monitor,
  Moon,
  Settings,
  Square
} from 'lucide-react'
import { t } from '../../../../shared/i18n'
import type { CameraPreset } from '../../../../shared/types'

interface PaletteCommand {
  id: string
  group: string
  label: string
  icon: React.ReactNode
  run: () => void
}

export function CommandPalettePage(): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [presets, setPresets] = useState<CameraPreset[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    void window.vyra?.getPresets().then((p) => setPresets(p))
    const offEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') window.vyra?.closePalette()
    }
    window.addEventListener('keydown', offEsc)
    return () => window.removeEventListener('keydown', offEsc)
  }, [])

  const commands = useMemo<PaletteCommand[]>(() => {
    const lang = 'en'
    const iconSize = 15
    return [
      {
        id: 'toggle-camera',
        group: t('palette.group.camera', lang),
        label: 'Toggle camera',
        icon: <Camera size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('toggleCamera')
      },
      {
        id: 'hide-camera',
        group: t('palette.group.camera', lang),
        label: 'Hide camera',
        icon: <CameraOff size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('toggleCamera')
      },
      {
        id: 'show-camera',
        group: t('palette.group.camera', lang),
        label: 'Show camera',
        icon: <Eye size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('toggleCamera')
      },
      {
        id: 'start-recording',
        group: t('palette.group.recording', lang),
        label: 'Start / stop recording',
        icon: <Clapperboard size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('startRecording')
      },
      {
        id: 'stop-recording',
        group: t('palette.group.recording', lang),
        label: 'Stop recording',
        icon: <Square size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('startRecording')
      },
      {
        id: 'screenshot',
        group: t('palette.group.recording', lang),
        label: 'Take screenshot',
        icon: <Monitor size={iconSize} />,
        run: (): void => window.vyra?.paletteRunAction('screenshot')
      },
      {
        id: 'mic-mute',
        group: t('palette.group.recording', lang),
        label: 'Toggle microphone mute',
        icon: <Circle size={iconSize} />,
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
      {
        id: 'open-about',
        group: t('palette.group.app', lang),
        label: t('settings.advanced.about', lang),
        icon: <Moon size={iconSize} />,
        run: (): void => {
          window.vyra?.closePalette()
          window.vyra?.openSettings()
        }
      },
      ...presets.slice(0, 8).map((preset) => ({
        id: `preset-${preset.id}`,
        group: t('palette.group.presets', lang),
        label: `Preset: ${preset.name}`,
        icon: <Eye size={iconSize} />,
        run: (): void => window.vyra?.paletteApplyPreset(preset.id)
      }))
    ]
  }, [presets])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q))
  }, [commands, query])

  // Reset selection when the query changes (adjust-state-during-render pattern).
  const [prevQuery, setPrevQuery] = useState(query)
  if (prevQuery !== query) {
    setPrevQuery(query)
    setActiveIndex(0)
  }

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

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
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('palette.placeholder', 'en')}
          spellCheck={false}
        />
        <div className="vyra-palette-list vyra-scroll" ref={listRef}>
          {filtered.length === 0 && (
            <div className="vyra-palette-empty">{t('palette.empty', 'en')}</div>
          )}
          {filtered.map((cmd, i) => {
            const showGroup = cmd.group !== lastGroup
            lastGroup = cmd.group
            return (
              <React.Fragment key={cmd.id}>
                {showGroup && <div className="vyra-palette-group">{cmd.group}</div>}
                <button
                  className={`vyra-palette-item ${i === activeIndex ? 'vyra-palette-item--active' : ''}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => runCommand(cmd)}
                >
                  {cmd.icon}
                  <span>{cmd.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-faint)' }}>
                    {i === activeIndex ? '↵' : ''}
                  </span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
        <div
          style={{
            padding: '6px 14px',
            borderTop: '1px solid var(--color-line)',
            fontSize: 10,
            color: 'var(--color-faint)',
            display: 'flex',
            gap: 12
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}

void EyeOff

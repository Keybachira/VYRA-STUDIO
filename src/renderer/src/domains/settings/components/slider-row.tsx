import React from 'react'
import { t } from '../../../../../shared/i18n'

export function SliderRow({
  label,
  min,
  max,
  value,
  onChange,
  suffix,
  language,
  disabled
}: {
  label: string
  min: number
  max: number
  value: number
  onChange: (v: number) => void
  suffix?: string
  language: 'en' | 'pt'
  disabled?: boolean
}): React.JSX.Element {
  return (
    <div className="vyra-row vyra-row--column" style={{ opacity: disabled ? 0.4 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="vyra-label">{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-vyra)' }}>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        className="vyra-slider"
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label || t('settings.reset', language)}
      />
    </div>
  )
}

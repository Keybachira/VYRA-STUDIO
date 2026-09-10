import React from 'react'

export function PillGroup({
  options,
  value,
  onChange
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`vyra-pill ${value === opt.value ? 'vyra-pill--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

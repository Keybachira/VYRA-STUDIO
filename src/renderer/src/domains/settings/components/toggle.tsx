import React from 'react'

export function Toggle({
  active,
  onChange,
  label,
  disabled
}: {
  active: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}): React.JSX.Element {
  return (
    <button
      className={`vyra-toggle ${active ? 'vyra-toggle--active' : ''}`}
      onClick={() => !disabled && onChange(!active)}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <span className="vyra-toggle__knob" />
    </button>
  )
}

import { useState } from 'react'

export default function TextInputBar({ onSend, disabled }) {
  const [value, setValue] = useState('')

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: 'min(420px, 92vw)',
        background: 'rgba(20,20,22,0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(201,162,75,0.25)',
        borderRadius: 999,
        padding: '6px 6px 6px 16px',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type, or paste a link…"
        disabled={disabled}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#F5F3EE',
          fontFamily: '"Neue Montreal", "Söhne", sans-serif',
          fontWeight: 300,
          fontSize: 14,
        }}
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        style={{
          border: 'none',
          borderRadius: 999,
          padding: '8px 16px',
          background: value.trim() ? 'rgba(201,162,75,0.14)' : 'transparent',
          color: value.trim() ? '#E8CE8C' : '#8A8A8E',
          fontSize: 12,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: value.trim() && !disabled ? 'pointer' : 'default',
          transition: 'background 300ms ease, color 300ms ease',
        }}
      >
        Send
      </button>
    </div>
  )
}
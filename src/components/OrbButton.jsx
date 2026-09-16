import { useRef, useState } from 'react'

export default function OrbButton({ children, onClick, onMouseDown, onMouseUp, disabled, active, variant = 'gold' }) {
  const btnRef = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [pressed, setPressed] = useState(false)

  const handleMouseMove = (e) => {
    const rect = btnRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    setOffset({ x: ((e.clientX - cx) / rect.width) * 6, y: ((e.clientY - cy) / rect.height) * 6 })
  }

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 })
    setPressed(false)
  }

  const isDanger = variant === 'danger'
  const lit = isDanger || active // danger is ALWAYS lit, no toggle needed

  const colors = isDanger
    ? { border: '#E8837A', bg: 'rgba(214,80,70,0.16)', text: '#F0A199', glow: 'rgba(214,80,70,0.4)' }
    : { border: '#E8CE8C', bg: 'rgba(201,162,75,0.14)', text: '#E8CE8C', glow: 'rgba(232,206,140,0.35)' }

  return (
    <button
      ref={btnRef}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={(e) => { setPressed(true); onMouseDown?.(e) }}
      onMouseUp={(e) => { setPressed(false); onMouseUp?.(e) }}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '10px 22px',
        borderRadius: 999,
        border: `1px solid ${lit ? colors.border : 'rgba(201,162,75,0.35)'}`,
        background: lit ? colors.bg : 'rgba(20,20,22,0.55)',
        backdropFilter: 'blur(12px)',
        color: lit ? colors.text : '#F5F3EE',
        fontFamily: '"Neue Montreal", "Söhne", sans-serif',
        fontWeight: 300,
        fontSize: 13,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${pressed ? 0.94 : 1})`,
        boxShadow: lit ? `0 0 24px ${colors.glow}, inset 0 0 12px ${colors.glow}` : '0 0 0 rgba(0,0,0,0)',
        transition: pressed
          ? 'transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1)'
          : 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 400ms ease, border 400ms ease, background 400ms ease',
      }}
    >
      {children}
    </button>
  )
}
import { useEffect, useState } from 'react'

export default function LimitOverlay({ open, onDismiss, onUpgrade }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setVisible(true), 10) // next tick, lets initial style apply first
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [open])

  if (!open) return null

  const overlay = {
    position: 'fixed', inset: 0,
    background: visible ? 'rgba(5,5,6,0.85)' : 'rgba(5,5,6,0)',
    backdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
    transition: 'background 0.6s ease, backdrop-filter 0.6s ease',
  }
  const box = {
    width: 420, background: '#141416', border: '1px solid #C9A24B', borderRadius: 6,
    padding: '32px 36px', color: '#F5F3EE', fontFamily: "'Inter', sans-serif",
    textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
    transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
  }
  const btn = (primary) => ({
    background: 'transparent', border: `1px solid ${primary ? '#C9A24B' : '#8A8A8E'}`,
    color: primary ? '#E8CE8C' : '#F5F3EE', padding: '10px 22px', borderRadius: 4,
    cursor: 'pointer', fontSize: 13,
  })

  return (
    <div style={overlay}>
      <div style={box}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: '#E8CE8C', marginBottom: 8 }}>
          The Orb has lost its patience.
        </div>
        <div style={{ fontSize: 11, color: '#8A8A8E', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 26 }}>
          (demo key usage limit reached)
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button style={btn(false)} onClick={onDismiss}>Well, okay</button>
          <button style={btn(true)} onClick={onUpgrade}>Upgrade my status</button>
        </div>
      </div>
    </div>
  )
}
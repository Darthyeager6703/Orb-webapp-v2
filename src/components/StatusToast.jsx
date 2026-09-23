import { useState, useEffect } from 'react'

export default function StatusToast({ message, visible, variant = 'default' }) {
  const [rendered, setRendered] = useState(false)
  useEffect(() => {
    if (visible) setRendered(true)
    else { const t = setTimeout(() => setRendered(false), 400); return () => clearTimeout(t) }
  }, [visible])
  if (!rendered) return null

  const isError = variant === 'error'

  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 10}px)`,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      background: isError ? 'rgba(139,30,30,0.15)' : '#141416',
      border: `1px solid ${isError ? 'rgba(220,60,60,0.5)' : 'rgba(201,162,75,0.4)'}`,
      borderRadius: 6, padding: '10px 18px',
      color: isError ? '#E88' : '#8A8A8E',
      fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: '0.02em',
      zIndex: 40, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  )
}
import { useState, useRef, useEffect } from 'react'

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onOutside() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onOutside])
}

export default function CostRatesMenu({ open, onClose, inputRate, outputRate, onSave, anchorStyle }) {
  const [localInput, setLocalInput] = useState(inputRate)
  const [localOutput, setLocalOutput] = useState(outputRate)
  const ref = useRef(null)
  useClickOutside(ref, onClose)

  if (!open) return null

  return (
    <div ref={ref} style={{
      position: 'absolute', ...anchorStyle,
      background: '#141416', border: '1px solid #C9A24B', borderRadius: 4,
      padding: '14px 16px', color: '#F5F3EE', fontFamily: "'Inter', sans-serif",
      fontSize: 12, minWidth: 200, zIndex: 15,
    }}>
      <div style={{ color: '#8A8A8E', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        Cost per 1M tokens ($)
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
        <span style={{ width: 50 }}>Input</span>
        <input type="number" step="0.01" value={localInput} onChange={(e) => setLocalInput(e.target.value)}
          style={{ flex: 1, background: '#0A0A0B', border: '1px solid #8A8A8E', color: '#F5F3EE', padding: '4px 6px', borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        <span style={{ width: 50 }}>Output</span>
        <input type="number" step="0.01" value={localOutput} onChange={(e) => setLocalOutput(e.target.value)}
          style={{ flex: 1, background: '#0A0A0B', border: '1px solid #8A8A8E', color: '#F5F3EE', padding: '4px 6px', borderRadius: 3 }} />
      </div>
      <button
        onClick={() => { onSave(parseFloat(localInput) || 0, parseFloat(localOutput) || 0); onClose() }}
        style={{ width: '100%', background: 'transparent', border: '1px solid #C9A24B', color: '#E8CE8C', padding: '6px', borderRadius: 3, cursor: 'pointer', fontSize: 12 }}
      >
        Save
      </button>
    </div>
  )
}
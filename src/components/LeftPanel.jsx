import { useState, useRef, useEffect } from 'react'
import { GearSixIcon, UserSoundIcon, CurrencyDollarIcon } from '@phosphor-icons/react'
import { getTokenTotals, setTokenTotals, getCostBreakdown } from '../lib/costTracker'


function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside()
      }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onOutside])
}

const iconWrap = {
  width: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  cursor: 'pointer',
  border: '1px solid transparent',
  transition: 'border-color 0.3s',
}

const panelBase = {
  position: 'absolute',
  left: 60,
  background: '#141416',
  border: '1px solid #C9A24B',
  borderRadius: 4,
  padding: '16px 18px',
  color: '#F5F3EE',
  fontFamily: "'Inter', sans-serif",
  fontSize: 13,
  minWidth: 220,
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  zIndex: 10,
}

export default function LeftPanel({
  voices,
  selectedVoice,
  onSelectVoice,
  onOpenSettings,
  inputRate,
  outputRate,
  onSaveRates,
}) {
  const [open, setOpen] = useState(null) // 'voice' | 'rates' | null
  const panelRef = useRef(null)
  useClickOutside(panelRef, () => setOpen(null))
  const toggle = (name) => setOpen((prev) => (prev === name ? null : name))
  
  const [localInput, setLocalInput] = useState(inputRate)
  const [localOutput, setLocalOutput] = useState(outputRate)

  const [localInputTokens, setLocalInputTokens] = useState(getTokenTotals().input)
  const [localOutputTokens, setLocalOutputTokens] = useState(getTokenTotals().output)

  useEffect(() => {
  const id = setInterval(() => {
    const t = getTokenTotals()
    setLocalInputTokens(t.input)
    setLocalOutputTokens(t.output)
  }, 1000)
  return () => clearInterval(id)
}, [])

  return (
    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 5 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={iconWrap} onClick={onOpenSettings}>
          <GearSixIcon size={26} weight="duotone" color="#8A8A8E" />
        </div>
        <div
          style={{ ...iconWrap, borderColor: open === 'voice' ? '#C9A24B' : 'transparent' }}
          onClick={() => toggle('voice')}
        >
          <UserSoundIcon size={26} weight="duotone" color={open === 'voice' ? '#E8CE8C' : '#8A8A8E'} />
        </div>
        <div
          style={{ ...iconWrap, borderColor: open === 'rates' ? '#C9A24B' : 'transparent' }}
          onClick={() => toggle('rates')}
        >
          <CurrencyDollarIcon size={26} weight="duotone" color={open === 'rates' ? '#E8CE8C' : '#8A8A8E'} />
        </div>
      </div>

      {open && (
        <div ref={panelRef} style={{ ...panelBase, top: open === 'voice' ? 54 : 108 }}>
          {open === 'voice' && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8A8E', marginBottom: 8 }}>
                Voice
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {voices.map((v) => (
                  <div
                    key={v}
                    onClick={() => { onSelectVoice(v); setOpen(null) }}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 3,
                      cursor: 'pointer',
                      color: v === selectedVoice ? '#E8CE8C' : '#F5F3EE',
                      background: v === selectedVoice ? 'rgba(201,162,75,0.12)' : 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,162,75,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = v === selectedVoice ? 'rgba(201,162,75,0.12)' : 'transparent')}
                  >
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}

          {open === 'rates' && (
  <div>
    <div style={{ fontSize: 10.5, lineHeight: 1.5, color: '#8A8A8E', marginBottom: 12 }}>
      Keep in mind that this is essentially just a generalized cost — adjust rates to match your provider.
      Adjust the output token rate for any reasoning and other intermediate token costs accordingly.
    </div>

    <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8A8E', marginBottom: 8 }}>
      Input tokens
    </div>
    <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
      <input
        type="number" value={localInputTokens}
        onChange={(e) => { const n = parseInt(e.target.value) || 0; setLocalInputTokens(n); setTokenTotals(n, localOutputTokens) }}
        style={{ width: 70, background: '#0A0A0B', border: '1px solid #8A8A8E', color: '#F5F3EE', padding: '4px 6px', borderRadius: 3 }}
      />
      <span style={{ color: '#8A8A8E' }}>×</span>
      <input
        type="number" step="0.01" value={localInput}
        onChange={(e) => setLocalInput(e.target.value)}
        style={{ width: 55, background: '#0A0A0B', border: '1px solid #8A8A8E', color: '#F5F3EE', padding: '4px 6px', borderRadius: 3 }}
      />
      <span style={{ color: '#8A8A8E' }}>=</span>
      <input
        type="text" readOnly
        value={`$${getCostBreakdown().inputCost.toFixed(6)}`}
        style={{ width: 70, background: 'rgba(201,162,75,0.06)', border: '1px solid rgba(201,162,75,0.35)', color: '#E8CE8C', padding: '4px 6px', borderRadius: 3 }}
      />
    </div>

    <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8A8E', margin: '10px 0 8px' }}>
      Output tokens
    </div>
    <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
      <input
        type="number" value={localOutputTokens}
        onChange={(e) => { const n = parseInt(e.target.value) || 0; setLocalOutputTokens(n); setTokenTotals(localInputTokens, n) }}
        style={{ width: 70, background: '#0A0A0B', border: '1px solid #8A8A8E', color: '#F5F3EE', padding: '4px 6px', borderRadius: 3 }}
      />
      <span style={{ color: '#8A8A8E' }}>×</span>
      <input
        type="number" step="0.01" value={localOutput}
        onChange={(e) => setLocalOutput(e.target.value)}
        style={{ width: 55, background: '#0A0A0B', border: '1px solid #8A8A8E', color: '#F5F3EE', padding: '4px 6px', borderRadius: 3 }}
      />
      <span style={{ color: '#8A8A8E' }}>=</span>
      <input
        type="text" readOnly
        value={`$${getCostBreakdown().outputCost.toFixed(6)}`}
        style={{ width: 70, background: 'rgba(201,162,75,0.06)', border: '1px solid rgba(201,162,75,0.35)', color: '#E8CE8C', padding: '4px 6px', borderRadius: 3 }}
      />
    </div>

    <div style={{ borderTop: '1px solid rgba(201,162,75,0.2)', paddingTop: 10, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#8A8A8E', fontSize: 11 }}>Total estimate</span>
      <span style={{ color: '#E8CE8C', fontSize: 13, fontWeight: 500 }}>
        ${getCostBreakdown().totalCost.toFixed(6)}
      </span>
    </div>

    <button
      onClick={() => { onSaveRates(parseFloat(localInput) || 0, parseFloat(localOutput) || 0); setOpen(null) }}
      style={{ width: '100%', background: 'transparent', border: '1px solid #C9A24B', color: '#E8CE8C', padding: '6px', borderRadius: 3, cursor: 'pointer', fontSize: 12 }}
    >
      Save
    </button>
  </div>
)}
        </div>
      )}
    </div>
  )
}
import { useState, useRef, useEffect } from 'react'

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onOutside])
}

const iconStyle = {
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#8A8A8E',
  border: '1px solid transparent',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 18,
  transition: 'color 0.3s, border-color 0.3s',
}

const activeIconStyle = {
  ...iconStyle,
  color: '#E8CE8C',
  borderColor: '#C9A24B',
}

const panelBase = {
  position: 'absolute',
  left: 56,
  background: '#141416',
  border: '1px solid #C9A24B',
  borderRadius: 4,
  padding: '14px 16px',
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
  apiKeyMode,
  onApiKeyModeChange,
  customApiKey,
  onCustomApiKeyChange,
}) {
  const [open, setOpen] = useState(null) // 'settings' | 'voice' | 'about' | null
  const panelRef = useRef(null)

  useClickOutside(panelRef, () => setOpen(null))

  const toggle = (name) => setOpen((prev) => (prev === name ? null : name))

  return (
    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 5 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={open === 'settings' ? activeIconStyle : iconStyle} onClick={() => toggle('settings')}>⚙</div>
        <div style={open === 'voice' ? activeIconStyle : iconStyle} onClick={() => toggle('voice')}>🗣</div>
        <div style={open === 'about' ? activeIconStyle : iconStyle} onClick={() => toggle('about')}>i</div>
      </div>

      {open && (
        <div ref={panelRef} style={{ ...panelBase, top: open === 'settings' ? 0 : open === 'voice' ? 48 : 96 }}>
          {open === 'settings' && (
            <div>
              <div style={{ color: '#C9A24B', letterSpacing: 1, marginBottom: 10, fontSize: 11, textTransform: 'uppercase' }}>Model Source</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                <input type="radio" checked={apiKeyMode === 'default'} onChange={() => onApiKeyModeChange('default')} />
                Use built-in key
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                <input type="radio" checked={apiKeyMode === 'custom'} onChange={() => onApiKeyModeChange('custom')} />
                Use my own Groq key
              </label>
              {apiKeyMode === 'custom' && (
                <input
                  type="password"
                  placeholder="gsk_..."
                  value={customApiKey}
                  onChange={(e) => onCustomApiKeyChange(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: 6,
                    background: '#0A0A0B',
                    border: '1px solid #8A8A8E',
                    borderRadius: 3,
                    color: '#F5F3EE',
                    padding: '6px 8px',
                    fontSize: 12,
                  }}
                />
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', opacity: 0.5 }}>
                <input type="radio" disabled />
                Local model (coming soon)
              </label>
            </div>
          )}

          {open === 'voice' && (
            <div>
              <div style={{ color: '#C9A24B', letterSpacing: 1, marginBottom: 8, fontSize: 11, textTransform: 'uppercase' }}>Voice</div>
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

          {open === 'about' && (
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: '#E8CE8C', marginBottom: 6 }}>Made with intent.</div>
              <div style={{ color: '#8A8A8E', marginBottom: 10, lineHeight: 1.5 }}>
                A voice interface built for the sake of building it well.
              </div>
              <a
                href="https://github.com/yourusername/yourrepo"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#C9A24B', textDecoration: 'none', borderBottom: '1px solid #C9A24B' }}
              >
                View on GitHub →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}    

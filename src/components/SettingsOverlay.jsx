import { useState } from 'react'

const PROVIDERS = [
  { id: 'groq', label: 'Groq' },
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic (Claude)' },
]

export default function SettingsOverlay({
  open,
  onClose,
  provider,
  onProviderChange,
  apiKeys,
  onApiKeyChange,
  useLocalModel,
  onUseLocalModelChange,
}) {
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(5,5,6,0.75)',
        backdropFilter: 'blur(4px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460, background: '#141416', border: '1px solid #C9A24B',
          borderRadius: 6, padding: '28px 32px', color: '#F5F3EE',
          fontFamily: "'Inter', sans-serif", boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: '#E8CE8C', marginBottom: 20 }}>
          Settings
        </div>

        <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8A8E', marginBottom: 8 }}>
          Model Source
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
          <input type="radio" checked={!useLocalModel} onChange={() => onUseLocalModelChange(false)} />
          Use an API key
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
          <input type="radio" checked={useLocalModel} onChange={() => onUseLocalModelChange(true)} />
          Run locally in-browser (large download, needs a capable device)
        </label>

        {!useLocalModel && (
          <>
            <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8A8E', marginBottom: 8 }}>
              Provider
            </div>
            <select
              value={provider}
              onChange={(e) => onProviderChange(e.target.value)}
              style={{
                width: '100%', background: '#0A0A0B', border: '1px solid #8A8A8E',
                borderRadius: 4, color: '#F5F3EE', padding: '8px 10px', marginBottom: 16, fontSize: 13,
              }}
            >
              {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>

            <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#8A8A8E', marginBottom: 8 }}>
              API Key
            </div>
            <input
              type="password"
              placeholder="Paste your key"
              value={apiKeys[provider] || ''}
              onChange={(e) => onApiKeyChange(provider, e.target.value)}
              style={{
                width: '100%', background: '#0A0A0B', border: '1px solid #8A8A8E',
                borderRadius: 4, color: '#F5F3EE', padding: '8px 10px', fontSize: 13,
              }}
            />
            <div style={{ fontSize: 11, color: '#8A8A8E', marginTop: 8, lineHeight: 1.5 }}>
              Stored only in this browser session. Leave blank to use the built-in demo key.
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid #C9A24B', color: '#E8CE8C',
              padding: '8px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 13,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
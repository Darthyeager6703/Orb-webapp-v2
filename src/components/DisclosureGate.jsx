import { useEffect, useState } from 'react'

const points = [
  'Speech recognition and voice generation run entirely in your browser — your voice and audio never reach a server.',
  'First load downloads the AI models directly to your device — a few hundred MB, one time, cached after.',
  'Works best in Chrome or Edge on desktop. Needs WebGPU — other browsers or older devices may be slower or unsupported.',
  'This demo key has a limited number of requests. Bring your own key in Settings for unlimited use.',
  'Any key you enter stays in this browser only — sent only to the provider itself, never stored elsewhere.',
  'On weaker hardware, voice generation may occasionally stumble and fall back automatically to a lighter and less human-like mode.',
]

export default function DisclosureGate({ onDismiss }) {
  const [visible, setVisible] = useState(false)
  const [shownCount, setShownCount] = useState(0)

  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t0)
  }, [])

//   useEffect(() => {
//   if (!visible) return
//   const t = setTimeout(() => setDrawDone(true), 1500) // 0.3s delay + 1.1s draw + small buffer
//   return () => clearTimeout(t)
// }, [visible])

  useEffect(() => {
    if (!visible) return
    if (shownCount >= points.length) return
    const t = setTimeout(() => setShownCount((c) => c + 1), 90)
    return () => clearTimeout(t)
  }, [visible, shownCount])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: visible ? 'rgba(5,5,6,0.88)' : 'rgba(5,5,6,0)',
        backdropFilter: visible ? 'blur(10px)' : 'blur(0px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, transition: 'background 0.7s ease, backdrop-filter 0.7s ease',
      }}
    >
      <div
        style={{
          width: 500,
          maxWidth: '90vw',
          padding: '40px 44px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
          transition: 'opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
        }}
      >
        {/* gold line draws in above the title */}
        <div style={{ position: 'relative', height: 1, marginBottom: 24, background: 'rgba(201,162,75,0.15)' }}>
  <div style={{
    position: 'absolute', left: 0, top: 0, height: 1,
    width: visible ? '100%' : '0%',
    background: 'linear-gradient(90deg, transparent, #C9A24B)',
    transition: 'width 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
  }} />
</div>

        <div style={{
          fontFamily: "'Fraunces', 'Canela', serif", fontWeight: 300, fontSize: 24,
          color: '#F5F3EE', letterSpacing: '0.01em', marginBottom: 28,
        }}>
          Before you begin
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {points.map((p, i) => (
            <div
              key={i}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                opacity: i < shownCount ? 1 : 0,
                transform: i < shownCount ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
              }}
            >
              <div style={{
                width: 4, height: 4, borderRadius: '50%', background: '#C9A24B',
                marginTop: 8, flexShrink: 0,
              }} />
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: 13.5,
                lineHeight: 1.55, color: '#C9C9CC',
              }}>
                {p}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          opacity: shownCount >= points.length ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent', border: '1px solid #C9A24B', color: '#E8CE8C',
              padding: '11px 28px', borderRadius: 3, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: 12.5, letterSpacing: '0.08em',
              textTransform: 'uppercase', transition: 'background 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,162,75,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  )
}
import { useEffect, useRef } from 'react'
import ResponseText from './ResponseText'

export default function ConversationPanel({ messages, open }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div
      className='conversation-panel'
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: 'min(420px, 92vw)',
        padding: '80px 28px 28px',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, rgba(10,10,11,0.3), rgba(10,10,11,0.85))',
        backdropFilter: 'blur(18px)',
        borderLeft: '1px solid rgba(201,162,75,0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        zIndex: 10,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'transform 550ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease',
      }}
    >
      {messages.map((m, i) => (
        <div
          key={i}
          style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '88%',
            padding: m.role === 'user' ? '10px 16px' : '4px 0',
            borderRadius: m.role === 'user' ? 16 : 0,
            background: m.role === 'user' ? 'rgba(201,162,75,0.1)' : 'transparent',
            border: m.role === 'user' ? '1px solid rgba(201,162,75,0.25)' : 'none',
            color: m.role === 'user' ? '#E8CE8C' : '#F5F3EE',
            fontSize: m.role === 'user' ? 14 : 15,
            animation: 'msg-in 420ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {m.role === 'user' ? m.text : <ResponseText text={m.text} />}

          {m.role === 'assistant' && m.usage && (
            <div
              style={{
                fontSize: 10,
                color: '#8A8A8E',
                marginTop: 6,
                letterSpacing: '0.03em',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Sent: {m.usage.prompt_tokens} · Received: {m.usage.completion_tokens} · Total: {m.usage.total_tokens}
            </div>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
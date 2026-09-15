import { useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import MorphOrb from './components/MorphOrb'

export default function App() {
  const [amplitude, setAmplitude] = useState(0)
  const [voiceState, setVoiceState] = useState('idle')
  const decayRef = useRef(null)

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onboundary = () => {
      setAmplitude(1)
      clearTimeout(decayRef.current)
      decayRef.current = setTimeout(() => setAmplitude(0.15), 80)
    }
    utterance.onstart = () => {
      setVoiceState('speaking')
      setAmplitude(0.15)
    }
    utterance.onend = () => {
      clearTimeout(decayRef.current)
      setAmplitude(0)
      setVoiceState('idle')
    }
    speechSynthesis.speak(utterance)
  }

  const deform = voiceState === 'listening' ? 0.06 + amplitude * 0.12 : 0
  const split = voiceState === 'speaking' || voiceState === 'thinking' ? 1 : 0

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1, display: 'flex', gap: 8 }}>
        <button onClick={() => speak('This is a test of the voice system, checking if the orb reacts properly.')}>Test Speak</button>
        <button onClick={() => setVoiceState('idle')}>Idle</button>
        <button onClick={() => setVoiceState('listening')}>Listening</button>
        <button onClick={() => setVoiceState('thinking')}>Thinking</button>
      </div>
      <div style={{ width: 'min(60vw, 60vh, 400px)', height: 'min(60vw, 60vh, 400px)' }}>
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]}>
          <MorphOrb deform={deform} split={split} mode={voiceState} radius={0.6} />
        </Canvas>
      </div>
    </div>
  )
}
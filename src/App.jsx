import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useState, useRef } from 'react'
import Orb from './components/Orb'
import Droplets from './components/Droplets'

export default function App() {
  const [amplitude, setAmplitude] = useState(0)
  const decayRef = useRef(null)

  const [voiceState, setVoiceState] = useState('listening') // idle | listening | thinking | speaking

// in render:
{(voiceState === 'idle' || voiceState === 'speaking') && (
  <Orb deform={voiceState === 'speaking' ? 0.35 + amplitude * 0.6 : 0} radius={0.6} />
)}
{(voiceState === 'listening' || voiceState === 'thinking') && (
  <Droplets mode={voiceState} />
)}

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text)

    utterance.onboundary = () => {
      // pulse on each word/syllable boundary
      setAmplitude(1)
      clearTimeout(decayRef.current)
      decayRef.current = setTimeout(() => setAmplitude(0.15), 80)
    }

    utterance.onstart = () => setAmplitude(0.15)
    utterance.onend = () => {
      clearTimeout(decayRef.current)
      setAmplitude(0)
    }

    speechSynthesis.speak(utterance)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={() => speak("This is a test of the voice system, checking if the orb reacts properly.")} style={{ position: 'absolute', top: 20, left: 20, zIndex: 1 }}>
        Test Speak
      </button>
      <div style={{ width: 'min(60vw, 60vh, 400px)', height: 'min(60vw, 60vh, 400px)' }}>
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]}>
          <ambientLight intensity={0.3} />
          <pointLight position={[2, 2, 2]} intensity={0.8} color="#E8CE8C" />
          <Orb amplitude={amplitude} radius={0.6} />
        </Canvas>
      </div>
    </div>
  )
}
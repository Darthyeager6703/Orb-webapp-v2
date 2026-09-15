import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import MorphOrb from './components/MorphOrb'
import VoicePicker from './components/VoicePicker'
import { askGroq } from './lib/groq'
import { loadKokoro, generateSpeech } from './lib/kokoro'
import ResponseText from './components/ResponseText'

export default function App() {
  const [amplitude, setAmplitude] = useState(0)
  const [voiceState, setVoiceState] = useState('idle') // idle | listening | thinking | speaking
  const [voice, setVoice] = useState('af_bella')
  const [voices, setVoices] = useState(['af_bella'])
  const [modelReady, setModelReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [reply, setReply] = useState('')

  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    loadKokoro((p) => {
      if (p?.progress != null) setLoadProgress(Math.round(p.progress))
    }).then((tts) => {
      if (tts.voices) setVoices(Object.keys(tts.voices))
      setModelReady(true)
    })
  }, [])

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.connect(audioCtxRef.current.destination)
    }
    return audioCtxRef.current
  }

  const trackAmplitude = () => {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)
    const avg = data.reduce((a, b) => a + b, 0) / data.length / 255
    setAmplitude(avg)
    rafRef.current = requestAnimationFrame(trackAmplitude)
  }

  const speak = async (text) => {
    if (!modelReady) return
    const ctx = getAudioCtx()
    const result = await generateSpeech(text, voice) // { audio: Float32Array, sampling_rate }

    const buffer = ctx.createBuffer(1, result.audio.length, result.sampling_rate)
    buffer.copyToChannel(result.audio, 0)

    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(analyserRef.current)

    setVoiceState('speaking')
    trackAmplitude()

    src.onended = () => {
      cancelAnimationFrame(rafRef.current)
      setAmplitude(0)
      setVoiceState('idle')
    }

    src.start()
  }

  const handleAsk = async (question) => {
  setVoiceState('thinking')
  try {
    const text = await askGroq(question)
    setReply(text)
    await speak(text)
  } catch (err) {
    console.error(err)
    setVoiceState('idle')
  }
}

  const deform =
    voiceState === 'listening' ? 0.05 :
    voiceState === 'speaking' ? 0.06 + amplitude * 0.12 :
    0

  const split = voiceState === 'thinking' || voiceState === 'speaking' ? 1 : 0

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0A0A0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => handleAsk('What can you help me with?')} disabled={!modelReady}>
          {modelReady ? 'Test Ask' : `Loading model ${loadProgress}%`}
        </button>
        <button onClick={() => setVoiceState('idle')}>Idle</button>
        <button onClick={() => setVoiceState('listening')}>Listening</button>
        <button onClick={() => setVoiceState('thinking')}>Thinking</button>
        <VoicePicker voice={voice} setVoice={setVoice} voices={voices} />
      </div>

      <div style={{ width: 'min(60vw, 60vh, 400px)', height: 'min(60vw, 60vh, 400px)' }}>
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]}>
          <MorphOrb deform={deform} split={split} mode={voiceState} radius={0.6} />
        </Canvas>
      </div>
      <ResponseText text={reply} />
    </div>
  )
}
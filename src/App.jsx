import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import MorphOrb from './components/MorphOrb'
import LeftPanel from './components/LeftPanel'
import OrbButton from './components/OrbButton'
import ConversationPanel from './components/ConversationPanel'
import { askGroq } from './lib/groq'
import { loadKokoro, generateSpeech } from './lib/kokoro'
import { loadWhisper, transcribe } from './lib/whisper'
import { blobToWhisperInput } from './lib/audio'
import { stripMarkdownForSpeech } from './lib/text'
import CameraRig from './components/CameraRig'
import SettingsOverlay from './components/SettingsOverlay'
import Footer from './components/Footer'
import { canSendRequest, recordUsage, getUsageSummary } from './lib/usage'
import { setRates, getRates, addUsage, getCostBreakdown } from './lib/costTracker'


export default function App() {
  const [amplitude, setAmplitude] = useState(0)
  const [voiceState, setVoiceState] = useState('idle')
  const [voice, setVoice] = useState('af_bella')
  const [voices, setVoices] = useState(['af_bella'])
  const [modelReady, setModelReady] = useState(false)
  const [sttReady, setSttReady] = useState(false)
  const [messages, setMessages] = useState([])

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [provider, setProvider] = useState('groq')
  const [apiKeys, setApiKeys] = useState({})
  const [useLocalModel, setUseLocalModel] = useState(false)

  const [apiKeyMode, setApiKeyMode] = useState('default')
  const [customApiKey, setCustomApiKey] = useState('')

  const [usage, setUsage] = useState(getUsageSummary())
  const [rates, setRatesState] = useState(getRates())
  const [totalCost, setTotalCost] = useState(0)

  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  const sourceRef = useRef(null)
  const abortRef = useRef(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    loadKokoro().then((v) => { if (v?.length) setVoices(v); setModelReady(true) })
    loadWhisper().then(() => setSttReady(true))
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
    setAmplitude(data.reduce((a, b) => a + b, 0) / data.length / 255)
    rafRef.current = requestAnimationFrame(trackAmplitude)
  }

  const speak = async (displayText, spokenText = displayText, reqUsage = null) => {
  if (!modelReady) return
  const ctx = getAudioCtx()
  const result = await generateSpeech(spokenText, voice)
  if (cancelledRef.current) return

  const buffer = ctx.createBuffer(1, result.audio.length, result.sampling_rate)
  buffer.copyToChannel(result.audio, 0)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.connect(analyserRef.current)
  sourceRef.current = src

  setMessages((m) => [...m, { role: 'assistant', text: displayText, usage: reqUsage }])
  setVoiceState('speaking')
  trackAmplitude()

  src.onended = () => {
    cancelAnimationFrame(rafRef.current)
    setAmplitude(0)
    setVoiceState('idle')
    sourceRef.current = null
  }
  src.start()
}

  const handleAsk = async (question) => {
  const usingDemoKey = apiKeyMode === 'default'

  if (usingDemoKey) {
    const check = canSendRequest(question)
    if (!check.ok) {
      console.warn('Blocked:', check.reason)
      return
    }
  }

  cancelledRef.current = false
  setMessages((m) => [...m, { role: 'user', text: question }])
  setVoiceState('thinking')
  abortRef.current = new AbortController()
  const activeKey = apiKeyMode === 'custom' && customApiKey ? customApiKey : undefined
  try {
    const { text, usage: reqUsage } = await askGroq(question, abortRef.current.signal, activeKey)
    if (usingDemoKey) setUsage(recordUsage(reqUsage))
    if (usingDemoKey) {
  addUsage(reqUsage)
  const {totalCost: newTotal} = getCostBreakdown()
  setTotalCost(newTotal)
}
    if (cancelledRef.current) return
    await speak(text, stripMarkdownForSpeech(text), reqUsage) // pass usage through to speak()
  } catch (err) {
    if (err.name !== 'AbortError') console.error(err)
    if (!cancelledRef.current) setVoiceState('idle')
  }
}

  const interrupt = () => {
    cancelledRef.current = true
    abortRef.current?.abort()
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch { }
      sourceRef.current = null
    }
    cancelAnimationFrame(rafRef.current)
    setAmplitude(0)
    setVoiceState('idle')
  }

  const startListening = async () => {
    if (!sttReady) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStreamRef.current = stream
    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.start()
    recorderRef.current = recorder
    setVoiceState('listening')
  }

  const stopListening = async () => {
    const recorder = recorderRef.current
    if (!recorder) return
    const stopped = new Promise((resolve) => { recorder.onstop = resolve })
    recorder.stop()
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    await stopped

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
    const audioFloat32 = await blobToWhisperInput(blob)
    setVoiceState('thinking')
    const question = await transcribe(audioFloat32)
    if (question?.trim()) await handleAsk(question)
    else setVoiceState('idle')
  }

  const deform =
    voiceState === 'listening' ? 0.05 :
      voiceState === 'speaking' ? 0.06 + amplitude * 0.12 :
        0
  const split = voiceState === 'thinking' || voiceState === 'speaking' ? 1 : 0

  const statusLabel = { idle: '', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking…' }[voiceState]

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, #141416 0%, #0A0A0B 55%, #050506 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <LeftPanel
        voices={voices}
        selectedVoice={voice}
        onSelectVoice={setVoice}
        onOpenSettings={() => setSettingsOpen(true)}
        inputRate={rates.input}
        outputRate={rates.output}
        onSaveRates={(i, o) => { setRates(i, o); setRatesState({ input: i, output: o }) }}
      />
      <SettingsOverlay
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        provider={provider}
        onProviderChange={setProvider}
        apiKeys={apiKeys}
        onApiKeyChange={(p, key) => setApiKeys((prev) => ({ ...prev, [p]: key }))}
        useLocalModel={useLocalModel}
        onUseLocalModelChange={setUseLocalModel}
      />

      <div
        style={{
          position: 'absolute',
          width: 560,
          height: 560,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,162,75,0.09), transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          textAlign: 'center',
          color: '#8A8A8E',
          fontFamily: '"Neue Montreal", "Söhne", sans-serif',
          fontWeight: 300,
          fontSize: 13,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          opacity: statusLabel ? 1 : 0,
          transition: 'opacity 500ms ease',
        }}
      >
        {statusLabel}
      </div>

      <div style={{ width: 'min(60vw, 60vh, 400px)', height: 'min(60vw, 60vh, 400px)' }}>
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]}>
          <MorphOrb deform={deform} split={split} mode={voiceState} radius={0.6} />
          <CameraRig />
        </Canvas>
      </div>

      <div style={{ position: 'absolute', bottom: 40, display: 'flex', gap: 12, alignItems: 'center', zIndex: 5 }}>
        <OrbButton
          onMouseDown={startListening}
          onMouseUp={stopListening}
          disabled={!sttReady || !modelReady}
          active={voiceState === 'listening'}
        >
          {sttReady && modelReady ? 'Hold to Talk' : 'Loading…'}
        </OrbButton>

        {(voiceState === 'thinking' || voiceState === 'speaking') && (
          <OrbButton onClick={interrupt} variant="danger">
            Stop
          </OrbButton>
        )}
      </div>

      <ConversationPanel messages={messages} />
      <SettingsOverlay
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        provider={provider}
        onProviderChange={setProvider}
        apiKeys={apiKeys}
        onApiKeyChange={(p, key) => setApiKeys((prev) => ({ ...prev, [p]: key }))}
        useLocalModel={useLocalModel}
        onUseLocalModelChange={setUseLocalModel}
      />
      {apiKeyMode === 'default' && (
  <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20, fontSize: 11, color: '#8A8A8E' }}>
    {usage.requestsLeft} requests · {usage.tokensLeft.toLocaleString()} tokens left
  </div>
)}
      <Footer />
    </div>
  )
}
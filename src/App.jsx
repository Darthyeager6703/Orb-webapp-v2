import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import MorphOrb from './components/MorphOrb'
import LeftPanel from './components/LeftPanel'
import OrbButton from './components/OrbButton'
import ConversationPanel from './components/ConversationPanel'
import CostBreakdown from './components/CostBreakdown'
import { askGroq } from './lib/groq'
import { loadKokoro, generateSpeech } from './lib/kokoro'
import { loadWhisper, transcribe } from './lib/whisper'
import { blobToWhisperInput } from './lib/audio'
import { stripMarkdownForSpeech } from './lib/text'
import CameraRig from './components/CameraRig'
import SettingsOverlay from './components/SettingsOverlay'
import Footer from './components/Footer'
import { canSendRequest, recordUsage, getUsageSummary, lockUsage, isLocked } from './lib/usage'
import { setRates, getRates, addUsage } from './lib/costTracker'
import LimitOverlay from './components/LimitOverlay'
import UpgradeGate from './components/UpgradeGate'
import TextInputBar from './components/TextInputBar'
import StatusToast from './components/StatusToast'

const PANEL_WIDTH_PX = 420
const SPINE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

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
  const [costPanelOpen, setCostPanelOpen] = useState(false)

  const [locked, setLocked] = useState(isLocked())
  const [limitOverlayOpen, setLimitOverlayOpen] = useState(false)
  const [upgradeStep, setUpgradeStep] = useState(0)

  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

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

  useEffect(() => {
    if (apiKeyMode === 'custom' && customApiKey) setLocked(false)
  }, [apiKeyMode, customApiKey])

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

  const speak = async (displayText, spokenText = displayText, reqUsage = null, hitLimit = false) => {
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
      setLocked(hitLimit)
      if (hitLimit) setLimitOverlayOpen(true)
    }
    src.start()
  }

  const showToast = (msg, duration = 3000) => {
  setToastMessage(msg)
  setToastVisible(true)
  setTimeout(() => setToastVisible(false), duration)
}

  const handleAsk = async (question, isRetry = false, retryCount = 0) => {
  const MAX_RETRIES = 2
  const usingDemoKey = apiKeyMode === 'default'

  if (usingDemoKey) {
    const check = canSendRequest(question)
    if (!check.ok) {
      if (['request_cap', 'token_cap', 'locked'].includes(check.reason)) {
        setLocked(true)
        setLimitOverlayOpen(true)
      }
      return
    }
  }

  cancelledRef.current = false
  if (!isRetry) setMessages((m) => [...m, { role: 'user', text: question }])
  setVoiceState('thinking')
  abortRef.current = new AbortController()
  const activeKey = apiKeyMode === 'custom' && customApiKey ? customApiKey : undefined

  try {
    const { text, usage: reqUsage, toolsUsed } = await askGroq(question, abortRef.current.signal, activeKey)

    addUsage(reqUsage)

    let hitLimit = false
    if (usingDemoKey) {
      const newUsage = recordUsage(reqUsage)
      setUsage(newUsage)
      hitLimit = newUsage.requestsLeft <= 0 || newUsage.tokensLeft <= 0
      if (hitLimit) lockUsage()
    }
    if (cancelledRef.current) return
    await speak(text, stripMarkdownForSpeech(text), reqUsage, hitLimit)
  } catch (err) {
    if (err.message === 'RATE_LIMITED') {
      if (retryCount >= MAX_RETRIES) {
        showToast("Groq's overloaded right now — try again in a bit.", 4000)
        setVoiceState('idle')
        return
      }
      showToast(`Groq's a little busy — retrying in ${Math.ceil(err.waitMs / 1000)}s`, err.waitMs + 1000)
      setTimeout(() => handleAsk(question, true, retryCount + 1), err.waitMs)
      return
    }
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
    if (!sttReady || locked) return
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
  const panelOpen = messages.length > 0

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, #141416 0%, #0A0A0B 55%, #050506 100%)',
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
      <StatusToast message={toastMessage} visible={toastVisible} />

      {/* THE STAGE — a real box with real width. Shrinks from 100% to (100% - panel width)
          when the panel opens. Everything inside it centers relative to ITS OWN bounds,
          not the viewport — so as it narrows, the center point moves correctly, for real,
          not via a browser-behavior guess. */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          width: panelOpen ? `calc(100% - ${PANEL_WIDTH_PX}px)` : '100%',
          transition: `width 550ms ${SPINE_EASE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 560,
            height: 560,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,162,75,0.09), transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />

        {/* orb — the only plain-flow child inside the stage, so flex centers exactly this
            within the stage's own (shrinking) box */}
        <div
          style={{
            width: 'min(60vw, 60vh, 400px)',
            height: 'min(60vw, 60vh, 400px)',
            filter: locked ? 'grayscale(1) brightness(1.25)' : 'none',
            transition: 'filter 0.8s ease',
          }}
        >
          <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]}>
            <MorphOrb deform={deform} split={split} mode={voiceState} radius={0.6} />
            <CameraRig />
          </Canvas>
        </div>

        {/* status + controls anchored to the STAGE's own center line (left: 50% of the stage,
            not the viewport) — this is what actually fixes the overlap: their center point
            is mathematically tied to the stage's width, so it moves in lockstep with the orb */}
        <div
          style={{
            position: 'absolute',
            bottom: '26%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#8A8A8E',
            fontFamily: '"Neue Montreal", "Söhne", sans-serif',
            fontWeight: 300,
            fontSize: 13,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: statusLabel ? 1 : 0,
            transition: 'opacity 500ms ease',
            whiteSpace: 'nowrap',
          }}
        >
          {statusLabel}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            alignItems: 'center',
            zIndex: 5,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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

          <TextInputBar onSend={handleAsk} disabled={voiceState === 'thinking' || voiceState === 'speaking'} />
        </div>
      </div>

      <ConversationPanel messages={messages} open={panelOpen} />

      <LimitOverlay
        open={limitOverlayOpen}
        onDismiss={() => setLimitOverlayOpen(false)}
        onUpgrade={() => { setLimitOverlayOpen(false); setUpgradeStep(1) }}
      />
      <UpgradeGate
        step={upgradeStep}
        onYes={() => setUpgradeStep(2)}
        onOkay={() => setUpgradeStep(0)}
      />

      {apiKeyMode === 'default' && (
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div
            onClick={() => setCostPanelOpen((v) => !v)}
            style={{ fontSize: 11, color: '#8A8A8E', cursor: 'pointer' }}
          >
            {usage.requestsLeft} requests · {usage.tokensLeft.toLocaleString()} tokens left
          </div>
          {costPanelOpen && <CostBreakdown />}
        </div>
      )}
      <Footer />
    </div>
  )
}
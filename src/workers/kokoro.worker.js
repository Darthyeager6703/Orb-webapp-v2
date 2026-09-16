import { KokoroTTS } from 'kokoro-js'

let ttsPromise = null

self.onmessage = async (e) => {
  const { type, text, voice, id } = e.data

  if (type === 'load') {
    ttsPromise = KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'fp32',
      device: 'webgpu',
    })
      .catch(() =>
        KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8' })
      )
      .then((tts) => {
        self.postMessage({ type: 'ready', voices: Object.keys(tts.voices ?? {}) })
        return tts
      })
    return
  }

  if (type === 'generate') {
    const tts = await ttsPromise
    const result = await tts.generate(text, { voice })
    self.postMessage(
      { type: 'result', id, audio: result.audio, sampling_rate: result.sampling_rate },
      [result.audio.buffer]
    )
  }
}
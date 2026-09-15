import { KokoroTTS } from 'kokoro-js'

let ttsInstance = null
let loadingPromise = null

export function loadKokoro(onProgress) {
  if (ttsInstance) return Promise.resolve(ttsInstance)
  if (loadingPromise) return loadingPromise

  loadingPromise = KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'q8',
    device: 'webgpu',
    progress_callback: onProgress,
  })
    .catch(() =>
      KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: 'q8',
        progress_callback: onProgress,
      })
    )
    .then((tts) => {
      ttsInstance = tts
      return tts
    })

  return loadingPromise
}

export async function generateSpeech(text, voice = 'af_bella') {
  if (!ttsInstance) throw new Error('Kokoro not loaded yet')
  return ttsInstance.generate(text, { voice })
}

export function listVoices() {
  return ttsInstance ? Object.keys(ttsInstance.voices ?? {}) : []
}
import { pipeline } from '@huggingface/transformers'

let transcriberPromise = null

self.onmessage = async (e) => {
  const { type, audio, id } = e.data

  if (type === 'load') {
    transcriberPromise = pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny.en', {
      dtype: 'q8',
    }).then((t) => {
      self.postMessage({ type: 'ready' })
      return t
    })
    return
  }

  if (type === 'transcribe') {
    const transcriber = await transcriberPromise
    const result = await transcriber(audio)
    self.postMessage({ type: 'result', id, text: result.text })
  }
}
let worker = null
let readyResolve
const readyPromise = new Promise((res) => { readyResolve = res })
const pending = new Map()
let reqId = 0

let forceWasm = false

export function forceWasmMode() {
  forceWasm = true
}


export function loadKokoro() {
  if (!worker) {
    worker = new Worker(new URL('../workers/kokoro.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      if (e.data.type === 'ready') readyResolve(e.data.voices)
      if (e.data.type === 'result') {
        const resolve = pending.get(e.data.id)
        if (resolve) {
          resolve({ audio: e.data.audio, sampling_rate: e.data.sampling_rate })
          pending.delete(e.data.id)
        }
      }
    }
    worker.postMessage({ type: 'load' })
  }
  return readyPromise
}

export function generateSpeech(text, voice) {
  return new Promise((resolve, reject) => {
    const id = reqId++
    pending.set(id, resolve)
     worker.postMessage({ type: 'generate', id, text, voice, device: forceWasm ? 'wasm' : 'webgpu' })
  })
}

export function splitIntoSentences(text) {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text]
  return sentences.map((s) => s.trim()).filter(Boolean)
}
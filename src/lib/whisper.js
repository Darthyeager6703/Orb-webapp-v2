let worker = null
let readyResolve
const readyPromise = new Promise((res) => { readyResolve = res })
const pending = new Map()
let reqId = 0

export function loadWhisper() {
  if (!worker) {
    worker = new Worker(new URL('../workers/whisper.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      if (e.data.type === 'ready') readyResolve()
      if (e.data.type === 'result') {
        const resolve = pending.get(e.data.id)
        if (resolve) {
          resolve(e.data.text)
          pending.delete(e.data.id)
        }
      }
    }
    worker.postMessage({ type: 'load' })
  }
  return readyPromise
}

export function transcribe(audioFloat32) {
  const id = reqId++
  return new Promise((resolve) => {
    pending.set(id, resolve)
    worker.postMessage({ type: 'transcribe', audio: audioFloat32, id }, [audioFloat32.buffer])
  })
}
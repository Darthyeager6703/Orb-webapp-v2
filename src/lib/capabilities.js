// lib/capabilities.js
export async function checkWebGPUSupport() {
  if (!navigator.gpu) return { supported: false, reason: 'no_webgpu' }
  try {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) return { supported: false, reason: 'no_adapter' }
    return { supported: true }
  } catch {
    return { supported: false, reason: 'request_failed' }
  }
}

export async function getGpuTier() {
  if (!navigator.gpu) return 'none'
  try {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) return 'none'
    const info = adapter.info || {}
    // Basic heuristic: discrete/dedicated GPUs report vendor names distinct from Intel iGPU strings
    const isIntel = /intel/i.test(info.vendor || info.description || '')
    return isIntel ? 'integrated' : 'dedicated'
  } catch {
    return 'unknown'
  }
}
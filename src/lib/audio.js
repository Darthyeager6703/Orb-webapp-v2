export async function blobToWhisperInput(blob) {
  const arrayBuffer = await blob.arrayBuffer()
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const decoded = await ctx.decodeAudioData(arrayBuffer)

  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000)
  const src = offline.createBufferSource()
  src.buffer = decoded
  src.connect(offline.destination)
  src.start()
  const rendered = await offline.startRendering()
  ctx.close()
  return rendered.getChannelData(0)
}
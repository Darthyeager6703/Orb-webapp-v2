export function stripMarkdownForSpeech(text) {
  let clean = text

  // Replace markdown tables entirely with a short spoken cue
  clean = clean.replace(/(\|.+\|\n)(\|[-: ]+\|\n)((\|.+\|\n?)+)/g, ' Here are the details, shown below. ')

  clean = clean.replace(/```[\s\S]*?```/g, ' See the code below. ') // fenced code blocks
  clean = clean.replace(/`([^`]+)`/g, '$1') // inline code
  clean = clean.replace(/\*\*(.+?)\*\*/g, '$1') // bold
  clean = clean.replace(/\*(.+?)\*/g, '$1') // italic
  clean = clean.replace(/#{1,6}\s+/g, '') // headers
  clean = clean.replace(/\[(.+?)\]\(.+?\)/g, '$1') // links → just the text
  clean = clean.replace(/^[-*+]\s+/gm, '') // list bullets
  clean = clean.replace(/\n{2,}/g, '. ') // collapse blank lines into pauses

  return clean.trim()
}
import {loadState, saveState} from './storage'

const MAX_REQUESTS = 10
const MAX_TOTAL_TOKENS = 20000
const MAX_INPUT_CHARS = 4000

const saved = loadState()
let state = saved.usage || { requestCount: 0, totalTokens: 0, history: [] }
let locked = saved.locked || false

function persist() {
  saveState({ usage: state, locked })
}

export function isLocked() { return locked }
export function lockUsage() { locked = true; persist() }

export function canSendRequest(inputText) {
  if (locked) return { ok: false, reason: 'locked' }
  if (inputText.length > MAX_INPUT_CHARS) return { ok: false, reason: 'input_too_long' }
  if (state.requestCount >= MAX_REQUESTS) return { ok: false, reason: 'request_cap' }
  if (state.totalTokens >= MAX_TOTAL_TOKENS) return { ok: false, reason: 'token_cap' }
  return { ok: true }
}

export function recordUsage(usage) {
  state.requestCount += 1
  state.totalTokens += usage.total_tokens
  state.history.push(usage)
  persist();
  return getUsageSummary()
}

export function getUsageSummary() {
  return {
    requestCount: state.requestCount,
    requestsLeft: Math.max(0, MAX_REQUESTS - state.requestCount),
    totalTokens: state.totalTokens,
    tokensLeft: Math.max(0, MAX_TOTAL_TOKENS - state.totalTokens),
  }
}
export function resetUsage() {
  state = { requestCount: 0, totalTokens: 0, history: [] }
}
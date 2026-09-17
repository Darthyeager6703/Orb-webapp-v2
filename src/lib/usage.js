const MAX_REQUESTS = 10
const MAX_TOTAL_TOKENS = 20000 // tune this — rough ceiling for ~10 modest exchanges
const MAX_INPUT_CHARS = 4000 // crude pre-send guard, ~1000 tokens worth, blocks the "quintillion token" case

let state = {
  requestCount: 0,
  totalTokens: 0,
  history: [], // { promptTokens, completionTokens, totalTokens, timestamp }
}

export function canSendRequest(inputText) {
  if (inputText.length > MAX_INPUT_CHARS) {
    return { ok: false, reason: 'input_too_long' }
  }
  if (state.requestCount >= MAX_REQUESTS) {
    return { ok: false, reason: 'request_cap' }
  }
  if (state.totalTokens >= MAX_TOTAL_TOKENS) {
    return { ok: false, reason: 'token_cap' }
  }
  return { ok: true }
}

export function recordUsage(usage) {
  state.requestCount += 1
  state.totalTokens += usage.total_tokens
  state.history.push({
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    timestamp: Date.now(),
  })
  return getUsageSummary()
}

export function getUsageSummary() {
  return {
    requestCount: state.requestCount,
    requestsLeft: MAX_REQUESTS - state.requestCount,
    totalTokens: state.totalTokens,
    tokensLeft: Math.max(0, MAX_TOTAL_TOKENS - state.totalTokens),
    history: state.history,
  }
}

export function resetUsage() {
  state = { requestCount: 0, totalTokens: 0, history: [] }
}
let rates = { input: 0, output: 0 } // per 1M tokens, user-set
let totalInputTokens = 0
let totalOutputTokens = 0

export function setRates(input, output) {
  rates = { input, output }
}

export function getRates() {
  return rates
}

export function addUsage(usage) {
  totalInputTokens += usage.prompt_tokens || 0
  totalOutputTokens += usage.completion_tokens || 0
}

export function getTokenTotals() {
  return { input: totalInputTokens, output: totalOutputTokens }
}

export function setTokenTotals(input, output) {
  totalInputTokens = input
  totalOutputTokens = output
}

export function getCostBreakdown() {
  console.log('COST CALC — rates:', rates, 'tokens:', totalInputTokens, totalOutputTokens)
  const inputCost = (totalInputTokens / 1_000_000) * rates.input
  const outputCost = (totalOutputTokens / 1_000_000) * rates.output
  return { inputCost, outputCost, totalCost: inputCost + outputCost }
}
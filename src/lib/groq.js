import { searchWikipedia, geocodeLocation } from './tools'
import { toolSchemas } from './toolSchemas'

const toolFns = { searchWikipedia, geocodeLocation }

const SYSTEM_PROMPT = `You are a confident, concise assistant with a quiet, understated tone. No filler openers, no unnecessary hedging.

Use the available tools whenever a question needs current facts, specific locations, or verifiable information you might not know precisely. Don't guess when a tool can check.

You may use markdown formatting including fenced code blocks when it aids clarity.`

async function callGroq(messages, signal, key, tools, retries = 2) {
  const body = JSON.stringify({ model: 'openai/gpt-oss-20b', messages, tools, temperature: 0.7 })

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body,
  })

  if ((res.status === 413 || res.status === 429) && retries > 0) {
    const errData = await res.json().catch(() => null)
    const match = errData?.error?.message?.match(/try again in ([\d.]+)s/i)
    const waitMs = match ? Math.min(parseFloat(match[1]) * 1000 + 500, 15000) : 1500
    const err = new Error('RATE_LIMITED')
    err.waitMs = waitMs
    throw err
  }

  if (!res.ok) throw new Error(`Groq error: ${res.status} — ${await res.text()}`)
  return res.json()
}

export async function askGroq(userMessage, signal, apiKeyOverride) {
  const key = apiKeyOverride || import.meta.env.VITE_GROQ_API_KEY

  let messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]

  let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  let toolsUsed = []

  for (let i = 0; i < 3; i++) {
    const data = await callGroq(messages, signal, key, toolSchemas)
    const msg = data.choices[0].message

    totalUsage.prompt_tokens += data.usage.prompt_tokens
    totalUsage.completion_tokens += data.usage.completion_tokens
    totalUsage.total_tokens += data.usage.total_tokens

    if (!msg.tool_calls) {
      return { text: msg.content, usage: totalUsage, toolsUsed }
    }

    messages.push(msg)
    for (const call of msg.tool_calls) {
      const fn = toolFns[call.function.name]
      const args = JSON.parse(call.function.arguments)
      toolsUsed.push(call.function.name)
      let result
      try {
        result = await fn(...Object.values(args))
      } catch (err) {
        result = { error: String(err) }
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) })
    }
  }

  return { text: 'Ran out of tool-call attempts — try rephrasing.', usage: totalUsage, toolsUsed }
}
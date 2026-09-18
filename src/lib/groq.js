import { searchWikipedia, searchDuckDuckGo, geocodeLocation } from './tools'
import { toolSchemas } from './toolSchemas'

const toolFns = { searchWikipedia, searchDuckDuckGo, geocodeLocation }

async function callGroq(messages, signal, key, tools) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages,
      tools,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status} — ${await res.text()}`)
  return res.json()
}

export async function askGroq(userMessage, signal, apiKeyOverride) {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
  const key = apiKeyOverride || GROQ_API_KEY

  let messages = [
    { role: 'system', content: 'You are a confident, concise assistant with a quiet, understated tone. Use tools when they help answer accurately — otherwise answer directly.' },
    { role: 'user', content: userMessage },
  ]

  let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  let toolsUsed = []

  for (let i = 0; i < 3; i++) { // cap tool-call rounds to avoid runaway loops
    const data = await callGroq(messages, signal, key, toolSchemas)
    const msg = data.choices[0].message

    totalUsage.prompt_tokens += data.usage.prompt_tokens
    totalUsage.completion_tokens += data.usage.completion_tokens
    totalUsage.total_tokens += data.usage.total_tokens

    if (!msg.tool_calls) {
      console.log('finish_reason:', data.choices[0].finish_reason)
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
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      })
    }
  }

  return { text: 'Ran out of tool-call attempts — try rephrasing.', usage: totalUsage, toolsUsed }
}
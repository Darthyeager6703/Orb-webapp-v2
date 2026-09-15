const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export async function askGroq(userMessage) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content:
            'You are a confident, concise assistant with a quiet, understated tone. Never verbose, never gushing. Answer directly, get to the point fast.',
        },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}
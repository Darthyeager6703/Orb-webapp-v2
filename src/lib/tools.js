async function tavilySearch(query) {
  const key = import.meta.env.VITE_TAVILY_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, query, max_results: 3, include_answer: true }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.results?.length) return null
    return {
      source: 'tavily',
      answer: data.answer || null,
      results: data.results.map((r) => ({ title: r.title, content: r.content?.slice(0, 400), url: r.url })),
    }
  } catch {
    return null
  }
}

const SEARXNG_INSTANCES = [
  'https://searx.be',
  'https://search.inetol.net',
  'https://priv.au',
]

async function searxngSearch(query) {
  for (const base of SEARXNG_INSTANCES) {
    try {
      const res = await fetch(`${base}/search?q=${encodeURIComponent(query)}&format=json`)
      if (!res.ok) continue
      const data = await res.json()
      if (!data.results?.length) continue
      return {
        source: 'searxng',
        instance: base,
        results: data.results.slice(0, 3).map((r) => ({ title: r.title, content: r.content?.slice(0, 400), url: r.url })),
      }
    } catch {
      continue
    }
  }
  return null
}

async function duckDuckGoSearch(query) {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    )
    const data = await res.json()
    if (!data.AbstractText) return null
    return {
      source: 'duckduckgo',
      answer: data.AbstractText,
      results: [{ title: data.Heading, content: data.AbstractText, url: data.AbstractURL }],
    }
  } catch {
    return null
  }
}

export async function webSearch({ query }) {
  const attempt =
    (await tavilySearch(query)) ||
    (await searxngSearch(query)) ||
    (await duckDuckGoSearch(query))

  if (!attempt) return { found: false }
  return { found: true, ...attempt }
}

export async function geocodeLocation({ place }) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
    )
    const data = await res.json()
    const top = data[0]
    if (top) {
      return {
        found: true,
        source: 'nominatim',
        name: top.display_name,
        lat: parseFloat(top.lat),
        lon: parseFloat(top.lon),
        mapUrl: `https://www.openstreetmap.org/?mlat=${top.lat}&mlon=${top.lon}#map=15/${top.lat}/${top.lon}`,
      }
    }
  } catch {
    // fall through
  }

  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(place)}&limit=1`)
    const data = await res.json()
    const top = data.features?.[0]
    if (top) {
      const [lon, lat] = top.geometry.coordinates
      const name = [top.properties.name, top.properties.city, top.properties.country]
        .filter(Boolean)
        .join(', ')
      return {
        found: true,
        source: 'photon',
        name,
        lat,
        lon,
        mapUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`,
      }
    }
  } catch {
    // fall through
  }

  return { found: false }
}
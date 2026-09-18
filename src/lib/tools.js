export async function searchWikipedia(query) {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`
  )
  const data = await res.json()
  const top = data.query.search[0]
  if (!top) return { found: false }
  const extractRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(top.title)}&format=json&origin=*`
  )
  const extractData = await extractRes.json()
  const page = Object.values(extractData.query.pages)[0]
  return { found: true, title: page.title, extract: page.extract?.slice(0, 800) }
}

export async function searchDuckDuckGo(query) {
  const res = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
  )
  const data = await res.json()
  return {
    abstract: data.AbstractText || null,
    source: data.AbstractSource || null,
    relatedTopics: (data.RelatedTopics || []).slice(0, 3).map((t) => t.Text).filter(Boolean),
  }
}

export async function geocodeLocation(place) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  )
  const data = await res.json()
  const top = data[0]
  if (!top) return { found: false }
  return {
    found: true,
    name: top.display_name,
    lat: parseFloat(top.lat),
    lon: parseFloat(top.lon),
    mapUrl: `https://www.openstreetmap.org/?mlat=${top.lat}&mlon=${top.lon}#map=15/${top.lat}/${top.lon}`,
  }
}
const KEY = 'orb-demo-state-v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveState(partial) {
  try {
    const current = loadState()
    const merged = { ...current, ...partial }
    localStorage.setItem(KEY, JSON.stringify(merged))
  } catch {
    // storage full or blocked — fail silently, app still works, just won't persist
  }
}

export function hasSeenDisclosure() {
  return loadState().seenDisclosure === true
}

export function markDisclosureSeen() {
  saveState({ seenDisclosure: true })
}
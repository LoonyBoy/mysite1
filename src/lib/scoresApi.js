// Prefer explicit base from env; if it's localhost but we're on a LAN host, rewrite to current hostname.
const resolveApiBase = () => {
  const envBase = import.meta.env.VITE_SCORES_API && String(import.meta.env.VITE_SCORES_API).trim()
  if (envBase) {
    try {
      const u = new URL(envBase, location.origin)
      const isLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
      const hostIsLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      if (isLocal && !hostIsLocal) {
        // Use same protocol and current LAN hostname, keep original port (or default 4000)
        const port = u.port || '4000'
        return `${location.protocol}//${location.hostname}:${port}`
      }
      return u.origin
    } catch {
      // Fallback if envBase isn't a valid URL
      return envBase
    }
  }
  // No env provided: default to current host on 4000
  return `${location.protocol}//${location.hostname}:4000`
}

const API_BASE = resolveApiBase()

export async function fetchTopScores(limit = 10) {
  const res = await fetch(`${API_BASE}/api/scores/top?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch scores')
  const data = await res.json()
  return data.items || []
}

export async function saveScore({ name, ship, score, date = new Date().toISOString() }) {
  const res = await fetch(`${API_BASE}/api/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ship, score, date })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to save score')
  }
  return await res.json()
}

// Resolve API base:
// - If VITE_SCORES_API points to localhost but we are on a public host, use same-origin (behind nginx proxy /api)
// - If VITE_SCORES_API is an absolute public URL, use its origin
// - Else (no env): same-origin in production, :4000 only for local dev
const resolveApiBase = () => {
  const envBase = import.meta.env.VITE_SCORES_API && String(import.meta.env.VITE_SCORES_API).trim()
  const hostIsLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1'

  if (envBase) {
    try {
      const u = new URL(envBase, location.origin)
      const isLocalTarget = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
      if (isLocalTarget && !hostIsLocal) {
        // We are in prod accessing a build that still has localhost API; fall back to same-origin
        return location.origin
      }
      return u.origin
    } catch {
      return envBase
    }
  }

  // No env var: choose based on current host
  if (hostIsLocal) {
    return `${location.protocol}//${location.hostname}:4000`
  }
  return location.origin
}

const API_BASE = resolveApiBase()

export async function fetchTopScores(limit = 10) {
  try {
    const res = await fetch(`${API_BASE}/api/scores/top?limit=${limit}`)
    if (!res.ok) {
      // Graceful fallback: empty list if DB unavailable
      return []
    }
    const data = await res.json().catch(()=>({ items: [] }))
    return data.items || []
  } catch (e) {
    return []
  }
}

export async function saveScore({ name, ship, score, date = new Date().toISOString() }) {
  try {
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
  } catch (e) {
    throw e
  }
}

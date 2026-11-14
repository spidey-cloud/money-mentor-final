/**
 * Safe localStorage helpers.
 * JSON.parse throws on corrupt data (partial write, quota error).
 * These helpers always return a sane fallback instead of propagating.
 */

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) ?? fallback : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // QuotaExceededError or SecurityError — fail silently
    return false
  }
}

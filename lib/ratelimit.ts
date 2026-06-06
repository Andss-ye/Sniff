const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

// ip → timestamps of requests within the current window
const store = new Map<string, number[]>()

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const windowStart = now - WINDOW_MS
  const timestamps = (store.get(ip) ?? []).filter((t) => t > windowStart)

  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = timestamps[0]
    return { allowed: false, retryAfterMs: oldest + WINDOW_MS - now }
  }

  timestamps.push(now)
  store.set(ip, timestamps)

  // Periodically prune IPs with no recent requests to avoid unbounded growth
  if (store.size > 5000) {
    for (const [key, ts] of store) {
      if (ts[ts.length - 1] < windowStart) store.delete(key)
    }
  }

  return { allowed: true, retryAfterMs: 0 }
}

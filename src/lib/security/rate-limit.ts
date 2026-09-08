type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();
/** Development-safe in-memory limiter. Replace with Redis/Upstash for multi-instance production deployments. */
export function limit(key: string, max = 20, windowMs = 60_000) { const now = Date.now(); const previous = store.get(key); const entry = !previous || previous.resetAt <= now ? { count: 1, resetAt: now + windowMs } : { ...previous, count: previous.count + 1 }; store.set(key, entry); return { allowed: entry.count <= max, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }; }

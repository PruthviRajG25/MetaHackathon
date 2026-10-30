interface RateLimitStore {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitStore>();

// In-memory sliding window rate limiter
export function checkRateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60 * 1000 // 1 minute default
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  // Clean old keys if map gets large
  if (memoryStore.size > 10000) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetTime < now) {
        memoryStore.delete(k);
      }
    }
  }

  if (!record || record.resetTime < now) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    reset: record.resetTime,
  };
}

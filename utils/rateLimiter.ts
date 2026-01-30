
/**
 * Simple Token Bucket Rate Limiter for Client-side protection
 */
class RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();

  /**
   * @param action The key for the action (e.g., 'ai_gen', 'join_team')
   * @param limit Max tokens allowed in the bucket
   * @param interval Time in ms for a full refill
   * @returns boolean true if allowed, false if limited
   */
  check(action: string, limit: number, interval: number): { allowed: boolean; waitTime: number } {
    const now = Date.now();
    let bucket = this.buckets.get(action);

    if (!bucket) {
      bucket = { tokens: limit, lastRefill: now };
      this.buckets.set(action, bucket);
    }

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed * (limit / interval));
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, waitTime: 0 };
    }

    const waitTime = Math.ceil(interval / limit - (now - bucket.lastRefill));
    return { allowed: false, waitTime: Math.max(0, waitTime) };
  }
}

export const globalRateLimiter = new RateLimiter();

// Sensible Defaults
export const LIMIT_CONFIGS = {
  AI_GENERATION: { limit: 3, interval: 60000 }, // 3 requests per minute
  DATABASE_JOIN: { limit: 2, interval: 30000 }, // 2 joins per 30s
  MARKET_UPDATE: { limit: 10, interval: 10000 }, // 10 updates per 10s
};

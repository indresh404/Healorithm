// App/src/sync/backoff.ts

/**
 * Calculates exponential backoff with full jitter in milliseconds.
 * Base: 1s, Max: 30s.
 */
export function calculateBackoffMs(attempts: number, baseMs: number = 1000, maxMs: number = 30000): number {
  const exp = Math.min(Math.pow(2, attempts) * baseMs, maxMs);
  // Full jitter: uniform random between 0 and exp
  return Math.floor(Math.random() * exp);
}

export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = (this.attempts.get(key) || []).filter((t) => now - t < windowMs);
    if (timestamps.length >= maxAttempts) {
      return false;
    }
    timestamps.push(now);
    this.attempts.set(key, timestamps);
    return true;
  }

  reset(): void {
    this.attempts.clear();
  }
}

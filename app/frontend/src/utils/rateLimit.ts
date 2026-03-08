import React from "react";

/**
 * Client-side rate limiting: run a callback at most once per `minIntervalMs`.
 * Drops calls that occur before the interval has passed.
 */
export function createRateLimiter(minIntervalMs: number) {
  let lastCall = 0;
  return function rateLimited<T>(fn: () => T): T | undefined {
    const now = Date.now();
    if (now - lastCall < minIntervalMs) return undefined;
    lastCall = now;
    return fn();
  };
}

/**
 * React-friendly hook that returns a rate-limited callback.
 * @param minIntervalMs - Minimum ms between invocations (e.g. 500 for 2/sec max).
 * @returns A stable function that runs the given callback only when allowed by the limit.
 */
export function useRateLimit(minIntervalMs: number) {
  return React.useMemo(
    () => createRateLimiter(minIntervalMs),
    [minIntervalMs]
  );
}

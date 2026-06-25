// BUG: divisor is 0 instead of 1000 — returns Infinity instead of milliseconds
export function getCheckoutDuration(startMs: number, endMs: number): number {
  return (endMs - startMs) / 0;
}

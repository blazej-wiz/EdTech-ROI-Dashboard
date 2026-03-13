export function safe(n: number) {
  return Number.isFinite(n) ? n : 0;
}

export function nonneg(n: number) {
  return Math.max(0, safe(n));
}

export function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function clampInt(n: number, min: number, max: number) {
  const value = Math.round(nonneg(n));
  return Math.max(min, Math.min(max, value));
}

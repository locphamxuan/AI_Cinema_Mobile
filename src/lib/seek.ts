/**
 * Where a seek lands: inside [0, duration] when the length is known, otherwise only not negative.
 * Null when the target is not a number, so the player is never handed NaN/Infinity (the web
 * video element throws on a non-finite currentTime).
 */
export function seekTarget(seconds: number, duration: number): number | null {
  if (!Number.isFinite(seconds)) return null;
  const end = Number.isFinite(duration) && duration > 0 ? duration : Infinity;
  return Math.max(0, Math.min(end, seconds));
}

/** Share of the bar left of the pointer, 0–1; null when the position or width is unknown. */
export function barRatio(offsetX: number, width: number): number | null {
  if (!Number.isFinite(offsetX) || !Number.isFinite(width) || width <= 0) return null;
  return Math.max(0, Math.min(1, offsetX / width));
}

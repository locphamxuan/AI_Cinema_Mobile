/**
 * Vietnamese weekday labels and the Monday-based day index.
 */

// Days of week in Vietnam starting Monday: T2, T3, T4, T5, T6, T7, CN
export const VN_DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

/**
 * Returns today's index in the Monday-based week array (0 = T2/Monday, ..., 6 = CN/Sunday).
 * JavaScript's Date.prototype.getDay() returns:
 * 0: Sunday (CN) -> index 6
 * 1: Monday (T2) -> index 0
 * 2: Tuesday (T3) -> index 1
 * 3: Wednesday (T4) -> index 2
 * 4: Thursday (T5) -> index 3
 * 5: Friday (T6) -> index 4
 * 6: Saturday (T7) -> index 5
 */
export function getTodayDayIndex(date: Date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Asia/Ho_Chi_Minh is UTC+7 all year (no daylight saving), the BE's business day (common/time/business-day.ts). */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Milliseconds until the next 00:00 in Vietnam, when the daily check-in opens again. */
export function msUntilVnMidnight(now: number = Date.now()): number {
  return DAY_MS - ((now + VN_OFFSET_MS) % DAY_MS);
}

/** `HH:MM:SS` for a countdown. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/**
 * Helper utilities for Real-World Date & Vietnam Weekday formatting.
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

/**
 * Returns YYYY-MM-DD string based on local time.
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns Vietnamese day of week label for today, e.g. "Thứ Tư (T4)".
 */
export function getTodayVnLabel(date: Date = new Date()): string {
  const idx = getTodayDayIndex(date);
  return VN_DAY_LABELS[idx];
}

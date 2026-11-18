/** Calendar helpers of the app: device days for lists, Vietnam days for the daily check-in. */

const pad = (n: number) => String(n).padStart(2, '0');

/** The device's calendar day of a moment (YYYY-MM-DD), so "today" matches what the viewer sees on the clock. */
export function dayKey(moment: Date): string {
  return `${moment.getFullYear()}-${pad(moment.getMonth() + 1)}-${pad(moment.getDate())}`;
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
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;

export interface ErrorUtilsLike {
  getGlobalHandler: () => GlobalHandler;
  setGlobalHandler: (handler: GlobalHandler) => void;
}

/** Marks the handler installed here, so a second call (fast refresh, tests) never wraps it twice. */
const KEEPS_APP_OPEN = Symbol('keepsAppOpen');

/**
 * An error thrown outside drawing (a button handler, a timer, a socket or network callback) never reaches the
 * screen's ErrorBoundary: React Native's own handler reports it as fatal and, in a release build, closes the app.
 * In a release build this keeps the app open and logs the error instead; the screen's ErrorBoundary still handles
 * errors while drawing. In development the original handler still runs, so the red error screen keeps showing bugs.
 */
export function installGlobalErrorHandler(
  utils: ErrorUtilsLike | undefined = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils,
  dev: boolean = typeof __DEV__ !== 'undefined' && __DEV__,
): boolean {
  if (!utils) return false;
  const original = utils.getGlobalHandler() as GlobalHandler & { [KEEPS_APP_OPEN]?: true };
  if (original[KEEPS_APP_OPEN]) return false;
  const handler: GlobalHandler & { [KEEPS_APP_OPEN]?: true } = (error, isFatal) => {
    if (dev) return original(error, isFatal);
    console.error(isFatal ? 'Lỗi chưa xử lý (đã giữ app mở):' : 'Lỗi chưa xử lý:', error);
  };
  handler[KEEPS_APP_OPEN] = true;
  utils.setGlobalHandler(handler);
  return true;
}

/**
 * Runs a call on an expo-video player that may already be released: a late network answer
 * (quality switch, retry, heartbeat) can land after the viewer left the screen, and touching a
 * released player throws. Such a call is simply dropped instead of crashing the app.
 */
export function onLivePlayer(call: () => void): void {
  try {
    call();
  } catch {
    // The player was released with its screen; nothing is left to update.
  }
}

/** `player.replaceAsync(...)` then `after`, both guarded: a failed or late replace never throws. */
export function replaceSafely(replace: () => Promise<void>, after: () => void): void {
  try {
    void replace()
      .then(() => onLivePlayer(after))
      .catch(() => undefined);
  } catch {
    // Released before the replace even started.
  }
}

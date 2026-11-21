import { useCallback, useEffect, useState } from 'react';
import type { VideoPlayer } from 'expo-video';

/** How long a fixed quality may stall before the player falls back to adapting by itself. */
export const STALL_FALLBACK_MS = 8000;

export interface PlayerHealth {
  /** The player waits for data (weak network): show that it is loading, not a frozen picture. */
  buffering: boolean;
  /** The stream stopped with an error even in auto: the viewer may try again. */
  failed: boolean;
  /** Set once a fixed quality stalled and the player went back to auto. */
  downgraded: boolean;
  retry: () => void;
}

/**
 * Weak network on top of the player's own adaptive bitrate (ExoPlayer / hls.js on the master playlist): while
 * buffering it says so; a quality the viewer fixed by hand that stalls `STALL_FALLBACK_MS` or fails goes back
 * to `auto`, so the player can step down; a failure in auto offers to retry from the same position.
 */
export function usePlayerHealth(
  player: VideoPlayer,
  url: string,
  quality: string,
  setQuality: (quality: string) => void,
): PlayerHealth {
  const [status, setStatus] = useState<string>(player.status ?? 'idle');
  const [downgraded, setDowngraded] = useState(false);
  const fixed = quality !== 'auto';

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status: next }) => setStatus(next));
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    if (!fixed || (status !== 'error' && status !== 'loading')) return;
    const fallBack = () => {
      setDowngraded(true);
      setQuality('auto');
    };
    const timer = setTimeout(fallBack, status === 'error' ? 0 : STALL_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [fixed, status, setQuality]);

  const retry = useCallback(() => {
    const at = player.currentTime;
    void player.replaceAsync({ uri: url }).then(() => {
      player.currentTime = at;
      player.play();
    });
  }, [player, url]);

  return { buffering: status === 'loading', failed: status === 'error' && !fixed, downgraded, retry };
}

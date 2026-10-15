import { useEffect, useState } from 'react';
import type { VideoPlayer } from 'expo-video';

export interface PlayerClock {
  currentTime: number;
  duration: number;
  playing: boolean;
}

/** Position, length and play state of the player, read four times a second (same on native and web). */
export function usePlayerClock(player: VideoPlayer): PlayerClock {
  const [clock, setClock] = useState<PlayerClock>({ currentTime: 0, duration: 0, playing: false });

  useEffect(() => {
    const read = () =>
      setClock((prev) => {
        const next = { currentTime: player.currentTime || 0, duration: player.duration || 0, playing: player.playing };
        return prev.currentTime === next.currentTime && prev.duration === next.duration && prev.playing === next.playing
          ? prev
          : next;
      });
    read();
    const timer = setInterval(read, 250);
    return () => clearInterval(timer);
  }, [player]);

  return clock;
}
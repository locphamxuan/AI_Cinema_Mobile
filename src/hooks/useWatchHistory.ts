import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { playbackService } from '../services/playbackService';
import type { WatchHistoryEntry } from '../types/playback';

const NONE: WatchHistoryEntry[] = [];

/**
 * The member's watch history from the BE, read again each time the screen comes into focus so
 * an episode just watched shows up. A guest keeps no history and gets an empty list.
 */
export function useWatchHistory(signedIn: boolean): WatchHistoryEntry[] {
  const [rows, setRows] = useState<WatchHistoryEntry[]>(NONE);
  // Signing out forgets the rows, so the next account never sees them while its own load.
  if (!signedIn && rows !== NONE) setRows(NONE);
  useFocusEffect(
    useCallback(() => {
      if (!signedIn) return undefined;
      let active = true;
      void playbackService.history().then((res) => {
        if (active && res.success && Array.isArray(res.data)) setRows(res.data);
      });
      return () => {
        active = false;
      };
    }, [signedIn]),
  );
  return rows;
}

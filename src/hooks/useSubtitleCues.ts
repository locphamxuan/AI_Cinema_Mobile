import { useEffect, useState } from 'react';
import { engagementService } from '../services/engagementService';
import { parseVtt, type Cue } from '../lib/vtt';

const cache = new Map<string, Cue[]>();
const NO_CUES: Cue[] = [];

/** The cues of a subtitle track, read once per track; empty while loading or when the track is off (null). */
export function useSubtitleCues(trackId: string | null): Cue[] {
  const [loaded, setLoaded] = useState<{ trackId: string; cues: Cue[] } | null>(null);

  useEffect(() => {
    if (!trackId || cache.has(trackId)) return;
    let active = true;
    void engagementService.subtitleText(trackId).then((text) => {
      const parsed = text ? parseVtt(text) : [];
      if (text) cache.set(trackId, parsed);
      if (active) setLoaded({ trackId, cues: parsed });
    });
    return () => {
      active = false;
    };
  }, [trackId]);

  if (!trackId) return NO_CUES;
  return cache.get(trackId) ?? (loaded?.trackId === trackId ? loaded.cues : NO_CUES);
}
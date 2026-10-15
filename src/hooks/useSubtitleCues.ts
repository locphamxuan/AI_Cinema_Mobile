import { useEffect, useState } from 'react';
import { engagementService } from '../services/engagementService';
import { parseVtt, type Cue } from '../lib/vtt';

const cache = new Map<string, Cue[]>();

/** The cues of a subtitle track, read once per track; empty while loading or when the track is off (null). */
export function useSubtitleCues(trackId: string | null): Cue[] {
  const [cues, setCues] = useState<Cue[]>(() => (trackId ? cache.get(trackId) ?? [] : []));

  useEffect(() => {
    let active = true;
    if (!trackId) {
      setCues([]);
      return;
    }
    const known = cache.get(trackId);
    if (known) {
      setCues(known);
      return;
    }
    void engagementService.subtitleText(trackId).then((text) => {
      const parsed = text ? parseVtt(text) : [];
      if (text) cache.set(trackId, parsed);
      if (active) setCues(parsed);
    });
    return () => {
      active = false;
    };
  }, [trackId]);

  return cues;
}
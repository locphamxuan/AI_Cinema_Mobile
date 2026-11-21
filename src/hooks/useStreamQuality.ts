import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { VideoPlayer } from 'expo-video';
import { type HlsRendition, parseMasterPlaylist, streamUrlFor } from '../lib/hlsQualities';
import type { StreamingSession } from '../types/playback';

/**
 * The room plays at the quality the Host picked (BR-69, 13/11/2026). Every member keeps their own signed
 * session, so the Host's choice (`720p`) maps onto each member's own rendition URL. Switching keeps the
 * position and the play state; on the web hls.js re-attaches to the new URL (attachWebStream).
 */
export function useRoomQuality(player: VideoPlayer, session: StreamingSession, quality: string) {
  const masterUrl = session.stream.masterUrl;
  const [renditions, setRenditions] = useState<HlsRendition[]>([]);
  const url = streamUrlFor(quality, renditions, masterUrl);
  const loaded = useRef(masterUrl);

  useEffect(() => {
    let active = true;
    void fetch(masterUrl)
      .then((res) => (res.ok ? res.text() : ''))
      .then((text) => {
        if (active) setRenditions(parseMasterPlaylist(text, masterUrl));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [masterUrl]);

  useEffect(() => {
    if (loaded.current === url || Platform.OS === 'web') {
      loaded.current = url;
      return;
    }
    loaded.current = url;
    const at = player.currentTime;
    const wasPlaying = player.playing;
    void player.replaceAsync({ uri: url }).then(() => {
      player.currentTime = at;
      if (wasPlaying) player.play();
    });
  }, [player, url]);

  /** Labels the Host can pick, `auto` first. */
  const options = ['auto', ...renditions.map((r) => r.label)];
  return { url, options };
}

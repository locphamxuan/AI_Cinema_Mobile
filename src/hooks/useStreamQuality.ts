import { replaceSafely } from '../lib/playerSafe';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { VideoPlayer } from 'expo-video';
import { type HlsRendition, parseMasterPlaylist, streamUrlFor } from '../lib/hlsQualities';

/**
 * Plays a stream at a chosen quality: `auto` is the master playlist (the player adapts), `720p` the closest
 * rendition at or below it. The master already holds only the renditions the viewer's plan allows (BE), so
 * the options never offer more. A watch room maps the Host's choice onto each member's own signed master
 * (BR-69). Switching keeps the position and the play state; on the web hls.js re-attaches to the new URL.
 */
export function useStreamQuality(player: VideoPlayer, masterUrl: string, quality: string) {
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
    replaceSafely(
      () => player.replaceAsync({ uri: url }),
      () => {
        player.currentTime = at;
        if (wasPlaying) player.play();
      },
    );
  }, [player, url]);

  /** Labels the viewer (or the Host of a room) can pick, `auto` first. */
  const options = ['auto', ...renditions.map((r) => r.label)];
  return { url, options };
}

import { useEffect } from 'react';
import type { VideoPlayer } from 'expo-video';

/**
 * A film muxed with subtitle tracks (`mov_text`) makes the native player draw its own line under the app's one.
 * While the app has subtitle tracks of its own, the embedded ones stay switched off, including a track the player
 * selects later (source loaded, quality changed). A film without app tracks keeps the embedded ones.
 */
export function useAppSubtitlesOnly(player: VideoPlayer, appHasSubtitles: boolean) {
  useEffect(() => {
    if (!appHasSubtitles) return;
    const hideEmbedded = () => {
      if (player.subtitleTrack) player.subtitleTrack = null;
    };
    hideEmbedded();
    const subs = [
      player.addListener('sourceLoad', hideEmbedded),
      player.addListener('availableSubtitleTracksChange', hideEmbedded),
      player.addListener('subtitleTrackChange', hideEmbedded),
    ];
    return () => subs.forEach((sub) => sub.remove());
  }, [player, appHasSubtitles]);
}

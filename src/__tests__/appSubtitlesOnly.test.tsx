import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { VideoPlayer } from 'expo-video';
import { useAppSubtitlesOnly } from '../hooks/useAppSubtitlesOnly';

function fakePlayer() {
  const listeners = new Map<string, () => void>();
  return {
    subtitleTrack: { language: 'vie' } as object | null,
    addListener: (event: string, fn: () => void) => {
      listeners.set(event, fn);
      return { remove: () => listeners.delete(event) };
    },
    emit: (event: string) => listeners.get(event)?.(),
    listeners,
  };
}

function Probe({ player, own }: { player: ReturnType<typeof fakePlayer>; own: boolean }) {
  useAppSubtitlesOnly(player as unknown as VideoPlayer, own);
  return null;
}

describe('useAppSubtitlesOnly', () => {
  it('switches the embedded track off, also when the player selects one later', async () => {
    const player = fakePlayer();
    const view = await render(<Probe player={player} own />);
    expect(player.subtitleTrack).toBeNull();

    for (const event of ['sourceLoad', 'availableSubtitleTracksChange', 'subtitleTrackChange']) {
      player.subtitleTrack = { language: 'eng' };
      await act(async () => player.emit(event));
      expect(player.subtitleTrack).toBeNull();
    }

    await view.unmount();
    expect(player.listeners.size).toBe(0);
  });

  it('keeps the embedded track of a film without app subtitles', async () => {
    const player = fakePlayer();
    await render(<Probe player={player} own={false} />);
    expect(player.subtitleTrack).toEqual({ language: 'vie' });
  });
});

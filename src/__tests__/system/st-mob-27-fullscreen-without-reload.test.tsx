import { mockOrientation, mockVideo } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { aiLabels, episodePlayer, playEpisode } from './support/watch';
import { usePlayerStore } from '../../store/playerStore';

describe('ST-MOB-27 Fullscreen without a reload', () => {
  it('ST-MOB-27 keeps the same video playing with the AI label, and Android Back leaves fullscreen without closing the app (D-39)', async () => {
    const back: { handlers: (() => boolean)[] } = { handlers: [] };
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      back.handlers.push(handler as () => boolean);
      return { remove: () => (back.handlers = back.handlers.filter((h) => h !== handler)) };
    });
    await playEpisode();
    const player = episodePlayer();
    const surfaces = mockVideo.viewMounts;
    const players = mockVideo.players.length;

    await fireEvent.press(screen.getByLabelText('Toàn màn hình'));
    expect(screen.getByTestId('player-fullscreen')).toBeOnTheScreen();
    // Rotated sideways for the fullscreen picture.
    expect(mockOrientation.lockAsync).toHaveBeenLastCalledWith('LANDSCAPE');
    expect(usePlayerStore.getState().fullscreen).toBe(true);
    expect(aiLabels()).toHaveLength(1);
    // Same native surface and the same player: no reload, the position is kept.
    expect(mockVideo.viewMounts).toBe(surfaces);
    expect(mockVideo.players).toHaveLength(players);
    expect(player.playing).toBe(true);

    // The newest handler answers Back first, as on Android.
    let handled = false;
    await act(() => {
      handled = back.handlers[back.handlers.length - 1]();
    });
    expect(handled).toBe(true);
    expect(screen.getByTestId('player-inline')).toBeOnTheScreen();
    expect(mockOrientation.lockAsync).toHaveBeenLastCalledWith('PORTRAIT_UP');
    expect(usePlayerStore.getState().fullscreen).toBe(false);
    expect(mockVideo.viewMounts).toBe(surfaces);
    expect(player.playing).toBe(true);
    expect(aiLabels()).toHaveLength(1);
  });

  it('ST-MOB-27 turns the phone back upright when the viewer leaves the screen in fullscreen', async () => {
    await playEpisode();
    await fireEvent.press(screen.getByLabelText('Toàn màn hình'));
    mockOrientation.lockAsync.mockClear();
    await act(() => screen.unmount());
    expect(mockOrientation.lockAsync).toHaveBeenCalledWith('PORTRAIT_UP');
    expect(usePlayerStore.getState().fullscreen).toBe(false);
  });
});

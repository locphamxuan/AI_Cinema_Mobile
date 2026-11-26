import { settle } from './support/harness';
import { act, screen } from '@testing-library/react-native';
import { episodePlayer, playEpisode, playTo } from './support/watch';

describe('ST-MOB-39 One subtitle line for a film with muxed subtitles', () => {
  it('ST-MOB-39 switches the embedded track off and keeps the app line', async () => {
    await playEpisode();
    const player = episodePlayer() as ReturnType<typeof episodePlayer> & { subtitleTrack?: object | null };

    player.subtitleTrack = { language: 'vie' };
    await act(async () => player.emit('sourceLoad'));
    await playTo(player, 10);
    await settle();

    expect(player.subtitleTrack).toBeNull();
    expect(await screen.findByText('Xin chào cả nhà')).toBeOnTheScreen();
    expect(screen.getAllByTestId('subtitle-line')).toHaveLength(1);
  });
});

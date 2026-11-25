import { mockOrientation, settle } from './support/harness';
import { fireEvent, screen, within } from '@testing-library/react-native';
import { aiLabels, episodePlayer, playEpisode, playTo } from './support/watch';

describe('ST-MOB-12 AI label and controls', () => {
  it('ST-MOB-12 keeps the AI label over the poster, the playing video and fullscreen (BR-10)', async () => {
    await playEpisode();
    expect(aiLabels()).toHaveLength(1);
    expect(within(aiLabels()[0]).getByText('Nội dung được tạo bằng AI')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Toàn màn hình'));
    expect(screen.getByTestId('player-fullscreen')).toBeOnTheScreen();
    expect(mockOrientation.lockAsync).toHaveBeenLastCalledWith('LANDSCAPE');
    expect(aiLabels()).toHaveLength(1);
    // The label is the last thing drawn on the picture, so nothing covers it.
    const stage = aiLabels()[0].parent!;
    expect(stage.children[stage.children.length - 1]).toBe(aiLabels()[0]);

    await fireEvent.press(screen.getByLabelText('Thoát toàn màn hình'));
    expect(screen.getByTestId('player-inline')).toBeOnTheScreen();
    expect(mockOrientation.lockAsync).toHaveBeenLastCalledWith('PORTRAIT_UP');
    expect(aiLabels()).toHaveLength(1);
  });

  it('ST-MOB-12 seeks, pauses, changes the speed and the subtitles', async () => {
    await playEpisode();
    const player = episodePlayer();
    await playTo(player, 20);

    await fireEvent.press(screen.getByLabelText('Tua tới 10 giây'));
    expect(player.currentTime).toBe(30);
    await playTo(player, 30);
    await fireEvent.press(screen.getByLabelText('Lùi 10 giây'));
    expect(player.currentTime).toBe(20);

    await fireEvent.press(screen.getByLabelText('Tạm dừng'));
    expect(player.pause).toHaveBeenCalled();

    // Vietnamese subtitles are on by default and drawn over the picture.
    expect(await screen.findByText('Xin chào cả nhà')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Cài đặt'));
    await fireEvent.press(screen.getByLabelText('Tốc độ 1.5 lần'));
    expect(player.playbackRate).toBe(1.5);
    await fireEvent.press(within(screen.getByTestId('player-settings-sheet')).getByText(/^Tắt, nghe âm thanh gốc/));
    await settle();
    expect(screen.queryByTestId('subtitle-line')).toBeNull();
    expect(aiLabels()).toHaveLength(1);
  });
});

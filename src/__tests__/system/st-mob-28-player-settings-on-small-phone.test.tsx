import { mockInsets, renderApp, settle } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';
import { playEpisode } from './support/watch';
import { PartyPlayer } from '../../components/watchParty/PartyPlayer';
import { streamingSession } from './support/fixtures';

const screenSize = (width: number, height: number) =>
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 2, fontScale: 1 });
const sheetStyle = () => StyleSheet.flatten(screen.getByTestId('player-settings-sheet').props.style);
const listPadding = () => screen.getByTestId('player-settings-list').props.contentContainerStyle;

describe('ST-MOB-28 Player settings sheet on a small phone', () => {
  it('ST-MOB-28 fits a small portrait screen and its safe area, and scrolls (D-41)', async () => {
    screenSize(320, 568);
    mockInsets.current = { top: 24, bottom: 48, left: 0, right: 0 };
    await playEpisode();
    await fireEvent.press(screen.getByLabelText('Cài đặt'));

    expect(sheetStyle().maxHeight).toBe(Math.floor(568 * 0.7));
    expect(sheetStyle().width).toBe(320);
    expect(listPadding()).toEqual({ paddingBottom: 48 + 16 });
    expect(StyleSheet.flatten(screen.getByTestId('player-settings-list').props.style)).toMatchObject({ flexShrink: 1 });
    expect(screen.getByLabelText('Tốc độ 2 lần')).toBeOnTheScreen();
  });

  it('ST-MOB-28 uses the short landscape height below the notch', async () => {
    screenSize(844, 390);
    mockInsets.current = { top: 0, bottom: 21, left: 47, right: 47 };
    await playEpisode();
    await fireEvent.press(screen.getByLabelText('Toàn màn hình'));
    await fireEvent.press(screen.getByLabelText('Cài đặt'));

    expect(sheetStyle().maxHeight).toBe(390 - 12);
    expect(sheetStyle().width).toBe(560);
    expect(listPadding()).toEqual({ paddingBottom: 21 + 16 });
  });

  it('ST-MOB-28 has no speed row in a watch room', async () => {
    screenSize(360, 640);
    await renderApp(
      <PartyPlayer
        session={streamingSession('ep-1') as never}
        isHost
        sync={null}
        subtitles={[]}
        audioLabel="Âm thanh gốc của phim"
        onHostAction={() => undefined}
        onEnded={() => undefined}
        roomAd={{ active: false }}
        onAdChange={() => undefined}
        quality="auto"
        onQualityChange={() => undefined}
      />,
    );
    await settle();
    await fireEvent.press(screen.getByLabelText('Cài đặt'));
    expect(screen.getByTestId('player-settings-sheet')).toBeOnTheScreen();
    expect(screen.queryByText('Tốc độ')).toBeNull();
    expect(screen.queryByLabelText('Tốc độ 1 lần')).toBeNull();
  });
});

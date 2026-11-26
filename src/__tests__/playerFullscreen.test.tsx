import React from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { EpisodePlayer } from '../components/player/EpisodePlayer';
import { PlayerSettingsSheet, SHEET_MAX_WIDTH, sheetFrame } from '../components/player/PlayerSettingsSheet';
import { syncTarget } from '../components/watchParty/PartyPlayer';
import { usePlayerStore } from '../store/playerStore';
import { installGlobalErrorHandler, type ErrorUtilsLike } from '../lib/globalErrorHandler';

jest.setTimeout(90_000);

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, MaterialCommunityIcons: () => null, MaterialIcons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 48, left: 0, right: 0 }) }));

const mockVideoMounts = { count: 0 };
jest.mock('expo-video', () => {
  const ReactActual = jest.requireActual('react');
  const player = {
    playing: false,
    currentTime: 0,
    duration: 600,
    status: 'readyToPlay',
    timeUpdateEventInterval: 0,
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    play: jest.fn(),
    pause: jest.fn(),
    replaceAsync: jest.fn(() => Promise.resolve()),
  };
  return {
    useVideoPlayer: () => player,
    // Counts native video views created: a remount would re-create the native video surface.
    VideoView: () => {
      ReactActual.useEffect(() => {
        mockVideoMounts.count += 1;
      }, []);
      return null;
    },
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const byId = (root: ReactTestRenderer, id: string) => root.root.findAll((n) => n.props.testID === id, { deep: false });
const press = (root: ReactTestRenderer, label: string) =>
  act(() => root.root.find((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function').props.onPress());

beforeEach(() => {
  // The stream page is not on the network under Jest.
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, text: async () => '' } as Response);
});
afterEach(() => jest.restoreAllMocks());

describe('fullscreen player (no Modal, no remount)', () => {
  it('grows the same box over the screen, keeps the video and the AI label, and Android back leaves it', () => {
    const back: { handler?: () => boolean } = {};
    const remove = jest.fn();
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      back.handler = handler as () => boolean;
      return { remove };
    });
    mockVideoMounts.count = 0;
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        <EpisodePlayer streamUrl="https://cdn/master.m3u8" posterUrl="" aiLabel="Phim tạo bằng AI" checking={false} onRequestPlay={() => undefined} />,
      );
    });
    expect(byId(root, 'player-inline')).toHaveLength(1);
    expect(mockVideoMounts.count).toBe(1);

    press(root, 'Toàn màn hình');
    const stage = byId(root, 'player-fullscreen');
    expect(stage).toHaveLength(1);
    const style = StyleSheet.flatten(stage[0].props.style);
    expect(style).toMatchObject({ position: 'absolute', top: 0, bottom: 0, paddingTop: 24, paddingBottom: 48 });
    expect(mockVideoMounts.count).toBe(1);
    expect(usePlayerStore.getState().fullscreen).toBe(true);
    expect(root.root.findAll((n) => n.props.testID === 'ai-label-overlay', { deep: false })).toHaveLength(1);

    let handled = false;
    act(() => {
      handled = back.handler!();
    });
    expect(handled).toBe(true);
    expect(byId(root, 'player-inline')).toHaveLength(1);
    expect(remove).toHaveBeenCalled();
    expect(usePlayerStore.getState().fullscreen).toBe(false);
    expect(mockVideoMounts.count).toBe(1);
    act(() => root.unmount());
  });
});

describe('player settings sheet size', () => {
  const insets = { top: 24, bottom: 48, left: 0, right: 0 };

  it('never runs past the screen on a small portrait phone and leaves room for the system bar', () => {
    expect(sheetFrame(320, 568, insets)).toEqual({ maxHeight: Math.floor(568 * 0.7), width: 320, paddingBottom: 64 });
  });

  it('uses the short landscape height below the notch, at a readable width', () => {
    const notch = { top: 0, bottom: 21, left: 47, right: 47 };
    expect(sheetFrame(844, 390, notch)).toEqual({ maxHeight: 378, width: SHEET_MAX_WIDTH, paddingBottom: 37 });
    expect(sheetFrame(640, 360, insets).maxHeight).toBe(360 - 24 - 12);
  });

  it('renders a scrolling list inside a sheet capped to the screen', () => {
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        <PlayerSettingsSheet
          visible
          onClose={() => undefined}
          subtitles={[1, 2, 3, 4, 5, 6].map((n) => ({ id: `t${n}`, label: `Phụ đề ${n}`, language: 'vi', isDefault: false }))}
          subtitleTrackId={null}
          onSubtitleChange={() => undefined}
          rate={1}
          onRateChange={() => undefined}
          quality={{ options: ['auto', '1080p', '720p', '480p', '360p'], value: 'auto', onChange: () => undefined }}
        />,
      );
    });
    const sheet = StyleSheet.flatten(byId(root, 'player-settings-sheet')[0].props.style);
    expect(sheet.maxHeight).toBeGreaterThan(0);
    const list = byId(root, 'player-settings-list')[0] as ReactTestInstance;
    expect(StyleSheet.flatten(list.props.style)).toMatchObject({ flexShrink: 1 });
    expect(list.props.contentContainerStyle).toEqual({ paddingBottom: 64 });
    expect(root.root.findAll((n) => n.props.accessibilityLabel === 'Tốc độ 2 lần', { deep: false })).toHaveLength(1);
    act(() => root.unmount());
  });

  it('leaves the speed row out of a watch room', () => {
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        <PlayerSettingsSheet visible onClose={() => undefined} subtitles={[]} subtitleTrackId={null} onSubtitleChange={() => undefined} rate={1} onRateChange={() => undefined} hideRate />,
      );
    });
    expect(root.root.findAll((n) => n.props.accessibilityLabel === 'Tốc độ 1 lần', { deep: false })).toHaveLength(0);
    act(() => root.unmount());
  });
});

describe('watch room sync target', () => {
  it('drops a sync without a usable position instead of seeking to NaN', () => {
    expect(syncTarget({ state: 'PLAYING', positionSeconds: Number.NaN, serverTimestamp: 0 } as never)).toBeNull();
    expect(syncTarget({ state: 'PAUSED', positionSeconds: undefined, serverTimestamp: 0 } as never)).toBeNull();
  });

  it('adds the network lag only while playing and never goes below zero', () => {
    expect(syncTarget({ state: 'PLAYING', positionSeconds: 10, serverTimestamp: 1000 } as never, 3000)).toBe(12);
    expect(syncTarget({ state: 'PAUSED', positionSeconds: 10, serverTimestamp: 1000 } as never, 3000)).toBe(10);
    expect(syncTarget({ state: 'PLAYING', positionSeconds: 10, serverTimestamp: Number.NaN } as never, 3000)).toBe(10);
    expect(syncTarget({ state: 'PAUSED', positionSeconds: -4, serverTimestamp: 0 } as never)).toBe(0);
  });
});

describe('global error handler', () => {
  const fakeUtils = () => {
    const original = jest.fn();
    let current: (error: unknown, isFatal?: boolean) => void = original;
    const utils: ErrorUtilsLike = { getGlobalHandler: () => current, setGlobalHandler: (h) => (current = h) };
    return { original, utils, fire: (e: unknown, fatal?: boolean) => current(e, fatal) };
  };

  it('keeps a release build open on an error outside drawing, and logs it', () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { original, utils, fire } = fakeUtils();
    expect(installGlobalErrorHandler(utils, false)).toBe(true);
    fire(new Error('timer'), true);
    expect(original).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Lỗi chưa xử lý (đã giữ app mở):', expect.any(Error));
  });

  it('still shows the red error screen in development and installs only once', () => {
    const { original, utils, fire } = fakeUtils();
    expect(installGlobalErrorHandler(utils, true)).toBe(true);
    expect(installGlobalErrorHandler(utils, true)).toBe(false);
    fire('boom', false);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith('boom', false);
  });
});

import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { VideoPlayer } from 'expo-video';
import { useSubtitleCues } from '../hooks/useSubtitleCues';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { usePlaybackSession } from '../hooks/usePlaybackSession';
import { engagementService } from '../services/engagementService';
import { notificationService } from '../services/notificationService';
import { playbackService } from '../services/playbackService';
import type { ApiResponse } from '../types/api';
import type { StreamingSession, WatchHistoryEntry } from '../types/playback';

// The first render of the auth / player tree loads and transforms many modules; on a slow machine that alone can
// pass 20 s, so these render suites get a generous per-test timeout.
jest.setTimeout(90_000);

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => jest.requireActual('react').useEffect(effect, [effect]),
}));

// The real icons load their font from the asset registry, which does not exist under Jest.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, MaterialCommunityIcons: () => null, MaterialIcons: () => null }));

const mockPlayer = {
  playing: true,
  currentTime: 0,
  duration: 600,
  timeUpdateEventInterval: 0,
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  play: jest.fn(),
  pause: jest.fn(),
};

jest.mock('expo-video', () => ({
  useVideoPlayer: () => mockPlayer,
  VideoView: () => null,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ok = <T,>(data: T): ApiResponse<T> => ({ success: true, data, statusCode: 200 });
const settle = () => act(async () => {
  await Promise.resolve();
  await Promise.resolve();
});

function renderHook<P, R>(useHook: (props: P) => R, initial: P) {
  const seen: R[] = [];
  const Probe = ({ props }: { props: P }) => {
    const value = useHook(props);
    React.useEffect(() => {
      seen.push(value);
    });
    return null;
  };
  let root!: ReactTestRenderer;
  act(() => {
    root = create(<Probe props={initial} />);
  });
  return {
    last: () => seen[seen.length - 1],
    rerender: (props: P) =>
      act(() => {
        root.update(<Probe props={props} />);
      }),
    unmount: () =>
      act(() => {
        root.unmount();
      }),
  };
}

afterEach(() => jest.restoreAllMocks());

describe('useSubtitleCues', () => {
  const vtt = (text: string) => `WEBVTT\n\n00:00.000 --> 00:02.000\n${text}\n`;

  it('is empty with the track off and reads a track once', async () => {
    const read = jest.spyOn(engagementService, 'subtitleText').mockImplementation(async (id) => vtt(`Câu ${id}`));
    const hook = renderHook(useSubtitleCues, null as string | null);
    expect(hook.last()).toEqual([]);
    expect(read).not.toHaveBeenCalled();

    hook.rerender('once-a');
    await settle();
    expect(hook.last().map((c) => c.text)).toEqual(['Câu once-a']);

    hook.rerender(null);
    expect(hook.last()).toEqual([]);

    hook.rerender('once-a');
    await settle();
    expect(hook.last().map((c) => c.text)).toEqual(['Câu once-a']);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('never shows the lines of the previous track while a new one loads', async () => {
    let answer: (text: string) => void = () => undefined;
    jest
      .spyOn(engagementService, 'subtitleText')
      .mockResolvedValueOnce(vtt('Tiếng Việt'))
      .mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
    const hook = renderHook(useSubtitleCues, 'switch-vi' as string | null);
    await settle();

    hook.rerender('switch-en');
    expect(hook.last()).toEqual([]);

    await act(async () => answer(vtt('English')));
    expect(hook.last().map((c) => c.text)).toEqual(['English']);
  });
});

describe('useUnreadNotifications', () => {
  it('counts for a member and goes back to zero on sign-out', async () => {
    const count = jest.spyOn(notificationService, 'unreadCount').mockResolvedValue(ok({ unread: 3 }));
    const hook = renderHook(useUnreadNotifications, false as boolean);
    expect(hook.last()).toBe(0);
    expect(count).not.toHaveBeenCalled();

    hook.rerender(true);
    await settle();
    expect(hook.last()).toBe(3);

    hook.rerender(false);
    expect(hook.last()).toBe(0);
    hook.unmount();
  });
});

describe('useWatchHistory', () => {
  const row = { episodeId: 'e1', movieId: 'm1' } as WatchHistoryEntry;

  it('asks the BE for a member, never for a guest, and forgets the rows on sign-out', async () => {
    const history = jest.spyOn(playbackService, 'history').mockResolvedValue(ok([row]));
    const hook = renderHook(useWatchHistory, false as boolean);
    await settle();
    expect(hook.last()).toEqual([]);
    expect(history).not.toHaveBeenCalled();

    hook.rerender(true);
    await settle();
    expect(hook.last()).toEqual([row]);

    hook.rerender(false);
    expect(hook.last()).toEqual([]);
  });
});

describe('usePlaybackSession', () => {
  const session = {
    sessionId: 's1',
    stream: { masterUrl: 'u', qualities: [], durationSeconds: 600 },
    resumePositionSeconds: 90,
    adSchedule: [{ breakId: 'b1', positionSeconds: 30, ad: { id: 'a', title: 'Ad', mediaUrl: 'm', clickUrl: null, durationSeconds: 5 } }],
  } as unknown as StreamingSession;

  const spies = () => ({
    stop: jest.spyOn(playbackService, 'stop').mockResolvedValue(ok({} as never)),
    adStarted: jest.spyOn(playbackService, 'adStarted').mockResolvedValue(ok(undefined)),
    adFinished: jest.spyOn(playbackService, 'adFinished').mockResolvedValue(ok(undefined)),
  });
  const player = mockPlayer as unknown as VideoPlayer;
  const useSession = (currentTime: number) => usePlaybackSession(player, session, currentTime);

  beforeEach(() => jest.clearAllMocks());

  it('stops the session at the last whole second on leaving', () => {
    const { stop } = spies();
    const hook = renderHook(useSession, 0 as number);
    hook.rerender(12.7);
    hook.unmount();
    expect(stop).toHaveBeenCalledWith('s1', 12);
  });

  it('pauses at a mid-roll cue with the current position, then resumes after the ad', () => {
    const { adStarted, adFinished } = spies();
    const hook = renderHook(useSession, 10 as number);
    hook.rerender(30.4);
    expect(adStarted).toHaveBeenCalledWith('s1', 'b1', 30);
    expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
    expect(hook.last().activeAd?.breakId).toBe('b1');

    act(() => {
      hook.last().finishAd(true);
    });
    expect(adFinished).toHaveBeenCalledWith('s1', 'b1');
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(hook.last().activeAd).toBeNull();
    hook.unmount();
  });

  it('never plays an ad of its own for a watch-room member (the room sees the Host ad)', () => {
    const { adStarted } = spies();
    const hook = renderHook((t: number) => usePlaybackSession(player, session, t, false), 10 as number);
    hook.rerender(30.4);
    expect(adStarted).not.toHaveBeenCalled();
    expect(mockPlayer.pause).not.toHaveBeenCalled();
    expect(hook.last().activeAd).toBeNull();
    hook.unmount();
  });

  it('seeks to the saved position only when the viewer accepts', () => {
    spies();
    mockPlayer.currentTime = 0;
    const hook = renderHook(useSession, 0);
    expect(hook.last().resumeAt).toBe(90);
    act(() => {
      hook.last().answerResume(true);
    });
    expect(mockPlayer.currentTime).toBe(90);
    expect(hook.last().resumeAt).toBeNull();
    hook.unmount();
  });
});

import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { VideoPlayer } from 'expo-video';
import { useSubtitleCues } from '../hooks/useSubtitleCues';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { usePlaybackSession } from '../hooks/usePlaybackSession';
import { SaveButton } from '../components/movie/SaveButton';
import { StatementList } from '../components/wallet/StatementList';
import { EpisodePlayer } from '../components/player/EpisodePlayer';
import { DEFAULT_AI_LABEL } from '../components/player/AIComplianceModal';
import { engagementService } from '../services/engagementService';
import { notificationService } from '../services/notificationService';
import { playbackService } from '../services/playbackService';
import { savedMovieService } from '../services/savedMovieService';
import { walletService } from '../services/walletService';
import { useAppStore } from '../store/useAppStore';
import type { ApiResponse } from '../types/api';
import type { StatementLine } from '../types/episodeAccess';
import type { StreamingSession, WatchHistoryEntry } from '../types/playback';

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

function render(element: React.ReactElement) {
  let root!: ReactTestRenderer;
  act(() => {
    root = create(element);
  });
  return root;
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

describe('SaveButton', () => {
  const label = (root: ReactTestRenderer) => root.root.findByProps({ accessibilityRole: undefined, disabled: false }).props.accessibilityLabel;

  beforeEach(() => {
    act(() => {
      useAppStore.setState({ isAuthenticated: true });
    });
  });
  afterEach(() => {
    act(() => {
      useAppStore.setState({ isAuthenticated: false });
    });
  });

  it('reads as not saved on a new movie until the BE answers for it', async () => {
    let answer: (res: ApiResponse<{ saved: boolean }>) => void = () => undefined;
    jest
      .spyOn(savedMovieService, 'isSaved')
      .mockResolvedValueOnce(ok({ saved: true }))
      .mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
    const root = render(<SaveButton movieId="m1" />);
    await settle();
    expect(label(root)).toBe('Bỏ lưu phim');

    act(() => root.update(<SaveButton movieId="m2" />));
    expect(label(root)).toBe('Lưu phim');

    await act(async () => answer(ok({ saved: true })));
    expect(label(root)).toBe('Bỏ lưu phim');
  });
});

describe('StatementList', () => {
  const line = (id: string): StatementLine => ({
    id,
    entryType: 'TOPUP' as StatementLine['entryType'],
    mainAmount: 10,
    bonusAmount: 0,
    description: id,
    createdAt: '2026-11-09T01:00:00.000Z',
    mainBalanceAfter: 10,
    bonusBalanceAfter: 0,
  });
  const spinners = (root: ReactTestRenderer) => root.root.findAll((n) => String(n.type) === 'ActivityIndicator', { deep: false }).length;

  it('shows the spinner while a new filter loads, and not after pressing the current one', async () => {
    let answer: (res: ApiResponse<StatementLine[]>) => void = () => undefined;
    const statements = jest
      .spyOn(walletService, 'getStatements')
      .mockResolvedValueOnce(ok([line('l1')]))
      .mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
    const root = render(<StatementList />);
    expect(spinners(root)).toBe(1);
    await settle();
    expect(spinners(root)).toBe(0);

    const chips = root.root.findAll((n) => typeof n.props.onPress === 'function' && n.props.accessibilityState?.selected !== undefined, { deep: false });
    const current = chips.find((c) => c.props.accessibilityState.selected)!;
    const other = chips.find((c) => !c.props.accessibilityState.selected)!;

    act(() => current.props.onPress());
    expect(spinners(root)).toBe(0);
    expect(statements).toHaveBeenCalledTimes(1);

    act(() => other.props.onPress());
    expect(spinners(root)).toBe(1);
    expect(statements).toHaveBeenCalledTimes(2);

    await act(async () => answer(ok([line('l2')])));
    expect(spinners(root)).toBe(0);
  });
});

describe('AI label on the player (BR-10)', () => {
  const overlayText = (root: ReactTestRenderer) =>
    root.root.findAll((n) => n.props.testID === 'ai-label-overlay', { deep: true })[0];
  const textOf = (node: ReturnType<typeof overlayText>) =>
    node.findAll((n) => String(n.type) === 'Text').flatMap((n) => n.children);

  const props = { posterUrl: '', checking: false, onRequestPlay: () => undefined };

  it('is on the poster, falling back to the default text', () => {
    const root = render(<EpisodePlayer {...props} streamUrl="" aiLabel={null} />);
    expect(textOf(overlayText(root))).toEqual([DEFAULT_AI_LABEL]);
  });

  it('stays on the playing video with the label of the episode', () => {
    const root = render(<EpisodePlayer {...props} streamUrl="https://cdn/master.m3u8" aiLabel="Phim tạo bằng AI" />);
    expect(textOf(overlayText(root))).toEqual(['Phim tạo bằng AI']);
    act(() => root.unmount());
  });
});

import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { SaveButton } from '../components/movie/SaveButton';
import { StatementList } from '../components/wallet/StatementList';
import { EpisodePlayer } from '../components/player/EpisodePlayer';
import { DEFAULT_AI_LABEL } from '../components/player/AIComplianceModal';
import { PartyPlayer } from '../components/watchParty/PartyPlayer';
import { playbackService } from '../services/playbackService';
import type { StreamingSession } from '../types/playback';
import { savedMovieService } from '../services/savedMovieService';
import { walletService } from '../services/walletService';
import { useSessionStore } from '../store';
import type { ApiResponse } from '../types/api';
import type { StatementLine } from '../types/episodeAccess';

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
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ok = <T,>(data: T): ApiResponse<T> => ({ success: true, data, statusCode: 200 });
const settle = () => act(async () => {
  await Promise.resolve();
  await Promise.resolve();
});

function render(element: React.ReactElement) {
  let root!: ReactTestRenderer;
  act(() => {
    root = create(element);
  });
  return root;
}

afterEach(() => jest.restoreAllMocks());

describe('SaveButton', () => {
  const label = (root: ReactTestRenderer) => root.root.findByProps({ accessibilityRole: undefined, disabled: false }).props.accessibilityLabel;

  beforeEach(() => {
    act(() => {
      useSessionStore.setState({ isAuthenticated: true });
    });
  });
  afterEach(() => {
    act(() => {
      useSessionStore.setState({ isAuthenticated: false });
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

describe('AI label in a watch room (BR-10)', () => {
  const session: StreamingSession = {
    sessionId: 's1',
    episodeId: 'e1',
    movieId: 'm1',
    accessType: 'FREE' as StreamingSession['accessType'],
    status: 'ACTIVE',
    stream: { masterUrl: 'https://cdn/master.m3u8', qualities: [], durationSeconds: 600 },
    aiLabel: null,
    adSchedule: [],
  };

  it('stays the top layer while a member waits through the Host ad', () => {
    jest.spyOn(playbackService, 'heartbeat').mockResolvedValue({ success: true, data: null as never });
    const root = render(
      <PartyPlayer
        session={session}
        isHost={false}
        sync={null}
        subtitles={[]}
        audioLabel="tiếng gốc"
        onHostAction={() => undefined}
        onEnded={() => undefined}
        roomAd={{ active: true, title: 'Quảng cáo', mediaUrl: 'https://cdn/ad.mp4', durationSeconds: 15, startedAt: 1 }}
        onAdChange={() => undefined}
        quality="auto"
        onQualityChange={() => undefined}
      />,
    );
    const label = root.root.findAll((n) => n.props.testID === 'ai-label-overlay', { deep: true })[0];
    expect(label.findAll((n) => String(n.type) === 'Text').flatMap((n) => n.children)).toEqual([DEFAULT_AI_LABEL]);
    // The stage's last child is the label, drawn after (above) the ad overlay.
    // label = the badge View, its parent = <AiLabelOverlay>, whose parent is the stage holding the ad overlay too.
    const overlay = label.parent!;
    const stage = overlay.parent!;
    const layers = stage.children.filter((c) => typeof c !== 'string') as (typeof overlay)[];
    expect(layers.some((c) => (c.type as { name?: string }).name === 'RoomAdOverlay')).toBe(true);
    expect(layers[layers.length - 1]).toBe(overlay);
    act(() => root.unmount());
  });
});

/**
 * System-test harness (Report 5, sheet ST-Mobile). The real screens, stores, services and API client run as in the
 * app; only the edges are replaced: the network (`fetch`, answered per `METHOD /path` like the BE), the socket
 * server, the native video / browser / orientation / Google modules and the router. Import it FIRST in a test file.
 */
import './env';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Internal helper of the library: the same lookup `fireEvent` does, used to tap twice in one frame.
import { findEventHandler } from '@testing-library/react-native/dist/events/propagation';
import { ThemeProvider } from '../../../theme';
import { AuthModal } from '../../../components/auth/AuthModal';
import { AppDialog } from '../../../components/common/AppDialog';
import { CheckInModal } from '../../../components/wallet/CheckInModal';
import { TopUpModal } from '../../../components/wallet/TopUpModal';
import { RewardSpinModal } from '../../../components/wallet/RewardSpinModal';
import { useAccountStore, useCatalogStore, useSessionStore, useUiStore } from '../../../store';
import { useDialogStore } from '../../../store/dialogStore';
import { usePlayerStore } from '../../../store/playerStore';
import type { UserProfile } from '../../../types/auth';

/* ------------------------------------------------------------------ router */

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  canGoBack: jest.fn(() => true),
};
/** `useLocalSearchParams()` of the screen under test. */
export const mockRoute: { params: Record<string, string | undefined> } = { params: {} };

jest.mock('expo-router', () => {
  const R = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => mockRouter,
    router: mockRouter,
    useLocalSearchParams: () => mockRoute.params,
    // The screen is focused while mounted.
    useFocusEffect: (effect: () => void | (() => void)) => R.useEffect(effect, [effect]),
  };
});

/* ------------------------------------------------------------- native UI */

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, MaterialCommunityIcons: () => null, MaterialIcons: () => null }));
jest.mock('expo-linear-gradient', () => {
  const R = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    LinearGradient: ({ children, style }: { children?: React.ReactNode; style?: import('react-native').ViewStyle }) =>
      R.createElement(View, { style }, children),
  };
});
export const mockInsets = { current: { top: 24, bottom: 16, left: 0, right: 0 } };
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets.current,
  SafeAreaProvider: ({ children }: { children?: React.ReactNode }) => children,
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

/* -------------------------------------------------------- video (expo-video) */

export interface FakePlayer {
  source: { uri: string };
  playing: boolean;
  currentTime: number;
  duration: number;
  status: string;
  playbackRate: number;
  timeUpdateEventInterval: number;
  play: jest.Mock;
  pause: jest.Mock;
  replaceAsync: jest.Mock;
  addListener: (event: string, fn: (payload?: unknown) => void) => { remove: () => void };
  /** What the native player would report: `playToEnd`, `statusChange`… */
  emit: (event: string, payload?: unknown) => void;
}
export const mockVideo = { players: [] as FakePlayer[], viewMounts: 0, duration: 1200 };

function mockMakePlayer(source: { uri: string }): FakePlayer {
  const listeners = new Map<string, Set<(payload?: unknown) => void>>();
  const player: FakePlayer = {
    source,
    playing: false,
    currentTime: 0,
    duration: mockVideo.duration,
    status: 'readyToPlay',
    playbackRate: 1,
    timeUpdateEventInterval: 0,
    play: jest.fn(() => {
      player.playing = true;
    }),
    pause: jest.fn(() => {
      player.playing = false;
    }),
    replaceAsync: jest.fn(() => Promise.resolve()),
    addListener: (event, fn) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
      return { remove: () => listeners.get(event)?.delete(fn) };
    },
    emit: (event, payload) => listeners.get(event)?.forEach((fn) => fn(payload)),
  };
  mockVideo.players.push(player);
  return player;
}

jest.mock('expo-video', () => {
  const R = jest.requireActual<typeof import('react')>('react');
  return {
    useVideoPlayer: (source: { uri: string }, setup?: (p: FakePlayer) => void) => {
      const [player] = R.useState(() => {
        const p = mockMakePlayer(source);
        setup?.(p);
        return p;
      });
      return player;
    },
    // Counts native video surfaces: a remount would build a new one.
    VideoView: () => {
      R.useEffect(() => {
        mockVideo.viewMounts += 1;
      }, []);
      return null;
    },
  };
});

/* ------------------------------------------------- browser, orientation */

export const mockBrowser = {
  openAuthSessionAsync: jest.fn(async () => ({ type: 'success' })),
  openBrowserAsync: jest.fn(async () => ({ type: 'opened' })),
};
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: (...args: unknown[]) => mockBrowser.openAuthSessionAsync(...(args as [])),
  openBrowserAsync: (...args: unknown[]) => mockBrowser.openBrowserAsync(...(args as [])),
}));

export const mockOrientation = { lockAsync: jest.fn(async (_lock: string) => undefined) };
jest.mock('expo-screen-orientation', () => ({
  lockAsync: (lock: string) => mockOrientation.lockAsync(lock),
  OrientationLock: { PORTRAIT_UP: 'PORTRAIT_UP', LANDSCAPE: 'LANDSCAPE' },
}));

/* ------------------------------------------------------- Google SDK */

export const mockGoogle = {
  configure: jest.fn(),
  hasPlayServices: jest.fn(async () => true),
  signIn: jest.fn(async () => ({ type: 'success', data: { idToken: 'google-id-token' } })),
  signOut: jest.fn(async () => undefined),
};
jest.mock('@react-native-google-signin/google-signin', () => ({ GoogleSignin: mockGoogle }));

/* ------------------------------------------------------- socket server */

type Listener = (payload?: unknown) => void;
export const mockSocket = {
  handlers: new Map<string, Listener[]>(),
  /** Everything the app sent: [event, payload]. */
  emitted: [] as [string, unknown][],
  created: 0,
  /** The server sends `event` to this client. */
  serverEmit(event: string, payload?: unknown) {
    (this.handlers.get(event) ?? []).forEach((fn) => fn(payload));
  },
  sent(event: string) {
    return this.emitted.filter(([name]) => name === event).map(([, payload]) => payload);
  },
  reset() {
    this.handlers.clear();
    this.emitted = [];
    this.created = 0;
  },
};
jest.mock('socket.io-client', () => ({
  io: () => {
    mockSocket.created += 1;
    mockSocket.handlers.clear();
    return {
      on: (event: string, fn: Listener) => mockSocket.handlers.set(event, [...(mockSocket.handlers.get(event) ?? []), fn]),
      emit: (event: string, payload: unknown) => mockSocket.emitted.push([event, payload]),
      connect: jest.fn(),
      disconnect: jest.fn(),
      removeAllListeners: () => mockSocket.handlers.clear(),
    };
  },
}));

/* ------------------------------------------------------------ network */

export interface ApiCall {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
}
export interface Reply {
  status: number;
  body?: unknown;
}
type Route = Reply | Promise<Reply> | ((call: ApiCall) => Reply | Promise<Reply>);

/** A BE success envelope. */
export const ok = (data: unknown, status = 200): Reply => ({ status, body: { data } });
/** A BE page: `{ data: rows, meta }`. */
export const page = (rows: unknown[], totalPages = 1): Reply => ({ status: 200, body: { data: rows, meta: { page: 1, totalPages } } });
/** A BE error envelope (`details.reason` when given). */
export const fail = (status: number, message: string, reason?: string): Reply => ({
  status,
  body: { error: { code: 'ERROR', message, details: reason ? { reason } : undefined } },
});

/** The fake BE: replies are queued per `METHOD /path` (the last one repeats); anything else answers 404. */
export const api = {
  routes: new Map<string, Route[]>(),
  calls: [] as ApiCall[],
  /** Requests still waiting for their reply (slow replies included); `settle` and the reset wait for them. */
  inFlight: new Set<Promise<unknown>>(),
  on(key: string, ...replies: Route[]) {
    this.routes.set(key, replies);
    return this;
  },
  /** A reply that takes `ms` to arrive: the request stays in flight meanwhile (double taps, slow networks). */
  slow(key: string, reply: Reply, ms = 50) {
    return this.on(key, () => new Promise<Reply>((resolve) => setTimeout(() => resolve(reply), ms)));
  },
  called(key: string) {
    const [method, path] = key.split(' ');
    return this.calls.filter((c) => c.method === method && c.path === path);
  },
  reset() {
    this.routes.clear();
    this.calls = [];
  },
};

const API_PATH = /\/api(\/[^?#]*)(\?[^#]*)?$/;

/** Every request is tracked until its reply is out, so no reply lands in a later step or a later test. */
function fakeFetch(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const response = answer(input, init);
  api.inFlight.add(response);
  void response.finally(() => api.inFlight.delete(response)).catch(() => undefined);
  return response;
}

async function answer(input: string | URL | Request, init: RequestInit): Promise<Response> {
  const url = String(input instanceof Request ? input.url : input);
  const match = API_PATH.exec(url);
  // Not the API (an HLS playlist, a subtitle file): nothing is on the network in a test.
  if (!match) return { ok: false, status: 404, json: async () => null, text: async () => '' } as Response;
  const method = (init.method ?? 'GET').toUpperCase();
  const call: ApiCall = {
    method,
    path: match[1],
    query: new URLSearchParams(match[2] ?? ''),
    body: typeof init.body === 'string' ? JSON.parse(init.body) : init.body,
    headers: (init.headers ?? {}) as Record<string, string>,
  };
  api.calls.push(call);
  const queue = api.routes.get(`${method} ${call.path}`);
  let reply: Reply = fail(404, 'Not Found');
  if (queue?.length) {
    const next = queue.length > 1 ? queue.shift()! : queue[0];
    reply = await (typeof next === 'function' ? next(call) : next);
  }
  // A string body goes out as is (a WebVTT subtitle file), anything else as JSON.
  const text = reply.body === undefined ? '' : typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body);
  return {
    ok: reply.status >= 200 && reply.status < 300,
    status: reply.status,
    json: async () => (text ? JSON.parse(text) : null),
    text: async () => text,
  } as Response;
}

/* ------------------------------------------------------------ session */

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
/** A signed-looking access token; `expiresIn` seconds from now (negative = already expired). */
export const accessToken = (expiresIn = 3600, sub = 'u-member') =>
  `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub, exp: Math.floor(Date.now() / 1000) + expiresIn })}.signature`;

export const MEMBER: UserProfile = {
  id: 'u-member',
  name: 'Lan Anh',
  email: 'lan.anh@example.com',
  avatarUrl: '',
  dateOfBirth: '2000-05-14',
  phoneNumber: null,
  role: 'user',
  isVIP: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};
/** The BE user object of a session answer. */
export const beUser = (role = 'MEMBER', overrides: Record<string, unknown> = {}) => ({
  id: MEMBER.id,
  email: MEMBER.email,
  fullName: MEMBER.name,
  dateOfBirth: MEMBER.dateOfBirth,
  role,
  ...overrides,
});
export const sessionReply = (role = 'MEMBER', overrides: Record<string, unknown> = {}) =>
  ok({ accessToken: accessToken(), refreshToken: 'refresh-new', user: beUser(role, overrides) });

/** The wallet, plan and owned episodes a member's account load reads. */
export function accountRoutes({ main = 0, bonus = 0, subscription = null as unknown, owned = [] as string[] } = {}) {
  api.on('GET /wallet', ok({ mainBalance: main, bonusBalance: bonus }));
  api.on('GET /subscriptions/me', ok(subscription));
  api.on('GET /accesses', page(owned.map((id) => ({ episode: { id } }))));
}

/** A signed-in member: tokens in storage and the session flag, as after a real sign-in. */
export async function signIn(user: UserProfile = MEMBER, token = accessToken()) {
  await AsyncStorage.setItem('ai_cinema_auth_token', token);
  await AsyncStorage.setItem('ai_cinema_refresh_token', 'refresh-1');
  await act(() => useSessionStore.setState({ isAuthenticated: true, user }));
}

/* ------------------------------------------------------------- render */

/** The screen under the app-wide sheets and dialogs that `app/_layout.tsx` draws above every screen. */
export async function renderApp(ui: React.ReactElement) {
  return render(
    <ThemeProvider initialTheme="dark">
      {ui}
      <AuthModal />
      <CheckInModal />
      <TopUpModal />
      <RewardSpinModal />
      <AppDialog />
    </ThemeProvider>,
  );
}

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Lets the app finish what it started: every request in flight gets its reply (slow ones too), then the promises,
 * 0 ms timers and renders that follow settle. Done once `rounds` turns in a row start no new request.
 */
export const settle = async (rounds = 5) => {
  let quiet = 0;
  // A cap, so a screen that keeps asking (a poll) cannot hold the test forever.
  for (let turn = 0; quiet < rounds && turn < 200; turn += 1) {
    const waiting = [...api.inFlight];
    await act(async () => {
      if (waiting.length) await Promise.allSettled(waiting);
      await nextTick();
    });
    quiet = waiting.length || api.inFlight.size ? 0 : quiet + 1;
  }
};

/** Two taps in the same frame: both reach the handler before React re-renders (a disabled state cannot stop them). */
export async function doubleTap(element: Parameters<typeof fireEvent.press>[0]) {
  // The handler `fireEvent.press` would call; two `fireEvent` calls at once would overlap two act() scopes.
  const { handler } = findEventHandler(element, 'press', { bubbles: true });
  if (!handler) throw new Error('Nothing handles a press on this element');
  await act(async () => {
    handler({ nativeEvent: {}, persist: () => undefined });
    handler({ nativeEvent: {}, persist: () => undefined });
  });
  await settle();
}

/** Presses a button of the app dialog on screen (`AppDialog`). */
export async function answerDialog(button: string) {
  await fireEvent.press(within(screen.getByRole('alert')).getByRole('button', { name: button }));
}

/** The dialog on screen (title and message), or null. */
export const shownDialog = () => useDialogStore.getState().queue[0] ?? null;

/* -------------------------------------------------------------- reset */

const initial = {
  session: useSessionStore.getState(),
  account: useAccountStore.getState(),
  catalog: useCatalogStore.getState(),
  ui: useUiStore.getState(),
  player: usePlayerStore.getState(),
};

// The fake network is in place before the start-up read below, so it never reaches the real one.
const realFetch = globalThis.fetch;
globalThis.fetch = fakeFetch as typeof fetch;
afterAll(() => {
  globalThis.fetch = realFetch;
});

beforeAll(async () => {
  // The store barrel starts the start-up read once the session is back from storage; let it finish first.
  await useSessionStore.persist.rehydrate();
  await settle();
});

beforeEach(() => {
  api.reset();
  mockSocket.reset();
  mockVideo.players = [];
  mockVideo.viewMounts = 0;
  mockVideo.duration = 1200;
  mockRoute.params = {};
  mockInsets.current = { top: 24, bottom: 16, left: 0, right: 0 };
});

afterEach(async () => {
  // In this order: the test's own work finishes, the screen unmounts (its timers stop), what the unmount started
  // finishes, and only then the stores are reset, so nothing of this test reaches the next one.
  await settle();
  await act(async () => {
    await cleanup();
  });
  await settle();
  await AsyncStorage.clear();
  await act(() => {
    useSessionStore.setState(initial.session, true);
    useAccountStore.setState(initial.account, true);
    useCatalogStore.setState(initial.catalog, true);
    useUiStore.setState(initial.ui, true);
    usePlayerStore.setState(initial.player, true);
    useDialogStore.setState({ queue: [] });
  });
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

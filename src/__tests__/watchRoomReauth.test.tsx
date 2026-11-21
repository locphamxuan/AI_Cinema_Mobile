import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ROOM_EVENT, SESSION_EXPIRED_NOTICE, useWatchRoomSocket } from '../hooks/useWatchRoomSocket';
import { apiClient } from '../services/apiClient';

type Handler = (payload?: unknown) => void;
const mockHandlers = new Map<string, Handler>();
const mockConnect = jest.fn();
const mockSocket: { auth?: (send: (data: { token: string }) => void) => void } = {};
jest.mock('socket.io-client', () => ({
  io: (_url: string, options: { auth: (send: (data: { token: string }) => void) => void }) => {
    mockSocket.auth = options.auth;
    return {
      on: (event: string, fn: Handler) => mockHandlers.set(event, fn),
      emit: jest.fn(),
      connect: mockConnect,
      removeAllListeners: jest.fn(),
      disconnect: jest.fn(),
    };
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const probe: { hook?: ReturnType<typeof useWatchRoomSocket> } = {};
function Probe() {
  const hook = useWatchRoomSocket('r1');
  React.useEffect(() => {
    probe.hook = hook;
  });
  return null;
}

const flush = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

/** The handshake sends the first token, the BE rejects it and drops the socket. */
async function rejectHandshake() {
  await act(async () => {
    await new Promise<void>((resolve) => mockSocket.auth?.(() => resolve()));
  });
  act(() => mockHandlers.get(ROOM_EVENT.ERROR)?.({ reason: 'UNAUTHENTICATED' }));
  act(() => mockHandlers.get('disconnect')?.('io server disconnect'));
  await flush();
}

describe('watch room socket after the BE rejects the token', () => {
  let root: ReactTestRenderer;
  beforeEach(async () => {
    mockHandlers.clear();
    mockConnect.mockClear();
    await act(async () => {
      root = create(<Probe />);
    });
  });
  afterEach(() => {
    act(() => root.unmount());
    jest.restoreAllMocks();
  });

  it('reconnects once with a new token', async () => {
    jest.spyOn(apiClient, 'getFreshAccessToken').mockResolvedValueOnce('old').mockResolvedValueOnce('new');
    await rejectHandshake();
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(probe.hook?.live.closed).toBe(false);
  });

  it('stops when the session is gone or the same token would be sent again', async () => {
    jest.spyOn(apiClient, 'getFreshAccessToken').mockResolvedValueOnce('same').mockResolvedValueOnce('same');
    await rejectHandshake();
    expect(mockConnect).not.toHaveBeenCalled();
    expect(probe.hook?.live).toMatchObject({ closed: true, notice: SESSION_EXPIRED_NOTICE });
  });

  it('stops when no token is left after a revoked refresh token', async () => {
    jest.spyOn(apiClient, 'getFreshAccessToken').mockResolvedValueOnce('old').mockResolvedValueOnce('');
    await rejectHandshake();
    expect(mockConnect).not.toHaveBeenCalled();
    expect(probe.hook?.live.notice).toBe(SESSION_EXPIRED_NOTICE);
  });

  it('does not reconnect after an ordinary server disconnect', async () => {
    const fresh = jest.spyOn(apiClient, 'getFreshAccessToken').mockResolvedValue('t');
    act(() => mockHandlers.get('disconnect')?.('io server disconnect'));
    await flush();
    expect(mockConnect).not.toHaveBeenCalled();
    expect(fresh).not.toHaveBeenCalled();
  });

  /** The BE refuses the handshake itself (middleware): the socket hears connect_error, no room event. */
  async function refuseHandshake() {
    await act(async () => {
      await new Promise<void>((resolve) => mockSocket.auth?.(() => resolve()));
    });
    act(() => mockHandlers.get('connect_error')?.(new Error('UNAUTHENTICATED')));
    await flush();
  }

  it('refreshes the session once and connects again when the handshake is refused', async () => {
    jest.spyOn(apiClient, 'getFreshAccessToken').mockResolvedValue('old');
    const refresh = jest.spyOn(apiClient, 'refreshAccessToken').mockResolvedValue('new');
    await refuseHandshake();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledTimes(1);

    // A second refusal in a row ends the room with the notice instead of looping.
    act(() => mockHandlers.get('connect_error')?.(new Error('UNAUTHENTICATED')));
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(probe.hook?.live).toMatchObject({ closed: true, notice: SESSION_EXPIRED_NOTICE });
  });

  it('leaves network errors to socket.io, and a connect resets the count and the notice', async () => {
    const refresh = jest.spyOn(apiClient, 'refreshAccessToken').mockResolvedValue('new');
    act(() => mockHandlers.get('connect_error')?.(new Error('xhr poll error')));
    await flush();
    expect(refresh).not.toHaveBeenCalled();
    act(() => mockHandlers.get('connect')?.());
    expect(probe.hook?.live).toMatchObject({ connected: true, notice: null });
  });
});

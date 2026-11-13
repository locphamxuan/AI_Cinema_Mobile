import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ROOM_EVENT, useWatchRoomSocket } from '../hooks/useWatchRoomSocket';

type Handler = (payload?: unknown) => void;
const mockHandlers = new Map<string, Handler>();
const mockEmit = jest.fn();
jest.mock('socket.io-client', () => ({
  io: () => ({
    on: (event: string, fn: Handler) => mockHandlers.set(event, fn),
    emit: (...args: unknown[]) => mockEmit(...args),
    removeAllListeners: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

const probe: { hook?: ReturnType<typeof useWatchRoomSocket> } = {};
function Probe() {
  probe.hook = useWatchRoomSocket('r1');
  return null;
}

const fire = (event: string, payload?: unknown) =>
  act(() => {
    mockHandlers.get(event)?.(payload);
  });

describe('useWatchRoomSocket shared screen (BR-69)', () => {
  let root: ReactTestRenderer;
  beforeEach(async () => {
    mockHandlers.clear();
    mockEmit.mockClear();
    await act(async () => {
      root = create(<Probe />);
    });
  });
  afterEach(() => act(() => root.unmount()));

  it('asks for the room screen once joined and catches up on quality, ad and chat', () => {
    fire(ROOM_EVENT.JOINED, { room: { id: 'r1', hostUserId: 'h', participantCount: 2 } });
    expect(mockEmit).toHaveBeenCalledWith(ROOM_EVENT.SCREEN_STATE, { roomId: 'r1' });
    const chat = [{ id: '1', userId: 'h', fullName: 'Host', text: 'hi', sentAt: 1 }];
    fire(ROOM_EVENT.SCREEN, { quality: '720p', ad: { active: true, title: 'Ad' }, chat });
    expect(probe.hook!.live).toMatchObject({ quality: '720p', ad: { active: true }, chat });
  });

  it('appends chat lines, explains a refused one, and sends with the room id', () => {
    fire(ROOM_EVENT.CHAT_MESSAGE, { id: '2', userId: 'm', fullName: 'Bình', text: 'xin chào', sentAt: 2 });
    expect(probe.hook!.live.chat.map((m) => m.text)).toEqual(['xin chào']);
    fire(ROOM_EVENT.CHAT_REJECTED, { reason: 'RATE_LIMITED' });
    expect(probe.hook!.live.notice).toContain('nhanh quá');
    act(() => {
      probe.hook!.sendChat('hello');
    });
    expect(mockEmit).toHaveBeenCalledWith(ROOM_EVENT.CHAT, { roomId: 'r1', text: 'hello' });
  });

  it('follows the Host ad and quality, and drops the ad when the Host changes', () => {
    fire(ROOM_EVENT.AD_STATE, { active: true, mediaUrl: 'https://cdn/ad.mp4' });
    expect(probe.hook!.live.ad.active).toBe(true);
    fire(ROOM_EVENT.QUALITY_CHANGED, { quality: '480p' });
    expect(probe.hook!.live.quality).toBe('480p');
    fire(ROOM_EVENT.HOST_CHANGED, { newHostUserId: 'm' });
    expect(probe.hook!.live.ad.active).toBe(false);
    act(() => {
      probe.hook!.sendAd(true, 'b1');
      probe.hook!.sendQuality('1080p');
    });
    expect(mockEmit).toHaveBeenCalledWith(ROOM_EVENT.AD_BREAK, { roomId: 'r1', active: true, breakId: 'b1' });
    expect(mockEmit).toHaveBeenCalledWith(ROOM_EVENT.QUALITY, { roomId: 'r1', quality: '1080p' });
  });
});

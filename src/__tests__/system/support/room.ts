/** A watch room as the BE and its socket server answer it. */
import { act } from '@testing-library/react-native';
import React from 'react';
import { MEMBER, accountRoutes, api, mockRoute, mockSocket, ok, renderApp, settle, signIn } from './harness';
import { activePlan, episodeDto, streamingSession } from './fixtures';
import WatchPartyScreen from '../../../../app/watch-party/[roomId]';
import { ROOM_EVENT } from '../../../lib/roomEvents';

export const HOST_ID = 'u-host';

export const room = (overrides: Record<string, unknown> = {}) => ({
  id: 'r-1',
  roomCode: 'AB2-CD9',
  episodeId: 'ep-1',
  hostUserId: HOST_ID,
  status: 'ACTIVE',
  currentPositionSeconds: 0,
  participantCount: 2,
  participants: [
    { userId: HOST_ID, fullName: 'Chủ phòng' },
    { userId: MEMBER.id, fullName: MEMBER.name },
  ],
  ...overrides,
});

/** The server sends `event` on the room socket. */
export const serverSends = (event: string, payload?: unknown) => act(() => mockSocket.serverEmit(event, payload));

/** Opens room r-1 as the signed-in member (the Host when `asHost`), with the socket connected and joined. */
export async function enterRoom({ asHost = false, roomOverrides = {} as Record<string, unknown> } = {}) {
  await signIn(asHost ? { ...MEMBER, id: HOST_ID } : MEMBER);
  accountRoutes({ subscription: activePlan() });
  const opened = room(roomOverrides);
  api.on('POST /watch-rooms/r-1/join', ok(opened));
  api.on('POST /playback/sessions', (call) => ok(streamingSession((call.body as { episodeId: string }).episodeId), 201));
  api.on('GET /movies/m-1/episodes', ok([episodeDto(1), episodeDto(2)]));
  api.on('GET /friends', ok([]));
  mockRoute.params = { roomId: 'r-1' };
  const view = await renderApp(React.createElement(WatchPartyScreen));
  await settle();
  await serverSends('connect');
  await serverSends(ROOM_EVENT.JOINED, { room: opened });
  await settle();
  return view;
}

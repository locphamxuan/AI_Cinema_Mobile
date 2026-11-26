import { MEMBER, accountRoutes, api, doubleTap, mockRouter, mockSocket, ok, renderApp, settle, signIn } from './support/harness';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { Share } from 'react-native';
import { room } from './support/room';
import CreateWatchPartyScreen from '../../../app/watch-party/create';
import { ROOM_EVENT } from '../../lib/roomEvents';
import { activePlan } from './support/fixtures';

const historyRow = (episodeId: string, n: number, available = true) => ({
  episodeId,
  episodeTitle: `Tập ${n}`,
  episodeNumber: n,
  thumbnailUrl: null,
  movieId: 'm-1',
  movieTitle: 'Mùa Hạ Trong Gương',
  positionSeconds: 300,
  durationSeconds: 1200,
  completed: false,
  lastWatchedAt: '2026-11-23T20:00:00.000Z',
  available,
  notice: null,
});

describe('ST-MOB-21 Open a room from the lobby', () => {
  it('ST-MOB-21 blocks a member without an active Monthly plan before loading room history', async () => {
    await signIn();
    accountRoutes();
    await renderApp(<CreateWatchPartyScreen />);
    await settle();

    expect(screen.getByText('Cần gói Tháng còn hiệu lực')).toBeOnTheScreen();
    expect(screen.getByText('Xem gói Tháng')).toBeOnTheScreen();
    expect(api.called('GET /playback/history')).toHaveLength(0);
    expect(api.called('POST /watch-rooms')).toHaveLength(0);
  });

  it('ST-MOB-21 picks an episode from the history, opens the room, shares the code and invites a friend without taking the Host seat', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    await signIn();
    accountRoutes({ subscription: activePlan({ status: 'PAST_DUE' }) });
    api.on('GET /playback/history', ok([historyRow('ep-2', 2), historyRow('ep-9', 9, false)]));
    api.on('POST /watch-rooms', ok(room({ episodeId: 'ep-2', hostUserId: MEMBER.id }), 201));
    api.on('GET /friends', ok([{ id: 'f-1', senderId: MEMBER.id, receiverId: 'u-an', status: 'ACCEPTED', createdAt: '', friend: { id: 'u-an', fullName: 'Trần An' } }]));
    await renderApp(<CreateWatchPartyScreen />);
    await settle();

    // Only episodes that can still be watched are offered.
    expect(screen.queryByLabelText('Mùa Hạ Trong Gương · Tập 9')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Mùa Hạ Trong Gương · Tập 2'));
    await fireEvent.press(screen.getByText('Tạo phòng'));
    await settle();
    expect(api.called('POST /watch-rooms')[0].body).toEqual({ episodeId: 'ep-2' });
    expect(api.called('POST /watch-rooms')[0].headers['X-Device-Id']).toBeTruthy();

    expect(screen.getByLabelText('Mã phòng AB2-CD9')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Chia sẻ mã phòng'));
    expect(share).toHaveBeenCalledWith({ message: 'Vào xem phim cùng mình trên AI Cinema, mã phòng: AB2-CD9' });

    await act(() => mockSocket.serverEmit('connect'));
    await settle();
    await fireEvent.press(screen.getByLabelText('Mời Trần An'));
    expect(mockSocket.sent(ROOM_EVENT.INVITE)).toEqual([{ roomId: 'r-1', friendId: 'u-an' }]);
    // The lobby socket only invites: it never joins, so the Host seat waits for the Host's own player.
    expect(mockSocket.sent(ROOM_EVENT.JOIN)).toEqual([]);
    await act(() => mockSocket.serverEmit(ROOM_EVENT.INVITE_SENT, {}));
    expect(screen.getByText('Đã gửi lời mời. Có thể mời lại người này sau 60 giây.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Vào phòng xem'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/watch-party/r-1');
  });

  it('ST-MOB-21 opens one room for a double tap on "Tạo phòng"', async () => {
    await signIn();
    accountRoutes({ subscription: activePlan() });
    api.on('GET /playback/history', ok([historyRow('ep-2', 2)]));
    api.slow('POST /watch-rooms', ok(room({ hostUserId: MEMBER.id }), 201));
    api.on('GET /friends', ok([]));
    await renderApp(<CreateWatchPartyScreen />);
    await settle();
    await fireEvent.press(screen.getByLabelText('Mùa Hạ Trong Gương · Tập 2'));
    await doubleTap(screen.getByText('Tạo phòng'));
    await settle();
    expect(api.called('POST /watch-rooms')).toHaveLength(1);
  });
});

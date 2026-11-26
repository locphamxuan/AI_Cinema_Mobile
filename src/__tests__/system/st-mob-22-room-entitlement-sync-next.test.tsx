import { accountRoutes, api, doubleTap, fail, mockRoute, ok, renderApp, settle, signIn } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { activePlan, episodeDto } from './support/fixtures';
import { enterRoom, room, serverSends } from './support/room';
import { episodePlayer, playTo } from './support/watch';
import WatchPartyScreen from '../../../app/watch-party/[roomId]';
import { ROOM_EVENT } from '../../lib/roomEvents';

describe('ST-MOB-22 Room entitlement, sync and next episode', () => {
  it('ST-MOB-22 blocks a direct room invite when the member has no active Monthly plan', async () => {
    await signIn();
    accountRoutes();
    mockRoute.params = { roomId: 'r-1' };
    await renderApp(<WatchPartyScreen />);
    await settle();

    expect(screen.getByText('Cần gói Tháng còn hiệu lực')).toBeOnTheScreen();
    expect(api.called('POST /watch-rooms/r-1/join')).toHaveLength(0);
    expect(api.called('POST /playback/sessions')).toHaveLength(0);
  });

  it('ST-MOB-22 refuses a member without the episode before any stream opens', async () => {
    await signIn();
    accountRoutes({ subscription: activePlan() });
    api.on(
      'POST /watch-rooms/r-1/join',
      fail(403, 'Entitlement required', 'ENTITLEMENT_REQUIRED'),
    );
    mockRoute.params = { roomId: 'r-1' };
    await renderApp(<WatchPartyScreen />);
    await settle();
    expect(screen.getByText('Bạn chưa có quyền xem tập này. Mở khóa tập hoặc đăng ký gói Tháng để vào phòng.')).toBeOnTheScreen();
    expect(api.called('POST /playback/sessions')).toHaveLength(0);
  });

  it('ST-MOB-22 has the member follow the Host play, pause and seek', async () => {
    await enterRoom();
    const player = episodePlayer('ep-1');
    await serverSends(ROOM_EVENT.SYNC_PLAYBACK, { state: 'PLAYING', positionSeconds: 120, serverTimestamp: Date.now() });
    expect(player.play).toHaveBeenCalled();
    expect(player.currentTime).toBeGreaterThanOrEqual(120);
    await playTo(player, 121);
    await serverSends(ROOM_EVENT.SYNC_PLAYBACK, { state: 'PAUSED', positionSeconds: 121, serverTimestamp: Date.now() });
    expect(player.pause).toHaveBeenCalled();
    expect(player.currentTime).toBe(121);
    await serverSends(ROOM_EVENT.SYNC_PLAYBACK, { state: 'PAUSED', positionSeconds: 600, serverTimestamp: Date.now() });
    expect(player.currentTime).toBe(600);
    // A member has no seek bar: the Host leads.
    expect(screen.queryByLabelText('Thanh tua')).toBeNull();
    expect(screen.getByText('Đang xem theo chủ phòng')).toBeOnTheScreen();
  });

  it('ST-MOB-22 moves the member to the episode the Host opened next (D-20)', async () => {
    await enterRoom();
    api.on('GET /watch-rooms/r-1', ok(room({ episodeId: 'ep-2' })));
    await serverSends(ROOM_EVENT.SYNC_PLAYBACK, { state: 'ENDED', positionSeconds: 0, serverTimestamp: Date.now() });
    await serverSends(ROOM_EVENT.SYNC_PLAYBACK, { state: 'PLAYING', positionSeconds: 0, serverTimestamp: Date.now() });
    await settle();
    expect(api.called('GET /watch-rooms/r-1')).toHaveLength(1);
    const sessions = api.called('POST /playback/sessions').map((c) => (c.body as { episodeId: string }).episodeId);
    expect(sessions).toEqual(['ep-1', 'ep-2']);
    expect(episodePlayer('ep-2')).toBeDefined();
  });

  it('ST-MOB-22 lets the Host move the room on once for a double tap on "Tập tiếp"', async () => {
    await enterRoom({ asHost: true });
    api.slow('POST /watch-rooms/r-1/next-episode', ok({ ...room({ episodeId: 'ep-2' }), blockedUserIds: [] }));
    api.on('GET /movies/m-1/episodes', ok([episodeDto(1), episodeDto(2)]));
    await doubleTap(screen.getByText('Tập tiếp'));
    await settle();
    expect(api.called('POST /watch-rooms/r-1/next-episode')).toHaveLength(1);
    expect(api.called('POST /playback/sessions').map((c) => (c.body as { episodeId: string }).episodeId)).toEqual(['ep-1', 'ep-2']);
    await fireEvent.press(screen.getByLabelText('Phát'));
    expect(episodePlayer('ep-2').play).toHaveBeenCalled();
  });
});

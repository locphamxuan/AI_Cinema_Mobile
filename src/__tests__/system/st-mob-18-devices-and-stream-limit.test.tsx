import { accountRoutes, answerDialog, api, fail, mockRoute, mockRouter, ok, renderApp, settle, shownDialog, signIn } from './support/harness';
import { fireEvent, screen } from '@testing-library/react-native';
import { granted, movieRoutes } from './support/fixtures';
import DevicesScreen from '../../../app/devices';
import WatchScreen from '../../../app/watch/[id]';

const overview = (streams: number) => ({
  limits: { maxRegisteredDevices: 2, maxConcurrentStreams: 1 },
  devices: [
    { id: 'd-1', name: 'Điện thoại của Lan', platform: 'ANDROID', createdAt: '2026-11-01T00:00:00.000Z', lastSeenAt: new Date().toISOString(), current: true },
    { id: 'd-2', name: 'Máy tính bảng', platform: 'ANDROID', createdAt: '2026-11-02T00:00:00.000Z', lastSeenAt: new Date().toISOString(), current: false },
  ],
  activeSessions: streams
    ? [{ id: 'live-1', deviceId: 'd-2', startedAt: '', lastHeartbeatAt: '', positionSeconds: 754, episode: { id: 'ep-9', title: 'Tập 9', episodeNumber: 9, movieTitle: 'Gió Đầu Mùa' } }]
    : [],
});

describe('ST-MOB-18 Devices and stream limit', () => {
  it('ST-MOB-18 blocks a new stream over the limit and points to the device list', async () => {
    await signIn();
    accountRoutes();
    movieRoutes();
    api.on('GET /playback/history', ok([]));
    api.on('GET /episodes/ep-1/access', ok(granted('ep-1')));
    api.on('POST /playback/sessions', fail(409, 'Too many streams', 'CONCURRENT_LIMIT_REACHED'));
    mockRoute.params = { id: 'm-1', episodeId: 'ep-1' };
    await renderApp(<WatchScreen />);
    await settle();
    await fireEvent.press(screen.getByLabelText('Phát tập'));
    await settle();

    expect(shownDialog()).toMatchObject({
      title: 'Đã đạt giới hạn thiết bị',
      message: 'Tài khoản đang xem trên quá nhiều thiết bị cùng lúc. Hãy dừng xem ở thiết bị khác rồi thử lại.',
    });
    expect(screen.queryByTestId('player-inline')).toBeNull();
    await answerDialog('Quản lý thiết bị');
    expect(mockRouter.push).toHaveBeenCalledWith('/devices');
  });

  it('ST-MOB-18 lists the devices and frees the slot when a stream is ended', async () => {
    await signIn();
    api.on('GET /devices', ok(overview(1)), ok(overview(0)));
    api.on('POST /devices/sessions/live-1/end', ok(null));
    await renderApp(<DevicesScreen />);
    await settle();

    expect(screen.getByText('Điện thoại của Lan')).toBeOnTheScreen();
    expect(screen.getByText('Máy này')).toBeOnTheScreen();
    expect(screen.getByText('1/1')).toBeOnTheScreen();
    expect(screen.getByText('Gió Đầu Mùa · Tập 9')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Dừng phát Gió Đầu Mùa'));
    expect(shownDialog()?.title).toBe('Dừng phát?');
    await answerDialog('Dừng phát');
    await settle();
    expect(api.called('POST /devices/sessions/live-1/end')).toHaveLength(1);
    expect(screen.getByText('0/1')).toBeOnTheScreen();
    expect(screen.getByText('Không có thiết bị nào đang phát.')).toBeOnTheScreen();
  });
});

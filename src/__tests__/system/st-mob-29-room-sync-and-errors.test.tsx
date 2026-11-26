import { screen } from '@testing-library/react-native';
import { enterRoom, serverSends } from './support/room';
import { episodePlayer, playTo } from './support/watch';
import { ROOM_EVENT } from '../../lib/roomEvents';
import { installGlobalErrorHandler, type ErrorUtilsLike } from '../../lib/globalErrorHandler';

describe('ST-MOB-29 Watch room sync and errors', () => {
  it('ST-MOB-29 follows the Host and ignores a sync without a position instead of seeking to NaN (D-40)', async () => {
    await enterRoom();
    const player = episodePlayer('ep-1');
    await serverSends(ROOM_EVENT.SYNC_PLAYBACK, { state: 'PLAYING', positionSeconds: 90, serverTimestamp: Date.now() });
    await playTo(player, 91);
    const writes: number[] = [];
    Object.defineProperty(player, 'currentTime', {
      get: () => 91,
      set: (value: number) => writes.push(value),
      configurable: true,
    });

    await serverSends(ROOM_EVENT.SYNC_PLAYBACK, { state: 'PLAYING', positionSeconds: Number.NaN, serverTimestamp: Date.now() });
    await serverSends(ROOM_EVENT.HEARTBEAT_SYNC, { state: 'PAUSED', serverTimestamp: Date.now() });
    expect(writes).toEqual([]);
    expect(player.pause).toHaveBeenCalled();

    await serverSends(ROOM_EVENT.SYNC_PLAYBACK, { state: 'PAUSED', positionSeconds: 300, serverTimestamp: Date.now() });
    expect(writes).toEqual([300]);
    expect(screen.getAllByTestId('ai-label-overlay')).toHaveLength(1);
  });

  it('ST-MOB-29 keeps a release build open and logs an error thrown outside a screen (D-42)', () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const closeApp = jest.fn();
    let handler: (error: unknown, isFatal?: boolean) => void = closeApp;
    const utils: ErrorUtilsLike = { getGlobalHandler: () => handler, setGlobalHandler: (h) => (handler = h) };

    expect(installGlobalErrorHandler(utils, false)).toBe(true);
    // A socket callback or a timer throws: React Native would report it as fatal and close the app.
    handler(new TypeError("Cannot read properties of undefined (reading 'positionSeconds')"), true);
    expect(closeApp).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Lỗi chưa xử lý (đã giữ app mở):', expect.any(TypeError));
  });
});

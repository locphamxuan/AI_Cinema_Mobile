import * as ScreenOrientation from 'expo-screen-orientation';
import { lockLandscape, lockPortrait } from '../lib/orientation';

jest.mock('expo-screen-orientation', () => ({
  OrientationLock: { PORTRAIT_UP: 'PORTRAIT_UP', LANDSCAPE: 'LANDSCAPE' },
  lockAsync: jest.fn(() => Promise.resolve()),
}));

describe('orientation helpers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('locks landscape for fullscreen video', async () => {
    await lockLandscape();
    expect(ScreenOrientation.lockAsync).toHaveBeenCalledWith('LANDSCAPE');
  });

  it('locks back to portrait afterwards', async () => {
    await lockPortrait();
    expect(ScreenOrientation.lockAsync).toHaveBeenCalledWith('PORTRAIT_UP');
  });

  it('does not throw when the device refuses the lock', async () => {
    (ScreenOrientation.lockAsync as jest.Mock).mockRejectedValueOnce(new Error('unsupported'));
    await expect(lockLandscape()).resolves.toBeUndefined();
  });
});

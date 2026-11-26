/** API answers the BE added on 2026-11-24: each is retried or worded in plain Vietnamese on the phone. */
import { accessToken, api, fail, ok, signIn } from './system/support/harness';
import { playbackService } from '../services/playbackService';
import { watchRoomService } from '../services/watchRoomService';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';
import { roomErrorNotice } from '../lib/roomEvents';
import { useSessionStore } from '../store';

describe('playback calls after the access token expired', () => {
  it('refreshes the token and sends the heartbeat again instead of stopping the player (SESSION_SIGN_IN_REQUIRED)', async () => {
    const fresh = accessToken(900);
    await signIn();
    api.on('PATCH /playback/sessions/s-1/heartbeat', fail(401, 'Sign in again to keep playing this session', 'SESSION_SIGN_IN_REQUIRED'), ok({ status: 'ACTIVE' }));
    api.on('POST /auth/refresh', ok({ accessToken: fresh, refreshToken: 'refresh-2' }));

    const res = await playbackService.heartbeat('s-1', 120, 15);

    expect(res.success).toBe(true);
    const beats = api.called('PATCH /playback/sessions/s-1/heartbeat');
    expect(beats).toHaveLength(2);
    expect(beats[1].headers.Authorization).toBe(`Bearer ${fresh}`);
    expect(beats[1].headers['X-Device-Id']).toBeTruthy();
  });

  it('words the refusal in Vietnamese when the session cannot be renewed', async () => {
    await signIn();
    api.on('POST /playback/sessions/s-1/stop', fail(401, 'Sign in again to keep playing this session', 'SESSION_SIGN_IN_REQUIRED'));
    api.on('POST /auth/refresh', fail(401, 'Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID'));
    const res = await playbackService.stop('s-1', 300);
    expect(res.message).toBe('Hết hạn đăng nhập, vui lòng đăng nhập lại để xem tiếp.');
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });
});

describe('refresh token refused', () => {
  it('signs the phone out when the BE reports a reused refresh token (REFRESH_TOKEN_REUSED)', async () => {
    await signIn();
    api.on('POST /auth/refresh', fail(401, 'This refresh token was already used; every session has been signed out', 'REFRESH_TOKEN_REUSED'));
    expect(await apiClient.refreshAccessToken()).toBe('');
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });
});

describe('watch room refusals', () => {
  it('says how long a member is locked out after too many wrong codes (CODE_GUESS_LOCKED)', async () => {
    await signIn();
    api.on('POST /watch-rooms/join', fail(403, 'Too many wrong room codes; try again in 15 minutes', 'CODE_GUESS_LOCKED'));
    const res = await watchRoomService.joinByCode('AB2-CD9');
    expect(res.message).toBe('Nhập sai mã phòng quá nhiều lần, thử lại sau 15 phút.');
  });

  it('words a closed room and a hand-over to someone gone (ROOM_CLOSED, NEW_HOST_NOT_IN_ROOM)', async () => {
    await signIn();
    api.on('POST /watch-rooms/r-1/next-episode', fail(409, 'Room is closed', 'ROOM_CLOSED'));
    api.on('POST /watch-rooms/r-1/leave', fail(400, 'The new Host must be a member still in the room', 'NEW_HOST_NOT_IN_ROOM'));
    expect((await watchRoomService.nextEpisode('r-1')).message).toBe('Phòng đã đóng.');
    expect((await watchRoomService.leave('r-1', 'TRANSFER')).message).toBe('Chủ phòng mới phải là người vẫn còn trong phòng.');
  });

  it.each([
    [{ reason: 'INVALID_PAYLOAD' }, 'Thao tác chưa gửi được tới phòng. Thử lại sau giây lát.'],
    [{ reason: 'NOT_IN_ROOM' }, 'Bạn không còn ở trong phòng này. Mở lại phòng để vào tiếp.'],
    [{ reason: 'Room is closed', details: { reason: 'ROOM_CLOSED' } }, 'Phòng đã đóng.'],
  ])('shows ROOM_ERROR %j in Vietnamese', (error, notice) => {
    expect(roomErrorNotice(error)).toBe(notice);
  });
});

describe('date of birth out of range (DATE_OF_BIRTH_INVALID)', () => {
  it('words the 400 of sign-up and of the profile in Vietnamese', async () => {
    const refusal = fail(400, 'Date of birth must be between 1900-01-01 and today', 'DATE_OF_BIRTH_INVALID');
    api.on('POST /auth/register', refusal);
    const signUp = await authService.register({ fullName: 'Lan Anh', email: 'a@b.vn', password: 'Matkhau123', dateOfBirth: '2099-01-01', acceptedTerms: true });
    expect(signUp.message).toBe('Ngày sinh phải từ 01/01/1900 đến hôm nay.');

    await signIn();
    api.on('PATCH /auth/me', refusal);
    const profile = await useSessionStore.getState().updateProfile({ dateOfBirth: '2099-01-01' });
    expect(profile.error).toBe('Ngày sinh phải từ 01/01/1900 đến hôm nay.');
  });
});

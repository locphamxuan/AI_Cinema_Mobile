import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { deviceIdentity, deviceKey } from '../lib/device';
import { idempotencyKey } from '../lib/ids';
import { uuidV4 } from '../lib/playback';
import { storage, STORAGE_KEYS } from '../lib/storage';
import type { ApiResponse } from '../types/api';
import type { SessionState, StreamingSession } from '../types/playback';

const { PLAYBACK } = API_ROUTES;

/** The device's guest identity for playback, kept so reopening the app reuses the live session. */
export async function guestKey(): Promise<string> {
  const saved = await storage.getString(STORAGE_KEYS.GUEST_KEY);
  if (saved) return saved;
  const key = uuidV4();
  await storage.set(STORAGE_KEYS.GUEST_KEY, key);
  return key;
}

const isMember = async () => !!(await storage.getString(STORAGE_KEYS.AUTH_TOKEN));

/**
 * A session belongs to a member (bearer token) or a guest (X-Guest-Key), never both. A member
 * plays from a registered device, named by X-Device-Id (MF-4).
 */
async function owner(headers: Record<string, string> = {}) {
  return {
    headers: (await isMember())
      ? { ...headers, 'X-Device-Id': await deviceKey() }
      : { ...headers, 'X-Guest-Key': await guestKey() },
  };
}

class PlaybackService {
  /** POST /playback/sessions - re-verifies access and hands back the stream, ads and resume point. */
  async openSession(episodeId: string, key = idempotencyKey('play-')): Promise<ApiResponse<StreamingSession>> {
    // The name and platform label this device on the member's device list.
    const body = (await isMember()) ? { episodeId, ...deviceIdentity() } : { episodeId };
    return apiClient.post<StreamingSession>(PLAYBACK.SESSIONS, body, await owner({ 'Idempotency-Key': key }));
  }

  /** `watchedSeconds` is what actually played since the last beat: 0 keeps a paused session alive without credit. */
  async heartbeat(sessionId: string, positionSeconds: number, watchedSeconds: number): Promise<ApiResponse<SessionState>> {
    return apiClient.patch<SessionState>(PLAYBACK.HEARTBEAT(sessionId), { positionSeconds, watchedSeconds }, await owner());
  }

  async stop(sessionId: string, positionSeconds: number): Promise<ApiResponse<SessionState>> {
    return apiClient.post<SessionState>(PLAYBACK.STOP(sessionId), { positionSeconds }, await owner());
  }

  /** The BE marks the episode completed only past its completion threshold. */
  async complete(sessionId: string, positionSeconds: number): Promise<ApiResponse<SessionState>> {
    return apiClient.post<SessionState>(PLAYBACK.COMPLETE(sessionId), { positionSeconds }, await owner());
  }

  async adStarted(sessionId: string, breakId: string, positionSeconds: number) {
    return apiClient.post(PLAYBACK.AD_STARTED(sessionId, breakId), { positionSeconds }, await owner());
  }

  async adFinished(sessionId: string, breakId: string) {
    return apiClient.post(PLAYBACK.AD_FINISHED(sessionId, breakId), {}, await owner());
  }
}

export const playbackService = new PlaybackService();

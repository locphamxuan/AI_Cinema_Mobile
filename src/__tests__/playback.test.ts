import { cuesReached, resumePointOf, uuidV4 } from '../lib/playback';
import { guestKey, playbackService } from '../services/playbackService';
import { extractErrorMessage } from '../services/apiClient';
import { storage, STORAGE_KEYS } from '../lib/storage';
import type { AdScheduleItem } from '../types/playback';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const cue = (breakId: string, positionSeconds: number): AdScheduleItem => ({
  breakId,
  positionSeconds,
  ad: { id: `ad-${breakId}`, title: 'Ad', mediaUrl: 'https://cdn/ad.mp4', clickUrl: null, durationSeconds: 15 },
});

const ok = (body: unknown) => ({ ok: true, status: 200, text: async () => JSON.stringify(body) }) as Response;
const headersOf = (call: unknown[]) => (call[1] as RequestInit).headers as Record<string, string>;

describe('MF-3 playback session', () => {
  beforeEach(() => storage.clear());
  afterEach(() => jest.restoreAllMocks());

  it('makes a UUID v4 guest key and keeps it on the device', async () => {
    expect(uuidV4()).toMatch(UUID_V4);
    const key = await guestKey();
    expect(key).toMatch(UUID_V4);
    expect(await guestKey()).toBe(key);
  });

  it('opens a guest session with X-Guest-Key and a member one with the bearer token only', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(ok({ sessionId: 's1' }));

    await playbackService.openSession('ep-1', 'k1');
    await storage.set(STORAGE_KEYS.AUTH_TOKEN, 'token');
    await playbackService.openSession('ep-1', 'k2');

    expect(String(fetchMock.mock.calls[0][0])).toContain('/playback/sessions');
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({ episodeId: 'ep-1' });
    expect(headersOf(fetchMock.mock.calls[0])['X-Guest-Key']).toMatch(UUID_V4);
    expect(headersOf(fetchMock.mock.calls[0])['Idempotency-Key']).toBe('k1');
    expect(headersOf(fetchMock.mock.calls[1])['X-Guest-Key']).toBeUndefined();
    expect(headersOf(fetchMock.mock.calls[1]).Authorization).toBe('Bearer token');
  });

  it('beats with the playhead and reads the ad a seek jumped over', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(ok({ dueAdBreakId: 'b1' }));

    const res = await playbackService.heartbeat('s1', 320, 12);

    expect(String(fetchMock.mock.calls[0][0])).toContain('/playback/sessions/s1/heartbeat');
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('PATCH');
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({ positionSeconds: 320, watchedSeconds: 12 });
    expect(res.data.dueAdBreakId).toBe('b1');
  });

  it('plays the nearest reached cue and passes the earlier ones a seek jumped over', () => {
    const schedule = [cue('a', 100), cue('b', 400), cue('c', 800)];
    expect(cuesReached(schedule, 50, new Set())).toBeNull();
    expect(cuesReached(schedule, 100, new Set())?.play.breakId).toBe('a');
    const seek = cuesReached(schedule, 900, new Set(['a']));
    expect(seek?.play.breakId).toBe('c');
    expect(seek?.passed).toEqual(['b', 'c']);
  });

  it('asks about resuming only part-way through the episode', () => {
    const stream = { masterUrl: '', qualities: [], durationSeconds: 1000 };
    expect(resumePointOf({ stream })).toBeNull();
    expect(resumePointOf({ stream, resumePositionSeconds: 320 })).toBe(320);
    expect(resumePointOf({ stream, resumePositionSeconds: 990 })).toBeNull();
  });

  it('explains the stream limit in Vietnamese', () => {
    const body = { error: { message: 'Too many streams', details: { reason: 'CONCURRENT_LIMIT_REACHED' } } };
    expect(extractErrorMessage(body)).toMatch(/nhiều thiết bị/);
  });
});

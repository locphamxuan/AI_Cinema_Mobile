import { deviceIcon, deviceKey, lastSeenLabel } from '../lib/device';
import { storage } from '../lib/storage';
import { extractErrorMessage, apiClient } from '../services/apiClient';
import { deviceService } from '../services/deviceService';
import { savedMovieService } from '../services/savedMovieService';
import { movieService } from '../services/movieService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const ok = (body: unknown, status = 200) => ({ ok: true, status, text: async () => JSON.stringify(body) }) as Response;
const call = (mock: jest.SpyInstance, i = 0) => mock.mock.calls[i] as [string, RequestInit];

describe('MF-4 devices', () => {
  beforeEach(() => storage.clear());
  afterEach(() => jest.restoreAllMocks());

  it('keeps one device id per install', async () => {
    const key = await deviceKey();
    expect(await deviceKey()).toBe(key);
  });

  it('asks for the overview with this install flagged, removes a device and ends a stream', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(ok({ limits: {}, devices: [], activeSessions: [] }));

    await deviceService.overview();
    await deviceService.remove('d-1');
    await deviceService.endStream('s-1');

    expect(call(fetchMock)[0]).toContain('/devices');
    expect((call(fetchMock)[1].headers as Record<string, string>)['X-Device-Id']).toBe(await deviceKey());
    expect(call(fetchMock, 1)[0]).toContain('/devices/d-1');
    expect(call(fetchMock, 1)[1].method).toBe('DELETE');
    expect(call(fetchMock, 2)[0]).toContain('/devices/sessions/s-1/end');
    expect(call(fetchMock, 2)[1].method).toBe('POST');
  });

  it('hands the refusal reason back so the player can offer the device list', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'Too many registered devices', details: { reason: 'DEVICE_LIMIT_REACHED' } } }),
    } as Response);

    const res = await apiClient.post('/playback/sessions', { episodeId: 'ep-1' });

    expect(res.reason).toBe('DEVICE_LIMIT_REACHED');
    expect(res.message).toBe(extractErrorMessage({ error: { details: { reason: 'DEVICE_LIMIT_REACHED' } } }));
    expect(res.message).toContain('gỡ bớt một thiết bị');
  });

  it('labels a device by platform and by when it last played', () => {
    expect(deviceIcon('WEB')).toBe('laptop-outline');
    expect(deviceIcon('OTHER')).toBe('hardware-chip-outline');
    const now = Date.parse('2026-10-27T12:00:00Z');
    expect(lastSeenLabel('2026-10-27T11:59:40Z', now)).toBe('Vừa xong');
    expect(lastSeenLabel('2026-10-27T11:48:00Z', now)).toBe('12 phút trước');
    expect(lastSeenLabel('2026-10-27T09:00:00Z', now)).toBe('3 giờ trước');
    expect(lastSeenLabel('2026-10-22T12:00:00Z', now)).toBe('5 ngày trước');
  });
});

describe('saved movies and ranking', () => {
  afterEach(() => jest.restoreAllMocks());

  it('saves, checks and unsaves through /saved-movies', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(ok({ saved: true }));

    await savedMovieService.save('m1');
    await savedMovieService.isSaved('m1');
    await savedMovieService.unsave('m1');

    expect(call(fetchMock)[0]).toContain('/saved-movies/m1');
    expect(fetchMock.mock.calls.map((c) => (c[1] as RequestInit).method)).toEqual(['PUT', 'GET', 'DELETE']);
  });

  it('turns the saved list and the ranking into movie cards, keeping the play count', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok([{ id: 'm1', title: 'Vùng dịch', genres: [{ id: 'g', name: 'Kinh dị' }], savedAt: '2026-10-27' }]))
      .mockResolvedValueOnce(ok([{ id: 'm2', title: 'Hit', genres: [], viewCount: 1200 }]));

    const saved = await savedMovieService.list();
    const ranked = await movieService.ranking();

    expect(saved.data[0]).toMatchObject({ id: 'm1', title: 'Vùng dịch', genre: ['Kinh dị'] });
    expect(ranked.data[0]).toMatchObject({ id: 'm2', viewCount: 1200 });
  });
});

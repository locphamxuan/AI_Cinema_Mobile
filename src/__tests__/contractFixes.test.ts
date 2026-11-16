import { tokenExpiresSoon, tokenExpiry } from '../lib/jwt';
import { roomErrorNotice } from '../lib/roomEvents';
import { adaptApiEpisodeToEpisode } from '../lib/apiAdapter';
import { apiClient } from '../services/apiClient';
import { episodeAccessService } from '../services/episodeAccessService';
import { storage, STORAGE_KEYS } from '../lib/storage';

const b64url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (exp: number) => `${b64url({ alg: 'HS256' })}.${b64url({ sub: 'u1', exp })}.sig`;

afterEach(async () => {
  jest.restoreAllMocks();
  await apiClient.clearSession();
});

describe('access token expiry', () => {
  it('reads the exp claim and treats an unreadable token as fresh', () => {
    expect(tokenExpiry(jwt(1_800_000_000))).toBe(1_800_000_000_000);
    expect(tokenExpiry('not-a-jwt')).toBeNull();
    expect(tokenExpiresSoon('not-a-jwt')).toBe(false);
  });

  it('counts a token within 30 seconds of its expiry as expired', () => {
    const now = 1_800_000_000_000;
    expect(tokenExpiresSoon(jwt(1_800_000_020), now)).toBe(true);
    expect(tokenExpiresSoon(jwt(1_800_000_600), now)).toBe(false);
  });

  it('refreshes an expired token before calling a public route, which would answer as a Guest', async () => {
    await apiClient.saveSession({ accessToken: jwt(1), refreshToken: 'refresh-1' });
    const fresh = jwt(Math.floor(Date.now() / 1000) + 900);
    const seen: string[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const path = new URL(String(input), 'http://x').pathname.replace(/^\/api/, '');
      seen.push(`${init?.method ?? 'GET'} ${path} ${(init?.headers as Record<string, string>)?.Authorization ?? ''}`);
      const body = path === '/auth/refresh' ? { accessToken: fresh, refreshToken: 'refresh-2' } : { accessGranted: true };
      return { ok: true, status: 200, text: async () => JSON.stringify(body) } as Response;
    });
    await episodeAccessService.checkAccess('ep-1');
    expect(seen[0]).toMatch(/^POST \/auth\/refresh/);
    expect(seen[1]).toBe(`GET /episodes/ep-1/access Bearer ${fresh}`);
    expect(await storage.getString(STORAGE_KEYS.REFRESH_TOKEN, '')).toBe('refresh-2');
  });
});

describe('BE field names', () => {
  it('reads the guest and member free flags of an episode', () => {
    const memberOnly = adaptApiEpisodeToEpisode({ id: 'e', isFreeStarter: false, isFreeForGuest: false, isFreeForMember: true });
    expect(memberOnly.isFree).toBe(false);
    expect(memberOnly.isFreeForMember).toBe(true);
    const older = adaptApiEpisodeToEpisode({ id: 'e', isFreeStarter: true });
    expect(older.isFree && older.isFreeForMember).toBe(true);
  });

  it('lists every episode the member owns from GET /accesses, page by page', async () => {
    const pages: Record<string, unknown> = {
      '1': { data: [{ episode: { id: 'e1' } }, { episode: null }], meta: { currentPage: 1, totalPages: 2, totalItems: 3 } },
      '2': { data: [{ episode: { id: 'e2' } }], meta: { currentPage: 2, totalPages: 2, totalItems: 3 } },
    };
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input), 'http://x');
      return { ok: true, status: 200, text: async () => JSON.stringify(pages[url.searchParams.get('page') ?? '1']) } as Response;
    });
    const res = await episodeAccessService.listOwnedEpisodeIds();
    expect(res.data).toEqual(['e1', 'e2']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('limit=100');
  });
});

describe('watch-room errors', () => {
  it('shows the code in details.reason in Vietnamese, never the raw English message', () => {
    expect(roomErrorNotice({ reason: 'Room is full', details: { reason: 'ROOM_FULL' } })).toBe('Phòng đã đủ 8 người.');
    expect(roomErrorNotice({ reason: 'NOT_HOST' })).toContain('chủ phòng');
    expect(roomErrorNotice({ reason: 'Something odd' })).toContain('Không thể đồng bộ');
  });
});

import { clock, cueAt, parseVtt } from '../lib/vtt';
import { adaptApiEpisodeToEpisode, adaptApiMovieToMovie } from '../lib/apiAdapter';
import { trackFor, languageName } from '../components/movie/AudioModeTabs';
import { compactCount } from '../components/movie/LikeButton';
import { MEMBER_NOTIFICATION_TABS } from '../lib/notificationTabs';
import { API_ROUTES } from '../constants/apiRoutes';
import { apiClient } from '../services/apiClient';
import { engagementService } from '../services/engagementService';
import { notificationService } from '../services/notificationService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const VTT = `WEBVTT

1
00:00:00.000 --> 00:00:05.230
[Nhạc nền]

2
00:02:10.540 --> 00:02:11.920
Đi với <i>ta</i> nào.
`;

describe('subtitles', () => {
  it('reads WebVTT cues and finds the line on screen at a moment', () => {
    const cues = parseVtt(VTT);
    expect(cues).toHaveLength(2);
    expect(cueAt(cues, 2)).toBe('[Nhạc nền]');
    expect(cueAt(cues, 60)).toBeNull();
    expect(cueAt(cues, 131)).toBe('Đi với ta nào.');
  });

  it('also reads SubRip timings with a comma', () => {
    expect(parseVtt('1\n00:00:01,500 --> 00:00:02,000\nXin chào')[0]).toEqual({ start: 1.5, end: 2, text: 'Xin chào' });
  });

  it('formats the player clock', () => {
    expect(clock(75)).toBe('1:15');
    expect(clock(3725)).toBe('1:02:05');
  });
});

describe('Phụ đề / Thuyết minh', () => {
  const tracks = [
    { id: 'en', language: 'en', label: 'English', isDefault: false },
    { id: 'vi', language: 'vi', label: 'Tiếng Việt', isDefault: true },
  ];

  it('turns subtitles off for Thuyết minh and picks the default track for Phụ đề', () => {
    expect(trackFor('voiceover', tracks, 'en')).toBeNull();
    expect(trackFor('subtitle', tracks, null)).toBe('vi');
    expect(trackFor('subtitle', tracks, 'en')).toBe('en');
    expect(trackFor('subtitle', [], null)).toBeNull();
    expect(languageName('vi')).toBe('Tiếng Việt');
  });

  it('keeps the subtitle tracks and the spoken language from the API', () => {
    const ep = adaptApiEpisodeToEpisode({ id: 'e1', subtitles: [{ id: 's1', language: 'vi', label: 'Tiếng Việt', isDefault: true }] });
    expect(ep.subtitles).toEqual([{ id: 's1', language: 'vi', label: 'Tiếng Việt', isDefault: true }]);
    expect(adaptApiEpisodeToEpisode({ id: 'e2' }).subtitles).toEqual([]);
    expect(adaptApiMovieToMovie({ id: 'm1', defaultLanguage: 'en' }).language).toBe('en');
  });
});

describe('hearts, plays and notifications', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows large counts the short way', () => {
    expect(compactCount(950)).toBe('950');
    expect(compactCount(1200)).toBe('1,2K');
    expect(compactCount(25000)).toBe('25K');
  });

  it('likes, unlikes and counts a play on the BE routes', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue({ success: true, data: {} } as never);
    const del = jest.spyOn(apiClient, 'delete').mockResolvedValue({ success: true, data: {} } as never);
    await engagementService.like('m1');
    await engagementService.unlike('m1');
    await engagementService.recordView('e1');
    expect(post).toHaveBeenCalledWith(API_ROUTES.MOVIES.LIKE('m1'));
    expect(del).toHaveBeenCalledWith('/movies/m1/like');
    expect(post).toHaveBeenCalledWith('/episodes/e1/views');
  });

  it('asks only for the kinds of the chosen tab, Coin spent and failed top-ups included', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ success: true, data: { data: [], meta: {} } } as never);
    const wallet = MEMBER_NOTIFICATION_TABS.find((t) => t.key === 'wallet')!;
    expect(wallet.types).toEqual(expect.arrayContaining(['COIN_TOPUP_SUCCESS', 'COIN_SPENT', 'COIN_TOPUP_FAILED', 'COIN_LOW_BALANCE']));
    await notificationService.list(wallet.types, 2);
    expect(get).toHaveBeenCalledWith('/notifications', {
      params: expect.objectContaining({ page: 2, 'filter.type': `$in:${wallet.types.join(',')}` }),
    });
  });
});
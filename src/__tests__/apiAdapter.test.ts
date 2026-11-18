import { adaptApiMovieToMovie, adaptApiEpisodeToEpisode, formatDuration, adaptUserProfile } from '../lib/apiAdapter';
import { dayKey } from '../lib/date';
import { movieService } from '../services';

describe('API Adapters', () => {
  it('adaptUserProfile converts backend user properly', () => {
    const raw = {
      id: 'usr-123',
      fullName: 'Nguyễn Văn A',
      email: 'a@gmail.com',
      role: 'VIP',
    };
    const profile = adaptUserProfile(raw);
    expect(profile.id).toBe('usr-123');
    expect(profile.name).toBe('Nguyễn Văn A');
    expect(profile.role).toBe('vip');
    expect(profile.isVIP).toBe(true);
  });

  it('adaptUserProfile returns guest fallback if given null', () => {
    const profile = adaptUserProfile(null);
    expect(profile.id).toBe('user-guest');
    expect(profile.role).toBe('user');
  });

  it('adaptApiMovieToMovie formats movie structure for mobile UI', () => {
    const rawMovie = {
      id: 'mv-01',
      title: 'Neon Odyssey',
      synopsis: 'A journey through cyber space',
      releaseYear: 2026,
      episodes: [
        {
          id: 'ep-01',
          episodeNumber: 1,
          title: 'Khởi đầu',
          duration: '42:15',
          isFree: true,
        },
      ],
    };
    const movie = adaptApiMovieToMovie(rawMovie);
    expect(movie.id).toBe('mv-01');
    expect(movie.title).toBe('Neon Odyssey');
    expect(movie.description).toBe('A journey through cyber space');
    expect(movie.year).toBe(2026);
    expect(movie.episodes).toHaveLength(1);
    expect(movie.episodes[0].isFree).toBe(true);
  });

  it('adaptApiEpisodeToEpisode maps the backend catalog episode', () => {
    const ep = adaptApiEpisodeToEpisode({
      id: 'ep-1',
      seasonNumber: 2,
      episodeNumber: 3,
      title: 'Dạo phố Tokyo',
      availability: 'UNDER_REVISION',
      notice: 'Đang bảo trì',
      isFreeStarter: true,
      coinPrice: 3,
      durationSeconds: 3725,
      aiLabel: { labelType: 'AI_GENERATED', labelText: 'Phim được tạo bằng AI', displayLocation: null },
    });
    expect(ep.seasonNumber).toBe(2);
    expect(ep.isFree).toBe(true);
    expect(ep.price).toBe(3);
    expect(ep.duration).toBe('1:02:05');
    expect(ep.availability).toBe('UNDER_REVISION');
    expect(ep.notice).toBe('Đang bảo trì');
    expect(ep.aiLabel).toBe('Phim được tạo bằng AI');
  });

  it('formatDuration handles short and missing lengths', () => {
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(null)).toBe('');
  });

  it('does not invent episodes for a movie the API sends without any', () => {
    const movie = adaptApiMovieToMovie({ id: 'mv-1', title: 'Phim không tập', episodeCount: 8 });
    expect(movie.episodes).toEqual([]);
    expect(movie.totalEpisodes).toBe(8);
  });

  it('movieService.getEpisodes calls the movie episodes endpoint', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: 'ep-1', episodeNumber: 1, coinPrice: 2 }]),
    } as Response);
    const res = await movieService.getEpisodes('mv-1');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/movies/mv-1/episodes');
    expect(res.data[0].price).toBe(2);
    jest.restoreAllMocks();
  });

  it('keys a moment by the calendar day of the device', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 10, 18, 0, 0))).toBe('2026-11-18');
  });

});

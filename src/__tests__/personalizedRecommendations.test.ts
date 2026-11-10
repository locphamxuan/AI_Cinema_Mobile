import { personalizedRecommendations, topPreferredGenres } from '../lib/homeFeed';
import type { Movie } from '../types/movie';
import type { WatchHistoryEntry } from '../types/playback';

function makeMovie(id: string, genre: string[], overrides: Partial<Movie> = {}): Movie {
  return {
    id,
    title: `Movie ${id}`,
    genre,
    posterUrl: '',
    bannerUrl: '',
    description: '',
    year: 2025,
    language: 'vi',
    episodes: [],
    aiCompliance: {
      aiModel: 'Kling',
      generatedDate: '2026-01-01',
      complianceArticle: 'Điều 44',
      reviewStatus: 'approved',
      moderationScore: 100,
      contentRating: 'T18',
      disclaimer: '',
    },
    totalEpisodes: 5,
    ...overrides,
  };
}

function makeHistory(movieId: string, completed = true): WatchHistoryEntry {
  return {
    episodeId: `ep-${movieId}`,
    episodeTitle: 'Tập 1',
    episodeNumber: 1,
    thumbnailUrl: null,
    movieId,
    movieTitle: `Movie ${movieId}`,
    positionSeconds: 120,
    durationSeconds: 300,
    completed,
    lastWatchedAt: '2026-11-10T10:00:00Z',
    available: true,
    notice: null,
  };
}

describe('personalizedRecommendations & topPreferredGenres', () => {
  const mSciFiWatched = makeMovie('m1', ['Sci-Fi', 'Hành động'], { viewCount: 200 });
  const mSciFiUnseen = makeMovie('m2', ['Sci-Fi', 'Bí ẩn'], { viewCount: 50 });
  const mRomance = makeMovie('m3', ['Tình cảm'], { viewCount: 900, matchScore: 95 });
  const mActionSaved = makeMovie('m4', ['Hành động'], { viewCount: 120 });

  it('extracts top preferred genres from watch history and saved films', () => {
    const movies = [mSciFiWatched, mSciFiUnseen, mRomance, mActionSaved];
    const top = topPreferredGenres(movies, [makeHistory('m1', true)], ['m4'], 2);
    expect(top).toEqual(['Hành động', 'Sci-Fi']);
  });

  it('prioritizes unseen movies matching user preferred genres over already watched or unrelated ones', () => {
    const movies = [mRomance, mSciFiWatched, mSciFiUnseen];
    const ranked = personalizedRecommendations(movies, [makeHistory('m1', true)], []);
    expect(ranked.map((m) => m.id)).toEqual(['m2', 'm1', 'm3']);
  });

  it('falls back to popularity and recency when user has no history or saved movies', () => {
    const olderLow = makeMovie('old', ['Drama'], { year: 2022, viewCount: 10, matchScore: 10 });
    const popularHigh = makeMovie('pop', ['Tình cảm'], { year: 2025, viewCount: 5000, matchScore: 90 });
    const mid = makeMovie('mid', ['Hài'], { year: 2025, viewCount: 100, matchScore: 20 });

    const ranked = personalizedRecommendations([olderLow, mid, popularHigh], [], []);
    expect(ranked.map((m) => m.id)).toEqual(['pop', 'mid', 'old']);
  });
});

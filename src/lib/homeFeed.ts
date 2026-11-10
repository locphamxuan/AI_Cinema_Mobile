import type { Movie } from '../types/movie';
import type { WatchHistoryEntry } from '../types/playback';

export type HomeTabKey = 'recommend' | 'ranking' | 'new' | 'genre';

export const HOME_TABS: { key: HomeTabKey; label: string }[] = [
  { key: 'recommend', label: 'Đề xuất' },
  { key: 'ranking', label: 'Xếp hạng' },
  { key: 'new', label: 'Phim mới' },
  { key: 'genre', label: 'Thể loại' },
];

export const ALL_GENRES = 'Tất cả';

/** Newest release year first; movies with the same year keep the order the BE gave (newest created first). */
export function newestFirst(movies: Movie[]): Movie[] {
  return movies
    .map((movie, index) => ({ movie, index }))
    .sort((a, b) => (b.movie.year || 0) - (a.movie.year || 0) || a.index - b.index)
    .map((entry) => entry.movie);
}

/** Genres that appear in the catalog, the most used first; ties keep first-seen order. */
export function collectGenres(movies: Movie[]): string[] {
  const counts = new Map<string, number>();
  for (const movie of movies) {
    for (const name of movie.genre) {
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

export interface GenreShelf {
  name: string;
  count: number;
  /** Poster of the first film in the genre that has one; empty when none does. */
  cover: string;
}

/** One shelf per genre for the Khám phá screen, the fullest first. */
export function genreShelves(movies: Movie[]): GenreShelf[] {
  return collectGenres(movies).map((name) => {
    const inGenre = movies.filter((movie) => movie.genre.includes(name));
    return { name, count: inGenre.length, cover: inGenre.find((movie) => movie.posterUrl)?.posterUrl ?? '' };
  });
}

export function filterByGenre(movies: Movie[], genre: string): Movie[] {
  if (genre === ALL_GENRES) return movies;
  return movies.filter((movie) => movie.genre.includes(genre));
}

/** A rotating window over the catalog, so "Đổi mới" shows different films without a server round trip. */
export function suggestionPage(movies: Movie[], page: number, size: number): Movie[] {
  if (movies.length === 0 || size <= 0) return [];
  if (movies.length <= size) return movies;
  const start = (((page * size) % movies.length) + movies.length) % movies.length;
  return Array.from({ length: size }, (_, i) => movies[(start + i) % movies.length]);
}

/** Counts genre affinity from the member's watch history and saved films. */
function genreAffinityMap(
  movies: Movie[],
  history: WatchHistoryEntry[],
  savedMovieIds: string[] = [],
): Map<string, number> {
  const byId = new Map(movies.map((m) => [m.id, m]));
  const scores = new Map<string, number>();

  for (const row of history) {
    const m = byId.get(row.movieId);
    if (!m) continue;
    const weight = row.completed ? 3 : 2;
    for (const g of m.genre) {
      scores.set(g, (scores.get(g) ?? 0) + weight);
    }
  }

  for (const id of savedMovieIds) {
    const m = byId.get(id);
    if (!m) continue;
    for (const g of m.genre) {
      scores.set(g, (scores.get(g) ?? 0) + 2);
    }
  }

  return scores;
}

/** Returns the top preferred genre names for UI explanation, e.g. ["Sci-Fi", "Hành động"]. */
export function topPreferredGenres(
  movies: Movie[],
  history: WatchHistoryEntry[],
  savedMovieIds: string[] = [],
  limit = 2,
): string[] {
  const scores = genreAffinityMap(movies, history, savedMovieIds);
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

/**
 * Ranks catalog films for the signed-in member based on genres of watched and saved movies,
 * preferring unseen films of matching genres first while keeping popularity and freshness as tie-breakers.
 */
export function personalizedRecommendations(
  movies: Movie[],
  history: WatchHistoryEntry[],
  savedMovieIds: string[] = [],
): Movie[] {
  if (movies.length === 0) return [];
  const scores = genreAffinityMap(movies, history, savedMovieIds);
  if (scores.size === 0) {
    // Guest or new member without history yet: sort by engagement (likes/views) and recency.
    return movies
      .map((movie, index) => ({ movie, index }))
      .sort((a, b) => {
        const popA = (a.movie.viewCount ?? 0) * 0.05 + (a.movie.matchScore ?? 0) * 3 + (a.movie.year ?? 0);
        const popB = (b.movie.viewCount ?? 0) * 0.05 + (b.movie.matchScore ?? 0) * 3 + (b.movie.year ?? 0);
        return popB - popA || a.index - b.index;
      })
      .map((e) => e.movie);
  }

  const watchedIds = new Set(history.map((h) => h.movieId));
  return movies
    .map((movie, index) => {
      let genreScore = 0;
      for (const g of movie.genre) {
        genreScore += scores.get(g) ?? 0;
      }
      // Unwatched films in preferred genres appear first, then watched matches, then unrelated films.
      const tierBoost = genreScore > 0 ? (watchedIds.has(movie.id) ? 500 : 1000) : 0;
      const popularity = Math.min(20, (movie.viewCount ?? 0) * 0.002 + (movie.matchScore ?? 0) * 0.1);
      return {
        movie,
        index,
        total: tierBoost + genreScore * 10 + popularity,
      };
    })
    .sort((a, b) => b.total - a.total || a.index - b.index)
    .map((entry) => entry.movie);
}

const MAX_RECENT_SEARCHES = 8;

/** Puts the term first, drops an earlier copy (case-insensitive) and keeps the list short. */
export function addRecentSearch(list: string[], term: string): string[] {
  const clean = term.trim();
  if (!clean) return list;
  const rest = list.filter((item) => item.toLowerCase() !== clean.toLowerCase());
  return [clean, ...rest].slice(0, MAX_RECENT_SEARCHES);
}

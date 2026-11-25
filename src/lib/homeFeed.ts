import type { Movie } from '../types/movie';

export type HomeTabKey = 'recommend' | 'ranking' | 'new' | 'genre';

export const HOME_TABS: { key: HomeTabKey; label: string }[] = [
  { key: 'recommend', label: 'Đề xuất' },
  { key: 'ranking', label: 'Xếp hạng' },
  { key: 'new', label: 'Phim mới' },
  { key: 'genre', label: 'Thể loại' },
];

export const ALL_GENRES = 'Tất cả';

/** How old an account may be and still count as just opened (a first Google sign-in), clock drift included. */
export const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

/**
 * The BE opens a member account on the first Google sign-in without saying so; an account created moments ago is
 * that one. A missing or unreadable date is an existing account.
 */
export function isNewAccount(createdAt: string | null | undefined, now = Date.now()): boolean {
  const created = createdAt ? Date.parse(createdAt) : NaN;
  return Number.isFinite(created) && Math.abs(now - created) <= NEW_ACCOUNT_WINDOW_MS;
}

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

const MAX_RECENT_SEARCHES = 8;

/** Puts the term first, drops an earlier copy (case-insensitive) and keeps the list short. */
export function addRecentSearch(list: string[], term: string): string[] {
  const clean = term.trim();
  if (!clean) return list;
  const rest = list.filter((item) => item.toLowerCase() !== clean.toLowerCase());
  return [clean, ...rest].slice(0, MAX_RECENT_SEARCHES);
}

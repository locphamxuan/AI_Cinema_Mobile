import {
  ALL_GENRES,
  addRecentSearch,
  collectGenres,
  filterByGenre,
  newestFirst,
  suggestionPage,
} from '../lib/homeFeed';
import type { Movie } from '../types/movie';

const film = (id: string, year: number, genre: string[]): Movie => ({ id, year, genre } as Movie);

const catalog = [
  film('a', 2025, ['Tình cảm', 'Báo thù']),
  film('b', 2026, ['Tình cảm']),
  film('c', 2026, ['Báo thù', 'Hoạt hình']),
  film('d', 0, []),
];

describe('home feed', () => {
  it('lists the newest year first and keeps the server order inside a year', () => {
    expect(newestFirst(catalog).map((m) => m.id)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('does not reorder the list it is given', () => {
    newestFirst(catalog);
    expect(catalog.map((m) => m.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('collects genres by how many films use them', () => {
    expect(collectGenres(catalog)).toEqual(['Tình cảm', 'Báo thù', 'Hoạt hình']);
  });

  it('filters by genre, and "Tất cả" keeps everything', () => {
    expect(filterByGenre(catalog, 'Báo thù').map((m) => m.id)).toEqual(['a', 'c']);
    expect(filterByGenre(catalog, ALL_GENRES)).toBe(catalog);
    expect(filterByGenre(catalog, 'Không có')).toEqual([]);
  });

  it('rotates suggestions and wraps around the catalog', () => {
    expect(suggestionPage(catalog, 0, 3).map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(suggestionPage(catalog, 1, 3).map((m) => m.id)).toEqual(['d', 'a', 'b']);
    expect(suggestionPage(catalog, 0, 10)).toBe(catalog);
    expect(suggestionPage([], 2, 3)).toEqual([]);
    expect(suggestionPage(catalog, -1, 3)).toHaveLength(3);
  });
});

describe('recent searches', () => {
  it('puts the newest term first and drops a repeated one', () => {
    expect(addRecentSearch(['mafia', 'sói'], 'Mafia')).toEqual(['Mafia', 'sói']);
  });

  it('ignores blank terms and trims the rest', () => {
    expect(addRecentSearch(['a'], '   ')).toEqual(['a']);
    expect(addRecentSearch([], '  thỏ  ')).toEqual(['thỏ']);
  });

  it('keeps at most 8 terms', () => {
    const full = ['1', '2', '3', '4', '5', '6', '7', '8'];
    expect(addRecentSearch(full, '9')).toEqual(['9', '1', '2', '3', '4', '5', '6', '7']);
  });
});

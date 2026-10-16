import { episodeLabel } from '../lib/episodeLabel';

describe('episodeLabel', () => {
  const episodes = [
    { seasonNumber: 1, episodeNumber: 1 },
    { seasonNumber: 2, episodeNumber: 2 },
    { seasonNumber: 3, episodeNumber: 3 },
    { seasonNumber: 3, episodeNumber: 4 },
  ];

  it('names the only episode of a season as the whole part', () => {
    expect(episodeLabel(episodes[0], episodes)).toBe('Phần 1 (trọn bộ)');
    expect(episodeLabel(episodes[1], episodes)).toBe('Phần 2 (trọn bộ)');
  });

  it('keeps "Tập N" in a season of several episodes', () => {
    expect(episodeLabel(episodes[2], episodes)).toBe('Tập 3');
    expect(episodeLabel(episodes[3], episodes)).toBe('Tập 4');
  });
});

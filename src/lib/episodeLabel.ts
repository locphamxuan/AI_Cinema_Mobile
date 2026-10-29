interface ListedEpisode {
  seasonNumber: number;
  episodeNumber: number;
}

/**
 * "Tập N", or "Phần N (trọn bộ)" when the episode is the only one of its season: a feature film, or its
 * sequel entered as season 2, is a whole part rather than an episode.
 */
export function episodeLabel(episode: ListedEpisode, episodes: ListedEpisode[]): string {
  const siblings = episodes.filter((other) => other.seasonNumber === episode.seasonNumber).length;
  return siblings === 1 ? `Phần ${episode.seasonNumber} (trọn bộ)` : `Tập ${episode.episodeNumber}`;
}

export interface AIComplianceInfo {
  aiModel: string;
  generatedDate: string;
  complianceArticle: string;
  reviewStatus: 'approved' | 'pending' | 'flagged';
  moderationScore: number;
  contentRating: string;
  disclaimer: string;
}

export type EpisodeAvailability = 'AVAILABLE' | 'UNDER_REVISION';

export interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  duration: string;
  hlsUrl: string;
  thumbnailUrl: string;
  /** Coin price of the episode (BE `coinPrice`). */
  price: number;
  /** Free-starter episode (BE `isFreeStarter`, BR-03). */
  isFree: boolean;
  /** UNDER_REVISION = taken down for fixing; shows `notice` and cannot be played (BR-56). */
  availability: EpisodeAvailability;
  notice: string | null;
  /** AI content label text that must be shown with the episode (BR-10). */
  aiLabel: string | null;
  isUnlocked: boolean;
  synopsis: string;
}

export interface Movie {
  id: string;
  title: string;
  genre: string[];
  posterUrl: string;
  bannerUrl: string;
  description: string;
  year: number;
  episodes: Episode[];
  aiCompliance: AIComplianceInfo;
  totalEpisodes: number;
  matchScore?: number;
  quality?: string;
  audioQuality?: string;
  ageRating?: string;
  badge?: string;
}

export interface WatchHistoryItem {
  id: string;
  movieId: string;
  movieTitle: string;
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
  thumbnailUrl: string;
  progressPercent: number;
  duration: string;
  lastWatchedAt: string;
}

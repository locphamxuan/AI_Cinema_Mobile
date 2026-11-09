/**
 * Catalog payloads as the BE sends them (src/modules/catalog: `movieCard`, `episodeView`).
 * The `Legacy*` fields are older names the adapter still accepts; the current BE sends none.
 */

export interface CatalogGenreDto {
  id: string;
  name: string;
}

/** The AI content label of an episode's approved media (BR-10). */
export interface CatalogAiLabelDto {
  labelType: string;
  labelText: string;
  displayLocation: string | null;
}

export interface CatalogSubtitleDto {
  id: string;
  language: string;
  label?: string;
  isDefault?: boolean;
}

interface LegacyEpisodeFields {
  duration?: string;
  videoUrl?: string;
  hlsUrl?: string;
  price?: number;
  isFree?: boolean;
  isUnlocked?: boolean;
  description?: string;
}

/** GET /movies/:id/episodes rows. */
export interface CatalogEpisodeDto extends LegacyEpisodeFields {
  id: string;
  movieId?: string;
  seasonNumber?: number;
  seasonTitle?: string | null;
  episodeNumber?: number;
  title?: string;
  synopsis?: string | null;
  thumbnailUrl?: string | null;
  availability?: 'AVAILABLE' | 'UNDER_REVISION';
  notice?: string | null;
  isFreeStarter?: boolean;
  coinPrice?: number;
  durationSeconds?: number | null;
  qualities?: string[];
  aiLabel?: CatalogAiLabelDto | null;
  subtitles?: CatalogSubtitleDto[];
  publishedAt?: string | null;
}

interface LegacyMovieFields {
  genre?: string[];
  thumbnailUrl?: string;
  description?: string;
  year?: number;
  language?: string;
  totalEpisodes?: number;
  matchScore?: number;
  quality?: string;
  audioQuality?: string;
  badge?: string;
  aiModel?: string;
  aiContentLabel?: string;
  generatedDate?: string;
  createdAt?: string;
  complianceArticle?: string;
  reviewStatus?: string;
  status?: string;
  moderationScore?: number;
  disclaimer?: string;
}

/** GET /movies, /movies/:id, /movies/ranking and /saved-movies items. */
export interface CatalogMovieDto extends LegacyMovieFields {
  id: string;
  title?: string;
  synopsis?: string | null;
  ageRating?: string | null;
  releaseYear?: number | null;
  defaultLanguage?: string | null;
  posterUrl?: string | null;
  bannerUrl?: string | null;
  trailerUrl?: string | null;
  aiGenerated?: boolean;
  genres?: (CatalogGenreDto | string)[];
  /** GET /movies/:id: released episodes across seasons. */
  episodeCount?: number;
  /** GET /movies/ranking: plays of all its episodes. */
  viewCount?: number;
  episodes?: CatalogEpisodeDto[];
}

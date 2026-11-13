import { API_ROUTES } from '../constants/apiRoutes';
import type { ApiResponse } from '../types/api';
import type { Movie } from '../types/movie';
import { apiClient } from './apiClient';

/** One row of the BE RecommendationResponseDto. */
export interface RecommendationDto {
  movieId: string;
  title: string;
  ageRating?: string | null;
  posterUrl?: string | null;
  score: number;
  source: 'hybrid' | 'trending' | 'similar' | 'after';
  reason?: string | null;
}

/** A recommendation shown with the same cards as the catalog; the reason rides along. */
export function adaptRecommendation(dto: RecommendationDto): Movie {
  return {
    id: dto.movieId,
    title: dto.title,
    genre: [],
    posterUrl: dto.posterUrl ?? '',
    bannerUrl: dto.posterUrl ?? '',
    description: dto.reason ?? '',
    year: 0,
    language: 'vi',
    episodes: [],
    totalEpisodes: 0,
    ageRating: dto.ageRating ?? undefined,
    matchScore: Math.round(Math.max(0, Math.min(1, dto.score)) * 100),
    recommendReason: dto.reason ?? undefined,
    aiCompliance: {
      aiModel: '',
      generatedDate: '',
      complianceArticle: '',
      reviewStatus: 'approved',
      moderationScore: 0,
      contentRating: dto.ageRating ?? '',
      disclaimer: '',
    },
  };
}

async function list(path: string): Promise<ApiResponse<Movie[]>> {
  const res = await apiClient.get<RecommendationDto[]>(path);
  return { ...res, data: res.success && Array.isArray(res.data) ? res.data.map(adaptRecommendation) : [] };
}

/**
 * BR-68 — AI recommendations from the BE: taste read from what the member watched to the end, dropped or left at
 * once, plus genres, countries and popularity. Guests get the trending list; T18 only for adults (server side).
 */
export const recommendationService = {
  forYou: () => list(API_ROUTES.RECOMMENDATIONS.FOR_YOU),
  trending: () => list(API_ROUTES.RECOMMENDATIONS.TRENDING),
  /** "AI đề xuất cho bạn" under the player once a movie ends (Member only). */
  afterWatching: (movieId: string) => list(API_ROUTES.RECOMMENDATIONS.AFTER(movieId)),
  /** "Phim tương tự" on a movie page (Guest too). */
  similar: (movieId: string) => list(API_ROUTES.RECOMMENDATIONS.SIMILAR(movieId)),
};

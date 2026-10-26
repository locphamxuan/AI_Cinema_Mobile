import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import type { ApiResponse } from '../types/api';

export interface MovieEngagement {
  likeCount: number;
  viewCount: number;
  /** Null for a Guest. */
  likedByMe: boolean | null;
}

/** Hearts on a movie, plays of an episode and the subtitle files, all from the BE. */
export const engagementService = {
  summary: (movieId: string): Promise<ApiResponse<MovieEngagement>> =>
    apiClient.get<MovieEngagement>(API_ROUTES.MOVIES.ENGAGEMENT(movieId)),
  like: (movieId: string): Promise<ApiResponse<MovieEngagement>> =>
    apiClient.post<MovieEngagement>(API_ROUTES.MOVIES.LIKE(movieId)),
  unlike: (movieId: string): Promise<ApiResponse<MovieEngagement>> =>
    apiClient.delete<MovieEngagement>(API_ROUTES.MOVIES.LIKE(movieId)),
  /** Counts a play once it started; the BE ignores a restart within 30 minutes. */
  recordView: (episodeId: string) => apiClient.post<{ counted: boolean; viewCount: number }>(API_ROUTES.MOVIES.VIEWS(episodeId)),
  /** The WebVTT of a track, or null when it cannot be read. */
  async subtitleText(subtitleId: string): Promise<string | null> {
    try {
      const response = await fetch(`${apiClient.getBaseUrl()}${API_ROUTES.MOVIES.SUBTITLE(subtitleId)}`);
      return response.ok ? await response.text() : null;
    } catch {
      return null;
    }
  },
};
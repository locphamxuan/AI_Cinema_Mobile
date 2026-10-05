import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { adaptApiMovieToMovie, adaptApiEpisodeToEpisode } from '../lib/apiAdapter';
import type { ApiResponse } from '../types/api';
import type { Movie, Episode } from '../types/movie';

class MovieService {
  async listMovies(params?: { category?: string; query?: string; search?: string; genre?: string; limit?: number }): Promise<ApiResponse<Movie[]>> {
    const searchVal = params?.search || params?.query;
    const limit = params?.limit || 100;

    return apiClient.get<Movie[]>(API_ROUTES.MOVIES.LIST, {
      params: {
        ...(searchVal ? { search: searchVal } : {}),
        limit,
      },
    }).then((res) => {
      if (res.success && res.data) {
        const rawList = Array.isArray(res.data)
          ? res.data
          : (res.data as any)?.items || (res.data as any)?.data || [];
        if (Array.isArray(rawList)) {
          return {
            ...res,
            data: rawList.map(adaptApiMovieToMovie),
          };
        }
      }
      return res;
    });
  }

  async getMovieDetail(id: string): Promise<ApiResponse<Movie>> {
    return apiClient.get<Movie>(API_ROUTES.MOVIES.DETAIL(id)).then((res) => {
      if (res.success && res.data) {
        return {
          ...res,
          data: adaptApiMovieToMovie(res.data),
        };
      }
      return res;
    });
  }

  async getFeaturedMovie(): Promise<ApiResponse<Movie>> {
    return apiClient.get<Movie>(API_ROUTES.MOVIES.FEATURED).then((res) => {
      if (res.success && res.data) {
        return {
          ...res,
          data: adaptApiMovieToMovie(res.data),
        };
      }
      return res;
    });
  }

  async getPopularMovies(): Promise<ApiResponse<Movie[]>> {
    return apiClient.get<Movie[]>(API_ROUTES.MOVIES.POPULAR).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        return {
          ...res,
          data: res.data.map(adaptApiMovieToMovie),
        };
      }
      return res;
    });
  }

  async getNewReleases(): Promise<ApiResponse<Movie[]>> {
    return apiClient.get<Movie[]>(API_ROUTES.MOVIES.NEW_RELEASES).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        return {
          ...res,
          data: res.data.map(adaptApiMovieToMovie),
        };
      }
      return res;
    });
  }

  /** Released episodes of a movie; movie list/detail responses do not include them. */
  async getEpisodes(movieId: string): Promise<ApiResponse<Episode[]>> {
    return apiClient.get<Episode[]>(API_ROUTES.MOVIES.EPISODES(movieId)).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        return {
          ...res,
          data: res.data.map((ep, index) => adaptApiEpisodeToEpisode(ep, index + 1)),
        };
      }
      return { ...res, success: false, data: [] };
    });
  }

  async getEpisodeDetail(id: string): Promise<ApiResponse<Episode>> {
    return apiClient.get<Episode>(API_ROUTES.MOVIES.EPISODE_DETAIL(id)).then((res) => {
      if (res.success && res.data) {
        return {
          ...res,
          data: adaptApiEpisodeToEpisode(res.data),
        };
      }
      return res;
    });
  }
}

export const movieService = new MovieService();

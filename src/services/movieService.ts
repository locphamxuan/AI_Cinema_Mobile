import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { allMockMovies, mockMovie } from '../mocks/mockData';
import { adaptApiMovieToMovie, adaptApiEpisodeToEpisode } from '../lib/apiAdapter';
import type { ApiResponse } from '../types/api';
import type { Movie, Episode } from '../types/movie';

class MovieService {
  async listMovies(params?: { category?: string; query?: string; search?: string; genre?: string; limit?: number }): Promise<ApiResponse<Movie[]>> {
    const searchVal = params?.search || params?.query;
    const catVal = params?.genre || params?.category;
    const endpoint = catVal
      ? API_ROUTES.MOVIES.BY_CATEGORY(catVal)
      : searchVal
      ? API_ROUTES.MOVIES.SEARCH
      : API_ROUTES.MOVIES.LIST;

    return apiClient.get<Movie[]>(
      endpoint,
      { params: searchVal ? { q: searchVal } : params?.limit ? { limit: params.limit } : undefined },
      async () => {
        let list = [...allMockMovies];
        if (catVal) {
          list = list.filter((m) => m.genre.includes(catVal));
        }
        if (searchVal) {
          const q = searchVal.toLowerCase();
          list = list.filter((m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
        }
        if (params?.limit) {
          list = list.slice(0, params.limit);
        }
        return list;
      }
    ).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        return {
          ...res,
          data: res.data.map(adaptApiMovieToMovie),
        };
      }
      return res;
    });
  }

  async getMovieDetail(id: string): Promise<ApiResponse<Movie>> {
    return apiClient.get<Movie>(
      API_ROUTES.MOVIES.DETAIL(id),
      undefined,
      async () => {
        const found = allMockMovies.find((m) => m.id === id);
        return found || mockMovie;
      }
    ).then((res) => {
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
    return apiClient.get<Movie>(
      API_ROUTES.MOVIES.FEATURED,
      undefined,
      async () => mockMovie
    ).then((res) => {
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
    return apiClient.get<Movie[]>(
      API_ROUTES.MOVIES.POPULAR,
      undefined,
      async () => allMockMovies.slice(0, 5)
    ).then((res) => {
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
    return apiClient.get<Movie[]>(
      API_ROUTES.MOVIES.NEW_RELEASES,
      undefined,
      async () => allMockMovies
    ).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        return {
          ...res,
          data: res.data.map(adaptApiMovieToMovie),
        };
      }
      return res;
    });
  }

  async getEpisodeDetail(id: string): Promise<ApiResponse<Episode>> {
    return apiClient.get<Episode>(
      API_ROUTES.MOVIES.EPISODE_DETAIL(id),
      undefined,
      async () => {
        for (const m of allMockMovies) {
          const found = m.episodes.find((e) => e.id === id);
          if (found) return found;
        }
        return mockMovie.episodes[0];
      }
    ).then((res) => {
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

import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { adaptApiMovieToMovie, adaptApiEpisodeToEpisode } from '../lib/apiAdapter';
import type { ApiResponse } from '../types/api';
import type { Movie, Episode } from '../types/movie';
import type { CatalogEpisodeDto, CatalogMovieDto } from '../types/catalog';

/** Older list shapes that wrapped the rows; the current BE sends the rows (unwrapped by apiClient). */
type MovieListBody = CatalogMovieDto[] | { items?: CatalogMovieDto[]; data?: CatalogMovieDto[] };

class MovieService {
  async listMovies(params?: { search?: string; genre?: string; limit?: number }): Promise<ApiResponse<Movie[]>> {
    const searchVal = params?.search;
    const limit = params?.limit || 100;

    return apiClient.get<MovieListBody>(API_ROUTES.MOVIES.LIST, {
      params: {
        ...(searchVal ? { search: searchVal } : {}),
        limit,
      },
    }).then((res) => {
      if (res.success && res.data) {
        const rawList = Array.isArray(res.data) ? res.data : res.data.items || res.data.data || [];
        if (Array.isArray(rawList)) {
          return {
            ...res,
            data: rawList.map(adaptApiMovieToMovie),
          };
        }
      }
      return { ...res, data: [] };
    });
  }

  /** The ranking tab: listed movies by plays, most first. */
  async ranking(): Promise<ApiResponse<Movie[]>> {
    const res = await apiClient.get<CatalogMovieDto[]>(API_ROUTES.MOVIES.RANKING);
    return { ...res, data: res.success && Array.isArray(res.data) ? res.data.map(adaptApiMovieToMovie) : [] };
  }

  async getMovieDetail(id: string): Promise<ApiResponse<Movie>> {
    return apiClient.get<CatalogMovieDto>(API_ROUTES.MOVIES.DETAIL(id)).then((res) => {
      if (res.success && res.data) {
        return {
          ...res,
          data: adaptApiMovieToMovie(res.data),
        };
      }
      return { ...res, data: null as unknown as Movie };
    });
  }

  /** Released episodes of a movie; movie list/detail responses do not include them. */
  async getEpisodes(movieId: string): Promise<ApiResponse<Episode[]>> {
    return apiClient.get<CatalogEpisodeDto[]>(API_ROUTES.MOVIES.EPISODES(movieId)).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        return {
          ...res,
          data: res.data.map((ep, index) => adaptApiEpisodeToEpisode(ep, index + 1)),
        };
      }
      return { ...res, success: false, data: [] };
    });
  }
}

export const movieService = new MovieService();

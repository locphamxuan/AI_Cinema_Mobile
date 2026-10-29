import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { adaptApiMovieToMovie } from '../lib/apiAdapter';
import type { ApiResponse } from '../types/api';
import type { Movie } from '../types/movie';

const { SAVED_MOVIES } = API_ROUTES;

/** "Danh sách của tôi": movies the member saved to watch later, kept on the BE. */
export const savedMovieService = {
  async list(): Promise<ApiResponse<Movie[]>> {
    const res = await apiClient.get<unknown[]>(SAVED_MOVIES.LIST);
    return { ...res, data: res.success && Array.isArray(res.data) ? res.data.map(adaptApiMovieToMovie) : [] };
  },
  isSaved: (movieId: string) => apiClient.get<{ saved: boolean }>(SAVED_MOVIES.ITEM(movieId)),
  save: (movieId: string) => apiClient.put<{ saved: boolean }>(SAVED_MOVIES.ITEM(movieId)),
  unsave: (movieId: string) => apiClient.delete<{ saved: boolean }>(SAVED_MOVIES.ITEM(movieId)),
};

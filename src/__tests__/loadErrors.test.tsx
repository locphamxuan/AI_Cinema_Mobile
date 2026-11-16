import React from 'react';
import { act, create } from 'react-test-renderer';
import { useMovieWithEpisodes } from '../hooks/useMovieWithEpisodes';
import { movieService } from '../services/movieService';
import { walletService } from '../services/walletService';
import { episodeAccessService } from '../services/episodeAccessService';
import { useAccountStore, useCatalogStore } from '../store';
import type { ApiResponse } from '../types/api';
import type { Episode, Movie } from '../types/movie';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ok = <T,>(data: T): ApiResponse<T> => ({ success: true, data, statusCode: 200 });
const fail = <T,>(statusCode: number | undefined, message: string): ApiResponse<T> => ({
  success: false,
  data: null as unknown as T,
  statusCode,
  message,
});
const flush = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});
const movie = { id: 'm1', title: 'Phim', episodes: [], totalEpisodes: 0 } as unknown as Movie;

function renderMovie(id: string) {
  const box: { current?: ReturnType<typeof useMovieWithEpisodes> } = {};
  function Probe() {
    const value = useMovieWithEpisodes(id);
    React.useEffect(() => {
      box.current = value;
    });
    return null;
  }
  act(() => {
    create(<Probe />);
  });
  return box as { current: ReturnType<typeof useMovieWithEpisodes> };
}

afterEach(() => {
  jest.restoreAllMocks();
  useCatalogStore.setState({ movies: [], currentMovie: null });
});

describe('movie screens tell a failed load from an empty one', () => {
  it('reports a network failure of the episodes with a retry, then loads', async () => {
    useCatalogStore.setState({ movies: [movie] });
    const episodes = jest
      .spyOn(movieService, 'getEpisodes')
      .mockResolvedValueOnce(fail(undefined, 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'))
      .mockResolvedValueOnce(ok([{ id: 'e1' } as Episode]));
    const hook = renderMovie('m1');
    await flush();
    expect(hook.current.error).toBe('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
    act(() => hook.current.retry());
    await flush();
    expect(episodes).toHaveBeenCalledTimes(2);
    expect(hook.current.error).toBeNull();
    expect(hook.current.movie?.episodes.map((e) => e.id)).toEqual(['e1']);
  });

  it('treats a 404 as a movie that is gone, not as a network error', async () => {
    jest.spyOn(movieService, 'getMovieDetail').mockResolvedValue(fail(404, 'Not found'));
    jest.spyOn(movieService, 'getEpisodes').mockResolvedValue(fail(404, 'Not found'));
    const hook = renderMovie('gone');
    await flush();
    expect(hook.current).toMatchObject({ loading: false, error: null, movie: null });
  });

  it('keeps the wallet error instead of showing 0 Coin', async () => {
    jest.spyOn(walletService, 'getWalletInfo').mockResolvedValue(fail(500, 'Máy chủ đang bận'));
    jest.spyOn(episodeAccessService, 'getMySubscription').mockResolvedValue(ok(null));
    jest.spyOn(episodeAccessService, 'listOwnedEpisodeIds').mockResolvedValue(ok([]));
    await useAccountStore.getState().loadAccountData();
    expect(useAccountStore.getState().walletError).toBe('Máy chủ đang bận');
    jest.spyOn(walletService, 'getWalletInfo').mockResolvedValue(ok({ mainCoin: 3, bonusCoin: 1 }));
    await useAccountStore.getState().loadAccountData();
    expect(useAccountStore.getState().walletError).toBeNull();
  });
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { movieService } from '../services';
import { useCatalogStore } from '../store';
import type { Movie } from '../types/movie';

/**
 * The movie of a detail or watch screen with its released episodes (list and detail responses carry none, so they
 * are always fetched). A movie already in the catalog shows at once while its episodes load. A network or server
 * failure is reported as `error` with a retry, never as "no episodes"; only a 404 means the movie is gone.
 */
export function useMovieWithEpisodes(id: string | undefined, onLoaded?: (movie: Movie) => void) {
  const { currentMovie, setCurrentMovie, movies } = useCatalogStore();
  const foundMovie = movies.find((item) => item.id === id) || (currentMovie?.id === id ? currentMovie : null);
  const [movie, setMovie] = useState<Movie | null>(foundMovie);
  // The movie whose fetch has finished (found, missing or failed): only an unknown movie waits for it.
  const [settled, setSettled] = useState<{ id: string; error: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const loadedRef = useRef(onLoaded);
  useEffect(() => {
    loadedRef.current = onLoaded;
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const { movies: listed, currentMovie: selected } = useCatalogStore.getState();
    const known = listed.find((item) => item.id === id) || (selected?.id === id ? selected : null);

    void Promise.all([known ? null : movieService.getMovieDetail(id), movieService.getEpisodes(id)]).then(([detailRes, episodesRes]) => {
      if (cancelled) return;
      const base = known ?? (detailRes?.success ? detailRes.data : null);
      const detailFailed = !known && detailRes && !detailRes.success && detailRes.statusCode !== 404;
      if (detailFailed || (base && !episodesRes.success)) {
        const failed = detailFailed ? detailRes : episodesRes;
        setSettled({ id, error: failed?.message || 'Chưa tải được danh sách tập. Kiểm tra mạng rồi thử lại.' });
        return;
      }
      if (base) {
        const episodes = episodesRes.data;
        const loaded: Movie = { ...base, episodes, totalEpisodes: episodes.length || base.totalEpisodes };
        setMovie(loaded);
        setCurrentMovie(loaded);
        loadedRef.current?.(loaded);
      }
      setSettled({ id, error: null });
    });

    return () => {
      cancelled = true;
    };
  }, [id, attempt, setCurrentMovie]);

  const current = settled?.id === id ? settled : null;
  return {
    movie,
    loading: !foundMovie && current === null,
    error: current?.error ?? null,
    retry: useCallback(() => {
      setSettled(null);
      setAttempt((n) => n + 1);
    }, []),
  };
}

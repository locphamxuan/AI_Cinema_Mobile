import { useCallback, useRef, useState } from 'react';
import { recommendationService } from '../services/recommendationService';
import type { Movie } from '../types/movie';

type Result = { episodeId: string; movies: Movie[]; error: string | null };

/**
 * BR-68 "AI đề xuất cho bạn" once a movie is over: read with this member's own token, so each person in a watch
 * room gets picks from their own behaviour. Asked once per episode; another episode on screen shows none.
 */
export function useAfterWatching(movieId: string | undefined, episodeId: string | undefined) {
  const [result, setResult] = useState<Result | null>(null);
  const asked = useRef<string | null>(null);
  const current = result && result.episodeId === episodeId ? result : null;

  const load = useCallback(
    (force = false) => {
      if (!movieId || !episodeId) return;
      if (!force && asked.current === episodeId) return;
      asked.current = episodeId;
      void recommendationService.afterWatching(movieId).then((res) => {
        if (asked.current !== episodeId) return;
        setResult({
          episodeId,
          movies: res.success ? res.data : [],
          error: res.success ? null : res.message || 'Chưa tải được phim đề xuất.',
        });
      });
    },
    [movieId, episodeId],
  );

  return {
    movies: current?.movies ?? [],
    error: current?.error ?? null,
    load,
    retry: useCallback(() => load(true), [load]),
  };
}

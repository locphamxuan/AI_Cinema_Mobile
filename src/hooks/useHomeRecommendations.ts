import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { recommendationService } from '../services/recommendationService';
import type { Movie } from '../types/movie';

type Result = { viewer: string; movies: Movie[]; error: string | null };

/**
 * The "Đề xuất" tab of Home, always from the BE (BR-68): a Member gets their own list, a Guest the trending one.
 * Nothing is built from the catalog on the phone, so T18 never reaches a Guest or a Member under 18, and a failed
 * read shows an error with a retry instead of a guess. Another account on screen never sees the previous one's
 * picks, and the list is read again each time Home comes back into view (after watching something, picks move).
 */
export function useHomeRecommendations(isAuthenticated: boolean, userId: string | undefined) {
  const viewer = isAuthenticated ? `member:${userId ?? ''}` : 'guest';
  const [result, setResult] = useState<Result | null>(null);
  // Answers for an account that is no longer the one on screen are thrown away.
  const viewerRef = useRef(viewer);
  useEffect(() => {
    viewerRef.current = viewer;
  }, [viewer]);
  const current = result && result.viewer === viewer ? result : null;

  const load = useCallback(async () => {
    const asked = viewer;
    const res = isAuthenticated ? await recommendationService.forYou() : await recommendationService.trending();
    if (viewerRef.current !== asked) return;
    setResult({
      viewer: asked,
      movies: res.success ? res.data : [],
      error: res.success ? null : res.message || 'Chưa tải được đề xuất. Kiểm tra mạng rồi thử lại.',
    });
  }, [isAuthenticated, viewer]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return {
    movies: current?.movies ?? [],
    loading: current === null,
    error: current?.error ?? null,
    reload: load,
  };
}

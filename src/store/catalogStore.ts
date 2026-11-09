import { create } from 'zustand';
import { movieService } from '../services';
import type { Movie } from '../types/movie';

/** The home feed asks for this many movies; screens filter and page them on the client. */
const CATALOG_SIZE = 50;

interface CatalogState {
  movies: Movie[];
  /** Reads the catalog; an unreachable BE leaves an empty list, never sample data. */
  loadCatalog: () => Promise<void>;
  /** The movie opened last, with its episodes once the detail or watch screen loaded them. */
  currentMovie: Movie | null;
  setCurrentMovie: (movie: Movie | null) => void;
  /** Flags an episode the BE granted (bought, plan, free starter); the wallet is left alone. */
  markEpisodeUnlocked: (episodeId: string) => void;
}

/** Catalog data shared by the browse screens. Not persisted: it is read from the BE at every start. */
export const useCatalogStore = create<CatalogState>()((set) => ({
  movies: [],
  loadCatalog: async () => {
    const res = await movieService.listMovies({ limit: CATALOG_SIZE });
    const movies = res.success && Array.isArray(res.data) ? res.data : [];
    set({ movies, currentMovie: movies[0] || null });
  },

  currentMovie: null,
  setCurrentMovie: (movie) => set({ currentMovie: movie }),
  markEpisodeUnlocked: (episodeId) =>
    set((s) => ({
      currentMovie: s.currentMovie && {
        ...s.currentMovie,
        episodes: s.currentMovie.episodes.map((ep) => (ep.id === episodeId ? { ...ep, isUnlocked: true } : ep)),
      },
    })),
}));

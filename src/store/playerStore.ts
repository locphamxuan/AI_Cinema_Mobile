import { create } from 'zustand';

interface PlayerState {
  /** A video fills the whole screen: floating buttons drawn above the screens stay hidden meanwhile. */
  fullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  fullscreen: false,
  setFullscreen: (fullscreen) => set({ fullscreen }),
}));

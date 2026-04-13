import { create } from "zustand"

interface PlayerState {
  currentShortPlayId: string | null
  currentEpisodeId: string | null
  autoNextEnabled: boolean
  setCurrentEpisode: (shortPlayId: string, episodeId: string) => void
  toggleAutoNext: () => void
  reset: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentShortPlayId: null,
  currentEpisodeId: null,
  autoNextEnabled: true,

  setCurrentEpisode: (shortPlayId, episodeId) =>
    set({ currentShortPlayId: shortPlayId, currentEpisodeId: episodeId }),

  toggleAutoNext: () =>
    set((state) => ({ autoNextEnabled: !state.autoNextEnabled })),

  reset: () =>
    set({ currentShortPlayId: null, currentEpisodeId: null }),
}))

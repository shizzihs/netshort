import { create } from "zustand"

export type ViewMode = 'classic' | 'tiktok'

function getStoredMode(): ViewMode {
  try { return (localStorage.getItem('playerViewMode') as ViewMode) ?? 'classic' }
  catch { return 'classic' }
}

interface PlayerState {
  currentShortPlayId: string | null
  currentEpisodeId: string | null
  autoNextEnabled: boolean
  viewMode: ViewMode
  setCurrentEpisode: (shortPlayId: string, episodeId: string) => void
  toggleAutoNext: () => void
  setViewMode: (mode: ViewMode) => void
  reset: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentShortPlayId: null,
  currentEpisodeId: null,
  autoNextEnabled: true,
  viewMode: getStoredMode(),

  setCurrentEpisode: (shortPlayId, episodeId) =>
    set({ currentShortPlayId: shortPlayId, currentEpisodeId: episodeId }),

  toggleAutoNext: () =>
    set((state) => ({ autoNextEnabled: !state.autoNextEnabled })),

  setViewMode: (mode) => {
    try { localStorage.setItem('playerViewMode', mode) } catch { /* ignore */ }
    set({ viewMode: mode })
  },

  reset: () =>
    set({ currentShortPlayId: null, currentEpisodeId: null }),
}))

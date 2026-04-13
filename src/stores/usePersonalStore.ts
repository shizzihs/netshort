import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { HistoryEntry, FavoriteEntry, ProgressEntry } from "@/lib/localStorage"

interface PersonalState {
  // History: max 100 items, sorted newest first
  history: HistoryEntry[]
  // Favorites: keyed by shortPlayId
  favorites: Record<string, FavoriteEntry>
  // Progress: keyed by shortPlayId
  progress: Record<string, ProgressEntry>

  addHistory: (entry: Omit<HistoryEntry, "lastWatchedAt">) => void
  toggleFavorite: (entry: Omit<FavoriteEntry, "addedAt">) => void
  saveProgress: (shortPlayId: string, episodeId: string, episodeNo: number) => void
  isFavorite: (shortPlayId: string) => boolean
  getProgress: (shortPlayId: string) => ProgressEntry | undefined
}

export const usePersonalStore = create<PersonalState>()(
  persist(
    (set, get) => ({
      history: [],
      favorites: {},
      progress: {},

      addHistory: (entry) =>
        set((state) => {
          const now = new Date().toISOString()
          const existing = state.history.filter(
            (h) => h.shortPlayId !== entry.shortPlayId,
          )
          const updated: HistoryEntry = { ...entry, lastWatchedAt: now }
          const next = [updated, ...existing].slice(0, 100)
          return { history: next }
        }),

      toggleFavorite: (entry) =>
        set((state) => {
          const exists = state.favorites[entry.shortPlayId]
          if (exists) {
            const updated = Object.fromEntries(
              Object.entries(state.favorites).filter(
                ([key]) => key !== entry.shortPlayId,
              ),
            ) as Record<string, FavoriteEntry>
            return { favorites: updated }
          }
          const newEntry: FavoriteEntry = {
            ...entry,
            addedAt: new Date().toISOString(),
          }
          return { favorites: { ...state.favorites, [entry.shortPlayId]: newEntry } }
        }),

      saveProgress: (shortPlayId, episodeId, episodeNo) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [shortPlayId]: {
              episodeId,
              episodeNo,
              updatedAt: new Date().toISOString(),
            },
          },
        })),

      isFavorite: (shortPlayId) => !!get().favorites[shortPlayId],

      getProgress: (shortPlayId) => get().progress[shortPlayId],
    }),
    { name: "ns_personal" },
  ),
)

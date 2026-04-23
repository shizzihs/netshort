import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HistoryEntry, FavoriteEntry, ProgressEntry } from '@/lib/localStorage'
import { getStoredProvider } from '@/contexts/ProviderContext'

interface PersonalState {
  // History: max 100 items per provider, sorted newest first
  history: HistoryEntry[]
  // Favorites: keyed by shortPlayId
  favorites: Record<string, FavoriteEntry>
  // Progress: keyed by shortPlayId
  progress: Record<string, ProgressEntry>

  addHistory: (entry: Omit<HistoryEntry, 'lastWatchedAt'>) => void
  toggleFavorite: (entry: Omit<FavoriteEntry, 'addedAt'>) => void
  saveProgress: (shortPlayId: string, episodeId: string, episodeNo: number) => void
  isFavorite: (shortPlayId: string) => boolean
  getProgress: (shortPlayId: string) => ProgressEntry | undefined
  migrateToV2: () => void
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
          const provider = getStoredProvider()
          // Filter out same shortPlayId AND same provider (cross-provider dedup handled separately)
          const existing = state.history.filter(
            (h) => !(h.shortPlayId === entry.shortPlayId && h.provider === provider),
          )
          const updated: HistoryEntry = { ...entry, provider, lastWatchedAt: now }
          const next = [updated, ...existing].slice(0, 100)
          return { history: next }
        }),

      toggleFavorite: (entry) =>
        set((state) => {
          const provider = getStoredProvider()
          const key = `${provider}:${entry.shortPlayId}`
          const exists = state.favorites[key]
          if (exists) {
            const updated = { ...state.favorites }
            delete updated[key]
            return { favorites: updated }
          }
          const newEntry: FavoriteEntry = {
            ...entry,
            provider,
            addedAt: new Date().toISOString(),
          }
          return { favorites: { ...state.favorites, [key]: newEntry } }
        }),

      saveProgress: (shortPlayId, episodeId, episodeNo) =>
        set((state) => {
          const provider = getStoredProvider()
          const key = `${provider}:${shortPlayId}`
          return {
            progress: {
              ...state.progress,
              [key]: {
                episodeId,
                episodeNo,
                provider,
                updatedAt: new Date().toISOString(),
              },
            },
          }
        }),

      isFavorite: (shortPlayId) => {
        const provider = getStoredProvider()
        return !!get().favorites[`${provider}:${shortPlayId}`]
      },

      getProgress: (shortPlayId) => {
        const provider = getStoredProvider()
        return get().progress[`${provider}:${shortPlayId}`]
      },

      migrateToV2: () =>
        set((state) => {
          // Migrate old flat history to provider-scoped keys
          const migrated: Record<string, FavoriteEntry> = { ...state.favorites }
          const migratedHistory: HistoryEntry[] = state.history.map((h) => ({
            ...h,
            provider: h.provider ?? 'netshort',
          }))
          return { favorites: migrated, history: migratedHistory }
        }),
    }),
    { name: 'ns_personal_v2' },
  ),
)

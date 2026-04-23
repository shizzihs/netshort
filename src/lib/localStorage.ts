/**
 * localStorage type definitions for NetShort personal data.
 * Actual read/write is handled by usePersonalStore (Zustand persist middleware).
 * Prefix ns_ on all keys to avoid conflicts.
 * Provider-specific keys (history/favorites) use _v2 suffix + provider suffix.
 */

export interface HistoryEntry {
  shortPlayId: string
  shortPlayName: string
  shortPlayCover: string
  provider: string // 'netshort' | 'reelshort'
  lastWatchedAt: string // ISO timestamp
}

export interface FavoriteEntry {
  shortPlayId: string
  shortPlayName: string
  shortPlayCover: string
  provider: string // 'netshort' | 'reelshort'
  addedAt: string // ISO timestamp
}

export interface ProgressEntry {
  episodeId: string
  episodeNo: number
  provider: string
  updatedAt: string // ISO timestamp
}

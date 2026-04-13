/**
 * localStorage type definitions for NetShort personal data.
 * Actual read/write is handled by usePersonalStore (Zustand persist middleware).
 * Prefix ns_ trên tất cả keys để tránh conflict.
 */

export interface HistoryEntry {
  shortPlayId: string
  shortPlayName: string
  shortPlayCover: string
  lastWatchedAt: string // ISO timestamp
}

export interface FavoriteEntry {
  shortPlayId: string
  shortPlayName: string
  shortPlayCover: string
  addedAt: string // ISO timestamp
}

export interface ProgressEntry {
  episodeId: string
  episodeNo: number
  updatedAt: string // ISO timestamp
}

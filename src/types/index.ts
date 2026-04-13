// ─── Tab & API wrappers ───────────────────────────────────────────────────────

export interface Tab {
  id: string
  name: string
  tabId?: string
  tabName?: string
}

export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

export interface PaginatedData<T> {
  completed: boolean
  maxOffset: number
  dataList: T[]
}

// ─── Film (từ API — field names thực) ────────────────────────────────────────

export interface Film {
  shortPlayId: string
  shortPlayName: string       // KHÔNG phải title
  shortPlayCover: string      // KHÔNG phải coverUrl
  shotIntroduce?: string      // KHÔNG phải description
  shortPlayLabels?: string[] | string  // API trả về array hoặc string tuỳ endpoint
  episodeCount?: number
  score?: number
  playCount?: number
}

// ─── Episodes ─────────────────────────────────────────────────────────────────

/** Episode từ detail endpoint (shortPlayEpisodeInfos) — field name thực từ APK */
export interface EpisodeInfo {
  episodeId: string           // field thực: episodeId (không phải shortPlayEpisodeId)
  episodeNo: number
  isLock: boolean
  playVoucher?: string        // có trong detail endpoint
  subtitleList?: SubtitleItem[]
}

/** Episode từ episode_play_detail (episodePlayList) — chỉ có episodeId + playVoucher */
export interface EpisodePlay {
  episodeId: string
  playVoucher: string         // direct CDN MP4 URL (fresh CDN link)
}

export interface SubtitleItem {
  url: string
  format: string              // "webvtt"
  subtitleLanguage: string    // "vi_VN", "en_US"
}

// ─── Film Detail ──────────────────────────────────────────────────────────────

export interface FilmDetail {
  shortPlayId: string
  shortPlayName: string
  shortPlayCover: string
  shotIntroduce?: string
  shortPlayLabels?: string[] | string
  episodeCount?: number
  shortPlayEpisodeInfos?: EpisodeInfo[]  // episodeId field inside
}

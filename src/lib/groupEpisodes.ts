import type { EpisodeInfo } from "@/types"

export interface EpisodeGroup {
  label: string       // "1–30" dùng em dash (U+2013)
  startNo: number     // 1, 31, 61...
  endNo: number       // 30, 60, 80...
  episodes: EpisodeInfo[]
}

/**
 * Chia danh sách tập thành các nhóm theo groupSize.
 * Nếu chỉ có 1 nhóm → label = "1–{total}"
 */
export function groupEpisodes(
  episodes: EpisodeInfo[],
  groupSize: number = 30,
): EpisodeGroup[] {
  if (episodes.length === 0) return []

  const groups: EpisodeGroup[] = []
  const total = episodes.length

  for (let i = 0; i < total; i += groupSize) {
    const chunk = episodes.slice(i, i + groupSize)
    const startNo = i + 1
    const endNo = Math.min(i + groupSize, total)
    groups.push({
      label: `${startNo}\u2013${endNo}`,
      startNo,
      endNo,
      episodes: chunk,
    })
  }

  return groups
}

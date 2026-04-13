import { useMemo } from 'react'
import { useCategories, useCategoryFilms } from './useCategories'
import type { Film } from '@/types'

interface Tag {
  labelLanguageId: number | null
  labelName: string
  newLabelIdList?: string[] | null
}

function extractTags(data: unknown): Tag[] {
  const d = data as Record<string, unknown>
  if (Array.isArray(d?.tag)) return d.tag as Tag[]
  return []
}

function extractFilms(data: unknown): Film[] {
  const d = data as Record<string, unknown>
  return Array.isArray(d?.dataList) ? (d.dataList as Film[]) : []
}

/**
 * Fetches films that share a label with the current film.
 * Matches shortPlayLabels (names) → categories tag list → newLabelIdList → /classes/page.
 */
export function useRelatedFilms(labels: string[], currentId: string) {
  const { data: categoriesData } = useCategories()
  const tags = extractTags(categoriesData)

  // Pick the first label that matches a tag (skip the "Tất cả" entry)
  const tagIds = useMemo<string[]>(() => {
    if (!labels.length || !tags.length) return []
    for (const label of labels) {
      const match = tags.find(
        (t) => t.labelLanguageId !== -1 && t.labelName === label,
      )
      if (match?.newLabelIdList?.length) {
        return match.newLabelIdList.filter(Boolean) as string[]
      }
    }
    return []
  }, [labels, tags])

  const { data, isLoading } = useCategoryFilms(tagIds, 0, 13)

  const films = useMemo<Film[]>(() => {
    return extractFilms(data).filter((f) => f.shortPlayId !== currentId).slice(0, 12)
  }, [data, currentId])

  return { films, isLoading, hasData: tagIds.length > 0 }
}

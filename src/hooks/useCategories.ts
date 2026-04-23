import { useQuery } from '@tanstack/react-query'
import { getCategories, getCategoryFilms, getWebCategoryFilms, getReelShortCategories } from '../api/categories'
import { getStoredProvider } from '../contexts/ProviderContext'
import { getTabContent } from '../api/discovery'

export function useCategories() {
  const provider = getStoredProvider()
  return useQuery({
    queryKey: ['categories', provider],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCategoryFilms(
  tagIds: string[],
  offset = 0,
  limit = 20,
  /** For NetShort cursor pagination: use maxOffset from previous response as next offset */
  cursorOffset?: number,
  enabled = true,
) {
  const provider = getStoredProvider()
  const effectiveOffset = cursorOffset ?? offset
  return useQuery({
    queryKey: ['category-films', provider, tagIds, effectiveOffset, limit],
    queryFn: () => getCategoryFilms(tagIds, effectiveOffset, limit),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useWebCategoryFilms(label: string, page: number) {
  const provider = getStoredProvider()
  return useQuery({
    queryKey: ['web-category-films', provider, label, page],
    queryFn: () => getWebCategoryFilms(label, page),
    enabled: label !== '',
    staleTime: 5 * 60 * 1000,
  })
}

export function useReelShortCategories(enabled = true) {
  const provider = getStoredProvider()
  return useQuery({
    queryKey: ['reelshort-categories', provider],
    queryFn: getReelShortCategories,
    enabled,
    staleTime: 10 * 60 * 1000,
  })
}

export function useReelShortCategoryFilms(tabId: string, offset = 0, limit = 20, enabled = true) {
  const provider = getStoredProvider()
  return useQuery({
    queryKey: ['reelshort-category-films', provider, tabId, offset, limit],
    queryFn: () => getTabContent(tabId),
    enabled: enabled && !!tabId,
    staleTime: 5 * 60 * 1000,
  })
}

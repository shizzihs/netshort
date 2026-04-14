import { useQuery } from '@tanstack/react-query'
import { getCategories, getCategoryFilms, getWebCategoryFilms } from '../api/categories'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCategoryFilms(tagIds: string[], offset = 0, limit = 20) {
  return useQuery({
    queryKey: ['category-films', tagIds, offset, limit],
    queryFn: () => getCategoryFilms(tagIds, offset, limit),
    enabled: tagIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useWebCategoryFilms(label: string, page: number) {
  return useQuery({
    queryKey: ['web-category-films', label, page],
    queryFn: () => getWebCategoryFilms(label, page),
    enabled: label !== '',
    staleTime: 5 * 60 * 1000,
  })
}

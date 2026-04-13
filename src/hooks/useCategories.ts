import { useQuery } from '@tanstack/react-query'
import { getCategories, getCategoryFilms } from '../api/categories'

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
    staleTime: 5 * 60 * 1000,
  })
}

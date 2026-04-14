import { get } from './client'

export function getCategories() {
  return get<unknown>('/categories')
}

export function getCategoryFilms(tagIds: string[], offset = 0, limit = 20) {
  return get<unknown>('/categories/films', { tagIds: tagIds.join(','), offset, limit })
}

export function getWebCategoryFilms(label: string, page: number) {
  return get<{ films: unknown[]; hasMore: boolean; page: number }>(
    '/categories/web-films',
    { label, page },
  )
}

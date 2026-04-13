import { get } from './client'

export function getCategories() {
  return get<unknown>('/categories')
}

export function getCategoryFilms(tagIds: string[], offset = 0, limit = 20) {
  return get<unknown>('/categories/films', { tagIds: tagIds.join(','), offset, limit })
}

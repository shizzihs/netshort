import { get } from './client'

export function getCategories() {
  return get<{ tag: Tag[] }>('/categories')
}

export interface Tag {
  labelLanguageId: number | null
  labelName: string
  newLabelIdList?: string[]
}

export function getCategoryFilms(tagIds: string[], offset = 0, limit = 20) {
  return get<{ dataList: Film[]; completed: boolean; maxOffset: number; count: number }>('/categories/films', { tagIds: tagIds.join(','), offset, limit })
}

export function getWebCategoryFilms(label: string, page: number) {
  return get<{ films: Film[]; hasMore: boolean; page: number; totalPages: number }>('/categories/web-films', { label, page })
}

export function getReelShortCategories() {
  return get<{ tab_list: Array<{ tab_id: string; tab_name: string }> }>('/tabs')
}

type Film = {
  shortPlayId: string
  shortPlayName: string
  shortPlayCover: string
  [key: string]: unknown
}

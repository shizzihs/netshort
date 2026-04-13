import { get } from './client';

export function getTabs() {
  return get<any>('/tabs');
}

export function getTabContent(tabId: string) {
  return get<any>(`/tabs/${tabId}`);
}

export function getTabContentPaginated(tabId: string, offset = 0, limit = 20) {
  return get<any>(`/tabs/${tabId}/all`, { offset, limit });
}

export function getRecommended(offset = 0, limit = 20) {
  return get<any>('/films/recommended', { offset, limit });
}

export function getRanking(limit = 20) {
  return get<any>('/films/ranking', { limit });
}

export function search(q: string, page = 1, pageSize = 20) {
  return get<any>('/search', { q, page, pageSize });
}

export function getTrendingSearches() {
  return get<any>('/search/trending');
}

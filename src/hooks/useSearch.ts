import { useQuery } from '@tanstack/react-query';
import { search, getTrendingSearches } from '../api/discovery';

export function useSearch(keyword: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['search', keyword, page, pageSize],
    queryFn: () => search(keyword, page, pageSize),
    enabled: keyword.length > 0,
  });
}

export function useTrendingSearches() {
  return useQuery({
    queryKey: ['trending-searches'],
    queryFn: getTrendingSearches,
  });
}

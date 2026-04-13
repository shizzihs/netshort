import { useQuery } from '@tanstack/react-query';
import { getRecommended, getRanking } from '../api/discovery';

export function useRecommended(offset = 0, limit = 20) {
  return useQuery({
    queryKey: ['recommended', offset, limit],
    queryFn: () => getRecommended(offset, limit),
  });
}

export function useRanking(limit = 20) {
  return useQuery({
    queryKey: ['ranking', limit],
    queryFn: () => getRanking(limit),
  });
}

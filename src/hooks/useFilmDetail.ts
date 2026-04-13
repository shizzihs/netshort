import { useQuery } from '@tanstack/react-query';
import { getFilmDetail, getEpisodes } from '../api/video';

export function useFilmDetail(shortPlayId: string) {
  return useQuery({
    queryKey: ['film', shortPlayId],
    queryFn: () => getFilmDetail(shortPlayId),
  });
}

export function useEpisodes(shortPlayId: string) {
  return useQuery({
    queryKey: ['episodes', shortPlayId],
    queryFn: () => getEpisodes(shortPlayId),
    // Refresh CDN links every 5 minutes in the background
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    // Don't refetch on window focus — avoids URL churn
    refetchOnWindowFocus: false,
  });
}

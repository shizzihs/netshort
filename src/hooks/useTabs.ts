import { useQuery } from '@tanstack/react-query';
import { getTabs, getTabContent } from '../api/discovery';

export function useTabs() {
  return useQuery({ queryKey: ['tabs'], queryFn: getTabs });
}

export function useTabContent(tabId: string | null) {
  return useQuery({
    queryKey: ['tab-content', tabId],
    queryFn: () => getTabContent(tabId!),
    enabled: !!tabId,
  });
}

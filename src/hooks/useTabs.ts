import { useQuery } from '@tanstack/react-query';
import { getTabs, getTabContent } from '../api/discovery';
import { getStoredProvider } from '../contexts/ProviderContext';

export function useTabs() {
  const provider = getStoredProvider();
  return useQuery({ queryKey: ['tabs', provider], queryFn: getTabs });
}

export function useTabContent(tabId: string | null) {
  const provider = getStoredProvider();
  return useQuery({
    queryKey: ['tab-content', provider, tabId],
    queryFn: () => getTabContent(tabId!),
    enabled: !!tabId,
  });
}

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type Provider = 'netshort' | 'reelshort'

const STORAGE_KEY = 'ns_current_provider'

function readStored(): Provider {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'reelshort') return 'reelshort'
  } catch {}
  return 'netshort'
}

interface ProviderContextValue {
  provider: Provider
  setProvider: (p: Provider) => void
  isReelShort: boolean
}

const ProviderContext = createContext<ProviderContextValue>({
  provider: 'netshort',
  setProvider: () => {},
  isReelShort: false,
})

export function ProviderContextProvider({ children }: { children: ReactNode }) {
  const [provider, setProviderState] = useState<Provider>(readStored)

  const setProvider = useCallback((p: Provider) => {
    setProviderState(p)
    try { localStorage.setItem(STORAGE_KEY, p) } catch {}
  }, [])

  return (
    <ProviderContext.Provider value={{ provider, setProvider, isReelShort: provider === 'reelshort' }}>
      {children}
    </ProviderContext.Provider>
  )
}

export function useProvider() {
  return useContext(ProviderContext)
}

export function getStoredProvider(): Provider {
  return readStored()
}

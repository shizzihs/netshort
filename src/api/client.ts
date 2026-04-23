import { getStoredProvider } from '@/contexts/ProviderContext'

const BASE_URL = '/api'

function providerHeader(): Record<string, string> {
  const p = getStoredProvider()
  return p === 'reelshort' ? { 'X-Provider': 'reelshort' } : {}
}

export async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), { headers: providerHeader() })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

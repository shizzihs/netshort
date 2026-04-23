import { useProvider, type Provider } from '@/contexts/ProviderContext'
import { useQueryClient } from '@tanstack/react-query'

const OPTIONS: { label: string; value: Provider }[] = [
  { label: 'NetShort', value: 'netshort' },
  { label: 'ReelShort', value: 'reelshort' },
]

export default function ProviderSelector() {
  const { provider, setProvider } = useProvider()
  const queryClient = useQueryClient()

  function handleChange(p: Provider) {
    if (p === provider) return
    setProvider(p)
    // Invalidate all cached data so pages refetch from the new provider
    queryClient.invalidateQueries()
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted/50 p-0.5">
      {OPTIONS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => handleChange(value)}
          className={[
            'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
            provider === value
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
          aria-pressed={provider === value}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

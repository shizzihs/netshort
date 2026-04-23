import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { usePersonalStore } from '@/stores/usePersonalStore'
import { useProvider } from '@/contexts/ProviderContext'
import FilmCard from '@/components/FilmCard'
import type { FavoriteEntry } from '@/lib/localStorage'

function FavoriteItem({ item }: { item: FavoriteEntry }) {
  const navigate = useNavigate()
  const { provider: currentProvider, setProvider } = useProvider()

  const handleClick = () => {
    if (item.provider !== currentProvider) {
      setProvider(item.provider as 'netshort' | 'reelshort')
    }
    navigate(`/film/${item.shortPlayId}`)
  }

  return (
    <div
      className="cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <FilmCard
        shortPlayId={item.shortPlayId}
        shortPlayName={item.shortPlayName}
        shortPlayCover={item.shortPlayCover}
      />
      {item.provider !== currentProvider && (
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          {item.provider === 'netshort' ? 'NetShort' : 'ReelShort'}
        </p>
      )}
    </div>
  )
}

export default function FavoritesPage() {
  const favorites = usePersonalStore((s) => s.favorites)

  const sortedFavorites = Object.values(favorites).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
  )

  if (sortedFavorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <Heart className="w-12 h-12 text-muted-foreground" strokeWidth={1} />
        <p className="text-muted-foreground text-sm">Chưa có phim yêu thích</p>
        <a href="/" className="text-sm text-primary hover:underline">
          Khám phá ngay →
        </a>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      <h1 className="text-base font-semibold text-foreground py-4">
        Yêu thích ({sortedFavorites.length})
      </h1>

      <div className="grid grid-cols-2 gap-3">
        {sortedFavorites.map((item) => (
          <FavoriteItem
            key={`${item.provider}:${item.shortPlayId}`}
            item={item}
          />
        ))}
      </div>
    </div>
  )
}

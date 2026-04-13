import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { usePersonalStore } from '@/stores/usePersonalStore'
import FilmCard from '@/components/FilmCard'

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
        <Link to="/" className="text-sm text-primary hover:underline">
          Khám phá ngay →
        </Link>
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
          <FilmCard
            key={item.shortPlayId}
            shortPlayId={item.shortPlayId}
            shortPlayName={item.shortPlayName}
            shortPlayCover={item.shortPlayCover}
          />
        ))}
      </div>
    </div>
  )
}

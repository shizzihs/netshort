import FilmCard, { FilmCardSkeleton } from './FilmCard'
import type { Film } from '@/types'

interface FilmGridProps {
  films: Film[]
  /** 'compact' → 3-col, 'default' → 2-col */
  variant?: 'default' | 'compact'
}

export default function FilmGrid({ films, variant = 'default' }: FilmGridProps) {
  if (films.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground text-sm">
        Không tìm thấy phim nào
      </p>
    )
  }

  return (
    <div className={
      variant === 'compact'
        ? 'grid grid-cols-3 gap-2'
        : 'grid grid-cols-2 gap-3'
    }>
      {films.map((film) => (
        <FilmCard
          key={film.shortPlayId}
          shortPlayId={film.shortPlayId}
          shortPlayName={film.shortPlayName}
          shortPlayCover={film.shortPlayCover}
          variant={variant}
        />
      ))}
    </div>
  )
}

export function FilmGridSkeleton({ variant = 'default', count = 9 }: {
  variant?: 'default' | 'compact'
  count?: number
}) {
  return (
    <div className={
      variant === 'compact'
        ? 'grid grid-cols-3 gap-2'
        : 'grid grid-cols-2 gap-3'
    }>
      {Array.from({ length: count }).map((_, i) => (
        <FilmCardSkeleton key={i} />
      ))}
    </div>
  )
}

import { useRelatedFilms } from '@/hooks/useRelatedFilms'
import FilmGrid, { FilmGridSkeleton } from './FilmGrid'

interface RelatedFilmsProps {
  labels: string[]
  currentId: string
  label?: string
}

export default function RelatedFilms({
  labels,
  currentId,
  label = 'Phim liên quan',
}: RelatedFilmsProps) {
  const { films, isLoading, hasData } = useRelatedFilms(labels, currentId)

  if (!hasData && !isLoading) return null
  if (!isLoading && films.length === 0) return null

  return (
    <div className="px-4 mt-6 pb-2">
      <h2 className="text-sm font-semibold text-foreground mb-3">{label}</h2>
      {isLoading ? (
        <FilmGridSkeleton variant="compact" count={6} />
      ) : (
        <FilmGrid films={films} variant="compact" />
      )}
    </div>
  )
}

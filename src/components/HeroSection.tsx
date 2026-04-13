import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Film } from '@/types'

interface HeroSectionProps {
  film: Film
  firstEpisodeId?: string
}

export function HeroSkeleton() {
  return <Skeleton className="w-full h-[200px] rounded-none" />
}

export default function HeroSection({ film, firstEpisodeId }: HeroSectionProps) {
  const navigate = useNavigate()

  const handlePlay = () => {
    if (firstEpisodeId) {
      navigate(`/watch/${film.shortPlayId}/${firstEpisodeId}`)
    } else {
      navigate(`/film/${film.shortPlayId}`)
    }
  }

  return (
    <div className="relative w-full h-[200px] overflow-hidden bg-muted">
      <img
        src={film.shortPlayCover}
        alt={film.shortPlayName}
        className="w-full h-full object-cover"
        fetchPriority="high"
        loading="eager"
      />

      {/* Gradient overlay — bottom 60% */}
      <div className={cn(
        'absolute inset-0',
        'bg-gradient-to-t from-background via-background/60 to-transparent',
      )} />

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground line-clamp-1 mb-1">
            {film.shortPlayName}
          </h2>
          {film.shortPlayLabels && film.shortPlayLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(film.shortPlayLabels)
                ? film.shortPlayLabels
                : String(film.shortPlayLabels).split(',').map((s) => s.trim()).filter(Boolean)
              ).slice(0, 3).map((label) => (
                <Badge key={label} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={handlePlay}
          aria-label={`Phát ${film.shortPlayName}`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Xem
        </Button>
      </div>
    </div>
  )
}

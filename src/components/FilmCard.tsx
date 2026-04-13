import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

// ─── Variants ────────────────────────────────────────────────────────────────

type FilmCardVariant = 'default' | 'compact' | 'continue'

interface FilmCardProps {
  shortPlayId: string
  shortPlayName: string
  shortPlayCover: string
  variant?: FilmCardVariant
  /** Chỉ dùng cho variant="continue" — 0..1 */
  progressRatio?: number
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function FilmCardSkeleton({ variant = 'default' }: { variant?: FilmCardVariant }) {
  if (variant === 'continue') {
    return (
      <div className="w-20 shrink-0">
        <Skeleton className="w-20 aspect-[2/3] rounded-lg" />
        <Skeleton className="mt-1 h-3 w-16 rounded" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="w-full aspect-[2/3] rounded-lg" />
      <Skeleton className="h-3 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
    </div>
  )
}

// ─── FilmCard ─────────────────────────────────────────────────────────────────

export default function FilmCard({
  shortPlayId,
  shortPlayName,
  shortPlayCover,
  variant = 'default',
  progressRatio,
}: FilmCardProps) {
  const name = stripHtml(shortPlayName)

  if (variant === 'continue') {
    return (
      <Link
        to={`/film/${shortPlayId}`}
        className="w-20 shrink-0 group block active:scale-[0.97] transition-transform"
        aria-label={name}
      >
        <div className="relative w-20 aspect-[2/3] rounded-lg overflow-hidden bg-muted">
          <img
            src={shortPlayCover}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(1, Math.max(0, progressRatio ?? 0)) * 100}%` }}
            />
          </div>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">{name}</p>
      </Link>
    )
  }

  // default + compact — chỉ khác nhau grid column (controlled by parent)
  return (
    <Link
      to={`/film/${shortPlayId}`}
      className="group block active:scale-[0.97] transition-transform"
      aria-label={name}
    >
      <div
        className={cn(
          'relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-muted',
        )}
      >
        <img
          src={shortPlayCover}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <p className={cn(
        'mt-2 font-medium line-clamp-2 leading-snug',
        variant === 'compact' ? 'text-xs' : 'text-sm',
      )}>
        {name}
      </p>
    </Link>
  )
}

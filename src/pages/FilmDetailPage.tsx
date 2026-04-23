import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, ChevronDown, ChevronUp, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useFilmDetail, useEpisodes } from '../hooks/useFilmDetail'
import { useProvider } from '@/contexts/ProviderContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import EpisodeGroupTabs from '@/components/EpisodeGroupTabs'
import RelatedFilms from '@/components/RelatedFilms'
import { usePersonalStore } from '@/stores/usePersonalStore'
import { cn } from '@/lib/utils'
import type { EpisodeInfo } from '@/types'

function FilmDetailSkeleton() {
  return (
    <div>
      <Skeleton className="w-full h-[260px]" />
      <div className="px-4 py-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

export default function FilmDetailPage() {
  const { shortPlayId } = useParams<{ shortPlayId: string }>()
  const navigate = useNavigate()
  const { isReelShort } = useProvider()
  const [introExpanded, setIntroExpanded] = useState(false)
  const isFavorite = usePersonalStore((s) => s.isFavorite)
  const toggleFavorite = usePersonalStore((s) => s.toggleFavorite)

  const { data: detailData, isLoading: detailLoading } = useFilmDetail(shortPlayId!)
  const { data: episodesData, isLoading: epsLoading } = useEpisodes(shortPlayId!)

  if (detailLoading) return <FilmDetailSkeleton />

  const film = (detailData ?? {}) as Record<string, unknown>
  const shortPlayName = String(film.shortPlayName ?? '')
  const shortPlayCover = String(film.shortPlayCover ?? '')
  const shortPlayLabels = Array.isArray(film.shortPlayLabels) ? film.shortPlayLabels as string[] : []
  const shotIntroduce = String(film.shotIntroduce ?? '')

  const detailEpisodes = (
    Array.isArray(film.shortPlayEpisodeInfos) ? film.shortPlayEpisodeInfos : []
  ) as EpisodeInfo[]

  // ReelShort: episodesData is a plain array; NetShort: episodesData.episodePlayList
  const episodePlayList = Array.isArray(episodesData)
    ? (episodesData as EpisodeInfo[])
    : ((episodesData as Record<string, unknown>)?.episodePlayList as EpisodeInfo[] | undefined)

  const episodes: EpisodeInfo[] =
    detailEpisodes.length > 0
      ? detailEpisodes
      : (episodePlayList ?? [])

  const firstEpisode = episodes[0]

  const handlePlay = () => {
    if (firstEpisode) {
      navigate(`/watch/${shortPlayId}/${firstEpisode.episodeId}`)
    }
  }

  return (
    <div className="pb-4">
      {/* Cover hero — 260px */}
      <div className="relative w-full h-[260px] bg-muted overflow-hidden">
        {shortPlayCover && (
          <img
            src={shortPlayCover}
            alt={shortPlayName}
            className="w-full h-full object-cover"
            loading="eager"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Heart button — top right */}
        {shortPlayId && shortPlayName && (
          <button
            onClick={() => {
              const wasFav = isFavorite(shortPlayId)
              toggleFavorite({
                shortPlayId,
                shortPlayName,
                shortPlayCover,
                provider: isReelShort ? 'reelshort' : 'netshort',
              })
              toast.success(wasFav ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích ❤️')
            }}
            className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm"
            aria-label={isFavorite(shortPlayId) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart
              className={cn(
                'w-5 h-5 transition-colors',
                isFavorite(shortPlayId)
                  ? 'fill-red-500 text-red-500'
                  : 'text-white',
              )}
            />
          </button>
        )}
      </div>

      {/* Film info */}
      <div className="px-4 pt-4 space-y-3">
        {/* Title */}
        <h1 className="text-lg font-semibold text-foreground leading-snug">
          {shortPlayName}
        </h1>

        {/* Labels */}
        {shortPlayLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {shortPlayLabels.map((label) => (
              <Badge key={label} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}

        {/* Description — 3-line clamp + expand */}
        {shotIntroduce && (
          <div>
            <p className={introExpanded ? 'text-sm text-muted-foreground' : 'text-sm text-muted-foreground line-clamp-3'}>
              {shotIntroduce}
            </p>
            <button
              onClick={() => setIntroExpanded((e) => !e)}
              className="flex items-center gap-1 mt-1 text-xs text-primary"
            >
              {introExpanded ? (
                <>Thu gọn <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Xem thêm <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Episode list */}
      <div className="px-4 mt-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Danh sách tập
          {episodes.length > 0 && (
            <span className="ml-2 text-muted-foreground font-normal">({episodes.length} tập)</span>
          )}
        </h2>

        {epsLoading ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        ) : episodes.length > 0 ? (
          <EpisodeGroupTabs
            shortPlayId={shortPlayId!}
            episodes={episodes}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có tập nào</p>
        )}
      </div>

      {/* CTA — Xem từ đầu */}
      {firstEpisode && (
        <div className="px-4 mt-6">
          <Button className="w-full gap-2" onClick={handlePlay}>
            <Play className="w-4 h-4 fill-current" />
            Xem từ đầu · Tập 1
          </Button>
        </div>
      )}

      {/* Related films */}
      {shortPlayId && (
        <RelatedFilms
          labels={shortPlayLabels}
          currentId={shortPlayId}
        />
      )}
    </div>
  )
}

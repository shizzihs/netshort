import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useFilmDetail, useEpisodes } from '../hooks/useFilmDetail'
import VideoPlayer from '@/components/VideoPlayer'
import TikTokPlayer from '@/components/TikTokPlayer'
import AutoNextOverlay from '@/components/AutoNextOverlay'
import EpisodeGroupTabs from '@/components/EpisodeGroupTabs'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { usePersonalStore } from '@/stores/usePersonalStore'
import RelatedFilms from '@/components/RelatedFilms'
import type { EpisodeInfo, EpisodePlay } from '@/types'

/** Merge detail episodes + fresh play vouchers from episode_play_detail */
function buildPlayList(detailData: unknown, episodesData: unknown): EpisodeInfo[] {
  const detail = (detailData ?? {}) as Record<string, unknown>
  const episodes = (episodesData ?? {}) as Record<string, unknown>

  const base: EpisodeInfo[] = Array.isArray(detail.shortPlayEpisodeInfos)
    ? (detail.shortPlayEpisodeInfos as EpisodeInfo[])
    : []

  const freshList: EpisodePlay[] = Array.isArray(episodes.episodePlayList)
    ? (episodes.episodePlayList as EpisodePlay[])
    : []

  if (freshList.length === 0) return base

  const freshMap = new Map(freshList.map((ep) => [ep.episodeId, ep.playVoucher]))
  return base.map((ep) => ({
    ...ep,
    playVoucher: freshMap.get(ep.episodeId) ?? ep.playVoucher,
  }))
}

export default function WatchPage() {
  const { shortPlayId, episodeId } = useParams<{
    shortPlayId: string
    episodeId: string
  }>()
  const navigate = useNavigate()
  const [showAutoNext, setShowAutoNext] = useState(false)
  const [showEpisodeList, setShowEpisodeList] = useState(false)
  const [fullscreenEl, setFullscreenEl] = useState<Element | null>(null)

  // Track browser fullscreen element — portal the overlay into it
  useEffect(() => {
    const handler = () => {
      const el = document.fullscreenElement ?? (document as unknown as Record<string, unknown>).webkitFullscreenElement as Element ?? null
      setFullscreenEl(el)
      // Auto-close list when exiting fullscreen
      if (!el) setShowEpisodeList(false)
    }
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  const { data: detailData } = useFilmDetail(shortPlayId!)
  const { data: episodesData, isLoading } = useEpisodes(shortPlayId!)

  const setCurrentEpisode = usePlayerStore((s) => s.setCurrentEpisode)
  const autoNextEnabled = usePlayerStore((s) => s.autoNextEnabled)
  const viewMode = usePlayerStore((s) => s.viewMode)
  const setViewMode = usePlayerStore((s) => s.setViewMode)
  const saveProgress = usePersonalStore((s) => s.saveProgress)
  const addHistory = usePersonalStore((s) => s.addHistory)

  const detail = (detailData ?? {}) as Record<string, unknown>
  const shortPlayName = String(detail.shortPlayName ?? '')
  const shortPlayCover = String(detail.shortPlayCover ?? '')
  const shortPlayLabels: string[] = Array.isArray(detail.shortPlayLabels)
    ? (detail.shortPlayLabels as string[])
    : typeof detail.shortPlayLabels === 'string'
      ? (detail.shortPlayLabels as string).split(',').map((s) => s.trim()).filter(Boolean)
      : []

  const playList = buildPlayList(detailData, episodesData)

  const currentIndex = playList.findIndex((ep) => ep.episodeId === episodeId)
  const currentEpisode = playList[currentIndex] ?? null
  const prevEpisode = currentIndex > 0 ? playList[currentIndex - 1] : null
  const nextEpisode = playList[currentIndex + 1] ?? null
  const isLastEpisode = currentIndex >= 0 && currentIndex === playList.length - 1

  useEffect(() => {
    if (shortPlayId && episodeId) setCurrentEpisode(shortPlayId, episodeId)
  }, [shortPlayId, episodeId, setCurrentEpisode])

  useEffect(() => {
    if (shortPlayId && shortPlayName && shortPlayCover)
      addHistory({ shortPlayId, shortPlayName, shortPlayCover })
  }, [shortPlayId, shortPlayName, shortPlayCover, addHistory])

  useEffect(() => {
    return () => {
      if (shortPlayId && currentEpisode)
        saveProgress(shortPlayId, currentEpisode.episodeId, currentEpisode.episodeNo)
    }
  }, [shortPlayId, currentEpisode, saveProgress])

  const handleEnded = useCallback(() => {
    if (!currentEpisode || !shortPlayId) return
    saveProgress(shortPlayId, currentEpisode.episodeId, currentEpisode.episodeNo)
    if (isLastEpisode) {
      toast.success('Hết phim 🎬', { description: 'Bạn đã xem hết tất cả các tập!' })
      return
    }
    if (autoNextEnabled && nextEpisode) setShowAutoNext(true)
  }, [currentEpisode, shortPlayId, isLastEpisode, autoNextEnabled, nextEpisode, saveProgress])

  const handleAutoNextConfirm = useCallback(() => {
    setShowAutoNext(false)
    if (nextEpisode && shortPlayId)
      navigate(`/watch/${shortPlayId}/${nextEpisode.episodeId}`)
  }, [nextEpisode, shortPlayId, navigate])

  const handleAutoNextCancel = useCallback(() => setShowAutoNext(false), [])

  const handleEpisodeSelect = useCallback((episode: EpisodeInfo) => {
    if (!shortPlayId || !currentEpisode) return
    saveProgress(shortPlayId, currentEpisode.episodeId, currentEpisode.episodeNo)
    setShowEpisodeList(false)
    navigate(`/watch/${shortPlayId}/${episode.episodeId}`)
  }, [shortPlayId, currentEpisode, saveProgress, navigate])

  const handlePrev = useCallback(() => {
    if (!prevEpisode || !shortPlayId) return
    if (currentEpisode) saveProgress(shortPlayId, currentEpisode.episodeId, currentEpisode.episodeNo)
    navigate(`/watch/${shortPlayId}/${prevEpisode.episodeId}`)
  }, [prevEpisode, shortPlayId, currentEpisode, saveProgress, navigate])

  const handleNext = useCallback(() => {
    if (!nextEpisode || !shortPlayId) return
    if (currentEpisode) saveProgress(shortPlayId, currentEpisode.episodeId, currentEpisode.episodeNo)
    navigate(`/watch/${shortPlayId}/${nextEpisode.episodeId}`)
  }, [nextEpisode, shortPlayId, currentEpisode, saveProgress, navigate])

  // Stable video URL — locked per episodeId, not updated on background refetch
  const stableUrlRef = useRef('')
  const prevEpisodeIdRef = useRef('')
  const freshUrl = currentEpisode?.playVoucher ?? ''
  if (episodeId !== prevEpisodeIdRef.current && freshUrl) {
    prevEpisodeIdRef.current = episodeId ?? ''
    stableUrlRef.current = freshUrl
  }
  const videoUrl = stableUrlRef.current

  const subtitles = currentEpisode?.subtitleList ?? []
  const epNo = currentEpisode?.episodeNo
  const title = epNo ? `${shortPlayName} - Tập ${epNo}` : shortPlayName || 'Đang tải...'

  const hasMultipleEps = playList.length > 1

  // Episode list overlay — rendered as portal inside fullscreen element
  const episodeOverlay = hasMultipleEps && showEpisodeList && fullscreenEl
    ? createPortal(
        <div
          className="absolute inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEpisodeList(false) }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <span className="text-white font-semibold text-sm">{shortPlayName}</span>
            <button
              onClick={() => setShowEpisodeList(false)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Scrollable episode grid */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <EpisodeGroupTabs
              shortPlayId={shortPlayId!}
              episodes={playList}
              currentEpisodeId={episodeId}
              onEpisodeSelect={handleEpisodeSelect}
            />
          </div>
        </div>,
        fullscreenEl,
      )
    : null

  const nextVideoUrl = nextEpisode?.playVoucher ?? undefined

  return (
    <div className="min-h-dvh bg-black">
      {/* Video */}
      <div className="relative w-full">
        {videoUrl ? (
          viewMode === 'tiktok' ? (
            <TikTokPlayer
              src={videoUrl}
              nextSrc={nextVideoUrl}
              subtitles={subtitles}
              onEnded={handleEnded}
              hasPrevEpisode={!!prevEpisode}
              hasNextEpisode={!!nextEpisode}
              onPrevEpisode={handlePrev}
              onNextEpisode={handleNext}
            />
          ) : (
            <VideoPlayer
              src={videoUrl}
              subtitles={subtitles}
              onEnded={handleEnded}
              hasPrevEpisode={!!prevEpisode}
              hasNextEpisode={!!nextEpisode}
              onPrevEpisode={handlePrev}
              onNextEpisode={handleNext}
              onToggleList={hasMultipleEps ? () => setShowEpisodeList((v) => !v) : undefined}
            />
          )
        ) : (
          <div className="w-full aspect-video flex items-center justify-center text-white/50 text-sm">
            {isLoading ? 'Đang tải video...' : 'Không có video'}
          </div>
        )}

        {showAutoNext && nextEpisode && (
          <AutoNextOverlay
            nextEpisodeNo={nextEpisode.episodeNo}
            cover={shortPlayCover}
            onConfirm={handleAutoNextConfirm}
            onCancel={handleAutoNextCancel}
          />
        )}
      </div>

      {/* Title + mode toggle */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <h2 className="flex-1 text-sm font-medium text-foreground truncate">{title}</h2>
        {/* Mode toggle pill */}
        <button
          onClick={() => setViewMode(viewMode === 'tiktok' ? 'classic' : 'tiktok')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors"
          style={viewMode === 'tiktok'
            ? { borderColor: '#38bdf8', color: '#38bdf8', background: 'rgba(56,189,248,0.08)' }
            : { borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', background: 'transparent' }}
          aria-label="Chuyển chế độ xem"
        >
          {viewMode === 'tiktok' ? (
            <><span>⚡</span> TikTok</>
          ) : (
            <><span>🎬</span> Classic</>
          )}
        </button>
      </div>

      {/* Episode list — only shown outside fullscreen */}
      {hasMultipleEps && !fullscreenEl && (
        <div className="px-4 pb-2">
          <EpisodeGroupTabs
            shortPlayId={shortPlayId!}
            episodes={playList}
            currentEpisodeId={episodeId}
            onEpisodeSelect={handleEpisodeSelect}
          />
        </div>
      )}

      {/* Related films */}
      {shortPlayId && !fullscreenEl && (
        <RelatedFilms
          labels={shortPlayLabels}
          currentId={shortPlayId}
        />
      )}

      {/* Fullscreen overlay portal */}
      {episodeOverlay}
    </div>
  )
}

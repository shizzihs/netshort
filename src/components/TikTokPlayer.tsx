import { useEffect, useRef, useState, useCallback } from 'react'

interface Subtitle {
  url: string
  format?: string
  subtitleLanguage?: string
}

export interface TikTokPlayerProps {
  src: string
  nextSrc?: string
  subtitles?: Subtitle[]
  onEnded?: () => void
  onPrevEpisode?: () => void
  onNextEpisode?: () => void
  hasPrevEpisode?: boolean
  hasNextEpisode?: boolean
}

const LANG_LABELS: Record<string, string> = {
  vi_VN: 'Tiếng Việt', en_US: 'English', zh_CN: '中文', zh_TW: '中文(繁)',
  ja_JP: '日本語', ko_KR: '한국어', th_TH: 'ไทย', es_ES: 'Español',
  pt_PT: 'Português', fr_FR: 'Français', de_DE: 'Deutsch',
  id_ID: 'Bahasa Indonesia', ms_MY: 'Bahasa Melayu', ar_AE: 'العربية',
  tr_TR: 'Türkçe', it_IT: 'Italiano', hi_IN: 'हिन्दी',
}

function langCode(locale?: string) { return locale ? locale.split('_')[0] : 'vi' }

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IPlay = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8 5v14l11-7z"/></svg>
const IPause = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
const IPrev = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="4" x2="5" y2="20"/></svg>
const INext = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="4" x2="19" y2="20"/></svg>
const IVolume = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
const IVolumeOff = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
const IFullscreen = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
const IFullscreenExit = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>
const ISub = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h4M13 15h4M7 11h2M12 11h5"/></svg>

// ─── Seek feedback overlay ─────────────────────────────────────────────────
function SeekFeedback({ delta, visible }: { delta: number; visible: boolean }) {
  return (
    <div className={`absolute inset-0 flex items-center pointer-events-none transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Left side: -10s */}
      <div className={`flex-1 flex items-center justify-center ${delta < 0 ? '' : 'invisible'}`}>
        <div className="flex flex-col items-center gap-1 bg-black/40 rounded-2xl px-5 py-3 backdrop-blur-sm">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
          </svg>
          <span className="text-white text-xs font-semibold">10 giây</span>
        </div>
      </div>
      {/* Right side: +10s */}
      <div className={`flex-1 flex items-center justify-center ${delta > 0 ? '' : 'invisible'}`}>
        <div className="flex flex-col items-center gap-1 bg-black/40 rounded-2xl px-5 py-3 backdrop-blur-sm">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
          </svg>
          <span className="text-white text-xs font-semibold">10 giây</span>
        </div>
      </div>
    </div>
  )
}

// ─── SwipeHint ─────────────────────────────────────────────────────────────
function SwipeHint({ dir, visible }: { dir: 'up' | 'down'; visible: boolean }) {
  return (
    <div className={`absolute inset-0 flex ${dir === 'up' ? 'items-end pb-16' : 'items-start pt-16'} justify-center pointer-events-none transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
        {dir === 'up' ? '▲ Tập sau' : '▼ Tập trước'}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function TikTokPlayer({
  src,
  nextSrc,
  subtitles = [],
  onEnded,
  onPrevEpisode,
  onNextEpisode,
  hasPrevEpisode,
  hasNextEpisode,
}: TikTokPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Gesture tracking (refs — not state, to avoid re-renders in event handlers)
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
  const seekingProgressRef = useRef(false)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapCountRef = useRef(0)
  const tapXRef = useRef(0)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isPortrait, setIsPortrait] = useState(false)
  const [subsOn, setSubsOn] = useState(subtitles.length > 0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [seekFeedback, setSeekFeedback] = useState<{ delta: number; key: number } | null>(null)
  const [swipeHint, setSwipeHint] = useState<'up' | 'down' | null>(null)

  // ── Swap src without destroying video element ─────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return
    setCurrentTime(0)
    setDuration(0)
    setPlaying(false)
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener('canplay', onCanPlay, { once: true })
    video.src = src
    video.load()
    return () => video.removeEventListener('canplay', onCanPlay)
  }, [src])

  // ── Subtitle tracks ───────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    Array.from(video.querySelectorAll('track')).forEach((t) => t.remove())
    subtitles.forEach((sub, i) => {
      const track = document.createElement('track')
      track.kind = 'subtitles'
      track.src = sub.url
      track.srclang = langCode(sub.subtitleLanguage)
      track.label = LANG_LABELS[sub.subtitleLanguage ?? ''] ?? sub.subtitleLanguage ?? 'Subtitles'
      if (i === 0) track.default = true
      video.appendChild(track)
    })
    setSubsOn(subtitles.length > 0)
  }, [subtitles])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = subsOn && i === 0 ? 'showing' : 'hidden'
    }
  }, [subsOn])

  // ── Fullscreen ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement ||
        !!(document as unknown as Record<string, unknown>).webkitFullscreenElement
      setIsFullscreen(fs)
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // ── Auto-hide controls ────────────────────────────────────────────────────
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  const revealControls = useCallback(() => {
    setShowControls(true)
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => {
    scheduleHide()
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }
  }, [scheduleHide])

  // ── Seek helpers ──────────────────────────────────────────────────────────
  const seekByDelta = useCallback((delta: number) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta))
    setSeekFeedback({ delta, key: Date.now() })
    setTimeout(() => setSeekFeedback(null), 700)
  }, [])

  const seekToRatio = useCallback((clientX: number) => {
    const bar = progressBarRef.current
    const video = videoRef.current
    if (!bar || !video || !video.duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    video.currentTime = ratio * video.duration
  }, [])

  // ── Touch gesture handling ────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (seekingProgressRef.current) {
      seekingProgressRef.current = false
      revealControls()
      return
    }

    const t = e.changedTouches[0]
    const { x: sx, y: sy, time: st } = touchStartRef.current
    const dx = t.clientX - sx
    const dy = t.clientY - sy
    const dt = Date.now() - st

    // Swipe gesture: significant vertical, low horizontal, fast
    if (Math.abs(dy) > 60 && Math.abs(dx) < 50 && dt < 450) {
      if (dy < 0 && hasNextEpisode) {
        // Swipe up → next
        setSwipeHint('up')
        setTimeout(() => setSwipeHint(null), 600)
        onNextEpisode?.()
      } else if (dy > 0 && hasPrevEpisode) {
        // Swipe down → prev
        setSwipeHint('down')
        setTimeout(() => setSwipeHint(null), 600)
        onPrevEpisode?.()
      }
      return
    }

    // Tap gesture: small movement, short duration
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20 && dt < 250) {
      tapCountRef.current += 1
      tapXRef.current = t.clientX

      if (tapCountRef.current === 1) {
        // Wait to see if a second tap arrives
        tapTimerRef.current = setTimeout(() => {
          tapCountRef.current = 0
          // Single tap: toggle controls or play/pause
          if (!showControls) {
            revealControls()
          } else {
            const video = videoRef.current
            if (video) {
              if (video.paused) video.play().catch(() => {})
              else video.pause()
            }
            revealControls()
          }
        }, 260)
      } else if (tapCountRef.current === 2) {
        // Double tap detected
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
        tapCountRef.current = 0
        const container = containerRef.current
        const midX = container ? container.getBoundingClientRect().left + container.offsetWidth / 2 : window.innerWidth / 2
        seekByDelta(tapXRef.current >= midX ? 10 : -10)
        revealControls()
      }
    }
  }, [showControls, hasNextEpisode, hasPrevEpisode, onNextEpisode, onPrevEpisode, seekByDelta, revealControls])

  // ── Progress bar touch ────────────────────────────────────────────────────
  const handleProgressTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    seekingProgressRef.current = true
    seekToRatio(e.touches[0].clientX)
  }, [seekToRatio])

  const handleProgressTouchMove = useCallback((e: React.TouchEvent) => {
    if (!seekingProgressRef.current) return
    e.stopPropagation()
    seekToRatio(e.touches[0].clientX)
  }, [seekToRatio])

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    seekToRatio(e.clientX)
    revealControls()
  }, [seekToRatio, revealControls])

  // ── Control button handlers ───────────────────────────────────────────────
  const btn = useCallback(<T extends { stopPropagation(): void }>(fn: () => void) =>
    (e: T) => { e.stopPropagation(); fn(); revealControls() },
  [revealControls])

  const handlePlayPause = btn(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {}); else v.pause()
  })

  const handleMute = btn(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  })

  const handleSubs = btn(() => setSubsOn((s) => !s))

  const handleFullscreen = btn(() => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else el.requestFullscreen().catch(() => {})
  })

  const handlePrev = btn(() => onPrevEpisode?.())
  const handleNext = btn(() => onNextEpisode?.())

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div
      ref={containerRef}
      className="tiktok-player relative w-full bg-black overflow-hidden select-none"
      style={{ aspectRatio: isPortrait ? '9/16' : '16/9' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Main video (persistent) ── */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        crossOrigin="anonymous"
        onLoadedMetadata={() => {
          const v = videoRef.current
          if (!v) return
          setDuration(v.duration)
          setIsPortrait(v.videoHeight > v.videoWidth)
        }}
        onTimeUpdate={() => {
          const v = videoRef.current
          if (v) setCurrentTime(v.currentTime)
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
      />

      {/* ── Prefetch next episode ── */}
      {nextSrc && (
        <video key={nextSrc} src={nextSrc} preload="auto" muted playsInline style={{ display: 'none' }} />
      )}

      {/* ── Seek visual feedback ── */}
      {seekFeedback && (
        <SeekFeedback key={seekFeedback.key} delta={seekFeedback.delta} visible />
      )}

      {/* ── Swipe hint ── */}
      {swipeHint && <SwipeHint dir={swipeHint} visible />}

      {/* ── Controls overlay ── */}
      <div
        className={`absolute inset-0 flex flex-col justify-end pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.72))' }}
      >
        <div
          className="pointer-events-auto px-3 space-y-2"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          {/* Progress bar */}
          <div
            ref={progressBarRef}
            className="relative h-1 rounded-full bg-white/30 cursor-pointer group"
            onClick={handleProgressClick}
            onTouchStart={handleProgressTouchStart}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={(e) => { e.stopPropagation(); revealControls() }}
          >
            <div
              className="h-full bg-sky-400 rounded-full relative"
              style={{ width: `${progress * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Button row */}
          <div className="flex items-center gap-0.5">
            <button onClick={handlePrev} disabled={!hasPrevEpisode}
              className="p-2 text-white disabled:opacity-30 touch-manipulation" aria-label="Tập trước">
              <IPrev />
            </button>

            <button onClick={handlePlayPause}
              className="p-2 text-white touch-manipulation" aria-label={playing ? 'Dừng' : 'Phát'}>
              {playing ? <IPause /> : <IPlay />}
            </button>

            <button onClick={handleNext} disabled={!hasNextEpisode}
              className="p-2 text-white disabled:opacity-30 touch-manipulation" aria-label="Tập sau">
              <INext />
            </button>

            <span className="text-white/75 text-[11px] ml-1 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {subtitles.length > 0 && (
              <button onClick={handleSubs}
                className="p-2 touch-manipulation"
                style={{ color: subsOn ? '#38bdf8' : 'rgba(255,255,255,0.4)' }}
                aria-label={subsOn ? 'Tắt phụ đề' : 'Bật phụ đề'}>
                <ISub />
              </button>
            )}

            <button onClick={handleMute}
              className="p-2 text-white touch-manipulation" aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}>
              {muted ? <IVolumeOff /> : <IVolume />}
            </button>

            <button onClick={handleFullscreen}
              className="p-2 text-white touch-manipulation" aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
              {isFullscreen ? <IFullscreenExit /> : <IFullscreen />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

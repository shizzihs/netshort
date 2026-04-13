/**
 * TikTokOverlay — full-viewport swipe player
 *
 * Architecture:
 *   • 3 stable video slots in a circular buffer (never unmount)
 *   • Swipe gestures write directly to DOM transforms → 60 fps, no React re-render
 *   • On snap: rotate slot assignments, load new episode into recycled slot
 *   • URL updated with history.pushState (no React Router navigation = no refetch)
 *   • Episodes at activeIdx+1 and activeIdx+2 are pre-loaded in background slots
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import type { EpisodeInfo, SubtitleItem } from '@/types/index'
import { X, ChevronUp, ChevronDown, List } from 'lucide-react'
import EpisodeGroupTabs from '@/components/EpisodeGroupTabs'

export interface TikTokOverlayProps {
  episodes: EpisodeInfo[]
  initialIndex: number
  shortPlayId: string
  /** Called when overlay closes — pass final episode index so WatchPage can sync route */
  onClose: (finalIndex: number) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SNAP_THRESHOLD = 0.22  // fraction of screen height
const ANIM_MS = 320
const LANG_LABELS: Record<string, string> = {
  vi_VN: 'Tiếng Việt', en_US: 'English', zh_CN: '中文', zh_TW: '中文(繁)',
  ja_JP: '日本語', ko_KR: '한국어', th_TH: 'ไทย', es_ES: 'Español',
  pt_PT: 'Português', fr_FR: 'Français', de_DE: 'Deutsch',
  id_ID: 'Bahasa Indonesia', ms_MY: 'Bahasa Melayu', ar_AE: 'العربية',
  tr_TR: 'Türkçe', it_IT: 'Italiano', hi_IN: 'हिन्दी',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function langCode(locale?: string) { return locale ? locale.split('_')[0] : 'vi' }
function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function loadEpisodeIntoVideo(video: HTMLVideoElement, ep: EpisodeInfo | null, autoplay: boolean) {
  // Clear existing tracks
  Array.from(video.querySelectorAll('track')).forEach(t => t.remove())

  if (!ep?.playVoucher) { video.src = ''; return }

  // Subtitle tracks
  if (ep.subtitleList?.length) {
    ep.subtitleList.forEach((sub: SubtitleItem, i) => {
      const track = document.createElement('track')
      track.kind = 'subtitles'
      track.src = sub.url
      track.srclang = langCode(sub.subtitleLanguage)
      track.label = LANG_LABELS[sub.subtitleLanguage] ?? sub.subtitleLanguage
      if (i === 0) track.default = true
      video.appendChild(track)
    })
  }

  if (autoplay) {
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener('canplay', onCanPlay, { once: true })
    video.src = ep.playVoucher
    video.load()
  } else {
    // Pre-load silently
    video.preload = 'auto'
    video.src = ep.playVoucher
    video.load()
  }
}

function setTranslateY(el: HTMLElement | null, vh: number, animated: boolean) {
  if (!el) return
  el.style.transition = animated ? `transform ${ANIM_MS}ms cubic-bezier(0.33, 1, 0.68, 1)` : 'none'
  el.style.transform = `translateY(${vh}vh)`
}

// ─── Seek / double-tap feedback ───────────────────────────────────────────────

function SeekFeedback({ side, visible }: { side: 'left' | 'right'; visible: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex items-center pointer-events-none transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className={`flex-1 flex justify-center ${side === 'left' ? '' : 'invisible'}`}>
        <div className="bg-black/40 rounded-2xl px-6 py-4 flex flex-col items-center gap-1 backdrop-blur-sm">
          <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
          </svg>
          <span className="text-white text-xs font-semibold">−10s</span>
        </div>
      </div>
      <div className={`flex-1 flex justify-center ${side === 'right' ? '' : 'invisible'}`}>
        <div className="bg-black/40 rounded-2xl px-6 py-4 flex flex-col items-center gap-1 backdrop-blur-sm">
          <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
          </svg>
          <span className="text-white text-xs font-semibold">+10s</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export default function TikTokOverlay({ episodes, initialIndex, shortPlayId, onClose }: TikTokOverlayProps) {
  // ── Slot refs (3 stable DOM nodes, never recreated) ───────────────────────
  const slotDivRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ]
  const videoRefs = [
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
  ]

  // Circular buffer state (mutable refs for use inside event handlers)
  const activeSlotRef = useRef(1)          // which slot (0,1,2) is visible
  const slotEpIdxRef = useRef<number[]>([  // which episode index is in each slot
    initialIndex - 1,
    initialIndex,
    initialIndex + 1,
  ])

  // React state only for UI rendering
  const [activeEpIdx, setActiveEpIdx] = useState(initialIndex)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [subsOn, setSubsOn] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [seekFeedback, setSeekFeedback] = useState<{ side: 'left' | 'right'; key: number } | null>(null)
  const [showEpList, setShowEpList] = useState(false)
  const showEpListRef = useRef(false)  // readable inside native touch handlers

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapCountRef = useRef(0)
  const tapXRef = useRef(0)

  // Touch gesture state (all in refs — never trigger re-render during swipe)
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  const touchStartTime = useRef(0)
  const dragging = useRef(false)
  const animating = useRef(false)

  // Progress bar
  const progressBarRef = useRef<HTMLDivElement>(null)
  const seekingBar = useRef(false)

  // ── Initial layout ────────────────────────────────────────────────────────
  useEffect(() => {
    // Position slots
    setTranslateY(slotDivRefs[0].current, -100, false)  // prev (above)
    setTranslateY(slotDivRefs[1].current, 0, false)      // current (visible)
    setTranslateY(slotDivRefs[2].current, 100, false)    // next (below)

    // Load initial episodes
    const loadSlot = (slotId: number, epIdx: number, autoplay: boolean) => {
      const v = videoRefs[slotId].current
      const ep = episodes[epIdx] ?? null
      if (v) loadEpisodeIntoVideo(v, ep, autoplay)
    }

    loadSlot(0, initialIndex - 1, false)  // prev: preload
    loadSlot(1, initialIndex, true)        // current: play
    loadSlot(2, initialIndex + 1, false)  // next: preload

    // Sync initial UI
    const activeVideo = videoRefs[1].current
    if (activeVideo) {
      const ep = episodes[initialIndex]
      setSubsOn(!!(ep?.subtitleList?.length))
    }

    // Prevent body scroll while overlay is open
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Controls auto-hide ────────────────────────────────────────────────────
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3500)
  }, [])

  const revealControls = useCallback(() => {
    setShowControls(true)
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => {
    scheduleHide()
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }
  }, [scheduleHide])

  // Keep ref in sync so native touch handlers can read it without stale closure
  useEffect(() => { showEpListRef.current = showEpList }, [showEpList])

  // ── Jump to any episode (used by episode list sheet) ─────────────────────
  const navigateTo = useCallback((epIdx: number) => {
    if (epIdx < 0 || epIdx >= episodes.length) return
    setShowEpList(false)

    const curSlot = activeSlotRef.current
    const nextSlot = (curSlot + 1) % 3
    const prevSlot = (curSlot + 2) % 3

    // Pause current
    videoRefs[curSlot].current?.pause()

    // Load target into active slot
    const targetEp = episodes[epIdx]
    loadEpisodeIntoVideo(videoRefs[curSlot].current!, targetEp, true)

    // Load adjacent into the other two slots
    loadEpisodeIntoVideo(videoRefs[prevSlot].current!, episodes[epIdx - 1] ?? null, false)
    loadEpisodeIntoVideo(videoRefs[nextSlot].current!, episodes[epIdx + 1] ?? null, false)

    // Reposition (active stays at 0, others reset to offscreen)
    setTranslateY(slotDivRefs[curSlot].current, 0, false)
    setTranslateY(slotDivRefs[prevSlot].current, -100, false)
    setTranslateY(slotDivRefs[nextSlot].current, 100, false)

    // Update slot→episode map
    slotEpIdxRef.current[curSlot] = epIdx
    slotEpIdxRef.current[prevSlot] = epIdx - 1
    slotEpIdxRef.current[nextSlot] = epIdx + 1

    // React state + URL
    setActiveEpIdx(epIdx)
    setSubsOn(!!(targetEp?.subtitleList?.length))
    if (targetEp) history.pushState(null, '', `/watch/${shortPlayId}/${targetEp.episodeId}`)
    revealControls()
  }, [episodes, shortPlayId, videoRefs, slotDivRefs, revealControls])

  // ── Navigate to adjacent episode ──────────────────────────────────────────
  const navigate = useCallback((direction: 1 | -1) => {
    if (animating.current) return
    const curActiveSlot = activeSlotRef.current
    const curEpIdx = slotEpIdxRef.current[curActiveSlot]
    const newEpIdx = curEpIdx + direction
    if (newEpIdx < 0 || newEpIdx >= episodes.length) return

    animating.current = true

    // Which slot is currently next/prev
    const nextSlot = (curActiveSlot + 1) % 3  // below
    const prevSlot = (curActiveSlot + 2) % 3  // above

    const targetSlot = direction === 1 ? nextSlot : prevSlot
    const recycledSlot = direction === 1 ? prevSlot : nextSlot

    // Animate: active → out, target → in
    setTranslateY(slotDivRefs[curActiveSlot].current, direction === 1 ? -100 : 100, true)
    setTranslateY(slotDivRefs[targetSlot].current, 0, true)

    setTimeout(() => {
      // Pause old video
      videoRefs[curActiveSlot].current?.pause()

      // Play new active video
      const newVideo = videoRefs[targetSlot].current
      if (newVideo) {
        newVideo.play().catch(() => {})
        setDuration(newVideo.duration || 0)
        setCurrentTime(newVideo.currentTime || 0)
        setPlaying(true)
        // Sync sub state
        const newEp = episodes[newEpIdx]
        setSubsOn(!!(newEp?.subtitleList?.length))
        // Apply current sub toggle to new video
        for (let i = 0; i < newVideo.textTracks.length; i++) {
          newVideo.textTracks[i].mode = newEp?.subtitleList?.length ? 'showing' : 'hidden'
        }
      }

      // Recycle the opposite slot: move offscreen & load the next episode to preload
      const recycleEpIdx = newEpIdx + direction  // one further in same direction
      const recycleEp = episodes[recycleEpIdx] ?? null
      setTranslateY(slotDivRefs[recycledSlot].current, direction === 1 ? 100 : -100, false)
      const recycledVideo = videoRefs[recycledSlot].current
      if (recycledVideo) loadEpisodeIntoVideo(recycledVideo, recycleEp, false)

      // Update refs
      activeSlotRef.current = targetSlot
      slotEpIdxRef.current[recycledSlot] = recycleEpIdx

      // Update React state (only affects UI, not gesture handling)
      setActiveEpIdx(newEpIdx)

      // Update URL silently (no React Router = no refetch)
      const ep = episodes[newEpIdx]
      if (ep) history.pushState(null, '', `/watch/${shortPlayId}/${ep.episodeId}`)

      animating.current = false
    }, ANIM_MS)
  }, [episodes, shortPlayId, slotDivRefs, videoRefs])

  // ── Touch gesture handling (attached natively for passive:false) ──────────
  useEffect(() => {
    const overlay = document.getElementById('tiktok-overlay-root')
    if (!overlay) return

    const onTouchStart = (e: TouchEvent) => {
      if (seekingBar.current || showEpListRef.current) return
      touchStartY.current = e.touches[0].clientY
      touchStartX.current = e.touches[0].clientX
      touchStartTime.current = Date.now()
      dragging.current = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (seekingBar.current || animating.current) return
      const dy = e.touches[0].clientY - touchStartY.current
      const dx = e.touches[0].clientX - touchStartX.current

      // Only handle vertical swipes
      if (!dragging.current && Math.abs(dx) > Math.abs(dy)) return  // horizontal — ignore
      dragging.current = true
      e.preventDefault()  // prevent scroll

      const curSlot = activeSlotRef.current
      const nextSlot = (curSlot + 1) % 3
      const prevSlot = (curSlot + 2) % 3

      // Live drag — update transforms directly on DOM
      const curEpIdx = slotEpIdxRef.current[curSlot]
      const canGoNext = curEpIdx < episodes.length - 1
      const canGoPrev = curEpIdx > 0

      const clampedDy = Math.max(
        canGoNext ? -window.innerHeight : 0,
        Math.min(canGoPrev ? window.innerHeight : 0, dy),
      )

      slotDivRefs[curSlot].current!.style.transition = 'none'
      slotDivRefs[curSlot].current!.style.transform = `translateY(${clampedDy}px)`
      slotDivRefs[nextSlot].current!.style.transition = 'none'
      slotDivRefs[nextSlot].current!.style.transform = `translateY(calc(100vh + ${clampedDy}px))`
      slotDivRefs[prevSlot].current!.style.transition = 'none'
      slotDivRefs[prevSlot].current!.style.transform = `translateY(calc(-100vh + ${clampedDy}px))`
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (seekingBar.current) { seekingBar.current = false; return }
      if (animating.current) return

      const dy = e.changedTouches[0].clientY - touchStartY.current
      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dt = Date.now() - touchStartTime.current

      if (dragging.current) {
        dragging.current = false
        const threshold = window.innerHeight * SNAP_THRESHOLD

        if (dy < -threshold) {
          navigate(1)   // swipe up → next
        } else if (dy > threshold) {
          navigate(-1)  // swipe down → prev
        } else {
          // Snap back to current position
          const curSlot = activeSlotRef.current
          const nextSlot = (curSlot + 1) % 3
          const prevSlot = (curSlot + 2) % 3
          setTranslateY(slotDivRefs[curSlot].current, 0, true)
          setTranslateY(slotDivRefs[nextSlot].current, 100, true)
          setTranslateY(slotDivRefs[prevSlot].current, -100, true)
        }
        return
      }

      // Tap gesture (no drag)
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18 && dt < 250) {
        tapCountRef.current += 1
        tapXRef.current = e.changedTouches[0].clientX

        if (tapCountRef.current === 1) {
          tapTimerRef.current = setTimeout(() => {
            tapCountRef.current = 0
            // Single tap: toggle controls
            setShowControls(s => {
              if (!s) { scheduleHide(); return true }
              clearTimeout(hideTimerRef.current!)
              return false
            })
          }, 250)
        } else if (tapCountRef.current >= 2) {
          if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
          tapCountRef.current = 0
          // Double tap: seek ±10s
          const isRight = tapXRef.current > window.innerWidth / 2
          const video = videoRefs[activeSlotRef.current].current
          if (video && video.duration) {
            video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + (isRight ? 10 : -10)))
          }
          setSeekFeedback({ side: isRight ? 'right' : 'left', key: Date.now() })
          setTimeout(() => setSeekFeedback(null), 700)
          revealControls()
        }
      }
    }

    overlay.addEventListener('touchstart', onTouchStart, { passive: true })
    overlay.addEventListener('touchmove', onTouchMove, { passive: false })
    overlay.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      overlay.removeEventListener('touchstart', onTouchStart)
      overlay.removeEventListener('touchmove', onTouchMove)
      overlay.removeEventListener('touchend', onTouchEnd)
    }
  }, [navigate, revealControls, scheduleHide, episodes.length, slotDivRefs, videoRefs])

  // ── Active video time tracking ────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const v = videoRefs[activeSlotRef.current].current
      if (!v) return
      setCurrentTime(v.currentTime)
      setDuration(v.duration || 0)
      setPlaying(!v.paused)
    }, 250)
    return () => clearInterval(interval)
  }, [videoRefs])

  // ── Subtitle toggle sync ──────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRefs[activeSlotRef.current].current
    if (!v) return
    for (let i = 0; i < v.textTracks.length; i++) {
      v.textTracks[i].mode = subsOn && i === 0 ? 'showing' : 'hidden'
    }
  }, [subsOn, videoRefs])

  // ── Progress bar seek ─────────────────────────────────────────────────────
  const handleProgressInteraction = useCallback((clientX: number) => {
    const bar = progressBarRef.current
    const v = videoRefs[activeSlotRef.current].current
    if (!bar || !v || !v.duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    v.currentTime = ratio * v.duration
  }, [videoRefs])

  // ── Play / pause active video ─────────────────────────────────────────────
  const togglePlayPause = useCallback(() => {
    const v = videoRefs[activeSlotRef.current].current
    if (!v) return
    if (v.paused) v.play().catch(() => {}); else v.pause()
    revealControls()
  }, [videoRefs, revealControls])

  // ── Mute ─────────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const v = videoRefs[activeSlotRef.current].current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
    revealControls()
  }, [videoRefs, revealControls])

  // ── Close ─────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    videoRefs.forEach(r => r.current?.pause())
    onClose(activeEpIdx)
  }, [videoRefs, onClose, activeEpIdx])

  const ep = episodes[activeEpIdx]
  const progress = duration > 0 ? currentTime / duration : 0
  const canGoPrev = activeEpIdx > 0
  const canGoNext = activeEpIdx < episodes.length - 1
  const hasSubs = !!(ep?.subtitleList?.length)

  return (
    <div
      id="tiktok-overlay-root"
      className="fixed inset-0 z-[9999] bg-black overflow-hidden touch-none"
    >
      {/* ── 3 Stable video slots ── */}
      {([0, 1, 2] as const).map((slotId) => (
        <div
          key={slotId}
          ref={slotDivRefs[slotId]}
          className="absolute inset-0 will-change-transform"
        >
          <video
            ref={videoRefs[slotId]}
            className="w-full h-full object-contain"
            playsInline
            crossOrigin="anonymous"
            loop={false}
            onEnded={() => { if (slotId === activeSlotRef.current && canGoNext) navigate(1) }}
          />
        </div>
      ))}

      {/* ── Seek feedback ── */}
      {seekFeedback && (
        <SeekFeedback key={seekFeedback.key} side={seekFeedback.side} visible />
      )}

      {/* ── Controls overlay ── */}
      <div
        className={`absolute inset-0 flex flex-col pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Top bar */}
        <div
          className="pointer-events-auto flex items-center justify-between px-4 pt-safe"
          style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
        >
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm drop-shadow">
              Tập {ep?.episodeNo ?? '…'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Swipe hints — right edge */}
        <div className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-6">
          <button
            onClick={() => { if (canGoPrev) navigate(-1) }}
            disabled={!canGoPrev}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/35 text-white disabled:opacity-20 backdrop-blur-sm"
            aria-label="Tập trước"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => { if (canGoNext) navigate(1) }}
            disabled={!canGoNext}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/35 text-white disabled:opacity-20 backdrop-blur-sm"
            aria-label="Tập sau"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom controls */}
        <div
          className="pointer-events-auto mt-auto px-4 space-y-2"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
        >
          {/* Progress bar */}
          <div
            ref={progressBarRef}
            className="h-1 rounded-full bg-white/25 cursor-pointer relative"
            onClick={(e) => handleProgressInteraction(e.clientX)}
            onTouchStart={(e) => { e.stopPropagation(); seekingBar.current = true; handleProgressInteraction(e.touches[0].clientX) }}
            onTouchMove={(e) => { if (!seekingBar.current) return; e.stopPropagation(); handleProgressInteraction(e.touches[0].clientX) }}
            onTouchEnd={(e) => { e.stopPropagation(); seekingBar.current = false }}
          >
            <div className="h-full bg-sky-400 rounded-full" style={{ width: `${progress * 100}%` }} />
          </div>

          {/* Button row */}
          <div className="flex items-center gap-1">
            {/* Play/Pause */}
            <button onClick={togglePlayPause} className="p-2 text-white touch-manipulation">
              {playing
                ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>

            {/* Time */}
            <span className="text-white/75 text-[11px] tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Sub toggle */}
            {hasSubs && (
              <button
                onClick={() => { setSubsOn(s => !s); revealControls() }}
                className="p-2 touch-manipulation"
                style={{ color: subsOn ? '#38bdf8' : 'rgba(255,255,255,0.4)' }}
                aria-label={subsOn ? 'Tắt phụ đề' : 'Bật phụ đề'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h4M13 15h4M7 11h2M12 11h5"/>
                </svg>
              </button>
            )}

            {/* Mute */}
            <button onClick={toggleMute} className="p-2 text-white touch-manipulation">
              {muted
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              }
            </button>

            {/* Episode list button */}
            {episodes.length > 1 && (
              <button
                onClick={() => { setShowEpList(s => !s); revealControls() }}
                className="p-2 touch-manipulation"
                style={{ color: showEpList ? '#38bdf8' : 'rgba(255,255,255,0.85)' }}
                aria-label="Danh sách tập"
              >
                <List className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Episode list bottom sheet ── */}
      {episodes.length > 1 && (
        <>
          {/* Backdrop */}
          <div
            className={`absolute inset-0 z-10 transition-opacity duration-300 ${showEpList ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setShowEpList(false)}
          />
          {/* Sheet */}
          <div
            className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              background: 'rgba(18,18,18,0.97)',
              backdropFilter: 'blur(12px)',
              maxHeight: '72vh',
              transform: showEpList ? 'translateY(0)' : 'translateY(100%)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Sheet handle + header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-1 rounded-full bg-white/25 absolute left-1/2 -translate-x-1/2 top-2" />
                <span className="text-white font-semibold text-sm">Danh sách tập</span>
                <span className="text-white/40 text-xs">({episodes.length} tập)</span>
              </div>
              <button
                onClick={() => setShowEpList(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Episode grid */}
            <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(72vh - 56px)' }}>
              <EpisodeGroupTabs
                shortPlayId={shortPlayId}
                episodes={episodes}
                currentEpisodeId={ep?.episodeId}
                onEpisodeSelect={(selected) => {
                  const idx = episodes.findIndex(e => e.episodeId === selected.episodeId)
                  if (idx >= 0) navigateTo(idx)
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AutoNextOverlayProps {
  nextEpisodeNo: number
  cover: string
  onConfirm: () => void
  onCancel: () => void
  /** Countdown giây, default = 2 */
  countdown?: number
}

export default function AutoNextOverlay({
  nextEpisodeNo,
  cover,
  onConfirm,
  onCancel,
  countdown = 2,
}: AutoNextOverlayProps) {
  const [remaining, setRemaining] = useState(countdown)

  useEffect(() => {
    if (remaining <= 0) {
      onConfirm()
      return
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining, onConfirm])

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-background/90 backdrop-blur-sm border-t border-border p-3">
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-14 aspect-[2/3] rounded overflow-hidden bg-muted shrink-0">
          <img src={cover} alt={`Tập ${nextEpisodeNo}`} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Tiếp theo</p>
          <p className="text-sm font-medium text-foreground">Tập {nextEpisodeNo}</p>
          <p
            className="text-2xl font-bold text-primary mt-0.5"
            aria-live="polite"
            aria-label={`Tự động chuyển sau ${remaining} giây`}
          >
            {remaining}s
          </p>
        </div>

        {/* Cancel */}
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="shrink-0 gap-1"
          aria-label="Hủy tự động chuyển tập"
        >
          <X className="w-3.5 h-3.5" />
          Hủy
        </Button>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { History } from 'lucide-react'
import { usePersonalStore } from '@/stores/usePersonalStore'
import FilmCard from '@/components/FilmCard'

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xem'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return new Date(isoString).toLocaleDateString('vi-VN')
}

export default function HistoryPage() {
  const history = usePersonalStore((s) => s.history)

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <History className="w-12 h-12 text-muted-foreground" strokeWidth={1} />
        <p className="text-muted-foreground text-sm">Chưa có lịch sử xem</p>
        <Link
          to="/"
          className="text-sm text-primary hover:underline"
        >
          Khám phá phim →
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      <h1 className="text-base font-semibold text-foreground py-4">
        Lịch sử xem ({history.length})
      </h1>

      <div className="grid grid-cols-2 gap-3">
        {history.map((item) => (
          <div key={item.shortPlayId} className="flex flex-col">
            <FilmCard
              shortPlayId={item.shortPlayId}
              shortPlayName={item.shortPlayName}
              shortPlayCover={item.shortPlayCover}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              {relativeTime(item.lastWatchedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

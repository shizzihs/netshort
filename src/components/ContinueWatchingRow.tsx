import { Link } from 'react-router-dom'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { usePersonalStore } from '@/stores/usePersonalStore'

export default function ContinueWatchingRow() {
  const history = usePersonalStore((s) => s.history)
  const progress = usePersonalStore((s) => s.progress)

  // Chỉ hiển thị phim có progress
  const continueItems = history
    .filter((h) => !!progress[h.shortPlayId])
    .slice(0, 20)

  if (continueItems.length === 0) return null

  return (
    <section className="mt-4">
      <h2 className="px-4 text-sm font-semibold text-foreground mb-2">
        Tiếp tục xem
      </h2>
      <ScrollArea className="w-full">
        <div className="flex gap-2 px-4 pb-2">
          {continueItems.map((item) => {
            const ep = progress[item.shortPlayId]
            return (
              <Link
                key={item.shortPlayId}
                to={`/watch/${item.shortPlayId}/${ep.episodeId}`}
                className="w-20 shrink-0 group block active:scale-[0.97] transition-transform"
                aria-label={item.shortPlayName}
              >
                <div className="relative w-20 aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={item.shortPlayCover}
                    alt={item.shortPlayName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                    <div
                      className="h-full bg-primary"
                      style={{ width: '40%' }}
                    />
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">
                  Tập {ep.episodeNo}
                </p>
              </Link>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}

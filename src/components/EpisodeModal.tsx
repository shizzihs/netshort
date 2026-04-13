import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import EpisodeGroupTabs from '@/components/EpisodeGroupTabs'
import type { EpisodeInfo } from '@/types'

interface EpisodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortPlayId: string
  episodes: EpisodeInfo[]
  currentEpisodeId?: string
  onEpisodeSelect: (episode: EpisodeInfo) => void
}

export default function EpisodeModal({
  open,
  onOpenChange,
  shortPlayId,
  episodes,
  currentEpisodeId,
  onEpisodeSelect,
}: EpisodeModalProps) {
  const handleSelect = (episode: EpisodeInfo) => {
    onOpenChange(false)
    onEpisodeSelect(episode)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-xl max-h-[70vh] flex flex-col p-0"
      >
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <SheetTitle className="text-sm font-semibold text-left">
            Danh sách tập
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable episode list — scroll bên trong không dismiss modal */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          <EpisodeGroupTabs
            shortPlayId={shortPlayId}
            episodes={episodes}
            currentEpisodeId={currentEpisodeId}
            onEpisodeSelect={handleSelect}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { groupEpisodes } from '@/lib/groupEpisodes'
import type { EpisodeInfo } from '@/types'

interface EpisodeGroupTabsProps {
  shortPlayId: string
  episodes: EpisodeInfo[]
  currentEpisodeId?: string
  onEpisodeSelect?: (episode: EpisodeInfo) => void
}

export default function EpisodeGroupTabs({
  shortPlayId,
  episodes,
  currentEpisodeId,
  onEpisodeSelect,
}: EpisodeGroupTabsProps) {
  const navigate = useNavigate()
  const groups = groupEpisodes(episodes)

  const currentGroupIndex = currentEpisodeId
    ? Math.max(0, groups.findIndex((g) =>
        g.episodes.some((ep) => ep.episodeId === currentEpisodeId),
      ))
    : 0
  const defaultGroup = groups[currentGroupIndex]?.label ?? groups[0]?.label ?? ''
  const [activeGroup, setActiveGroup] = useState(defaultGroup)

  if (groups.length === 0) return null

  return (
    <Tabs value={activeGroup} onValueChange={setActiveGroup}>
      {groups.length > 1 && (
        <TabsList className="w-full justify-start overflow-x-auto h-auto bg-transparent gap-1.5 mb-3 px-0">
          {groups.map((group) => (
            <TabsTrigger
              key={group.label}
              value={group.label}
              className={cn(
                'shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors',
                'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                'data-[state=inactive]:bg-white/10 data-[state=inactive]:text-white/60',
                'data-[state=inactive]:hover:bg-white/20 data-[state=inactive]:hover:text-white',
              )}
            >
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>
      )}

      {groups.map((group) => (
        <TabsContent key={group.label} value={group.label} className="mt-0">
          <div className="grid grid-cols-5 gap-2">
            {group.episodes.map((ep) => {
              const isCurrent = ep.episodeId === currentEpisodeId
              return (
                <button
                  key={ep.episodeId}
                  onClick={() => {
                    if (onEpisodeSelect) {
                      onEpisodeSelect(ep)
                    } else {
                      navigate(`/watch/${shortPlayId}/${ep.episodeId}`)
                    }
                  }}
                  aria-label={`Tập ${ep.episodeNo}`}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={cn(
                    'flex items-center justify-center min-h-[40px] rounded-lg text-sm font-semibold transition-colors',
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'bg-white/10 text-white hover:bg-white/20',
                  )}
                >
                  {ep.episodeNo}
                </button>
              )
            })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

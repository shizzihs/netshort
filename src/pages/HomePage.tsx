import { useState } from 'react'
import { useTabs, useTabContent } from '../hooks/useTabs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import FilmGrid, { FilmGridSkeleton } from '@/components/FilmGrid'
import HeroSection, { HeroSkeleton } from '@/components/HeroSection'
import ContinueWatchingRow from '@/components/ContinueWatchingRow'
import { useProvider } from '@/contexts/ProviderContext'
import type { Film } from '@/types'

function extractFilms(data: unknown): Film[] {
  if (!data) return []
  if (Array.isArray(data)) {
    const films: Film[] = []
    for (const group of data) {
      const g = group as Record<string, unknown>
      if (Array.isArray(g?.contentInfos)) {
        films.push(...(g.contentInfos as Film[]))
      } else if (typeof (g as unknown as Film)?.shortPlayId === 'string') {
        films.push(g as unknown as Film)
      }
    }
    return films.length > 0 ? films : (data as Film[])
  }
  const d = data as Record<string, unknown>
  if (Array.isArray(d?.contentInfos)) return d.contentInfos as Film[]
  if (Array.isArray(d?.dataList)) return d.dataList as Film[]
  return []
}

export default function HomePage() {
  const { provider } = useProvider()
  const { data: tabsData, isLoading: tabsLoading } = useTabs()
  const tabs = Array.isArray(tabsData) ? tabsData : (tabsData as Record<string, unknown>)?.dataList ?? []
  const tabList = (tabs as Array<{ id?: string; tabId?: string; name?: string; tabName?: string; isGroup?: boolean }>)
    .filter((tab) => tab.isGroup === true)

  const firstTabId = tabList[0]?.id ?? tabList[0]?.tabId ?? ''
  const [activeTabId, setActiveTabId] = useState<string>('')

  const effectiveTabId = activeTabId || firstTabId

  const { data: tabContent, isLoading: contentLoading } = useTabContent(effectiveTabId || null)
  const films = extractFilms(tabContent)

  const heroFilm = films[0] ?? null
  const gridFilms = films.slice(1)

  return (
    <div className="pb-2">
      {contentLoading ? (
        <HeroSkeleton />
      ) : heroFilm ? (
        <HeroSection film={heroFilm} />
      ) : null}

      <ContinueWatchingRow />

      {tabsLoading ? (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-16 rounded-full bg-muted shrink-0 animate-pulse" />
          ))}
        </div>
      ) : tabList.length > 0 ? (
        <Tabs
          key={provider}
          value={effectiveTabId}
          onValueChange={setActiveTabId}
          className="mt-3"
        >
          <TabsList className="w-full justify-start overflow-x-auto h-auto px-4 bg-transparent gap-1 rounded-none border-b border-border pb-0">
            {tabList.map((tab) => {
              const id = tab.id ?? tab.tabId ?? ''
              const name = tab.name ?? tab.tabName ?? 'Tab'
              return (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="shrink-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary pb-2 text-sm"
                >
                  {name}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {tabList.map((tab) => {
            const id = tab.id ?? tab.tabId ?? ''
            return (
              <TabsContent key={id} value={id} className="mt-0 px-3 pt-3">
                {contentLoading ? (
                  <FilmGridSkeleton variant="compact" count={9} />
                ) : (
                  <FilmGrid films={gridFilms} variant="compact" />
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      ) : null}
    </div>
  )
}

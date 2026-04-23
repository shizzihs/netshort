import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import FilmGrid, { FilmGridSkeleton } from '@/components/FilmGrid'
import Pagination from '@/components/Pagination'
import { useCategories, useCategoryFilms, useReelShortCategories, useReelShortCategoryFilms } from '../hooks/useCategories'
import { useProvider } from '@/contexts/ProviderContext'
import type { Film } from '@/types'

interface Tag {
  labelLanguageId: number | null
  labelName: string
  newLabelIdList?: string[]
}

function extractTags(data: unknown): Tag[] {
  if (!data) return []
  const d = data as Record<string, unknown>
  if (Array.isArray(d?.tag)) return d.tag as Tag[]
  if (Array.isArray(d?.dataList)) return d.dataList as Tag[]
  if (Array.isArray(data)) return data as Tag[]
  return []
}

export default function CategoryPage() {
  const { isReelShort } = useProvider()

  const [page, setPage] = useState(1)
  const [rsTab, setRsTab] = useState('44385')
  const [nextCursor, setNextCursor] = useState<number | null>(null)

  useEffect(() => {
    setPage(1)
    setNextCursor(null)
  }, [isReelShort])

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const tags = extractTags(categoriesData)

  // NetShort: page 1 uses plain offset; page 2+ uses maxOffset cursor
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const { data: categoryData, isLoading: filmsLoading } = useCategoryFilms(
    selectedTagIds,
    (page - 1) * 20,
    20,
    page > 1 ? nextCursor ?? undefined : undefined,
    !isReelShort,
  )

  // ReelShort state
  const { data: rsCategoriesData, isLoading: rsCategoriesLoading } = useReelShortCategories(isReelShort)
  const rsTabList: Array<{ tab_id: string; tab_name: string }> =
    (rsCategoriesData as { tab_list?: Array<{ tab_id: string; tab_name: string }> })?.tab_list ?? []
  const { data: rsFilmsData, isLoading: rsFilmsLoading } = useReelShortCategoryFilms(rsTab, (page - 1) * 20, 20, isReelShort)

  // Derive display data from active provider
  const loading = isReelShort ? rsFilmsLoading : filmsLoading
  const categoryLoading = isReelShort ? rsCategoriesLoading : categoriesLoading

  // NetShort
  const films: Film[] = Array.isArray(categoryData?.dataList) ? categoryData.dataList : []
  const hasMore = categoryData?.completed === false
  const maxOffset = (categoryData as { maxOffset?: number })?.maxOffset

  // ReelShort
  const rsFilms: Film[] = Array.isArray((rsFilmsData as { contentInfos?: Film[] })?.contentInfos)
    ? (rsFilmsData as { contentInfos: Film[] }).contentInfos
    : []
  const rsHasMore = false

  const displayFilms = isReelShort ? rsFilms : films
  const displayHasMore = isReelShort ? rsHasMore : hasMore

  const handleTagSelect = (tagIds: string[]) => {
    setSelectedTagIds(tagIds)
    setPage(1)
    setNextCursor(null)
  }

  const handleRsTabSelect = (tabId: string) => {
    setRsTab(tabId)
    setPage(1)
  }

  const handlePageChange = (p: number) => {
    if (p === page + 1 && maxOffset !== undefined) {
      // Sequential forward: use maxOffset cursor
      setNextCursor(maxOffset)
    } else {
      // Backward or jump: plain offset is reliable
      setNextCursor(null)
    }
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="pb-4">
      <h1 className="sr-only">Thể loại phim</h1>

      {/* Tag filter — ReelShort uses tab_list, NetShort uses /categories */}
      <div className="sticky top-0 z-30 bg-background pt-3 pb-2 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {categoryLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-muted shrink-0 animate-pulse" />
            ))
          ) : isReelShort ? (
            rsTabList.map((tab) => {
              const isActive = tab.tab_id === rsTab
              return (
                <button
                  key={tab.tab_id}
                  onClick={() => handleRsTabSelect(tab.tab_id)}
                  className={cn(
                    'shrink-0 px-4 h-8 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.tab_name}
                </button>
              )
            })
          ) : (
            tags.map((tag) => {
              const tagIds = tag.labelLanguageId === -1 ? [] : (tag.newLabelIdList ?? [])
              const isActive = JSON.stringify(tagIds) === JSON.stringify(selectedTagIds)

              return (
                <button
                  key={tag.labelName}
                  onClick={() => handleTagSelect(tagIds)}
                  className={cn(
                    'shrink-0 px-4 h-8 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tag.labelName}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Film grid */}
      <div className="px-4 mt-2">
        {loading ? (
          <FilmGridSkeleton count={6} />
        ) : displayFilms.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground text-sm">
            Chưa có phim trong thể loại này
          </p>
        ) : (
          <FilmGrid films={displayFilms} />
        )}
      </div>

      {!loading && displayFilms.length > 0 && (page > 1 || displayHasMore) && (
        <Pagination
          page={page}
          hasNext={displayHasMore}
          onPageChange={handlePageChange}
          totalPages={undefined}
        />
      )}
    </div>
  )
}
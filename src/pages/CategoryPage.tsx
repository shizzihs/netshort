import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import FilmGrid, { FilmGridSkeleton } from '@/components/FilmGrid'
import Pagination from '@/components/Pagination'
import { useCategories, useCategoryFilms, useReelShortCategories, useReelShortCategoryFilms } from '../hooks/useCategories'
import { getCategoryFilms } from '../api/categories'
import { useProvider } from '@/contexts/ProviderContext'
import { getStoredProvider } from '@/contexts/ProviderContext'
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

const SESSION_KEY = 'categoryPage:cursors'

function loadCursorMap(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function saveCursorMap(map: Record<string, number>) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(map))
  } catch {
    // sessionStorage unavailable (private browsing, quota exceeded)
  }
}

export default function CategoryPage() {
  const { isReelShort } = useProvider()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // All filter/pagination state lives in the URL — back/forward works for free
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const rsTab = searchParams.get('tab') ?? '44385'
  const selectedTagIds = searchParams.get('tags')
    ? searchParams.get('tags')!.split(',').filter(Boolean)
    : []

  // Cursor map persisted to sessionStorage so it survives navigation away and back.
  // Keys are scoped by filter context to avoid cross-filter cursor reuse.
  const [cursorMap, setCursorMap] = useState<Record<string, number>>(loadCursorMap)

  useEffect(() => {
    saveCursorMap(cursorMap)
  }, [cursorMap])

  const filterKey = `${isReelShort}:${rsTab}:${selectedTagIds.join(',')}`
  const cursorOffset = page > 1 ? cursorMap[`${filterKey}:${page}`] : undefined

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const tags = extractTags(categoriesData)

  const { data: categoryData, isLoading: filmsLoading } = useCategoryFilms(
    selectedTagIds,
    (page - 1) * 20,
    20,
    cursorOffset,
    !isReelShort,
  )

  const { data: rsCategoriesData, isLoading: rsCategoriesLoading } = useReelShortCategories(isReelShort)
  const rsTabList: Array<{ tab_id: string; tab_name: string }> =
    (rsCategoriesData as { tab_list?: Array<{ tab_id: string; tab_name: string }> })?.tab_list ?? []
  const { data: rsFilmsData, isLoading: rsFilmsLoading } = useReelShortCategoryFilms(rsTab, (page - 1) * 20, 20, isReelShort)

  const loading = isReelShort ? rsFilmsLoading : filmsLoading
  const categoryLoading = isReelShort ? rsCategoriesLoading : categoriesLoading

  const films: Film[] = Array.isArray(categoryData?.dataList) ? categoryData.dataList : []
  const hasMore = categoryData?.completed === false
  const maxOffset = (categoryData as { maxOffset?: number })?.maxOffset

  const rsFilms: Film[] = Array.isArray((rsFilmsData as { contentInfos?: Film[] })?.contentInfos)
    ? (rsFilmsData as { contentInfos: Film[] }).contentInfos
    : []

  const displayFilms = isReelShort ? rsFilms : films
  const displayHasMore = isReelShort ? false : hasMore

  const handleTagSelect = (tagIds: string[]) => {
    setSearchParams(
      tagIds.length ? { tags: tagIds.join(','), page: '1' } : { page: '1' },
      { replace: false },
    )
  }

  const handleRsTabSelect = (tabId: string) => {
    setSearchParams({ tab: tabId, page: '1' }, { replace: false })
  }

  const handlePageChange = async (targetPage: number) => {
    const workingMap = { ...cursorMap }

    // Store current page's maxOffset as cursor for the next page
    if (maxOffset !== undefined) {
      workingMap[`${filterKey}:${page + 1}`] = maxOffset
    }

    // When jumping forward by more than 1 page, pre-fetch each intermediate page
    // sequentially to build up the cursor chain
    if (!isReelShort && targetPage > page + 1) {
      const provider = getStoredProvider()
      for (let p = page + 1; p < targetPage; p++) {
        const cursorForP = workingMap[`${filterKey}:${p}`]
        if (cursorForP === undefined) break  // can't proceed without cursor

        try {
          const data = await queryClient.fetchQuery({
            queryKey: ['category-films', provider, selectedTagIds, cursorForP, 20],
            queryFn: () => getCategoryFilms(selectedTagIds, cursorForP, 20),
            staleTime: 5 * 60 * 1000,
          })
          const nextCursor = (data as { maxOffset?: number })?.maxOffset
          if (nextCursor !== undefined) {
            workingMap[`${filterKey}:${p + 1}`] = nextCursor
          } else {
            break
          }
        } catch {
          break
        }
      }
    }

    setCursorMap(workingMap)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(targetPage))
        return next
      },
      { replace: false },
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="pb-4">
      <h1 className="sr-only">Thể loại phim</h1>

      {/* Tag filter */}
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

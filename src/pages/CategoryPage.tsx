import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import FilmGrid, { FilmGridSkeleton } from '@/components/FilmGrid'
import Pagination from '@/components/Pagination'
import { useCategories, useCategoryFilms } from '../hooks/useCategories'
import type { Film } from '@/types'

const PAGE_SIZE = 20

interface Tag {
  labelLanguageId: number | null
  labelName: string
  valueEn?: string
  newLabelIdList?: string[] | null
}

function extractTags(data: unknown): Tag[] {
  if (!data) return []
  const d = data as Record<string, unknown>
  if (Array.isArray(d?.tag)) return d.tag as Tag[]
  if (Array.isArray(d?.dataList)) return d.dataList as Tag[]
  if (Array.isArray(data)) return data as Tag[]
  return []
}

function extractFilms(data: unknown): { films: Film[]; completed: boolean; maxOffset: number } {
  if (!data) return { films: [], completed: true, maxOffset: 0 }
  const d = data as Record<string, unknown>
  const films = Array.isArray(d?.dataList) ? (d.dataList as Film[]) : []
  const completed = Boolean(d?.completed)
  const maxOffset = typeof d?.maxOffset === 'number' ? d.maxOffset : 0
  return { films, completed, maxOffset }
}

export default function CategoryPage() {
  const [selectedLabel, setSelectedLabel] = useState('')
  const [page, setPage] = useState(1)
  // cursors[i] = offset to send when fetching page (i+1).
  // Populated from the server's maxOffset after each successful fetch so we
  // use the server's own cursor rather than computing (page-1)*PAGE_SIZE.
  const [cursors, setCursors] = useState<number[]>([0])

  const currentOffset = cursors[page - 1] ?? (page - 1) * PAGE_SIZE

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const tags = extractTags(categoriesData)

  const selectedTag = tags.find((t) => t.labelName === selectedLabel)
  // Send all IDs in newLabelIdList — each genre groups male/female/other sub-label variants.
  // Sending all gives the full film set for that genre (tested: 11 films for "Cổ Đại").
  const tagIds: string[] =
    selectedLabel === '' ? [] : (selectedTag?.newLabelIdList?.filter(Boolean) as string[] ?? [])

  const { data: filmsData, isLoading: filmsLoading } = useCategoryFilms(tagIds, currentOffset, PAGE_SIZE)
  const { films, completed, maxOffset } = extractFilms(filmsData)

  // After each successful fetch, store the server's maxOffset as the cursor
  // for the next page so subsequent requests use the correct server-side cursor.
  useEffect(() => {
    if (filmsLoading || !filmsData) return
    if (completed) return
    const nextCursor = maxOffset > currentOffset ? maxOffset : currentOffset + PAGE_SIZE
    setCursors((prev) => {
      if (prev[page] !== undefined) return prev // already known — don't overwrite
      const next = [...prev]
      next[page] = nextCursor
      return next
    })
  }, [filmsData, filmsLoading, completed, maxOffset, currentOffset, page])

  const handleTagSelect = (labelName: string) => {
    setSelectedLabel(labelName)
    setPage(1)
    setCursors([0])
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    // Scroll to top of film list on page change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="pb-4">
      <h1 className="sr-only">Thể loại phim</h1>

      {/* Tag filter — sticky, top-0 because main already sits below header */}
      <div className="sticky top-0 z-30 bg-background pt-3 pb-2 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {categoriesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-muted shrink-0 animate-pulse" />
            ))
          ) : (
            tags.map((tag) => {
              const isAllTag = tag.labelLanguageId === -1
              const key = isAllTag ? '' : tag.labelName
              const isActive = key === selectedLabel

              return (
                <button
                  key={tag.labelName}
                  onClick={() => handleTagSelect(key)}
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
        {filmsLoading ? (
          <FilmGridSkeleton count={6} />
        ) : films.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground text-sm">
            Chưa có phim trong thể loại này
          </p>
        ) : (
          <FilmGrid films={films} />
        )}
      </div>

      {!filmsLoading && films.length > 0 && (page > 1 || (!completed && films.length >= PAGE_SIZE)) && (
        <Pagination
          page={page}
          hasNext={!completed && films.length >= PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

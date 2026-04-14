import { useState } from 'react'
import { cn } from '@/lib/utils'
import FilmGrid, { FilmGridSkeleton } from '@/components/FilmGrid'
import Pagination from '@/components/Pagination'
import { useCategories, useWebCategoryFilms } from '../hooks/useCategories'
import type { Film } from '@/types'

interface Tag {
  labelLanguageId: number | null
  labelName: string
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
  const [selectedLabel, setSelectedLabel] = useState('all-plots')
  const [page, setPage] = useState(1)

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const tags = extractTags(categoriesData)

  const { data: webData, isLoading: filmsLoading } = useWebCategoryFilms(selectedLabel, page)
  const films = (webData?.films ?? []) as Film[]
  const hasMore = webData?.hasMore ?? false
  const totalPages = webData?.totalPages ?? 0

  const handleTagSelect = (label: string) => {
    setSelectedLabel(label)
    setPage(1)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="pb-4">
      <h1 className="sr-only">Thể loại phim</h1>

      {/* Tag filter */}
      <div className="sticky top-0 z-30 bg-background pt-3 pb-2 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {categoriesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-muted shrink-0 animate-pulse" />
            ))
          ) : (
            tags.map((tag) => {
              const label = tag.labelLanguageId === -1 ? 'all-plots' : tag.labelName
              const isActive = label === selectedLabel

              return (
                <button
                  key={tag.labelName}
                  onClick={() => handleTagSelect(label)}
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

      {!filmsLoading && films.length > 0 && (page > 1 || hasMore) && (
        <Pagination
          page={page}
          hasNext={hasMore}
          onPageChange={handlePageChange}
          totalPages={totalPages > 0 ? totalPages : undefined}
        />
      )}
    </div>
  )
}

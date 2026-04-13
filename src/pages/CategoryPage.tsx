import { useState } from 'react'
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

function extractFilms(data: unknown): { films: Film[]; completed: boolean } {
  if (!data) return { films: [], completed: true }
  const d = data as Record<string, unknown>
  const films = Array.isArray(d?.dataList) ? (d.dataList as Film[]) : []
  const completed = Boolean(d?.completed)
  return { films, completed }
}

export default function CategoryPage() {
  // selectedLabel: '' = Tất cả (labelLanguageId === -1), otherwise labelName
  const [selectedLabel, setSelectedLabel] = useState('')
  const [offset, setOffset] = useState(0)

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const tags = extractTags(categoriesData)

  const selectedTag = tags.find((t) => t.labelName === selectedLabel)
  // "Tất cả" (labelLanguageId === -1) means no filter; use its newLabelIdList = []
  const tagIds: string[] =
    selectedLabel === '' ? [] : (selectedTag?.newLabelIdList?.filter(Boolean) as string[] ?? [])

  const { data: filmsData, isLoading: filmsLoading } = useCategoryFilms(tagIds, offset, PAGE_SIZE)
  const { films, completed } = extractFilms(filmsData)

  const page = Math.floor(offset / PAGE_SIZE) + 1

  const handleTagSelect = (labelName: string) => {
    setSelectedLabel(labelName)
    setOffset(0)
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
              // "Tất cả" entry has labelLanguageId === -1; treat its key as ''
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

      {!filmsLoading && films.length > 0 && (
        <Pagination
          page={page}
          hasNext={!completed && films.length >= PAGE_SIZE}
          onPageChange={(p) => setOffset((p - 1) * PAGE_SIZE)}
        />
      )}
    </div>
  )
}

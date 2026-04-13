import { useState, useEffect, useRef } from 'react'
import { X, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useSearch, useTrendingSearches } from '../hooks/useSearch'
import FilmGrid, { FilmGridSkeleton } from '@/components/FilmGrid'
import Pagination from '@/components/Pagination'
import { cn } from '@/lib/utils'
import type { Film } from '@/types'

function extractSearchFilms(data: unknown): Film[] {
  if (!data) return []
  const d = data as Record<string, unknown>
  if (Array.isArray(d?.searchCodeSearchResult)) return d.searchCodeSearchResult as Film[]
  if (Array.isArray(d?.dataList)) return d.dataList as Film[]
  if (Array.isArray(data)) return data as Film[]
  return []
}

type TrendingResult =
  | { type: 'films'; items: Film[] }
  | { type: 'keywords'; items: string[] }

function extractTrending(data: unknown): TrendingResult {
  const list: unknown[] = []

  if (Array.isArray(data)) {
    list.push(...data)
  } else {
    const d = data as Record<string, unknown>
    if (Array.isArray(d?.dataList)) list.push(...(d.dataList as unknown[]))
    else if (Array.isArray(d?.searchCodeSearchResult))
      list.push(...(d.searchCodeSearchResult as unknown[]))
  }

  if (list.length === 0) return { type: 'keywords', items: [] }

  // Detect film objects by presence of shortPlayId
  const first = list[0] as Record<string, unknown>
  if (first?.shortPlayId) {
    return { type: 'films', items: list as Film[] }
  }

  // Keyword objects
  const keywords = list.map((item) => {
    const t = item as Record<string, unknown>
    return String(t?.keyword ?? t?.searchCode ?? t?.name ?? t?.shortPlayName ?? '')
  }).filter(Boolean)
  return { type: 'keywords', items: keywords }
}

export default function SearchPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: searchData, isLoading: searching, isError } = useSearch(debouncedQuery, page)
  const { data: trendingData } = useTrendingSearches()

  const films = extractSearchFilms(searchData)
  const trending = extractTrending(trendingData)

  // Show toast on error
  useEffect(() => {
    if (isError) {
      toast.error('Không thể tải kết quả. Thử lại?', {
        action: { label: 'Thử lại', onClick: () => setDebouncedQuery((q) => q) },
      })
    }
  }, [isError])

  const handleTrendingClick = (keyword: string) => {
    setQuery(keyword)
    inputRef.current?.focus()
  }

  const hasQuery = debouncedQuery.length > 0
  const hasTrending = trending.items.length > 0

  return (
    <div className="px-4 pb-4">
      {/* Search input */}
      <div className="sticky top-0 z-30 bg-background py-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm phim..."
            className={cn(
              'w-full h-10 pl-9 pr-10 rounded-lg',
              'bg-muted border border-transparent',
              'text-foreground placeholder:text-muted-foreground',
              'text-[16px]',  // prevent auto-zoom on mobile
              'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
              'transition-colors',
            )}
            aria-label="Tìm kiếm phim"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 flex items-center justify-center w-5 h-5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Trending — hiển thị trước khi gõ */}
      {!hasQuery && hasTrending && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Xu hướng tìm kiếm</h3>
          {trending.type === 'films' ? (
            <FilmGrid films={trending.items} variant="compact" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {(trending.items as string[]).map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => handleTrendingClick(keyword)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm',
                    'bg-muted text-muted-foreground',
                    'hover:bg-primary/10 hover:text-primary',
                    'transition-colors',
                  )}
                >
                  {keyword}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {searching && <FilmGridSkeleton count={6} />}

      {hasQuery && !searching && films.length === 0 && !isError && (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-sm mb-4">
            Không tìm thấy phim nào cho "{debouncedQuery}"
          </p>
          {trending.type === 'keywords' && trending.items.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-3">Thử tìm kiếm:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {(trending.items as string[]).slice(0, 5).map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => handleTrendingClick(keyword)}
                    className="px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground hover:text-primary transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {hasQuery && !searching && films.length > 0 && (
        <FilmGrid films={films} />
      )}

      {hasQuery && !searching && films.length > 0 && (
        <Pagination
          page={page}
          hasNext={films.length >= 20}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

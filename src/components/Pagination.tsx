import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  hasNext: boolean
  onPageChange: (page: number) => void
  /** Estimated total pages (optional — omit if unknown) */
  totalPages?: number
}

/** Generates the page number sequence to display, e.g. [1,2,3,'…',143] */
function buildPages(current: number, total: number | undefined): (number | '…')[] {
  const pages: (number | '…')[] = []

  if (!total) {
    // Unknown total: show a sliding window of 5 around current
    const start = Math.max(1, current - 2)
    const end = current + 2
    if (start > 1) { pages.push(1); if (start > 2) pages.push('…') }
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  if (total <= 7) {
    for (let p = 1; p <= total; p++) pages.push(p)
    return pages
  }

  pages.push(1)

  if (current <= 4) {
    for (let p = 2; p <= Math.min(6, total - 1); p++) pages.push(p)
    pages.push('…')
  } else if (current >= total - 3) {
    pages.push('…')
    for (let p = Math.max(total - 5, 2); p <= total - 1; p++) pages.push(p)
  } else {
    pages.push('…')
    for (let p = current - 1; p <= current + 1; p++) pages.push(p)
    pages.push('…')
  }

  pages.push(total)
  return pages
}

export default function Pagination({ page, hasNext, onPageChange, totalPages }: PaginationProps) {
  const pages = buildPages(page, totalPages)
  const hasPrev = page > 1

  const btnBase =
    'flex items-center justify-center h-9 min-w-[36px] rounded-lg text-sm font-medium transition-colors select-none'

  return (
    <nav
      className="flex items-center justify-center gap-1 mt-6 pb-4"
      aria-label="Phân trang"
    >
      {/* Prev */}
      <button
        onClick={() => hasPrev && onPageChange(page - 1)}
        disabled={!hasPrev}
        aria-label="Trang trước"
        className={cn(
          btnBase,
          'px-2',
          hasPrev
            ? 'text-foreground hover:bg-muted'
            : 'text-muted-foreground/40 cursor-not-allowed',
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === '…' ? (
          <span
            key={`ellipsis-${i}`}
            className="flex items-center justify-center h-9 px-1 text-sm text-muted-foreground select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              btnBase,
              'px-2.5',
              p === page
                ? 'bg-primary text-primary-foreground pointer-events-none'
                : 'text-foreground hover:bg-muted',
            )}
          >
            {p}
          </button>
        ),
      )}

      {/* Next */}
      <button
        onClick={() => hasNext && onPageChange(page + 1)}
        disabled={!hasNext}
        aria-label="Trang sau"
        className={cn(
          btnBase,
          'px-2',
          hasNext
            ? 'text-foreground hover:bg-muted'
            : 'text-muted-foreground/40 cursor-not-allowed',
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}

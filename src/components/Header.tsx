import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'

export default function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Hiển thị back button khi đang ở FilmDetailPage (/film/*)
  const isFilmDetail = pathname.startsWith('/film/')

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center px-4">
      {isFilmDetail ? (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-foreground hover:bg-muted transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      ) : (
        <img
          src="/favicon.svg"
          alt="NetShort"
          className="h-7 w-auto select-none"
          draggable={false}
        />
      )}

      <div className="flex-1" />

      <button
        onClick={() => navigate('/search')}
        className="flex items-center justify-center w-10 h-10 -mr-2 rounded-full text-foreground hover:bg-muted transition-colors"
        aria-label="Tìm kiếm"
      >
        <Search className="w-5 h-5" />
      </button>
    </header>
  )
}

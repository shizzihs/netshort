import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProviderContextProvider } from './contexts/ProviderContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import FilmDetailPage from './pages/FilmDetailPage'
import CategoryPage from './pages/CategoryPage'
import HistoryPage from './pages/HistoryPage'
import FavoritesPage from './pages/FavoritesPage'

// Lazy load WatchPage — plyr (~200KB) chỉ tải khi cần
const WatchPage = lazy(() => import('./pages/WatchPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProviderContextProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/film/:shortPlayId" id="film-detail" element={<FilmDetailPage />} />
            <Route
              path="/watch/:shortPlayId/:episodeId"
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-dvh bg-black text-muted-foreground text-sm">Đang tải...</div>}>
                  <WatchPage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
      </ProviderContextProvider>
    </QueryClientProvider>
  )
}

export default App

import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'

export default function Layout() {
  const { pathname } = useLocation()

  // BottomNav ẩn hoàn toàn trên WatchPage — không render vào DOM
  const isWatchPage = pathname.startsWith('/watch/')

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <Header />

      <main
        className="flex-1 overflow-y-auto"
        // Padding bottom để tránh content bị BottomNav che
        style={{ paddingBottom: isWatchPage ? 0 : 'calc(56px + env(safe-area-inset-bottom))' }}
      >
        <Outlet />
      </main>

      {!isWatchPage && <BottomNav />}
    </div>
  )
}

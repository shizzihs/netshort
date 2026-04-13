import { NavLink } from 'react-router-dom'
import { Home, Clapperboard, Search, Heart, History } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/categories', icon: Clapperboard, label: 'Thể loại', end: false },
  { to: '/search', icon: Search, label: 'Tìm kiếm', end: false },
  { to: '/favorites', icon: Heart, label: 'Yêu thích', end: false },
  { to: '/history', icon: History, label: 'Lịch sử', end: false },
] as const

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 w-full min-h-[56px] px-1 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
              aria-label={label}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

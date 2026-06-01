import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'

export default function CustomerLayout() {
  const { language } = useAuthStore()
  const t = useT(language)

  const NAV = [
    { to: '/shop',         icon: '🌾', label: t.nav.shop,     end: true },
    { to: '/shop/orders',  icon: '📋', label: t.nav.myOrders, end: false },
    { to: '/shop/profile', icon: '👤', label: t.nav.profile,  end: false },
  ]

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--gvr-surface)' }}>
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between"
              style={{ background: 'var(--gvr-green)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🌾</span>
          <div>
            <p className="text-white text-sm font-semibold leading-none">{t.appName}</p>
            <p className="text-white/60 text-xs">గ్రీన్ విలేజ్ రైస్</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-gray-100 flex">
        {NAV.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

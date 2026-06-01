import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'

const NAV = [
  { to: '/owner',            icon: '⊞', key: 'home' as const },
  { to: '/owner/orders',     icon: '📋', key: 'orders' as const },
  { to: '/owner/inventory',  icon: '📦', key: 'inventory' as const },
  { to: '/owner/customers',  icon: '👥', key: 'customers' as const },
  { to: '/owner/analytics',  icon: '📊', key: 'analytics' as const },
]

export default function OwnerLayout() {
  const { user, logout, language, setLanguage } = useAuthStore()
  const t = useT(language)
  const navigate = useNavigate()

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--gvr-surface)' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-white border-r border-gray-100">
        {/* Brand */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                 style={{ background: 'var(--gvr-green)' }}>🌾</div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>GVR</p>
              <p className="text-xs text-gray-400">Owner Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/owner'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-base">{icon}</span>
              <span>{t.nav[key]}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {/* Language toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-gray-50 mb-2">
            {(['en', 'te'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className="flex-1 py-1 text-xs font-medium rounded-md transition-all"
                style={{
                  background: language === l ? 'var(--gvr-green)' : 'transparent',
                  color: language === l ? 'white' : '#6B7280'
                }}
              >
                {l === 'en' ? 'EN' : 'తె'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                 style={{ background: 'var(--gvr-green-light)', color: 'var(--gvr-green-dark)' }}>
              {user?.name?.[0] || user?.phone?.slice(-2) || 'O'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{user?.name || 'Owner'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.phone}</p>
            </div>
          </div>
          <button onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all">
            ↩ {t.profile.logout}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

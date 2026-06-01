import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'

export default function DeliveryLayout() {
  const { logout, language, user } = useAuthStore()
  const t = useT(language)
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--gvr-surface)' }}>
      <header className="px-4 py-3 flex items-center justify-between"
              style={{ background: 'var(--gvr-green)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🚚</span>
          <div>
            <p className="text-white text-sm font-semibold">{t.delivery.title}</p>
            <p className="text-white/60 text-xs">{user?.name || user?.phone}</p>
          </div>
        </div>
        <button
          onClick={async () => { await logout(); navigate('/login') }}
          className="text-white/70 hover:text-white text-sm"
        >
          ↩ {t.profile.logout}
        </button>
      </header>
      <main className="flex-1">
        <div className="page-enter"><Outlet /></div>
      </main>
    </div>
  )
}

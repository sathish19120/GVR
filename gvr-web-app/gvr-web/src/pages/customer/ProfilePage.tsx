import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const { user, logout, language, setLanguage } = useAuthStore()
  const t = useT(language)
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveName() {
    if (!user) return
    setSaving(true)
    await supabase.from('users').update({ name }).eq('id', user.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="p-4 space-y-4 max-w-sm mx-auto">
      <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>{t.profile.title}</h2>

      {/* Avatar */}
      <div className="flex flex-col items-center py-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold mb-3"
             style={{ background: 'var(--gvr-green-light)', color: 'var(--gvr-green-dark)', border: '3px solid var(--gvr-green)' }}>
          {user?.name?.[0] || user?.phone?.slice(-2) || '🌾'}
        </div>
        <p className="font-medium text-gray-800">{user?.name || 'Customer'}</p>
        <p className="text-sm text-gray-500">{user?.phone}</p>
      </div>

      {/* Edit name */}
      <div className="card space-y-3">
        <p className="text-sm font-medium text-gray-700">Name</p>
        <input className="input" value={name} onChange={e => setName(e.target.value)}
               placeholder="Enter your name" />
        <button className="btn-primary text-sm w-full" onClick={saveName} disabled={saving}>
          {saved ? '✓ Saved!' : saving ? 'Saving…' : t.common.save}
        </button>
      </div>

      {/* Language */}
      <div className="card">
        <p className="text-sm font-medium text-gray-700 mb-3">{t.profile.language}</p>
        <div className="flex gap-2">
          {(['en', 'te'] as const).map(l => (
            <button key={l} onClick={() => setLanguage(l)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: language === l ? 'var(--gvr-green)' : '#F3F4F6',
                      color: language === l ? 'white' : '#6B7280'
                    }}>
              {l === 'en' ? '🇬🇧 English' : '🇮🇳 తెలుగు'}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
              className="w-full py-3 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-sm font-medium transition-all">
        ↩ {t.profile.logout}
      </button>
    </div>
  )
}

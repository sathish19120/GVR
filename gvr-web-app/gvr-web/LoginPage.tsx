cat > src/pages/LoginPage.tsx << 'ENDOFFILE'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const { sendOTP, loading, error, clearError, language } = useAuthStore()
  const navigate = useNavigate()

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) return
    try {
      await sendOTP(email)
      navigate('/otp', { state: { email } })
    } catch {}
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--gvr-surface)' }}>
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12"
           style={{ background: 'var(--gvr-green)' }}>
        <div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl mb-8">🌾</div>
          <h1 className="font-display text-white text-4xl font-semibold leading-tight mb-4">
            Green Village<br/>Rice
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            గ్రీన్ విలేజ్ రైస్<br/>
            Farm-fresh Sona Masoori<br/>delivered to your door.
          </p>
        </div>
        <div className="space-y-3">
          {['Direct from Telangana farms', 'Freshness date on every pack', 'Telugu + English support'].map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <span className="text-white/80 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                 style={{ background: 'var(--gvr-green)' }}>🌾</div>
            <div>
              <p className="font-display text-lg font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>Green Village Rice</p>
              <p className="text-xs text-gray-500">గ్రీన్ విలేజ్ రైస్</p>
            </div>
          </div>

          <h2 className="text-2xl font-display font-semibold mb-1" style={{ color: 'var(--gvr-text)' }}>
            {language === 'te' ? 'స్వాగతం' : 'Welcome back'}
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            {language === 'te' ? 'మీ ఇమెయిల్ నమోదు చేయండి' : 'Enter your email to receive a login code'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-600 ml-2">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {language === 'te' ? 'ఇమెయిల్ చిరునామా' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value.trim())}
                placeholder="you@example.com"
                className="input w-full"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !isValidEmail(email)}
              className="btn-primary w-full"
            >
              {loading
                ? (language === 'te' ? 'పంపుతోంది…' : 'Sending code…')
                : (language === 'te' ? 'కోడ్ పంపండి' : 'Send Login Code →')}
            </button>
          </form>

          <div className="mt-6 p-3 rounded-xl bg-green-50 border border-green-100">
            <p className="text-xs text-green-700 text-center">
              📧 A 6-digit code will be sent to your email inbox
            </p>
          </div>

          <p className="mt-4 text-xs text-center text-gray-400">
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
ENDOFFILE
echo "LoginPage.tsx written"

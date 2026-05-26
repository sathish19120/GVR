import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [message, setMessage] = useState('')
  const { loading, error, clearError, language, signIn, resetPassword } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setMessage('')
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate('/')
      } else {
        await resetPassword(email)
        setMessage('Password reset link sent to your email.')
      }
    } catch {}
  }

  const features = [
    'Direct from Telangana farms',
    'Freshness date on every pack',
    'Telugu + English support'
  ]

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--gvr-surface)' }}>

      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12"
           style={{ background: 'var(--gvr-green)' }}>
        <div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl mb-8">🌾</div>
          <h1 className="font-display text-white text-4xl font-semibold leading-tight mb-4">
            Green Village<br />Rice
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            గ్రీన్ విలేజ్ రైస్<br />
            Farm-fresh Sona Masoori<br />delivered to your door.
          </p>
        </div>
        <div className="space-y-3">
          {features.map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/80 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                 style={{ background: 'var(--gvr-green)' }}>🌾</div>
            <div>
              <p className="font-display text-lg font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>Green Village Rice</p>
              <p className="text-xs text-gray-500">గ్రీన్ విలేజ్ రైస్</p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-display font-semibold mb-1" style={{ color: 'var(--gvr-text)' }}>
            {mode === 'login' ? (language === 'te' ? 'స్వాగతం' : 'Welcome back') : 'Reset password'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {mode === 'login' ? 'Sign in to your GVR account' : 'Enter your email to get a reset link'}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0">✕</button>
            </div>
          )}

          {/* Success message */}
          {message && (
            <div className="mb-4 p-3 rounded-xl border text-sm"
                 style={{ background: 'var(--gvr-green-light)', borderColor: '#97C459', color: 'var(--gvr-green-dark)' }}>
              ✓ {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {language === 'te' ? 'ఇమెయిల్' : 'Email Address'}
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

            {mode === 'login' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'te' ? 'పాస్‌వర్డ్' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); clearError(); setMessage('') }}
                    className="text-xs hover:underline"
                    style={{ color: 'var(--gvr-green)' }}
                  >
                    {language === 'te' ? 'పాస్‌వర్డ్ మర్చిపోయారా?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input w-full pr-16"
                    required
                    minLength={6}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading
                ? (language === 'te' ? 'వేచి ఉండండి…' : 'Please wait…')
                : mode === 'login'
                  ? (language === 'te' ? 'లాగిన్ →' : 'Login →')
                  : 'Send Reset Link →'
              }
            </button>
          </form>

          {mode === 'forgot' && (
            <button
              onClick={() => { setMode('login'); clearError(); setMessage('') }}
              className="w-full text-sm text-center mt-4 hover:underline"
              style={{ color: 'var(--gvr-green)' }}
            >
              ← Back to login
            </button>
          )}

          <p className="mt-6 text-xs text-center text-gray-400">
            Green Village Rice · గ్రీన్ విలేజ్ రైస్
          </p>
        </div>
      </div>
    </div>
  )
}

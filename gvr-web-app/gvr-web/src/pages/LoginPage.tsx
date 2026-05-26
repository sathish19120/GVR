import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const { loading, error, clearError, signIn, signUp, resetPassword } = useAuthStore()
  const navigate = useNavigate()

  const reset = () => {
    clearError()
    setMessage('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setName('')
  }

  const switchMode = (m: typeof mode) => { reset(); setMode(m) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setMessage('')
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate('/')
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          clearError()
          setMessage('')
          return
        }
        await signUp(email, password, name)
        setMessage('Account created! You can now login.')
        switchMode('login')
      } else {
        await resetPassword(email)
        setMessage('Reset link sent! Check your email.')
      }
    } catch {}
  }

  const eyeIcon = (show: boolean) => show
    ? <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #3B6D11 0%, #27500A 50%, #173404 100%)',
      padding: '24px',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '28px',
        border: '1px solid rgba(255,255,255,0.15)',
        padding: '40px 36px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 14px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>🌾</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '1px' }}>
            GREEN VILLAGE RICE
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0 }}>
            గ్రీన్ విలేజ్ రైస్
          </p>
        </div>

        {/* Mode tabs */}
        {mode !== 'forgot' && (
          <div style={{
            display: 'flex', gap: '4px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '12px', padding: '4px',
            marginBottom: '28px'
          }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: '8px', borderRadius: '9px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                transition: 'all 0.2s',
                background: mode === m ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                {m === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {/* Page heading */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: '0 0 4px' }}>
            {mode === 'login'  ? 'Welcome back' :
             mode === 'signup' ? 'Create account' :
             'Reset password'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>
            {mode === 'login'  ? 'Sign in to continue' :
             mode === 'signup' ? 'Fill in your details below' :
             'We will send you a reset link'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ color: '#FCA5A5', fontSize: '13px' }}>{error}</span>
            <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: '16px', padding: '0 0 0 8px' }}>✕</button>
          </div>
        )}

        {/* Success */}
        {message && (
          <div style={{
            background: 'rgba(59,109,17,0.3)', border: '1px solid rgba(151,196,89,0.5)',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '16px'
          }}>
            <span style={{ color: '#C0DD97', fontSize: '13px' }}>✓ {message}</span>
          </div>
        )}

        {/* Password mismatch */}
        {mode === 'signup' && password && confirmPassword && password !== confirmPassword && (
          <div style={{
            background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '16px'
          }}>
            <span style={{ color: '#FCA5A5', fontSize: '13px' }}>Passwords do not match</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Name — signup only */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                required
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(151,196,89,0.7)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              placeholder="Enter your email"
              required
              autoComplete="email"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(151,196,89,0.7)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
            />
          </div>

          {/* Password */}
          {mode !== 'forgot' && (
            <div style={{ marginBottom: mode === 'login' ? '8px' : '16px' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{
                    width: '100%', padding: '12px 44px 12px 16px', borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff', fontSize: '14px', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(151,196,89,0.7)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0
                }}>
                  {eyeIcon(showPass)}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password — signup only */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={6}
                  style={{
                    width: '100%', padding: '12px 44px 12px 16px', borderRadius: '12px',
                    border: `1px solid ${confirmPassword && password !== confirmPassword ? 'rgba(220,38,38,0.6)' : 'rgba(255,255,255,0.2)'}`,
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff', fontSize: '14px', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(151,196,89,0.7)'}
                  onBlur={e => e.target.style.borderColor = confirmPassword && password !== confirmPassword ? 'rgba(220,38,38,0.6)' : 'rgba(255,255,255,0.2)'}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0
                }}>
                  {eyeIcon(showConfirm)}
                </button>
              </div>
            </div>
          )}

          {/* Forgot password link */}
          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <button type="button" onClick={() => switchMode('forgot')} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)',
                fontSize: '12px', cursor: 'pointer', textDecoration: 'underline'
              }}>
                Forgot password?
              </button>
            </div>
          )}

          {mode !== 'login' && <div style={{ marginBottom: '24px' }} />}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || (mode === 'signup' && password !== confirmPassword)}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)',
              color: loading ? 'rgba(255,255,255,0.5)' : '#27500A',
              border: 'none', borderRadius: '14px',
              fontSize: '15px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px', textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Please wait…' :
              mode === 'login'  ? 'LOGIN' :
              mode === 'signup' ? 'CREATE ACCOUNT' :
              'SEND RESET LINK'}
          </button>
        </form>

        {/* Back to login from forgot */}
        {mode === 'forgot' && (
          <button onClick={() => switchMode('login')} style={{
            display: 'block', width: '100%', marginTop: '16px',
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.55)', fontSize: '13px',
            cursor: 'pointer', textAlign: 'center'
          }}>
            ← Back to login
          </button>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '28px', marginBottom: 0 }}>
          Green Village Rice © 2026
        </p>
      </div>
    </div>
  )
}

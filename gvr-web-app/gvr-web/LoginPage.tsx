import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const { loading, error, clearError, signIn, signUp } = useAuthStore()
  const navigate = useNavigate()

  const switchMode = (m: typeof mode) => {
    setMode(m); clearError(); setMessage('')
    setUsername(''); setPassword(''); setConfirmPassword(''); setName('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError(); setMessage('')
    if (mode === 'signup' && password !== confirmPassword) return
    try {
      if (mode === 'login') {
        await signIn(username, password)
        navigate('/')
      } else {
        await signUp(username, password, name)
        setMessage('Account created! You can now login.')
        switchMode('login')
      }
    } catch {}
  }

  const EyeIcon = ({ show }: { show: boolean }) => show ? (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    borderRadius: '10px', border: '1.5px solid #E5E7EB',
    fontSize: '14px', color: '#1A1A1A', outline: 'none',
    boxSizing: 'border-box', background: '#FAFAFA',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#374151',
    fontSize: '12px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.8px',
    marginBottom: '8px'
  }

  const features = [
    { icon: '📦', label: 'Orders' },
    { icon: '🌾', label: 'Inventory' },
    { icon: '📊', label: 'Analytics' },
  ]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #3B6D11 0%, #27500A 55%, #639922 100%)',
        padding: '48px 40px',
      }}>
        <div style={{
          width: '88px', height: '88px', borderRadius: '24px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '42px', marginBottom: '24px',
        }}>🌾</div>

        <h1 style={{
          color: '#fff', fontSize: '40px', fontWeight: '800',
          margin: '0 0 10px', textAlign: 'center', lineHeight: 1.1,
        }}>Green Village<br />Rice</h1>

        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', margin: '0 0 6px' }}>
          గ్రీన్ విలేజ్ రైస్
        </p>
        <p style={{
          color: 'rgba(255,255,255,0.55)', fontSize: '14px',
          textAlign: 'center', margin: '0 0 44px', lineHeight: 1.6
        }}>
          Farm-fresh Sona Masoori rice,<br />delivered to your door in Hyderabad
        </p>

        <div style={{ display: 'flex', gap: '16px' }}>
          {features.map(f => (
            <div key={f.label} style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '16px', padding: '20px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{f.icon}</div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        width: '480px', flexShrink: 0, background: '#fff',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 52px',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* Heading */}
          <h2 style={{
            fontSize: '32px', fontWeight: '800', color: '#1A1A1A',
            margin: '0 0 6px',
          }}>
            {mode === 'login' ? 'Welcome' : 'Create Account'}
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 28px' }}>
            {mode === 'login' ? 'Sign in to continue' : 'Fill in your details below'}
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '10px', padding: '10px 14px', marginBottom: '20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ color: '#DC2626', fontSize: '13px' }}>{error}</span>
              <button onClick={clearError} style={{
                background: 'none', border: 'none', color: '#DC2626',
                cursor: 'pointer', fontSize: '18px', paddingLeft: '8px'
              }}>✕</button>
            </div>
          )}

          {/* Success */}
          {message && (
            <div style={{
              background: '#EAF3DE', border: '1px solid #97C459',
              borderRadius: '10px', padding: '10px 14px', marginBottom: '20px'
            }}>
              <span style={{ color: '#27500A', fontSize: '13px' }}>✓ {message}</span>
            </div>
          )}

          {/* Password mismatch */}
          {mode === 'signup' && password && confirmPassword && password !== confirmPassword && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '10px', padding: '10px 14px', marginBottom: '16px'
            }}>
              <span style={{ color: '#DC2626', fontSize: '13px' }}>Passwords do not match</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Full Name — signup only */}
            {mode === 'signup' && (
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#3B6D11')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
            )}

            {/* USERNAME */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Username</label>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value.trim())}
                placeholder="Enter username"
                required autoComplete="username" autoFocus
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#3B6D11')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter password'}
                  required minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  onFocus={e => (e.target.style.borderColor = '#3B6D11')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', color: '#9CA3AF', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', padding: 0
                }}><EyeIcon show={showPass} /></button>
              </div>
            </div>

            {/* CONFIRM PASSWORD — signup only */}
            {mode === 'signup' && (
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required minLength={6}
                    style={{
                      ...inputStyle, paddingRight: '44px',
                      borderColor: confirmPassword && password !== confirmPassword
                        ? '#EF4444' : '#E5E7EB'
                    }}
                    onFocus={e => (e.target.style.borderColor = '#3B6D11')}
                    onBlur={e => (e.target.style.borderColor =
                      confirmPassword && password !== confirmPassword ? '#EF4444' : '#E5E7EB')}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', color: '#9CA3AF', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', padding: 0
                  }}><EyeIcon show={showConfirm} /></button>
                </div>
              </div>
            )}

            {/* Links row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '24px', marginTop: '4px'
            }}>
              {mode === 'login' ? (
                <>
                  <button type="button" onClick={() => switchMode('signup')} style={{
                    background: 'none', border: 'none', color: '#3B6D11',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    padding: 0, textDecoration: 'underline'
                  }}>Create Account</button>
                  <span style={{ color: '#9CA3AF', fontSize: '13px' }}>
                    Forgot password? Contact admin
                  </span>
                </>
              ) : (
                <button type="button" onClick={() => switchMode('login')} style={{
                  background: 'none', border: 'none', color: '#3B6D11',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  padding: 0, textDecoration: 'underline'
                }}>← Back to Login</button>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || (mode === 'signup' && password !== confirmPassword)}
              style={{
                width: '100%', padding: '15px',
                background: loading ? '#9CA3AF' : '#3B6D11',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '16px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

          </form>

          <p style={{
            textAlign: 'center', color: '#9CA3AF',
            fontSize: '12px', marginTop: '32px', marginBottom: 0
          }}>
            © 2026 Green Village Rice. All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  )
}

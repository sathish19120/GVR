import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { loading, error, clearError, signIn } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await signIn(email, password)
      navigate('/')
    } catch {}
  }

  const EyeIcon = ({ show }: { show: boolean }) => show ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )

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
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '28px',
        border: '1px solid rgba(255,255,255,0.15)',
        padding: '44px 36px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '68px', height: '68px',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '34px', margin: '0 auto 16px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>🌾</div>
          <h1 style={{
            color: '#fff', fontSize: '18px', fontWeight: '700',
            margin: '0 0 4px', letterSpacing: '2px', textTransform: 'uppercase'
          }}>
            Green Village Rice
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', margin: 0 }}>
            గ్రీన్ విలేజ్ రైస్
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: '10px', padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ color: '#FCA5A5', fontSize: '13px' }}>{error}</span>
            <button onClick={clearError} style={{
              background: 'none', border: 'none', color: '#FCA5A5',
              cursor: 'pointer', fontSize: '16px', padding: '0 0 0 8px'
            }}>✕</button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Username / Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', color: 'rgba(255,255,255,0.65)',
              fontSize: '11px', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px'
            }}>
              Username
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              placeholder="Enter username"
              required
              autoComplete="email"
              autoFocus
              style={{
                width: '100%', padding: '13px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(192,221,151,0.7)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block', color: 'rgba(255,255,255,0.65)',
              fontSize: '11px', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={6}
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '13px 44px 13px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.07)',
                  color: '#fff', fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(192,221,151,0.7)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', padding: 0
                }}
              >
                <EyeIcon show={showPass} />
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginBottom: '28px' }}>
            <a
              href="mailto:support@greenvillagerice.in?subject=Password Reset Request"
              style={{
                color: 'rgba(255,255,255,0.45)', fontSize: '12px',
                textDecoration: 'underline', cursor: 'pointer'
              }}
            >
              Forgot password?
            </a>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.92)',
              color: loading ? 'rgba(255,255,255,0.4)' : '#27500A',
              border: 'none', borderRadius: '14px',
              fontSize: '15px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '1.5px', textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in…' : 'LOGIN'}
          </button>

        </form>

        <p style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.25)',
          fontSize: '11px', marginTop: '32px', marginBottom: 0
        }}>
          Green Village Rice © 2026
        </p>
      </div>
    </div>
  )
}

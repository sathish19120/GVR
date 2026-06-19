import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { trackSignup, trackLogin, trackPage } from '../lib/analytics'

const G = {
  green:      '#3B6D11',
  greenDark:  '#27500A',
  greenLight: '#EAF3DE',
  green2:     '#639922',
  border:     '#E5E7EB',
  text:       '#111827',
  muted:      '#6B7280',
  red:        '#DC2626',
  redBg:      '#FEF2F2',
}

const inp = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: `1.5px solid ${G.border}`, fontSize: 14,
  color: G.text, outline: 'none', background: '#FAFAFA',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
}

const lbl = {
  display: 'block', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.8px',
  color: G.muted, marginBottom: 7,
}

export default function AuthPage() {
  const [mode, setMode]       = useState('login') // 'login' | 'signup'
  const [username, setUser]   = useState('')
  const [fullName, setName]   = useState('')
  const [password, setPass]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [showP, setShowP]     = useState(false)
  const [showC, setShowC]     = useState(false)
  const [done, setDone]       = useState('')
  const { signIn, signUp, error, clearError, loading } = useAuth()
  const navigate = useNavigate()

  const [forgotUsername, setForgotUsername] = useState('')
  const [forgotMsg, setForgotMsg]           = useState('')
  const [forgotErr, setForgotErr]           = useState('')
  const [forgotLoading, setForgotLoading]   = useState(false)
  const [newPwd, setNewPwd]                 = useState('')
  const [confirmPwd, setConfirmPwd]         = useState('')
  const [resetStep, setResetStep]           = useState(1) // 1=enter username, 2=enter new password
  const [resetUser, setResetUser]           = useState(null)

  const mismatch = mode === 'signup' && confirm && password !== confirm

  async function checkUsername() {
    if (!forgotUsername.trim()) { setForgotErr('Enter your username'); return }
    setForgotLoading(true); setForgotErr('')
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, role')
        .eq('username', forgotUsername.trim().toLowerCase())
        .single()
      if (!data) { setForgotErr('Username not found. Check and try again.'); setForgotLoading(false); return }
      setResetUser(data)
      setResetStep(2)
    } catch(e) { setForgotErr('Username not found') }
    finally { setForgotLoading(false) }
  }

  async function resetPassword() {
    if (newPwd.length < 6) { setForgotErr('Password must be at least 6 characters'); return }
    if (newPwd !== confirmPwd) { setForgotErr('Passwords do not match'); return }
    setForgotLoading(true); setForgotErr('')
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(newPwd + 'gvr_salt_2026')
      const hash = await crypto.subtle.digest('SHA-256', data)
      const hashed = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
      await supabase.from('profiles').update({ password_hash: hashed }).eq('id', resetUser.id)
      setForgotMsg('Password reset successfully! You can now login.')
      setTimeout(() => {
        setMode('login'); setForgotUsername(''); setNewPwd(''); setConfirmPwd('')
        setResetStep(1); setResetUser(null); setForgotMsg(''); setForgotErr('')
      }, 2000)
    } catch(e) { setForgotErr(e.message) }
    finally { setForgotLoading(false) }
  }

  const reset = (m) => {
    setMode(m); clearError(); setDone('')
    setUser(''); setName(''); setPass(''); setConfirm('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (mismatch) return
    clearError(); setDone('')
    if (mode === 'signup') {
      const ok = await signUp(username, password, fullName)
      if (ok) {
        setDone('Account created! You can now login.')
        reset('login')
      }
    } else {
      const ok = await signIn(username, password)
      if (ok) { trackLogin(ok?.role || 'customer'); navigate('/') }
    }
  }

  const Eye = ({ show, toggle }) => (
    <button type="button" onClick={toggle} style={{
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', color: G.muted, padding: 0
    }}>
      {show
        ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>
        : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      }
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* LEFT — brand */}
      <div className="auth-left" style={{
        flex: 1, background: `linear-gradient(145deg, ${G.green} 0%, ${G.greenDark} 60%, #1a3a08 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '48px 40px',
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: 22,
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 44, marginBottom: 24,
        }}>🌾</div>
        <h1 style={{ color: '#fff', fontSize: 38, fontWeight: 800, textAlign: 'center', lineHeight: 1.1, margin: '0 0 10px' }}>
          Green Village<br />Rice
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, margin: '0 0 6px' }}>
          గ్రీన్ విలేజ్ రైస్
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', margin: '0 0 48px', lineHeight: 1.7 }}>
          Farm-fresh Sona Masoori rice<br />delivered across Hyderabad
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['📦','Orders'],['🌾','Inventory'],['📊','Analytics']].map(([icon, label]) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 14, padding: '18px 22px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 26, marginBottom: 7 }}>{icon}</div>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{
        width: 460, flexShrink: 0, background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 44px', boxShadow: '-4px 0 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{ width: '100%', maxWidth: 340 }}>

          <h2 style={{ fontSize: 30, fontWeight: 800, color: G.text, margin: '0 0 6px' }}>
            {mode === 'login' ? 'Welcome' : 'Create Account'}
          </h2>
          <p style={{ color: G.muted, fontSize: 14, margin: '0 0 28px' }}>
            {mode === 'login' ? 'Sign in to continue' : 'Set up your super admin account'}
          </p>

          {/* Error */}
          {error && (
            <div style={{ background: G.redBg, border: `1px solid #FECACA`, borderRadius: 10, padding: '10px 14px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: G.red, fontSize: 13 }}>{error}</span>
              <button onClick={clearError} style={{ background: 'none', border: 'none', color: G.red, cursor: 'pointer', fontSize: 16, paddingLeft: 8 }}>✕</button>
            </div>
          )}

          {/* Success */}
          {done && (
            <div style={{ background: G.greenLight, border: `1px solid #97C459`, borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
              <span style={{ color: G.greenDark, fontSize: 13 }}>✓ {done}</span>
            </div>
          )}

          {mismatch && (
            <div style={{ background: G.redBg, border: `1px solid #FECACA`, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <span style={{ color: G.red, fontSize: 13 }}>Passwords do not match</span>
            </div>
          )}

          {mode !== 'forgot' && <form onSubmit={submit}>
            {/* Full name — signup only */}
            {mode === 'signup' && (
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Full Name</label>
                <input style={inp} type="text" value={fullName} onChange={e => setName(e.target.value)}
                  placeholder="Your full name" required
                  onFocus={e => e.target.style.borderColor = G.green}
                  onBlur={e => e.target.style.borderColor = G.border} />
              </div>
            )}

            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Username</label>
              <input style={inp} type="text" value={username}
                onChange={e => setUser(e.target.value.trim())}
                placeholder="Enter username" required autoFocus autoComplete="username"
                onFocus={e => e.target.style.borderColor = G.green}
                onBlur={e => e.target.style.borderColor = G.border} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Password</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inp, paddingRight: 40 }} type={showP ? 'text' : 'password'}
                  value={password} onChange={e => setPass(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter password'}
                  required minLength={6}
                  onFocus={e => e.target.style.borderColor = G.green}
                  onBlur={e => e.target.style.borderColor = G.border} />
                <Eye show={showP} toggle={() => setShowP(!showP)} />
              </div>
            </div>

            {/* Confirm password — signup only */}
            {mode === 'signup' && (
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inp, paddingRight: 40, borderColor: mismatch ? G.red : G.border }}
                    type={showC ? 'text' : 'password'} value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter password" required minLength={6}
                    onFocus={e => e.target.style.borderColor = G.green}
                    onBlur={e => e.target.style.borderColor = mismatch ? G.red : G.border} />
                  <Eye show={showC} toggle={() => setShowC(!showC)} />
                </div>
              </div>
            )}

            {/* Links */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, marginTop: 8 }}>
              {mode === 'login' ? (
                <button type="button" onClick={() => reset('signup')}
                  style={{ background: 'none', border: 'none', color: G.green, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                  Create Account
                </button>
              ) : (
                <button type="button" onClick={() => reset('login')}
                  style={{ background: 'none', border: 'none', color: G.green, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                  ← Back to Login
                </button>
              )}
              {mode === 'login' && (
                <button type="button" onClick={() => reset('forgot')} style={{ background:'none', border:'none', color:G.amber, fontSize:13, fontWeight:600, cursor:'pointer', padding:0, textDecoration:'underline' }}>Forgot Password?</button>
              )}
            </div>

            <button type="submit" disabled={loading || mismatch} style={{
              width: '100%', padding: 14, background: loading ? '#9CA3AF' : G.green,
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Super Admin'}
            </button>
          </form>}

          <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginTop: 28 }}>
            © 2026 Green Village Rice. All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',
  red:'#DC2626',redBg:'#FEF2F2',white:'#fff'
}

const inp = {
  width:'100%', padding:'12px 14px', borderRadius:10,
  border:`1.5px solid ${G.border}`, fontSize:14,
  color:G.text, outline:'none', background:'#FAFAFA',
  boxSizing:'border-box', transition:'border-color 0.2s',
}
const lbl = {
  display:'block', fontSize:11, fontWeight:700,
  textTransform:'uppercase', letterSpacing:'0.8px',
  color:G.muted, marginBottom:7,
}

async function hashPw(pw) {
  const enc = new TextEncoder()
  const data = enc.encode(pw + 'gvr_salt_2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export default function AuthPage() {
  const [mode, setMode]     = useState('login') // login | signup | forgot
  const [username, setUser] = useState('')
  const [fullName, setName] = useState('')
  const [phone, setPhone]   = useState('')
  const [password, setPass] = useState('')
  const [confirm, setConf]  = useState('')
  const [showP, setShowP]   = useState(false)
  const [done, setDone]     = useState('')
  const { signIn, signUp, error, clearError, loading } = useAuth()
  const navigate = useNavigate()

  // Forgot password states
  const [fUser, setFUser]       = useState('')
  const [fNewPw, setFNewPw]     = useState('')
  const [fConfPw, setFConfPw]   = useState('')
  const [fMsg, setFMsg]         = useState('')
  const [fErr, setFErr]         = useState('')
  const [fLoading, setFLoading] = useState(false)
  const [fStep, setFStep]       = useState(1) // 1=username, 2=new password
  const [fProfile, setFProfile] = useState(null)

  const mismatch = mode === 'signup' && confirm && password !== confirm

  function switchMode(m) {
    setMode(m); clearError(); setDone('')
    setUser(''); setName(''); setPhone(''); setPass(''); setConf('')
    setFUser(''); setFNewPw(''); setFConfPw(''); setFMsg(''); setFErr('')
    setFStep(1); setFProfile(null)
  }

  async function submit(e) {
    e.preventDefault()
    if (mismatch) return
    clearError(); setDone('')
    if (mode === 'signup') {
      const ok = await signUp(username, password, fullName, phone, 'customer')
      if (ok) { setDone('Account created! You can now login.'); switchMode('login') }
    } else {
      const ok = await signIn(username, password)
      if (ok) navigate('/')
    }
  }

  async function checkUsername() {
    if (!fUser.trim()) { setFErr('Enter your username'); return }
    setFLoading(true); setFErr('')
    try {
      const { data, error } = await supabase
        .from('profiles').select('id,username,full_name,role')
        .eq('username', fUser.trim().toLowerCase()).single()
      if (error || !data) { setFErr('Username not found. Check and try again.'); return }
      setFProfile(data); setFStep(2)
    } catch(e) { setFErr('Username not found') }
    finally { setFLoading(false) }
  }

  async function doReset() {
    if (fNewPw.length < 6) { setFErr('Password must be at least 6 characters'); return }
    if (fNewPw !== fConfPw) { setFErr('Passwords do not match'); return }
    setFLoading(true); setFErr('')
    try {
      const hashed = await hashPw(fNewPw)
      await supabase.from('profiles').update({ password_hash: hashed }).eq('id', fProfile.id)
      setFMsg('Password reset successfully! You can now login.')
      setTimeout(() => switchMode('login'), 2000)
    } catch(e) { setFErr(e.message) }
    finally { setFLoading(false) }
  }

  const Eye = () => (
    <button type="button" onClick={() => setShowP(!showP)} style={{
      position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
      background:'none', border:'none', cursor:'pointer', color:G.muted, fontSize:12, fontWeight:600
    }}>{showP ? 'Hide' : 'Show'}</button>
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 640px) {
          .auth-left { display: none !important; }
          .auth-right { width: 100% !important; padding: 32px 20px !important; }
        }
      `}</style>

      {/* LEFT — brand */}
      <div className="auth-left" style={{
        flex:1, background:`linear-gradient(145deg,${G.green} 0%,${G.greenDark} 60%,#1a3a08 100%)`,
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'48px 40px',
      }}>
        <div style={{ width:88, height:88, borderRadius:22, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, marginBottom:24 }}>🌾</div>
        <h1 style={{ color:'#fff', fontSize:38, fontWeight:800, textAlign:'center', lineHeight:1.1, margin:'0 0 10px' }}>Green Village<br />Rice</h1>
        <p style={{ color:'rgba(255,255,255,0.65)', fontSize:15, margin:'0 0 6px' }}>గ్రీన్ విలేజ్ రైస్</p>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, textAlign:'center', margin:'0 0 48px', lineHeight:1.7 }}>
          Farm-fresh Sona Masoori rice<br />delivered across Hyderabad
        </p>
        <div style={{ display:'flex', gap:16 }}>
          {[['📦','Orders'],['🌾','Inventory'],['📊','Analytics']].map(([icon,label]) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:14, padding:'18px 22px', textAlign:'center' }}>
              <div style={{ fontSize:26, marginBottom:7 }}>{icon}</div>
              <div style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="auth-right" style={{ width:460, flexShrink:0, background:G.white, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 44px', boxShadow:'-4px 0 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width:'100%', maxWidth:340 }}>

          {/* ── LOGIN / SIGNUP ── */}
          {(mode === 'login' || mode === 'signup') && <>
            <h2 style={{ fontSize:30, fontWeight:800, color:G.text, margin:'0 0 6px' }}>
              {mode === 'login' ? 'Welcome' : 'Create Account'}
            </h2>
            <p style={{ color:G.muted, fontSize:14, margin:'0 0 28px' }}>
              {mode === 'login' ? 'Sign in to continue' : 'Sign up to start ordering rice'}
            </p>

            {error && (
              <div style={{ background:G.redBg, border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:G.red, fontSize:13 }}>{error}</span>
                <button type="button" onClick={clearError} style={{ background:'none', border:'none', color:G.red, cursor:'pointer', fontSize:16, paddingLeft:8 }}>✕</button>
              </div>
            )}
            {done && (
              <div style={{ background:G.greenLight, border:'1px solid #97C459', borderRadius:10, padding:'10px 14px', marginBottom:18 }}>
                <span style={{ color:G.greenDark, fontSize:13 }}>✓ {done}</span>
              </div>
            )}

            <form onSubmit={submit}>
              {mode === 'signup' && (
                <>
                  <div style={{ marginBottom:16 }}>
                    <label style={lbl}>Full Name *</label>
                    <input type="text" value={fullName} onChange={e=>setName(e.target.value)} placeholder="Your full name" required style={inp}
                      onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={lbl}>Phone Number</label>
                    <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mobile number" style={inp}
                      onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                  </div>
                </>
              )}

              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Username *</label>
                <input type="text" value={username} onChange={e=>setUser(e.target.value.trim().toLowerCase())}
                  placeholder="Enter username" required autoComplete="username"
                  style={inp}
                  onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Password *</label>
                <div style={{ position:'relative' }}>
                  <input type={showP?'text':'password'} value={password} onChange={e=>setPass(e.target.value)}
                    placeholder={mode==='signup'?'Min 6 characters':'Enter password'}
                    required minLength={6}
                    style={{ ...inp, paddingRight:50 }}
                    onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                  <Eye />
                </div>
              </div>

              {mode === 'signup' && (
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>Confirm Password *</label>
                  <input type={showP?'text':'password'} value={confirm} onChange={e=>setConf(e.target.value)}
                    placeholder="Re-enter password" required minLength={6}
                    style={{ ...inp, borderColor: mismatch ? G.red : G.border }}
                    onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=mismatch?G.red:G.border} />
                  {mismatch && <p style={{ margin:'4px 0 0', fontSize:12, color:G.red }}>Passwords do not match</p>}
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22, marginTop:6 }}>
                {mode === 'login' ? (
                  <>
                    <button type="button" onClick={() => switchMode('signup')} style={{ background:'none', border:'none', color:G.green, fontSize:13, fontWeight:600, cursor:'pointer', padding:0, textDecoration:'underline' }}>
                      Create Account
                    </button>
                    <button type="button" onClick={() => switchMode('forgot')} style={{ background:'none', border:'none', color:G.amber, fontSize:13, fontWeight:600, cursor:'pointer', padding:0, textDecoration:'underline' }}>
                      Forgot Password?
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => switchMode('login')} style={{ background:'none', border:'none', color:G.green, fontSize:13, fontWeight:600, cursor:'pointer', padding:0, textDecoration:'underline' }}>
                    ← Back to Login
                  </button>
                )}
              </div>

              <button type="submit" disabled={loading || mismatch} style={{
                width:'100%', padding:14,
                background:loading?'#9CA3AF':G.green,
                color:G.white, border:'none', borderRadius:12,
                fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer',
              }}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create My Account'}
              </button>
            </form>
          </>}

          {/* ── FORGOT PASSWORD ── */}
          {mode === 'forgot' && <>
            <h2 style={{ fontSize:28, fontWeight:800, color:G.text, margin:'0 0 6px' }}>Reset Password</h2>
            <p style={{ color:G.muted, fontSize:14, margin:'0 0 24px' }}>
              {fStep === 1 ? 'Enter your username to continue' : `Reset password for @${fProfile?.username}`}
            </p>

            {fErr && (
              <div style={{ background:G.redBg, border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:G.red, fontSize:13 }}>{fErr}</span>
                <button type="button" onClick={()=>setFErr('')} style={{ background:'none', border:'none', color:G.red, cursor:'pointer', fontSize:16 }}>✕</button>
              </div>
            )}
            {fMsg && (
              <div style={{ background:G.greenLight, border:'1px solid #97C459', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
                <span style={{ color:G.greenDark, fontSize:13 }}>✓ {fMsg}</span>
              </div>
            )}

            {/* Step 1 — username */}
            {fStep === 1 && (
              <>
                <div style={{ marginBottom:20 }}>
                  <label style={lbl}>Username</label>
                  <input type="text" value={fUser} onChange={e=>setFUser(e.target.value.trim().toLowerCase())}
                    placeholder="Enter your username" autoFocus style={inp}
                    onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                </div>
                <button type="button" onClick={checkUsername} disabled={fLoading||!fUser.trim()} style={{
                  width:'100%', padding:13,
                  background:fLoading||!fUser.trim()?'#9CA3AF':G.green,
                  color:G.white, border:'none', borderRadius:12,
                  fontSize:15, fontWeight:700, cursor:'pointer'
                }}>
                  {fLoading ? 'Checking...' : 'Continue →'}
                </button>
              </>
            )}

            {/* Step 2 — new password */}
            {fStep === 2 && fProfile && (
              <>
                <div style={{ background:G.greenLight, borderRadius:10, padding:'10px 14px', marginBottom:18, display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:G.green, display:'flex', alignItems:'center', justifyContent:'center', color:G.white, fontSize:14, fontWeight:700, flexShrink:0 }}>
                    {fProfile.full_name?.[0] || fProfile.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin:0, fontWeight:700, fontSize:13, color:G.greenDark }}>{fProfile.full_name || fProfile.username}</p>
                    <p style={{ margin:0, fontSize:11, color:G.green2 }}>@{fProfile.username} · {fProfile.role}</p>
                  </div>
                </div>

                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>New Password</label>
                  <input type="password" value={fNewPw} onChange={e=>setFNewPw(e.target.value)}
                    placeholder="Min 6 characters" autoFocus style={inp}
                    onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                </div>
                <div style={{ marginBottom:22 }}>
                  <label style={lbl}>Confirm New Password</label>
                  <input type="password" value={fConfPw} onChange={e=>setFConfPw(e.target.value)}
                    placeholder="Re-enter new password"
                    style={{ ...inp, borderColor: fConfPw && fNewPw !== fConfPw ? G.red : G.border }}
                    onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=fConfPw&&fNewPw!==fConfPw?G.red:G.border} />
                  {fConfPw && fNewPw !== fConfPw && <p style={{ margin:'4px 0 0', fontSize:12, color:G.red }}>Passwords do not match</p>}
                </div>

                <button type="button" onClick={doReset}
                  disabled={fLoading || !fNewPw || fNewPw !== fConfPw} style={{
                  width:'100%', padding:13,
                  background:fLoading||!fNewPw||fNewPw!==fConfPw?'#9CA3AF':G.amber,
                  color:G.white, border:'none', borderRadius:12,
                  fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:10
                }}>
                  {fLoading ? 'Resetting...' : '✓ Reset Password'}
                </button>
                <button type="button" onClick={()=>setFStep(1)} style={{ width:'100%', padding:9, background:'none', border:'none', color:G.muted, fontSize:13, cursor:'pointer' }}>
                  ← Try different username
                </button>
              </>
            )}

            <button type="button" onClick={() => switchMode('login')} style={{ width:'100%', marginTop:14, padding:9, background:'none', border:'none', color:G.green, fontSize:13, fontWeight:600, cursor:'pointer', textDecoration:'underline' }}>
              ← Back to Login
            </button>
          </>}

          <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:11, marginTop:28 }}>
            © 2026 Green Village Rice. All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  )
}

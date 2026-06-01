import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',border:'#E5E7EB',text:'#111827',
  muted:'#6B7280',red:'#DC2626',redBg:'#FEF2F2',white:'#fff',surface:'#F4F6F3'
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

export default function AuthPage() {
  const [mode, setMode]       = useState('login') // login | signup
  const [username, setUser]   = useState('')
  const [fullName, setName]   = useState('')
  const [phone, setPhone]     = useState('')
  const [password, setPass]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [showP, setShowP]     = useState(false)
  const [showC, setShowC]     = useState(false)
  const [done, setDone]       = useState('')
  const { signIn, signUp, error, clearError, loading } = useAuth()
  const navigate = useNavigate()

  const mismatch = mode === 'signup' && confirm && password !== confirm

  const reset = (m) => {
    setMode(m); clearError(); setDone('')
    setUser(''); setName(''); setPhone(''); setPass(''); setConfirm('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (mismatch) return
    clearError(); setDone('')
    if (mode === 'signup') {
      const ok = await signUp(username, password, fullName, phone, 'customer')
      if (ok) {
        setDone('Account created! You can now login.')
        reset('login')
      }
    } else {
      const ok = await signIn(username, password)
      if (ok) navigate('/')
    }
  }

  const Eye = ({ show, toggle }) => (
    <button type="button" onClick={toggle} style={{
      position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
      background:'none', border:'none', cursor:'pointer', color:G.muted, padding:0, fontSize:12, fontWeight:600
    }}>{show ? 'Hide' : 'Show'}</button>
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Inter', sans-serif" }}>

      {/* LEFT — brand */}
      <div style={{
        flex:1, background:`linear-gradient(145deg, ${G.green} 0%, ${G.greenDark} 60%, #1a3a08 100%)`,
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
          {[['📦','Orders'],['🌾','Inventory'],['📊','Analytics']].map(([icon, label]) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:14, padding:'18px 22px', textAlign:'center' }}>
              <div style={{ fontSize:26, marginBottom:7 }}>{icon}</div>
              <div style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{ width:480, flexShrink:0, background:G.white, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 44px', boxShadow:'-4px 0 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width:'100%', maxWidth:360 }}>

          <h2 style={{ fontSize:30, fontWeight:800, color:G.text, margin:'0 0 6px' }}>
            {mode === 'login' ? 'Welcome' : 'Create Account'}
          </h2>
          <p style={{ color:G.muted, fontSize:14, margin:'0 0 28px' }}>
            {mode === 'login' ? 'Sign in to continue' : 'Sign up to start ordering rice'}
          </p>

          {/* Error */}
          {error && (
            <div style={{ background:G.redBg, border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:G.red, fontSize:13 }}>{error}</span>
              <button onClick={clearError} style={{ background:'none', border:'none', color:G.red, cursor:'pointer', fontSize:16, paddingLeft:8 }}>✕</button>
            </div>
          )}

          {/* Success */}
          {done && (
            <div style={{ background:G.greenLight, border:'1px solid #97C459', borderRadius:10, padding:'10px 14px', marginBottom:18 }}>
              <span style={{ color:G.greenDark, fontSize:13 }}>✓ {done}</span>
            </div>
          )}

          <form onSubmit={submit}>

            {/* Signup extra fields */}
            {mode === 'signup' && (
              <>
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>Full Name *</label>
                  <input type="text" value={fullName} onChange={e=>setName(e.target.value)}
                    placeholder="Your full name" required style={inp}
                    onFocus={e=>e.target.style.borderColor=G.green}
                    onBlur={e=>e.target.style.borderColor=G.border} />
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>Phone Number</label>
                  <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
                    placeholder="Mobile number" style={inp}
                    onFocus={e=>e.target.style.borderColor=G.green}
                    onBlur={e=>e.target.style.borderColor=G.border} />
                </div>
              </>
            )}

            {/* Username */}
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Username *</label>
              <input type="text" value={username} onChange={e=>setUser(e.target.value.trim().toLowerCase())}
                placeholder="Enter username" required autoComplete="username"
                style={inp}
                onFocus={e=>e.target.style.borderColor=G.green}
                onBlur={e=>e.target.style.borderColor=G.border} />
            </div>

            {/* Password */}
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Password *</label>
              <div style={{ position:'relative' }}>
                <input type={showP?'text':'password'} value={password}
                  onChange={e=>setPass(e.target.value)}
                  placeholder={mode==='signup'?'Min 6 characters':'Enter password'}
                  required minLength={6}
                  style={{ ...inp, paddingRight:50 }}
                  onFocus={e=>e.target.style.borderColor=G.green}
                  onBlur={e=>e.target.style.borderColor=G.border} />
                <Eye show={showP} toggle={()=>setShowP(!showP)} />
              </div>
            </div>

            {/* Confirm password — signup only */}
            {mode === 'signup' && (
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Confirm Password *</label>
                <div style={{ position:'relative' }}>
                  <input type={showC?'text':'password'} value={confirm}
                    onChange={e=>setConfirm(e.target.value)}
                    placeholder="Re-enter password" required minLength={6}
                    style={{ ...inp, paddingRight:50, borderColor:mismatch?G.red:G.border }}
                    onFocus={e=>e.target.style.borderColor=G.green}
                    onBlur={e=>e.target.style.borderColor=mismatch?G.red:G.border} />
                  <Eye show={showC} toggle={()=>setShowC(!showC)} />
                </div>
                {mismatch && <p style={{ margin:'5px 0 0', fontSize:12, color:G.red }}>Passwords do not match</p>}
              </div>
            )}

            {/* Links row */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, marginTop:8 }}>
              {mode === 'login' ? (
                <>
                  <button type="button" onClick={()=>reset('signup')} style={{ background:'none', border:'none', color:G.green, fontSize:13, fontWeight:600, cursor:'pointer', padding:0, textDecoration:'underline' }}>
                    Create Account
                  </button>
                  <span style={{ color:G.muted, fontSize:12 }}>Contact admin to reset password</span>
                </>
              ) : (
                <button type="button" onClick={()=>reset('login')} style={{ background:'none', border:'none', color:G.green, fontSize:13, fontWeight:600, cursor:'pointer', padding:0, textDecoration:'underline' }}>
                  ← Back to Login
                </button>
              )}
            </div>

            <button type="submit" disabled={loading || mismatch} style={{
              width:'100%', padding:14,
              background:loading?'#9CA3AF':G.green,
              color:G.white, border:'none', borderRadius:12,
              fontSize:15, fontWeight:700,
              cursor:loading?'not-allowed':'pointer',
              transition:'background 0.2s',
            }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create My Account'}
            </button>
          </form>

          {/* Info box for new users */}
          {mode === 'signup' && (
            <div style={{ marginTop:20, padding:'12px 16px', background:'#F0F7FF', borderRadius:12, border:'1px solid #BFDBFE' }}>
              <p style={{ margin:0, fontSize:12, color:'#1E5FA5', lineHeight:1.6 }}>
                ✅ After creating your account you can:<br />
                • Browse and order rice online<br />
                • Track all your orders by name<br />
                • View your full order history
              </p>
            </div>
          )}

          <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:11, marginTop:24 }}>
            © 2026 Green Village Rice. All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  )
}

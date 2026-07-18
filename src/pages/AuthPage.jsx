import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

// ── Design tokens (matches CustomerShop redesign) ─────────
const C = {
  p900:'#0D2B05', p800:'#1A4A0A', p700:'#27500A', p600:'#3B6D11',
  p500:'#4E8A17', p400:'#639922', p300:'#85B84A', p100:'#D4EDB5', p50:'#EAF3DE',
  a500:'#E8931A', a400:'#F5A623', a100:'#FEF0D0', a50:'#FFFAF0',
  red:'#E53935', redBg:'#FFEBEE',
  n900:'#0F1923', n800:'#1C2B3A', n700:'#2D3F50', n500:'#6B7A8D',
  n300:'#B0BEC5', n200:'#E1E8ED', n100:'#F0F4F7', n50:'#F7FAFC',
  white:'#FFFFFF',
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { font-family: 'Inter', -apple-system, sans-serif; }

  .auth-root {
    min-height: 100vh;
    display: flex;
    background: ${C.n50};
  }

  /* Left brand panel — hidden on mobile */
  .auth-brand {
    width: 420px;
    flex-shrink: 0;
    background: linear-gradient(160deg, ${C.p600} 0%, ${C.p800} 50%, ${C.p900} 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
    position: relative;
    overflow: hidden;
  }
  .auth-brand::before {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    top: -80px; right: -80px;
  }
  .auth-brand::after {
    content: '';
    position: absolute;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    bottom: -40px; left: -40px;
  }

  .auth-form-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    overflow-y: auto;
    min-height: 100vh;
  }

  .auth-form-card {
    width: 100%;
    max-width: 400px;
    background: ${C.white};
    border-radius: 24px;
    padding: 36px 32px;
    box-shadow: 0 4px 24px rgba(15,25,35,0.08), 0 1px 4px rgba(15,25,35,0.04);
  }

  .auth-input {
    width: 100%;
    padding: 13px 16px;
    border-radius: 12px;
    border: 1.5px solid ${C.n200};
    font-size: 14px;
    color: ${C.n900};
    outline: none;
    background: ${C.n50};
    font-family: inherit;
    transition: border-color 0.15s, background 0.15s;
  }
  .auth-input:focus {
    border-color: ${C.p500};
    background: ${C.white};
  }
  .auth-input::placeholder { color: ${C.n300}; }

  .auth-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: ${C.n500};
    margin-bottom: 7px;
  }

  .auth-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    letter-spacing: 0.2px;
    transition: all 0.15s;
  }
  .auth-btn:active { transform: scale(0.98); }
  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .auth-btn-primary {
    background: linear-gradient(135deg, ${C.p600}, ${C.p700});
    color: ${C.white};
    box-shadow: 0 4px 12px rgba(59,109,17,0.3);
  }
  .auth-btn-primary:not(:disabled):hover {
    background: linear-gradient(135deg, ${C.p700}, ${C.p800});
    box-shadow: 0 6px 16px rgba(59,109,17,0.35);
  }

  .auth-btn-secondary {
    background: ${C.n100};
    color: ${C.n700};
  }
  .auth-btn-secondary:hover { background: ${C.n200}; }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
    color: ${C.n300};
    font-size: 12px;
  }
  .auth-divider::before, .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${C.n200};
  }

  .auth-link {
    background: none;
    border: none;
    color: ${C.p600};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    text-decoration: none;
  }
  .auth-link:hover { text-decoration: underline; color: ${C.p700}; }

  .step-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: ${C.n200};
    transition: all 0.2s;
  }
  .step-dot.active { background: ${C.p600}; width: 20px; border-radius: 4px; }
  .step-dot.done  { background: ${C.p400}; }

  /* Trust badges on brand panel */
  .trust-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 10px;
  }

  @media (max-width: 768px) {
    .auth-brand { display: none; }
    .auth-form-card {
      box-shadow: none;
      border-radius: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 32px 24px;
      background: ${C.white};
    }
    .auth-form-panel {
      padding: 0;
      background: ${C.white};
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn 0.22s ease-out both; }
`

async function hashPw(pw) {
  const enc  = new TextEncoder()
  const data = enc.encode(pw + 'gvr_salt_2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
}

function LangToggle({ lang, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <button type="button" onClick={()=>setOpen(!open)} style={{ display:'flex',alignItems:'center',gap:6,background:C.p50,border:`1px solid ${C.p300}`,borderRadius:20,padding:'6px 14px',cursor:'pointer',color:C.p700,fontSize:12,fontWeight:700 }}>
        {lang==='te'?'🇮🇳 తె':'🌐 EN'} <span style={{ fontSize:10,opacity:.6 }}>▾</span>
      </button>
      {open && (
        <div style={{ position:'absolute',top:'110%',right:0,background:C.white,borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,0.14)',overflow:'hidden',minWidth:130,zIndex:999,border:`1px solid ${C.n200}` }}>
          {[['en','🌐','English'],['te','🇮🇳','తెలుగు']].map(([code,flag,label])=>(
            <button type="button" key={code} onClick={()=>{ onChange(code); setOpen(false) }}
              style={{ width:'100%',padding:'11px 14px',display:'flex',alignItems:'center',gap:10,background:lang===code?C.p50:C.white,border:'none',borderBottom:`1px solid ${C.n100}`,cursor:'pointer' }}>
              <span style={{fontSize:16}}>{flag}</span>
              <span style={{fontSize:13,fontWeight:600,color:C.n900}}>{label}</span>
              {lang===code && <span style={{marginLeft:'auto',color:C.p600,fontWeight:800}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Alert component ───────────────────────────────────────
function Alert({ msg, type='error', onClose }) {
  if (!msg) return null
  const isError   = type === 'error'
  const bg        = isError ? C.redBg  : C.p50
  const color     = isError ? C.red    : C.p700
  const border    = isError ? '#FECACA': C.p300
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:12, padding:'11px 14px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'flex-start', fontSize:13, color, lineHeight:1.5 }}>
      <span>{msg}</span>
      {onClose && <button type="button" onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color,fontSize:18,lineHeight:1,marginLeft:8,flexShrink:0 }}>✕</button>}
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label className="auth-label">{label}</label>
      {children}
    </div>
  )
}

// ── Brand panel ───────────────────────────────────────────
function BrandPanel() {
  return (
    <div className="auth-brand">
      {/* Logo */}
      <div style={{ position:'relative',zIndex:1,textAlign:'center',marginBottom:40 }}>
        <div style={{ width:80,height:80,borderRadius:22,background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:42,margin:'0 auto 20px' }}>🌾</div>
        <h1 style={{ color:C.white,fontSize:32,fontWeight:900,lineHeight:1.15,margin:'0 0 8px' }}>Green Village<br/>Rice</h1>
        <p style={{ color:'rgba(255,255,255,0.55)',fontSize:14,margin:'0 0 4px' }}>గ్రీన్ విలేజ్ రైస్</p>
        <p style={{ color:'rgba(255,255,255,0.4)',fontSize:13,lineHeight:1.6 }}>Farm-fresh Sona Masoori<br/>delivered across Hyderabad</p>
      </div>

      {/* Trust badges */}
      <div style={{ position:'relative',zIndex:1,width:'100%',maxWidth:280 }}>
        {[
          ['🌱','Farm direct sourcing','From certified Telangana farms'],
          ['✅','FSSAI certified','Lic. No. 10020042009874'],
          ['⚡','Same day delivery','Order before 2 PM'],
          ['🔒','Secure payments','UPI & Cash on delivery'],
        ].map(([icon,title,sub])=>(
          <div key={title} className="trust-badge">
            <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
            <div>
              <p style={{ margin:0,fontSize:13,fontWeight:700,color:C.white }}>{title}</p>
              <p style={{ margin:0,fontSize:11,color:'rgba(255,255,255,0.45)' }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <p style={{ position:'relative',zIndex:1,color:'rgba(255,255,255,0.25)',fontSize:11,marginTop:28 }}>© 2014–2026 Green Village Rice</p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function AuthPage({ defaultMode }) {
  const navigate = useNavigate()
  const { signIn, signUp, error, clearError, loading } = useAuth()

  const [mode, setMode]     = useState(defaultMode || 'login')
  const [lang, setLangState] = useState(localStorage.getItem('gvr_lang') || 'en')
  const S = STRINGS[lang] || STRINGS.en
  const setLang = l => { localStorage.setItem('gvr_lang',l); setLangState(l) }

  // Login
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [done,     setDone]     = useState('')

  // Signup extra
  const [fullName, setFullName] = useState('')
  const [phone,    setPhone]    = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [refCode,  setRefCode]  = useState('')

  // Forgot
  const [fUser,    setFUser]    = useState('')
  const [fPhone,   setFPhone]   = useState('')
  const [fNewPw,   setFNewPw]   = useState('')
  const [fConfPw,  setFConfPw]  = useState('')
  const [fProfile, setFProfile] = useState(null)
  const [fStep,    setFStep]    = useState(1)
  const [fMsg,     setFMsg]     = useState('')
  const [fErr,     setFErr]     = useState('')
  const [fLoading, setFLoading] = useState(false)

  const mismatch = mode === 'signup' && confirm && password !== confirm

  function switchMode(m) {
    setMode(m); clearError(); setDone('')
    setUsername(''); setPassword(''); setFullName(''); setPhone('')
    setConfirm(''); setFUser(''); setFPhone(''); setFNewPw('')
    setFConfPw(''); setFMsg(''); setFErr(''); setFStep(1); setFProfile(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (mismatch) return
    clearError(); setDone('')
    if (mode === 'signup') {
      const ok = await signUp(username, password, fullName, phone, 'customer', refCode)
      if (ok) { setDone(S.accountCreated); switchMode('login') }
    } else {
      const ok = await signIn(username, password)
      if (ok) navigate('/', { replace: true })
    }
  }

  async function checkUsername() {
    if (!fUser.trim()) { setFErr('Enter your username'); return }
    setFLoading(true); setFErr('')
    try {
      const { data, error:err } = await supabase.from('profiles').select('id,username,full_name,role,phone').eq('username', fUser.trim().toLowerCase()).single()
      if (err || !data) { setFErr('Username not found'); return }
      setFProfile(data); setFStep(2)
    } catch { setFErr('Username not found') }
    finally { setFLoading(false) }
  }

  async function verifyPhone() {
    if (!fPhone.trim()) { setFErr('Enter your registered phone number'); return }
    setFLoading(true); setFErr('')
    const norm = p => p.replace(/[\s\-\+]/g,'').replace(/^91/,'').slice(-10)
    if (norm(fPhone) !== norm(fProfile?.phone||'')) {
      setFErr("Phone number doesn't match our records")
      setFLoading(false); return
    }
    setFStep(3); setFLoading(false)
  }

  async function doReset() {
    if (fNewPw.length < 6) { setFErr(S.weakPw); return }
    if (fNewPw !== fConfPw) { setFErr(S.mismatch); return }
    setFLoading(true); setFErr('')
    try {
      const hashed = await hashPw(fNewPw)
      await supabase.from('profiles').update({ password_hash:hashed }).eq('id', fProfile.id)
      setFMsg('Password reset! Sign in with your new password.')
      setTimeout(() => switchMode('login'), 2200)
    } catch(e) { setFErr(e.message) }
    finally { setFLoading(false) }
  }

  return (
    <>
      <style>{css}</style>
      <div className="auth-root">
        <BrandPanel />

        <div className="auth-form-panel">
          {/* Lang toggle */}
          <div style={{ position:'fixed',top:16,right:16,zIndex:200 }}>
            <LangToggle lang={lang} onChange={setLang} />
          </div>

          <div className="auth-form-card fade-in">

            {/* ── LOGIN ─────────────────────────────────── */}
            {mode==='login' && (
              <>
                <div style={{ marginBottom:28 }}>
                  <h2 style={{ fontSize:26,fontWeight:900,color:C.n900,margin:'0 0 6px' }}>{S.welcome} 👋</h2>
                  <p style={{ color:C.n500,fontSize:14 }}>{S.signinSubtitle}</p>
                </div>

                <Alert msg={error} onClose={clearError} />
                {done && <Alert msg={done} type="success" />}

                <form onSubmit={handleSubmit}>
                  <Field label={S.usernameLbl}>
                    <input className="auth-input" type="text" value={username} onChange={e=>setUsername(e.target.value.trim().toLowerCase())}
                      placeholder="your_username" required autoComplete="username" />
                  </Field>
                  <Field label={S.passwordLbl}>
                    <div style={{ position:'relative' }}>
                      <input className="auth-input" type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                        placeholder="••••••••" required style={{ paddingRight:60 }} />
                      <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:C.n500,fontSize:12,fontWeight:700,fontFamily:'inherit' }}>
                        {showPw?S.hidePw:S.showPw}
                      </button>
                    </div>
                  </Field>

                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
                    <button type="button" className="auth-link" onClick={()=>switchMode('signup')}>{S.signupLink} →</button>
                    <button type="button" className="auth-link" style={{ color:C.a500 }} onClick={()=>switchMode('forgot')}>{S.forgotBtn}</button>
                  </div>

                  <button type="submit" disabled={loading} className="auth-btn auth-btn-primary">
                    {loading ? <span>⏳ {S.loading}</span> : S.signinBtn}
                  </button>
                </form>

                <div className="auth-divider">or continue with</div>

                <a href={`https://wa.me/919999999999?text=${encodeURIComponent('Hi, I want to create an account on GVR.')}`} target="_blank" rel="noreferrer"
                  style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'13px',background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:14,textDecoration:'none',color:'#15803D',fontWeight:700,fontSize:14 }}>
                  <span style={{ fontSize:20 }}>💬</span> Order via WhatsApp
                </a>
              </>
            )}

            {/* ── SIGNUP ────────────────────────────────── */}
            {mode==='signup' && (
              <>
                <div style={{ marginBottom:24 }}>
                  <h2 style={{ fontSize:24,fontWeight:900,color:C.n900,margin:'0 0 6px' }}>{S.signupTitle} 🌾</h2>
                  <p style={{ color:C.n500,fontSize:14 }}>{S.signupSubtitle}</p>
                </div>

                <Alert msg={error} onClose={clearError} />

                <form onSubmit={handleSubmit}>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
                    <div>
                      <label className="auth-label">{S.fullNameLbl} *</label>
                      <input className="auth-input" type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Full name" required />
                    </div>
                    <div>
                      <label className="auth-label">{S.phoneLbl}</label>
                      <input className="auth-input" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number" />
                    </div>
                  </div>
                  <Field label={S.usernameLbl+' *'}>
                    <input className="auth-input" type="text" value={username} onChange={e=>setUsername(e.target.value.trim().toLowerCase())} placeholder="choose_username" required />
                  </Field>
                  <Field label={S.passwordLbl+' *'}>
                    <div style={{ position:'relative' }}>
                      <input className="auth-input" type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" required style={{ paddingRight:60 }} />
                      <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:C.n500,fontSize:12,fontWeight:700,fontFamily:'inherit' }}>
                        {showPw?S.hidePw:S.showPw}
                      </button>
                    </div>
                  </Field>
                  <Field label={S.confirmLbl+' *'}>
                    <input className="auth-input" type={showPw?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter password" required
                      style={{ borderColor:mismatch?C.red:undefined }} />
                    {mismatch && <p style={{ margin:'5px 0 0',fontSize:12,color:C.red }}>{S.mismatch}</p>}
                  </Field>
                  <Field label={S.referralLbl}>
                    <input className="auth-input" type="text" value={refCode} onChange={e=>setRefCode(e.target.value.trim().toUpperCase())} placeholder="FRIEND CODE"
                      style={{ borderColor:refCode?C.p500:undefined,letterSpacing:refCode?2:0 }} />
                    {refCode && <p style={{ margin:'5px 0 0',fontSize:12,color:C.p600,fontWeight:600 }}>✓ {S.referralApplied}</p>}
                  </Field>

                  <button type="submit" disabled={loading||mismatch} className="auth-btn auth-btn-primary" style={{ marginBottom:10 }}>
                    {loading?`⏳ ${S.creating}`:S.createBtn}
                  </button>
                  <button type="button" className="auth-btn auth-btn-secondary" onClick={()=>switchMode('login')}>
                    {S.backBtn}
                  </button>
                </form>
              </>
            )}

            {/* ── FORGOT PASSWORD ───────────────────────── */}
            {mode==='forgot' && (
              <>
                <div style={{ marginBottom:20 }}>
                  <h2 style={{ fontSize:24,fontWeight:900,color:C.n900,margin:'0 0 6px' }}>{S.resetTitle}</h2>
                  <p style={{ color:C.n500,fontSize:14 }}>
                    {fStep===1 ? S.resetSubtitle1 : fStep===2 ? 'Verify your phone number' : `Set a new password for @${fProfile?.username}`}
                  </p>
                </div>

                {/* Step dots */}
                <div style={{ display:'flex',gap:6,marginBottom:20 }}>
                  {[1,2,3].map(s=>(
                    <div key={s} className={`step-dot${fStep===s?' active':fStep>s?' done':''}`} />
                  ))}
                  <span style={{ marginLeft:6,fontSize:11,color:C.n500,alignSelf:'center' }}>
                    {fStep===1?'Username':fStep===2?'Verify phone':'New password'}
                  </span>
                </div>

                <Alert msg={fErr} onClose={()=>setFErr('')} />
                {fMsg && <Alert msg={fMsg} type="success" />}

                {/* Step 1 */}
                {fStep===1 && (
                  <>
                    <Field label={S.usernameLbl}>
                      <input className="auth-input" type="text" value={fUser} onChange={e=>setFUser(e.target.value.trim().toLowerCase())} placeholder="your_username" autoFocus />
                    </Field>
                    <button type="button" disabled={fLoading||!fUser.trim()} className="auth-btn auth-btn-primary" onClick={checkUsername} style={{ marginBottom:10 }}>
                      {fLoading?`⏳ ${S.loading}`:`${S.continueBtn}`}
                    </button>
                  </>
                )}

                {/* Step 2 — phone verify */}
                {fStep===2 && fProfile && (
                  <>
                    <div style={{ background:C.p50,border:`1px solid ${C.p300}`,borderRadius:14,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:12 }}>
                      <div style={{ width:36,height:36,borderRadius:10,background:C.p600,display:'flex',alignItems:'center',justifyContent:'center',color:C.white,fontSize:15,fontWeight:800,flexShrink:0 }}>
                        {fProfile.full_name?.[0]||fProfile.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin:0,fontWeight:700,fontSize:13,color:C.p800 }}>{fProfile.full_name||fProfile.username}</p>
                        <p style={{ margin:0,fontSize:11,color:C.p500 }}>@{fProfile.username}</p>
                      </div>
                    </div>
                    <div style={{ background:C.a50,border:`1px solid ${C.a100}`,borderRadius:12,padding:'10px 14px',marginBottom:16,display:'flex',gap:8 }}>
                      <span>🔒</span>
                      <p style={{ margin:0,fontSize:12,color:C.a500,lineHeight:1.5 }}>Enter the phone number registered to this account to verify it's you.</p>
                    </div>
                    <Field label="Registered phone number">
                      <input className="auth-input" type="tel" value={fPhone} onChange={e=>setFPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" autoFocus />
                    </Field>
                    <button type="button" disabled={fLoading||!fPhone.trim()} className="auth-btn auth-btn-primary" onClick={verifyPhone} style={{ marginBottom:10 }}>
                      {fLoading?`⏳ ${S.loading}`:'Verify & continue →'}
                    </button>
                    <button type="button" className="auth-btn auth-btn-secondary" onClick={()=>{setFStep(1);setFErr('')}}>← Try different username</button>
                  </>
                )}

                {/* Step 3 — new password */}
                {fStep===3 && fProfile && (
                  <>
                    <div style={{ background:C.p50,border:`1px solid ${C.p300}`,borderRadius:12,padding:'10px 14px',marginBottom:16,display:'flex',gap:8,alignItems:'center' }}>
                      <span>✅</span>
                      <p style={{ margin:0,fontSize:12,color:C.p700,fontWeight:600 }}>Phone verified — set your new password</p>
                    </div>
                    <Field label={S.passwordLbl+' (new)'}>
                      <input className="auth-input" type="password" value={fNewPw} onChange={e=>setFNewPw(e.target.value)} placeholder="Min 6 characters" autoFocus />
                    </Field>
                    <Field label={S.confirmLbl}>
                      <input className="auth-input" type="password" value={fConfPw} onChange={e=>setFConfPw(e.target.value)} placeholder="Re-enter new password"
                        style={{ borderColor:fConfPw&&fNewPw!==fConfPw?C.red:undefined }} />
                      {fConfPw&&fNewPw!==fConfPw && <p style={{ margin:'5px 0 0',fontSize:12,color:C.red }}>{S.mismatch}</p>}
                    </Field>
                    <button type="button" disabled={fLoading||!fNewPw||fNewPw!==fConfPw} className="auth-btn auth-btn-primary" onClick={doReset} style={{ marginBottom:10 }}>
                      {fLoading?`⏳ ${S.resetting}`:'✓ Reset password'}
                    </button>
                  </>
                )}

                <button type="button" className="auth-link" style={{ display:'block',textAlign:'center',marginTop:16,width:'100%',padding:'8px' }} onClick={()=>switchMode('login')}>
                  {S.backBtn}
                </button>
              </>
            )}

            <p style={{ textAlign:'center',color:C.n300,fontSize:11,marginTop:24 }}>© 2014–2026 Green Village Rice · Hyderabad</p>
          </div>
        </div>
      </div>
    </>
  )
}

// Language strings (kept at bottom to keep component readable)
const STRINGS = {
  en: {
    welcome:'Welcome back', signinBtn:'Sign in', signupTitle:'Create account',
    resetTitle:'Reset password', usernameLbl:'Username', passwordLbl:'Password',
    fullNameLbl:'Full name', phoneLbl:'Phone', confirmLbl:'Confirm password',
    forgotBtn:'Forgot password?', createBtn:'Create account',
    backBtn:'← Back to sign in', referralLbl:'Referral code (optional)',
    loading:'Please wait…', creating:'Creating…', resetting:'Resetting…',
    continueBtn:'Continue →', resetBtn:'Reset password',
    signupLink:'New here? Create account', signinSubtitle:'Sign in to continue to GVR',
    signupSubtitle:'Join thousands of happy customers',
    resetSubtitle1:'Enter your username to get started',
    showPw:'Show', hidePw:'Hide', mismatch:'Passwords do not match',
    referralApplied:'Referral code applied — you get ₹20 on your first order!',
    weakPw:'Password must be at least 6 characters',
    userTaken:'Username already taken. Try another.',
    accountCreated:'Account created! Sign in below.',
  },
  te: {
    welcome:'స్వాగతం', signinBtn:'లాగిన్', signupTitle:'ఖాతా తయారు చేయండి',
    resetTitle:'పాస్‌వర్డ్ రీసెట్', usernameLbl:'యూజర్‌నేమ్', passwordLbl:'పాస్‌వర్డ్',
    fullNameLbl:'పూర్తి పేరు', phoneLbl:'ఫోన్', confirmLbl:'పాస్‌వర్డ్ నిర్ధారించండి',
    forgotBtn:'పాస్‌వర్డ్ మర్చిపోయారా?', createBtn:'ఖాతా తయారు చేయండి',
    backBtn:'← లాగిన్‌కు వెళ్ళండి', referralLbl:'రెఫరల్ కోడ్ (ఐచ్ఛికం)',
    loading:'వేచి ఉండండి…', creating:'తయారవుతోంది…', resetting:'రీసెట్ అవుతోంది…',
    continueBtn:'కొనసాగించండి →', resetBtn:'పాస్‌వర్డ్ రీసెట్',
    signupLink:'కొత్తగా వచ్చారా? ఖాతా తయారు చేయండి', signinSubtitle:'GVR కి లాగిన్ చేయండి',
    signupSubtitle:'వేలమంది సంతోషకరమైన కస్టమర్లలో చేరండి',
    resetSubtitle1:'మీ యూజర్‌నేమ్ నమోదు చేయండి',
    showPw:'చూపించు', hidePw:'దాచు', mismatch:'పాస్‌వర్డ్‌లు సరిపోలడం లేదు',
    referralApplied:'రెఫరల్ కోడ్ వర్తించింది — మీకు ₹20 లభిస్తుంది!',
    weakPw:'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి',
    userTaken:'యూజర్‌నేమ్ ఇప్పటికే తీసుకోబడింది.',
    accountCreated:'ఖాతా తయారైంది! లాగిన్ చేయండి.',
  }
}

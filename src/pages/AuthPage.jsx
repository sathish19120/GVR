import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11', greenDark:'#27500A', greenLight:'#EAF3DE',
  amber:'#BA7517', border:'#E5E7EB', text:'#111827', muted:'#6B7280',
  red:'#DC2626', redBg:'#FEF2F2', white:'#fff'
}

const STRINGS = {
  en: {
    welcome:'Welcome', signinBtn:'Sign In', signupTitle:'Create Account',
    resetTitle:'Reset Password', usernameLbl:'Username', passwordLbl:'Password',
    fullNameLbl:'Full Name', phoneLbl:'Phone', confirmLbl:'Confirm Password',
    forgotBtn:'Forgot Password?', createBtn:'Create My Account',
    backBtn:'← Back to Login', referralLbl:'Referral Code (optional)',
    loading:'Please wait…', creating:'Creating…', resetting:'Resetting...',
    continueBtn:'Continue →', resetBtn:'✓ Reset Password',
    signupLink:'Create Account', signinSubtitle:'Sign in to continue',
    signupSubtitle:'Sign up to start ordering rice',
    resetSubtitle1:'Enter your username to continue',
    showPw:'Show', hidePw:'Hide', mismatch:'Passwords do not match',
    referralApplied:'✓ Referral code applied — you get ₹20 after first order!',
    weakPw:'Password must be at least 6 characters',
    userTaken:'Username already taken. Choose another.',
    accountCreated:'Account created! You can now sign in.',
  },
  te: {
    welcome:'స్వాగతం', signinBtn:'లాగిన్ చేయండి', signupTitle:'ఖాతా తయారు చేయండి',
    resetTitle:'పాస్‌వర్డ్ రీసెట్', usernameLbl:'యూజర్‌నేమ్', passwordLbl:'పాస్‌వర్డ్',
    fullNameLbl:'పూర్తి పేరు', phoneLbl:'ఫోన్ నంబర్', confirmLbl:'పాస్‌వర్డ్ నిర్ధారించండి',
    forgotBtn:'పాస్‌వర్డ్ మర్చిపోయారా?', createBtn:'నా ఖాతా తయారు చేయండి',
    backBtn:'← లాగిన్‌కు వెళ్ళండి', referralLbl:'రెఫరల్ కోడ్ (ఐచ్ఛికం)',
    loading:'వేచి ఉండండి…', creating:'తయారవుతోంది…', resetting:'రీసెట్ అవుతోంది...',
    continueBtn:'కొనసాగించండి →', resetBtn:'✓ పాస్‌వర్డ్ రీసెట్ చేయండి',
    signupLink:'ఖాతా తయారు చేయండి', signinSubtitle:'కొనసాగించడానికి లాగిన్ చేయండి',
    signupSubtitle:'బియ్యం ఆర్డర్ చేయడం ప్రారంభించండి',
    resetSubtitle1:'కొనసాగించడానికి మీ యూజర్‌నేమ్ నమోదు చేయండి',
    showPw:'చూపించు', hidePw:'దాచు', mismatch:'పాస్‌వర్డ్‌లు సరిపోలడం లేదు',
    referralApplied:'✓ రెఫరల్ కోడ్ వర్తించింది — మీకు ₹20 లభిస్తుంది!',
    weakPw:'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి',
    userTaken:'యూజర్‌నేమ్ ఇప్పటికే తీసుకోబడింది.',
    accountCreated:'ఖాతా తయారైంది! ఇప్పుడు లాగిన్ చేయండి.',
  }
}

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
      <button type="button" onClick={()=>setOpen(!open)} style={{ display:'flex',alignItems:'center',gap:6,background:'#EAF3DE',border:'1px solid #97C459',borderRadius:20,padding:'5px 12px',cursor:'pointer',color:'#27500A',fontSize:12,fontWeight:600 }}>
        {lang==='te'?'🇮🇳 తెలుగు':'🌐 English'} <span>▾</span>
      </button>
      {open && (
        <div style={{ position:'absolute',top:'110%',right:0,background:G.white,borderRadius:12,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',overflow:'hidden',minWidth:130,zIndex:999 }}>
          {[['en','🌐','English'],['te','🇮🇳','తెలుగు']].map(([code,flag,label])=>(
            <button type="button" key={code} onClick={()=>{ onChange(code); setOpen(false) }}
              style={{ width:'100%',padding:'10px 14px',display:'flex',alignItems:'center',gap:8,background:lang===code?'#EAF3DE':G.white,border:'none',borderBottom:`1px solid ${G.border}`,cursor:'pointer' }}>
              <span style={{fontSize:16}}>{flag}</span>
              <span style={{fontSize:13,fontWeight:600,color:G.text}}>{label}</span>
              {lang===code && <span style={{marginLeft:'auto',color:G.green,fontWeight:700}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AuthPage({ defaultMode }) {
  const navigate = useNavigate()
  const { signIn, signUp, error, clearError, loading } = useAuth()

  const [mode, setMode]       = useState(defaultMode || 'login')
  const [lang, setLangState]  = useState(localStorage.getItem('gvr_lang') || 'en')
  const S = STRINGS[lang] || STRINGS.en

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [confirm, setConfirm]   = useState('')
  const [refCode, setRefCode]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [done, setDone]         = useState('')

  const [fUser, setFUser]     = useState('')
  const [fNewPw, setFNewPw]   = useState('')
  const [fConfPw, setFConfPw] = useState('')
  const [fProfile, setFProfile] = useState(null)
  const [fStep, setFStep]     = useState(1)
  const [fMsg, setFMsg]       = useState('')
  const [fErr, setFErr]       = useState('')
  const [fLoading, setFLoading] = useState(false)

  const mismatch = mode === 'signup' && confirm && password !== confirm

  const setLang = (l) => { localStorage.setItem('gvr_lang', l); setLangState(l) }

  function switchMode(m) {
    setMode(m); clearError(); setDone('')
    setUsername(''); setPassword(''); setFullName(''); setPhone(''); setConfirm('')
    setFUser(''); setFNewPw(''); setFConfPw(''); setFMsg(''); setFErr('')
    setFStep(1); setFProfile(null)
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
      const { data, error: err } = await supabase
        .from('profiles').select('id,username,full_name,role')
        .eq('username', fUser.trim().toLowerCase()).single()
      if (err || !data) { setFErr('Username not found'); return }
      setFProfile(data); setFStep(2)
    } catch { setFErr('Username not found') }
    finally { setFLoading(false) }
  }

  async function doReset() {
    if (fNewPw.length < 6) { setFErr(S.weakPw); return }
    if (fNewPw !== fConfPw) { setFErr(S.mismatch); return }
    setFLoading(true); setFErr('')
    try {
      const hashed = await hashPw(fNewPw)
      await supabase.from('profiles').update({ password_hash: hashed }).eq('id', fProfile.id)
      setFMsg('Password reset! You can now login.')
      setTimeout(() => switchMode('login'), 2000)
    } catch(e) { setFErr(e.message) }
    finally { setFLoading(false) }
  }

  const inp = { width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:14, color:G.text, outline:'none', background:'#FAFAFA', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:G.muted, marginBottom:7 }
  const btn = (bg) => ({ width:'100%', padding:14, background:bg||G.green, color:G.white, border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer' })

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Inter',sans-serif" }}>
      {/* Lang toggle fixed top right */}
      <div style={{ position:'fixed', top:16, right:16, zIndex:200 }}>
        <LangToggle lang={lang} onChange={setLang} />
      </div>

      {/* LEFT brand panel */}
      <div className="auth-left" style={{ flex:1, background:`linear-gradient(145deg,${G.green},${G.greenDark},#1a3a08)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 40px' }}>
        <div style={{ width:88,height:88,borderRadius:22,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,marginBottom:24 }}>🌾</div>
        <h1 style={{ color:'#fff',fontSize:38,fontWeight:800,textAlign:'center',lineHeight:1.1,margin:'0 0 10px' }}>Green Village<br/>Rice</h1>
        <p style={{ color:'rgba(255,255,255,0.65)',fontSize:15,margin:'0 0 6px' }}>గ్రీన్ విలేజ్ రైస్</p>
        <p style={{ color:'rgba(255,255,255,0.5)',fontSize:14,textAlign:'center',margin:'0 0 48px',lineHeight:1.7 }}>Farm-fresh Sona Masoori rice<br/>delivered across Hyderabad</p>
        <div style={{ display:'flex',gap:16 }}>
          {[['📦','Orders'],['🌾','Inventory'],['📊','Analytics']].map(([icon,label])=>(
            <div key={label} style={{ background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:14,padding:'18px 22px',textAlign:'center' }}>
              <div style={{ fontSize:26,marginBottom:7 }}>{icon}</div>
              <div style={{ color:'#fff',fontSize:12,fontWeight:600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT form panel */}
      <div className="auth-right" style={{ width:460,flexShrink:0,background:G.white,display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 44px',boxShadow:'-4px 0 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width:'100%',maxWidth:340 }}>

          {/* LOGIN */}
          {mode === 'login' && (
            <>
              <h2 style={{ fontSize:30,fontWeight:800,color:G.text,margin:'0 0 6px' }}>{S.welcome}</h2>
              <p style={{ color:G.muted,fontSize:14,margin:'0 0 28px' }}>{S.signinSubtitle}</p>
              {error && <div style={{ background:G.redBg,border:'1px solid #FECACA',borderRadius:10,padding:'10px 14px',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <span style={{ color:G.red,fontSize:13 }}>{error}</span>
                <button type="button" onClick={clearError} style={{ background:'none',border:'none',color:G.red,cursor:'pointer',fontSize:16 }}>✕</button>
              </div>}
              {done && <div style={{ background:G.greenLight,border:'1px solid #97C459',borderRadius:10,padding:'10px 14px',marginBottom:18 }}>
                <span style={{ color:G.greenDark,fontSize:13 }}>✓ {done}</span>
              </div>}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>{S.usernameLbl}</label>
                  <input type="text" value={username} onChange={e=>setUsername(e.target.value.trim().toLowerCase())} placeholder="Enter username" required autoComplete="username" style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>{S.passwordLbl}</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" required style={{ ...inp,paddingRight:50 }} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                    <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:G.muted,fontSize:12,fontWeight:600 }}>{showPw?S.hidePw:S.showPw}</button>
                  </div>
                </div>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
                  <button type="button" onClick={()=>switchMode('signup')} style={{ background:'none',border:'none',color:G.green,fontSize:13,fontWeight:600,cursor:'pointer',padding:0,textDecoration:'underline' }}>{S.signupLink}</button>
                  <button type="button" onClick={()=>switchMode('forgot')} style={{ background:'none',border:'none',color:G.amber,fontSize:13,fontWeight:600,cursor:'pointer',padding:0,textDecoration:'underline' }}>{S.forgotBtn}</button>
                </div>
                <button type="submit" disabled={loading} style={{ ...btn(loading?'#9CA3AF':G.green) }}>
                  {loading ? S.loading : S.signinBtn}
                </button>
              </form>
            </>
          )}

          {/* SIGNUP */}
          {mode === 'signup' && (
            <>
              <h2 style={{ fontSize:28,fontWeight:800,color:G.text,margin:'0 0 6px' }}>{S.signupTitle}</h2>
              <p style={{ color:G.muted,fontSize:14,margin:'0 0 24px' }}>{S.signupSubtitle}</p>
              {error && <div style={{ background:G.redBg,border:'1px solid #FECACA',borderRadius:10,padding:'10px 14px',marginBottom:16,display:'flex',justifyContent:'space-between' }}>
                <span style={{ color:G.red,fontSize:13 }}>{error}</span>
                <button type="button" onClick={clearError} style={{ background:'none',border:'none',color:G.red,cursor:'pointer',fontSize:16 }}>✕</button>
              </div>}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>{S.fullNameLbl} *</label>
                  <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name" required style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>{S.phoneLbl}</label>
                  <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mobile number" style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>{S.usernameLbl} *</label>
                  <input type="text" value={username} onChange={e=>setUsername(e.target.value.trim().toLowerCase())} placeholder="Choose a username" required style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>{S.passwordLbl} *</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" required style={{ ...inp,paddingRight:50 }} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                    <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:G.muted,fontSize:12,fontWeight:600 }}>{showPw?S.hidePw:S.showPw}</button>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>{S.confirmLbl} *</label>
                  <input type={showPw?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter password" required style={{ ...inp,borderColor:mismatch?G.red:G.border }} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=mismatch?G.red:G.border} />
                  {mismatch && <p style={{ margin:'4px 0 0',fontSize:12,color:G.red }}>{S.mismatch}</p>}
                </div>
                <div style={{ marginBottom:22 }}>
                  <label style={lbl}>{S.referralLbl}</label>
                  <input type="text" value={refCode} onChange={e=>setRefCode(e.target.value.trim().toUpperCase())} placeholder="Friend's referral code" style={{ ...inp,borderColor:refCode?G.green:G.border }} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=refCode?G.green:G.border} />
                  {refCode && <p style={{ margin:'4px 0 0',fontSize:12,color:G.green }}>{S.referralApplied}</p>}
                </div>
                <button type="submit" disabled={loading||mismatch} style={{ ...btn(loading||mismatch?'#9CA3AF':G.green),marginBottom:10 }}>
                  {loading ? S.creating : S.createBtn}
                </button>
                <button type="button" onClick={()=>switchMode('login')} style={{ width:'100%',padding:10,background:'none',border:'none',color:G.green,fontSize:13,fontWeight:600,cursor:'pointer',textDecoration:'underline' }}>
                  {S.backBtn}
                </button>
              </form>
            </>
          )}

          {/* FORGOT */}
          {mode === 'forgot' && (
            <>
              <h2 style={{ fontSize:28,fontWeight:800,color:G.text,margin:'0 0 6px' }}>{S.resetTitle}</h2>
              <p style={{ color:G.muted,fontSize:14,margin:'0 0 24px' }}>{fStep===1?S.resetSubtitle1:`Reset for @${fProfile?.username}`}</p>
              {fErr && <div style={{ background:G.redBg,border:'1px solid #FECACA',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',justifyContent:'space-between' }}>
                <span style={{ color:G.red,fontSize:13 }}>{fErr}</span>
                <button type="button" onClick={()=>setFErr('')} style={{ background:'none',border:'none',color:G.red,cursor:'pointer',fontSize:16 }}>✕</button>
              </div>}
              {fMsg && <div style={{ background:G.greenLight,border:'1px solid #97C459',borderRadius:10,padding:'10px 14px',marginBottom:14 }}>
                <span style={{ color:G.greenDark,fontSize:13 }}>✓ {fMsg}</span>
              </div>}
              {fStep===1 && (
                <>
                  <div style={{ marginBottom:20 }}>
                    <label style={lbl}>{S.usernameLbl}</label>
                    <input type="text" value={fUser} onChange={e=>setFUser(e.target.value.trim().toLowerCase())} placeholder="Enter your username" autoFocus style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                  </div>
                  <button type="button" onClick={checkUsername} disabled={fLoading||!fUser.trim()} style={{ ...btn(fLoading||!fUser.trim()?'#9CA3AF':G.green),marginBottom:10 }}>
                    {fLoading ? S.loading : S.continueBtn}
                  </button>
                </>
              )}
              {fStep===2 && fProfile && (
                <>
                  <div style={{ background:G.greenLight,borderRadius:10,padding:'10px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:10 }}>
                    <div style={{ width:34,height:34,borderRadius:'50%',background:G.green,display:'flex',alignItems:'center',justifyContent:'center',color:G.white,fontSize:14,fontWeight:700,flexShrink:0 }}>
                      {fProfile.full_name?.[0]||fProfile.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin:0,fontWeight:700,fontSize:13,color:G.greenDark }}>{fProfile.full_name||fProfile.username}</p>
                      <p style={{ margin:0,fontSize:11,color:G.green }}>@{fProfile.username} · {fProfile.role}</p>
                    </div>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>{S.passwordLbl} (New)</label>
                    <input type="password" value={fNewPw} onChange={e=>setFNewPw(e.target.value)} placeholder="Min 6 characters" autoFocus style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label style={lbl}>{S.confirmLbl}</label>
                    <input type="password" value={fConfPw} onChange={e=>setFConfPw(e.target.value)} placeholder="Re-enter new password" style={{ ...inp,borderColor:fConfPw&&fNewPw!==fConfPw?G.red:G.border }} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=fConfPw&&fNewPw!==fConfPw?G.red:G.border} />
                    {fConfPw&&fNewPw!==fConfPw && <p style={{ margin:'4px 0 0',fontSize:12,color:G.red }}>{S.mismatch}</p>}
                  </div>
                  <button type="button" onClick={doReset} disabled={fLoading||!fNewPw||fNewPw!==fConfPw} style={{ ...btn(fLoading||!fNewPw||fNewPw!==fConfPw?'#9CA3AF':G.amber),marginBottom:10 }}>
                    {fLoading ? S.resetting : S.resetBtn}
                  </button>
                  <button type="button" onClick={()=>setFStep(1)} style={{ width:'100%',padding:9,background:'none',border:'none',color:G.muted,fontSize:13,cursor:'pointer' }}>← Try different username</button>
                </>
              )}
              <button type="button" onClick={()=>switchMode('login')} style={{ width:'100%',marginTop:14,padding:9,background:'none',border:'none',color:G.green,fontSize:13,fontWeight:600,cursor:'pointer',textDecoration:'underline' }}>
                {S.backBtn}
              </button>
            </>
          )}

          <p style={{ textAlign:'center',color:'#9CA3AF',fontSize:11,marginTop:28 }}>© 2014–2026 Green Village Rice. All Rights Reserved</p>
        </div>
      </div>
    </div>
  )
}

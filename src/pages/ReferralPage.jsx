import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',purple:'#7C3AED',purpleLight:'#EDE9FE',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

export default function ReferralPage() {
  const { user } = useAuth()
  const [profile, setProfile]       = useState(null)
  const [wallet, setWallet]         = useState([])
  const [referrals, setReferrals]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [copied, setCopied]         = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [pRes, wRes, rRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      // ✅ FIX: wallet_transactions table now exists — no longer crashes
      supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      // ✅ FIX: referred_by column now exists on profiles — no longer crashes
      supabase.from('profiles').select('id,full_name,username,created_at,total_orders').eq('referred_by', user?.referral_code || ''),
    ])
    setProfile(pRes.data)
    setWallet(wRes.data || [])
    setReferrals(rRes.data || [])
    setLoading(false)
  }

  // ✅ FIX: Copy Code copies ONLY the referral code (not the full WhatsApp message)
  function copyCode() {
    const code = profile?.referral_code || ''
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // Copy full link (separate button)
  function copyLink() {
    const code = profile?.referral_code || ''
    const link = `https://gvr-lemon.vercel.app?ref=${code}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    })
  }

  function shareWhatsApp() {
    const code = profile?.referral_code || ''
    const msg  = `🌾 Order fresh Sona Masoori rice from Green Village Rice!\nUse my referral code *${code}* and get ₹20 off your first order.\nOrder here: https://gvr-lemon.vercel.app?ref=${code}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const balance       = profile?.wallet_balance || 0
  const totalEarned   = wallet.filter(w=>w.type==='credit').reduce((s,w)=>s+Number(w.amount),0)
  const totalUsed     = wallet.filter(w=>w.type==='debit').reduce((s,w)=>s+Number(w.amount),0)
  const fmtRs = v => `₹${Number(v).toLocaleString('en-IN')}`

  if (loading) return <div style={{ textAlign:'center', padding:60, color:G.muted }}>Loading...</div>

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", maxWidth:600, margin:'0 auto' }}>

      {/* Wallet balance */}
      <div style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`, borderRadius:20, padding:'24px 28px', marginBottom:20, color:G.white }}>
        <p style={{ margin:'0 0 4px', fontSize:13, color:'rgba(255,255,255,0.7)' }}>GVR Wallet Balance</p>
        <p style={{ margin:'0 0 16px', fontSize:40, fontWeight:800 }}>₹{balance.toFixed(2)}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[
            ['Total Earned',    fmtRs(totalEarned), '💰'],
            ['Total Used',      fmtRs(totalUsed),   '🛒'],
            ['Friends Referred', referrals.length,  '👥'],
          ].map(([label, val, icon]) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.12)', borderRadius:12, padding:'12px 14px', textAlign:'center' }}>
              <p style={{ margin:'0 0 4px', fontSize:11, color:'rgba(255,255,255,0.7)' }}>{label}</p>
              <p style={{ margin:0, fontSize:18, fontWeight:700 }}>{icon} {val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral code */}
      <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:700, color:G.text }}>🎁 Your Referral Code</p>
        <p style={{ margin:'0 0 16px', fontSize:13, color:G.muted }}>Share with friends — you both get ₹20 when they place their first order</p>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <div style={{ flex:1, padding:'14px 18px', background:'#F9FAF7', borderRadius:12, border:`2px dashed ${G.green}`, textAlign:'center' }}>
            <p style={{ margin:0, fontSize:28, fontWeight:900, letterSpacing:'4px', color:G.greenDark, fontFamily:'monospace' }}>{profile?.referral_code || '—'}</p>
          </div>
          {/* ✅ FIX: now copies only the code */}
          <button onClick={copyCode} style={{ padding:'14px 16px', background:copied?G.green:G.greenLight, border:'none', borderRadius:12, cursor:'pointer', fontSize:13, fontWeight:700, color:copied?G.white:G.green, transition:'all 0.2s', minWidth:80 }}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button onClick={shareWhatsApp} style={{ padding:'12px', background:'#25D366', color:G.white, border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>💬</span> Share on WhatsApp
          </button>
          {/* ✅ FIX: Copy Link copies the referral URL (distinct from Copy Code) */}
          <button onClick={copyLink} style={{ padding:'12px', background:copiedLink?G.blue:G.blueLight, color:copiedLink?G.white:G.blue, border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>🔗</span> {copiedLink ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background:G.white, borderRadius:16, padding:'18px 22px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ margin:'0 0 14px', fontSize:14, fontWeight:700 }}>How Referral Works</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            ['1', G.green,  '📤', 'Share your code with friends and family'],
            ['2', G.blue,   '📱', 'Friend signs up using your code and places first order'],
            ['3', G.amber,  '💰', 'Both of you get ₹20 added to your GVR wallet instantly'],
            ['4', G.purple, '🛒', 'Use wallet balance on your next order automatically'],
          ].map(([step, color, icon, text]) => (
            <div key={step} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px', background:'#F9FAF7', borderRadius:12 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:color, color:G.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, flexShrink:0 }}>{step}</div>
              <span style={{ fontSize:18 }}>{icon}</span>
              <p style={{ margin:0, fontSize:13, color:G.text }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Friends referred */}
      {referrals.length > 0 && (
        <div style={{ background:G.white, borderRadius:16, padding:'18px 22px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin:'0 0 14px', fontSize:14, fontWeight:700 }}>👥 Friends You Referred ({referrals.length})</p>
          {referrals.map((r,i) => (
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<referrals.length-1?`1px solid ${G.border}`:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:G.green }}>
                  {r.full_name?.[0]||r.username?.[0]?.toUpperCase()||'?'}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:13 }}>{r.full_name||r.username}</p>
                  <p style={{ margin:0, fontSize:11, color:G.muted }}>Joined {new Date(r.created_at).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</p>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ margin:0, fontSize:12, color:G.green, fontWeight:600 }}>{r.total_orders||0} orders</p>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:G.greenLight, color:G.green, fontWeight:600 }}>+₹20 earned</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wallet history */}
      {wallet.length > 0 && (
        <div style={{ background:G.white, borderRadius:16, padding:'18px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin:'0 0 14px', fontSize:14, fontWeight:700 }}>💳 Wallet History</p>
          {wallet.slice(0,10).map((w,i) => (
            <div key={w.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<wallet.slice(0,10).length-1?`1px solid ${G.border}`:'none' }}>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:500 }}>{w.reason||'Transaction'}</p>
                <p style={{ margin:0, fontSize:11, color:G.muted }}>{new Date(w.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
              </div>
              <span style={{ fontSize:15, fontWeight:700, color:w.type==='credit'?G.green:G.red }}>
                {w.type==='credit'?'+':'−'}₹{Number(w.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty wallet state */}
      {wallet.length === 0 && (
        <div style={{ background:G.white, borderRadius:16, padding:'28px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>💳</div>
          <p style={{ margin:'0 0 4px', fontWeight:600, color:G.text }}>No wallet transactions yet</p>
          <p style={{ margin:0, fontSize:13, color:G.muted }}>Refer a friend to earn ₹20!</p>
        </div>
      )}
    </div>
  )
}

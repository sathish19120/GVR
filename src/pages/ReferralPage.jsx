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
  const [profile, setProfile]     = useState(null)
  const [wallet, setWallet]       = useState([])
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading]     = useState(true)
  const [copied, setCopied]       = useState(false)
  const [shareMsg, setShareMsg]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [pRes, wRes, rRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        // FIX #1: wallet_transactions now exists in schema
        supabase.from('wallet_transactions')
          .select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        // FIX #2: filter by referred_by column (now exists in schema)
        supabase.from('profiles')
          .select('id,full_name,username,created_at,total_orders')
          .eq('referred_by', user?.referral_code || 'NO_CODE'),
      ])
      setProfile(pRes.data)
      setWallet(wRes.data || [])
      setReferrals(rRes.data || [])
    } catch(e) {
      console.error('ReferralPage load error:', e)
    }
    setLoading(false)
  }

  // FIX #10: copyCode now copies ONLY the referral code, not the whole message
  function copyCode() {
    const code = profile?.referral_code || ''
    if (!code) return
    navigator.clipboard.writeText(code)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
      .catch(() => {
        // Fallback for browsers that block clipboard
        const el = document.createElement('textarea')
        el.value = code
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
        setCopied(true); setTimeout(() => setCopied(false), 2500)
      })
  }

  function shareWhatsApp() {
    const code = profile?.referral_code || ''
    const msg  = `🌾 Order fresh Sona Masoori rice from Green Village Rice!\nUse my referral code *${code}* and get ₹20 off your first order.\nOrder here: https://gvr-lemon.vercel.app`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function copyShareMessage() {
    const code = profile?.referral_code || ''
    const msg  = `🌾 Order fresh Sona Masoori rice from Green Village Rice!\nUse my referral code *${code}* and get ₹20 off your first order.\nOrder here: https://gvr-lemon.vercel.app`
    navigator.clipboard.writeText(msg)
      .then(() => { setShareMsg(true); setTimeout(() => setShareMsg(false), 2500) })
  }

  const balance     = profile?.wallet_balance || 0
  const totalEarned = wallet.filter(w => w.type === 'credit').reduce((s,w) => s+Number(w.amount), 0)
  const totalUsed   = wallet.filter(w => w.type === 'debit').reduce((s,w) => s+Number(w.amount), 0)
  const fmtRs = v => `₹${Number(v).toLocaleString('en-IN')}`

  if (loading) return (
    <div style={{ textAlign:'center', padding:60, color:G.muted }}>
      <div style={{ fontSize:32, marginBottom:10 }}>🎁</div>
      <p>Loading your referral dashboard...</p>
    </div>
  )

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", maxWidth:600, margin:'0 auto' }}>

      {/* Wallet balance card */}
      <div style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`, borderRadius:20, padding:'24px 28px', marginBottom:20, color:G.white }}>
        <p style={{ margin:'0 0 4px', fontSize:13, color:'rgba(255,255,255,0.7)' }}>GVR Wallet Balance</p>
        <p style={{ margin:'0 0 4px', fontSize:42, fontWeight:800 }}>₹{Number(balance).toFixed(2)}</p>
        <p style={{ margin:'0 0 16px', fontSize:12, color:'rgba(255,255,255,0.6)' }}>
          {balance > 0
            ? '✅ Applied automatically on your next order'
            : 'Refer friends to earn wallet credits'}
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[
            ['Total Earned',     fmtRs(totalEarned),  '💰'],
            ['Total Used',       fmtRs(totalUsed),    '🛒'],
            ['Friends Referred', referrals.length,    '👥'],
          ].map(([label, val, icon]) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.12)', borderRadius:12, padding:'12px 14px', textAlign:'center' }}>
              <p style={{ margin:'0 0 4px', fontSize:11, color:'rgba(255,255,255,0.7)' }}>{label}</p>
              <p style={{ margin:0, fontSize:17, fontWeight:700 }}>{icon} {val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral code */}
      <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ margin:'0 0 4px', fontSize:15, fontWeight:700, color:G.text }}>🎁 Your Referral Code</p>
        <p style={{ margin:'0 0 16px', fontSize:13, color:G.muted }}>
          Share with friends — you both get <strong style={{ color:G.green }}>₹20</strong> when they place their first order
        </p>

        {/* Code display */}
        <div style={{ background:'#F9FAF7', borderRadius:14, padding:'16px 18px', border:`2px dashed ${G.green}`, textAlign:'center', marginBottom:14 }}>
          <p style={{ margin:'0 0 6px', fontSize:11, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', fontWeight:600 }}>Your Code</p>
          <p style={{ margin:'0 0 8px', fontSize:32, fontWeight:900, letterSpacing:'5px', color:G.greenDark, fontFamily:'monospace' }}>
            {profile?.referral_code || '——'}
          </p>
          {/* FIX #10: copy only the code, not the full message */}
          <button onClick={copyCode} style={{
            padding:'8px 24px', background:copied?G.green:G.greenLight,
            border:'none', borderRadius:20, cursor:'pointer',
            fontSize:13, fontWeight:700,
            color:copied?G.white:G.green, transition:'all 0.2s'
          }}>
            {copied ? '✓ Code Copied!' : '📋 Copy Code'}
          </button>
        </div>

        {/* Share buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button onClick={shareWhatsApp} style={{
            padding:'12px', background:'#25D366', color:G.white,
            border:'none', borderRadius:12, fontSize:14, fontWeight:700,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8
          }}>
            <span style={{ fontSize:18 }}>💬</span> Share on WhatsApp
          </button>
          <button onClick={copyShareMessage} style={{
            padding:'12px', background:shareMsg?G.blue:G.blueLight, color:shareMsg?G.white:G.blue,
            border:'none', borderRadius:12, fontSize:14, fontWeight:700,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            transition:'all 0.2s'
          }}>
            <span style={{ fontSize:18 }}>🔗</span> {shareMsg ? '✓ Copied!' : 'Copy Message'}
          </button>
        </div>

        {/* Preview the share message */}
        <div style={{ marginTop:12, background:'#F9FAF7', borderRadius:10, padding:'10px 14px', border:`1px solid ${G.border}` }}>
          <p style={{ margin:'0 0 5px', fontSize:10, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.5px' }}>Message Preview</p>
          <p style={{ margin:0, fontSize:12, color:G.muted, lineHeight:1.7 }}>
            🌾 Order fresh Sona Masoori rice from Green Village Rice!<br/>
            Use my referral code <strong style={{ color:G.greenDark, fontFamily:'monospace', fontSize:13 }}>{profile?.referral_code||'——'}</strong> and get ₹20 off.<br/>
            Order: https://gvr-lemon.vercel.app
          </p>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background:G.white, borderRadius:16, padding:'18px 22px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ margin:'0 0 14px', fontSize:14, fontWeight:700 }}>How Referral Works</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            [G.green,  '📤', '1', 'Share your code or message with friends and family'],
            [G.blue,   '📱', '2', "Friend uses your code when signing up"],
            [G.amber,  '💰', '3', 'Both of you get ₹20 wallet credit when they place first order'],
            [G.purple, '🛒', '4', 'Wallet balance is applied automatically at checkout'],
          ].map(([color, icon, step, text]) => (
            <div key={step} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px', background:'#F9FAF7', borderRadius:12 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:color, color:G.white, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0 }}>{step}</div>
              <span style={{ fontSize:18 }}>{icon}</span>
              <p style={{ margin:0, fontSize:13, color:G.text }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Friends referred */}
      <div style={{ background:G.white, borderRadius:16, padding:'18px 22px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ margin:'0 0 14px', fontSize:14, fontWeight:700 }}>
          👥 Friends You Referred
          <span style={{ marginLeft:8, fontSize:12, fontWeight:600, padding:'2px 10px', borderRadius:20, background:referrals.length>0?G.greenLight:'#F3F4F6', color:referrals.length>0?G.green:G.muted }}>
            {referrals.length}
          </span>
        </p>

        {referrals.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:G.muted }}>
            <div style={{ fontSize:36, marginBottom:8 }}>👥</div>
            <p style={{ margin:'0 0 4px', fontWeight:600, color:G.text }}>No referrals yet</p>
            <p style={{ fontSize:12 }}>Share your code above to start earning</p>
          </div>
        ) : (
          referrals.map((r, i) => (
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<referrals.length-1?`1px solid ${G.border}`:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:G.green }}>
                  {r.full_name?.[0] || r.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:13 }}>{r.full_name || r.username}</p>
                  <p style={{ margin:0, fontSize:11, color:G.muted }}>Joined {new Date(r.created_at).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</p>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ margin:0, fontSize:12, color:G.green, fontWeight:600 }}>{r.total_orders||0} orders</p>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:G.greenLight, color:G.green, fontWeight:600 }}>+₹20 earned</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Wallet transaction history */}
      <div style={{ background:G.white, borderRadius:16, padding:'18px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ margin:'0 0 14px', fontSize:14, fontWeight:700 }}>💳 Wallet History</p>

        {wallet.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px 0', color:G.muted }}>
            <div style={{ fontSize:36, marginBottom:8 }}>💳</div>
            <p style={{ margin:'0 0 4px', fontWeight:600, color:G.text }}>No transactions yet</p>
            <p style={{ fontSize:12 }}>Refer friends or place orders to earn wallet credits</p>
          </div>
        ) : (
          wallet.slice(0, 15).map((w, i) => (
            <div key={w.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<Math.min(wallet.length,15)-1?`1px solid ${G.border}`:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                  background: w.type==='credit' ? G.greenLight : G.redLight }}>
                  {w.type === 'credit' ? '💰' : '🛒'}
                </div>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:500 }}>{w.reason || 'Transaction'}</p>
                  <p style={{ margin:0, fontSize:11, color:G.muted }}>{new Date(w.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>
              </div>
              <span style={{ fontSize:15, fontWeight:800, color:w.type==='credit'?G.green:G.red }}>
                {w.type === 'credit' ? '+' : '−'}₹{Number(w.amount).toFixed(0)}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  )
}

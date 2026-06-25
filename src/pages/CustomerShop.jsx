import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'
import ProfilePage from './ProfilePage'

const SHOP_STRINGS = {
  en: { orderRice:'Order Rice', myOrders:'My Orders', subscribe:'Subscribe', referEarn:'Refer & Earn', addToCart:'Add +', checkout:'Checkout', placeOrder:'Place Order', homeDelivery:'Home Delivery', storePickup:'Store Pickup', cashOnDelivery:'Cash on Delivery', upiPayment:'UPI Payment', orderPlaced:'Order Placed!', trackOrder:'Track My Order', orderMore:'Order More Rice', outOfStock:'Out of Stock', logout:'Logout', whereWeWork:'Where We Work', whatWeDo:'What We Do', about:'About', freshStock:'Fresh stock available today' },
  te: { orderRice:'బియ్యం ఆర్డర్', myOrders:'నా ఆర్డర్లు', subscribe:'సబ్‌స్క్రైబ్', referEarn:'రెఫర్ & సంపాదించండి', addToCart:'చేర్చండి +', checkout:'చెక్అవుట్', placeOrder:'ఆర్డర్ పెట్టండి', homeDelivery:'ఇంటికి డెలివరీ', storePickup:'స్టోర్ పికప్', cashOnDelivery:'డెలివరీలో నగదు', upiPayment:'UPI చెల్లింపు', orderPlaced:'ఆర్డర్ పెట్టారు!', trackOrder:'ఆర్డర్ ట్రాక్ చేయండి', orderMore:'మరింత బియ్యం', outOfStock:'స్టాక్ లేదు', logout:'లాగ్ అవుట్', whereWeWork:'మేము ఎక్కడ పని చేస్తాం', whatWeDo:'మేము ఏమి చేస్తాం', about:'గురించి', freshStock:'ఈరోజు తాజా స్టాక్ అందుబాటులో ఉంది' }
}

function ShopLangToggle({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setOpen(!open)} style={{ display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:20,padding:'4px 10px',cursor:'pointer',color:'#fff',fontSize:11,fontWeight:600 }}>
        <span>{lang==='te'?'🇮🇳':'🌐'}</span>{lang==='te'?'తె':'EN'}
      </button>
      {open && (
        <div style={{ position:'absolute',top:'110%',right:0,background:'#fff',borderRadius:12,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',overflow:'hidden',minWidth:120,zIndex:999 }}>
          {[['en','🌐','English'],['te','🇮🇳','తెలుగు']].map(([code,flag,label])=>(
            <button key={code} onClick={()=>{setLang(code);setOpen(false)}} style={{ width:'100%',padding:'9px 12px',display:'flex',alignItems:'center',gap:8,background:lang===code?'#EAF3DE':'#fff',border:'none',borderBottom:'1px solid #F3F4F6',cursor:'pointer' }}>
              <span style={{fontSize:15}}>{flag}</span>
              <span style={{fontSize:12,fontWeight:600,color:'#111827'}}>{label}</span>
              {lang===code && <span style={{marginLeft:'auto',color:'#3B6D11',fontWeight:700,fontSize:11}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const STATUS_COLOR = { pending:G.amber,confirmed:G.blue,packed:G.green2,dispatched:'#7C3AED',delivered:G.green,cancelled:G.red }
const STATUS_BG    = { pending:G.amberLight,confirmed:G.blueLight,packed:G.greenLight,dispatched:'#EDE9FE',delivered:G.greenLight,cancelled:G.redLight }
const BRANCHES     = ['Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu']

function TopNavModal({ modal, onClose }) {
  if (!modal) return null
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:580,maxHeight:'85vh',overflowY:'auto',padding:32 }}>
        {modal==='where' && <>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:'#27500A' }}>📍 Where We Work</h2>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#6B7280' }}>✕</button>
          </div>
          <p style={{ color:'#6B7280',fontSize:14,lineHeight:1.7,marginBottom:18 }}>Green Village Rice serves customers across <strong style={{color:'#3B6D11'}}>Hyderabad and Secunderabad</strong>.</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {[{area:'Kukatpally',icon:'🏙️',desc:'KPHB, JNTU, Miyapur'},{area:'Hitech City',icon:'💻',desc:'Madhapur, Gachibowli'},{area:'Secunderabad',icon:'🏛️',desc:'Trimulgherry, Karkhana'},{area:'Dilsukhnagar',icon:'🌆',desc:'LB Nagar, Malakpet'},{area:'Ameerpet',icon:'🏢',desc:'SR Nagar, Punjagutta'},{area:'Uppal',icon:'🏭',desc:'Nacharam, Habsiguda'}].map(a=>(
              <div key={a.area} style={{ background:'#F4F6F3',borderRadius:12,padding:'12px 14px',display:'flex',gap:10 }}>
                <span style={{ fontSize:20 }}>{a.icon}</span>
                <div><p style={{ margin:'0 0 2px',fontWeight:700,fontSize:13 }}>{a.area}</p><p style={{ margin:0,fontSize:11,color:'#6B7280' }}>{a.desc}</p></div>
              </div>
            ))}
          </div>
        </>}
        {modal==='what' && <>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:'#27500A' }}>🌾 What We Do</h2>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#6B7280' }}>✕</button>
          </div>
          {[{icon:'🌱',title:'Farm Sourcing',desc:'Directly from certified paddy farmers in Nalgonda, Khammam, and Warangal.'},{icon:'⚙️',title:'Fresh Milling',desc:'Milled in small batches with packing date on every pack.'},{icon:'📦',title:'Quality Packing',desc:'1kg and 5kg packs. FSSAI-compliant with best-before dates.'},{icon:'🚪',title:'Doorstep Delivery',desc:'Orders delivered to your home within hours.'},{icon:'💰',title:'Fair Pricing',desc:'Sona Masoori 1kg ₹68, Sona Masoori 5kg ₹320, Basmati 1kg ₹95, and Basmati 5kg ₹440.'}].map(item=>(
            <div key={item.title} style={{ display:'flex',gap:12,padding:'12px 14px',background:'#F9FAF7',borderRadius:12,borderLeft:'3px solid #3B6D11',marginBottom:8 }}>
              <span style={{ fontSize:22,flexShrink:0 }}>{item.icon}</span>
              <div><p style={{ margin:'0 0 3px',fontWeight:700,fontSize:14 }}>{item.title}</p><p style={{ margin:0,fontSize:13,color:'#6B7280',lineHeight:1.6 }}>{item.desc}</p></div>
            </div>
          ))}
        </>}
        {modal==='about' && <>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:'#27500A' }}>🌾 About Green Village Rice</h2>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#6B7280' }}>✕</button>
          </div>
          <p style={{ color:'#6B7280',fontSize:14,lineHeight:1.8,marginBottom:16 }}>We are a <strong style={{color:'#3B6D11'}}>direct-to-consumer rice brand</strong> sourcing premium Sona Masoori from Telangana farms.</p>
          <div style={{ background:'#EAF3DE',borderRadius:12,padding:'12px 16px' }}>
            <p style={{ margin:'0 0 8px',fontWeight:700,fontSize:13,color:'#27500A' }}>Our Products</p>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {[['Sona Masoori 1kg','₹68'],['Sona Masoori 5kg','₹320'],['Basmati 1kg','₹95'],['Basmati 5kg','₹440']].map(([name,price])=>(
                <span key={name} style={{ fontSize:12,padding:'4px 12px',borderRadius:20,background:'#fff',color:'#3B6D11',fontWeight:600 }}>{name} — {price}</span>
              ))}
            </div>
          </div>
        </>}
      </div>
    </div>
  )
}

// FIX #1 & #2: ReferralSection now receives D as a prop so it doesn't crash
function ReferralSection({ user, D }) {
  const [profile, setProfile] = useState(null)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    if (!user?.id) return

    async function loadReferralProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('referral_code,wallet_balance')
        .eq('id', user.id)
        .single()

      setProfile(data || null)
    }

    loadReferralProfile()
  }, [user])

  function share() {
    const code = profile?.referral_code || ''
    const msg  = `🌾 Order fresh Sona Masoori rice from Green Village Rice!\nUse my referral code *${code}* and get ₹20 off!\nOrder: https://gvr-lemon.vercel.app`
    navigator.clipboard.writeText(msg).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div style={{ padding:16 }}>
      <div style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`, borderRadius:16, padding:'20px 22px', marginBottom:16, color:G.white }}>
        <p style={{ margin:'0 0 4px', fontSize:12, color:'rgba(255,255,255,0.7)' }}>GVR Wallet</p>
        <p style={{ margin:'0 0 12px', fontSize:32, fontWeight:800 }}>₹{Number(profile?.wallet_balance||0).toFixed(0)}</p>
        <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.7)' }}>Earn ₹20 for every friend you refer</p>
      </div>
      <div style={{ background:D.card, borderRadius:14, padding:18, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:700 }}>🎁 Your Referral Code</p>
        <p style={{ margin:'0 0 14px', fontSize:12, color:D.muted }}>Share with friends — you both get ₹20 when they place first order</p>
        <div style={{ padding:'14px 18px', background:'#F9FAF7', borderRadius:12, border:`2px dashed ${G.green}`, textAlign:'center', marginBottom:12 }}>
          <p style={{ margin:0, fontSize:26, fontWeight:900, letterSpacing:'4px', color:G.greenDark, fontFamily:'monospace' }}>{profile?.referral_code || 'Loading...'}</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button onClick={share} style={{ padding:'11px', background:copied?G.green:G.greenLight, color:copied?G.white:G.green, border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
          <button onClick={() => {
            const code = profile?.referral_code||''
            const msg  = `🌾 Order fresh rice from Green Village Rice!\nUse code *${code}* — get ₹20 off!\nhttps://gvr-lemon.vercel.app`
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
          }} style={{ padding:'11px', background:'#25D366', color:G.white, border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            💬 WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

// FIX #1 & #2: SubscribeSection receives both switchTab and D as props
function SubscribeSection({ user, D, switchTab }) {
  const [products, setProducts] = useState([])
  const [mySubs, setMySubs]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('browse') // local tab within subscribe section

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*').eq('active',true).order('weight_kg'),
      supabase.from('subscriptions').select('*').eq('customer_id',user.id).order('created_at',{ascending:false})
    ]).then(([pRes, sRes]) => {
      setProducts(pRes.data||[])
      setMySubs(sRes.data||[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function subscribe(product, freq) {
    const days   = freq==='weekly'?7:freq==='biweekly'?14:30
    const disc   = freq==='weekly'?3:freq==='biweekly'?4:5
    const next   = new Date(); next.setDate(next.getDate()+days)
    try {
      await supabase.from('subscriptions').insert({
        customer_id:    user.id,
        customer_name:  user.full_name||user.username,
        product_id:     product.id,
        product_name:   product.name,
        quantity_bags:  1,
        frequency:      freq,
        next_order_date: next.toISOString().split('T')[0],
        discount_pct:   disc,
        status:         'active',
        address:        user.address||'',
        phone:          user.phone||'',
        payment_method: 'upi',
        created_at:     new Date().toISOString()
      })
      const { data } = await supabase.from('subscriptions').select('*').eq('customer_id',user.id).order('created_at',{ascending:false})
      setMySubs(data||[])
      setTab('mysubs')
    } catch(e) { alert('Subscribe failed: '+e.message) }
  }

  async function updateSub(id, status) {
    await supabase.from('subscriptions').update({status}).eq('id',id)
    setMySubs(prev=>prev.map(s=>s.id===id?{...s,status}:s))
  }

  if (loading) return <div style={{ textAlign:'center',padding:40,color:G.muted }}>Loading...</div>

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex',gap:6,marginBottom:14 }}>
        {[['browse','🛒 Plans'],['mysubs',`📋 My Subs (${mySubs.filter(s=>s.status==='active').length})`]].map(([key,label])=>(
          // FIX #1: use local setTab, not the undefined parent switchTab
          <button key={key} onClick={()=>setTab(key)} style={{ padding:'7px 16px',borderRadius:20,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:tab===key?G.green:'#F3F4F6',color:tab===key?G.white:G.muted }}>
            {label}
          </button>
        ))}
      </div>

      {tab==='browse' && (
        <>
          <div style={{ background:G.greenLight,borderRadius:12,padding:'12px 14px',marginBottom:14,fontSize:12,color:G.greenDark }}>
            💡 Subscribe and save 3–5% on every delivery. Cancel anytime.
          </div>
          {products.map(p=>(
            <div key={p.id} style={{ background:D.card,borderRadius:14,padding:16,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${D.border}` }}>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12 }}>
                <div style={{ width:44,height:44,borderRadius:10,background:G.greenLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>🌾</div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:14 }}>{p.name}</p>
                  <p style={{ margin:0,fontSize:12,color:G.muted }}>₹{p.price_per_bag}/bag · {p.weight_kg}kg</p>
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8 }}>
                {[['weekly','Weekly','3%'],['biweekly','2 Weeks','4%'],['monthly','Monthly','5% ⭐']].map(([key,label,disc])=>(
                  <button key={key} onClick={()=>subscribe(p,key)} style={{ padding:'10px 6px',background:G.greenLight,border:`1.5px solid ${G.green}`,borderRadius:10,cursor:'pointer',textAlign:'center' }}>
                    <p style={{ margin:'0 0 2px',fontSize:11,fontWeight:700,color:G.greenDark }}>{label}</p>
                    <p style={{ margin:'0 0 2px',fontSize:13,fontWeight:800,color:G.green }}>₹{Math.round(p.price_per_bag*(1-parseInt(disc)/100))}</p>
                    <span style={{ fontSize:10,color:G.green2,fontWeight:600 }}>Save {disc}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {tab==='mysubs' && (
        <>
          {mySubs.length===0 && <div style={{ textAlign:'center',padding:'40px 20px',background:D.card,borderRadius:14,color:D.muted }}><p style={{ fontSize:36,marginBottom:8 }}>🔄</p><p>No subscriptions yet</p></div>}
          {mySubs.map(s=>(
            <div key={s.id} style={{ background:D.card,borderRadius:14,padding:16,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.status==='active'?G.green:s.status==='paused'?G.amber:G.red}` }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                <div>
                  <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:14 }}>{s.product_name}</p>
                  <p style={{ margin:0,fontSize:12,color:D.muted }}>{s.frequency} · {s.discount_pct}% off</p>
                </div>
                <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:s.status==='active'?G.greenLight:s.status==='paused'?G.amberLight:G.redLight,color:s.status==='active'?G.green:s.status==='paused'?G.amber:G.red,textTransform:'capitalize' }}>
                  {s.status}
                </span>
              </div>
              {s.status==='active' && <p style={{ margin:'0 0 10px',fontSize:12,color:G.blue }}>📅 Next: {new Date(s.next_order_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</p>}
              <div style={{ display:'flex',gap:8 }}>
                {s.status==='active' && <button onClick={()=>updateSub(s.id,'paused')} style={{ flex:1,padding:'8px',background:G.amberLight,border:'none',borderRadius:8,fontSize:12,fontWeight:700,color:G.amber,cursor:'pointer' }}>⏸ Pause</button>}
                {s.status==='paused' && <button onClick={()=>updateSub(s.id,'active')} style={{ flex:1,padding:'8px',background:G.greenLight,border:'none',borderRadius:8,fontSize:12,fontWeight:700,color:G.green,cursor:'pointer' }}>▶ Resume</button>}
                {s.status!=='cancelled' && <button onClick={()=>{ if(window.confirm('Cancel subscription?')) updateSub(s.id,'cancelled') }} style={{ flex:1,padding:'8px',background:G.redLight,border:'none',borderRadius:8,fontSize:12,fontWeight:700,color:G.red,cursor:'pointer' }}>✕ Cancel</button>}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ── Helper: safe order number using MAX ───────────────────
// FIX #5: avoids duplicate GVR-XXXX when orders are deleted
async function getNextOrderNumber(prefix = 'GVR') {
  const { data } = await supabase
    .from('orders')
    .select('order_number')
    .like('order_number', `${prefix}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const lastNum = data?.order_number
    ? parseInt(data.order_number.replace(`${prefix}-`, '').replace(/\D/g, ''), 10) || 0
    : 0
  return `${prefix}-${String(lastNum + 1).padStart(4, '0')}`
}

export default function CustomerShop() {
  const { user, signOut }         = useAuth()
  const [lang, setLangState]      = useState(localStorage.getItem('gvr_lang')||'en')
  const [dark, setDarkState]      = useState(localStorage.getItem('gvr_dark')==='1')
  const setDark = (v) => { localStorage.setItem('gvr_dark', v?'1':'0'); setDarkState(v) }
  const D = dark ? {
    bg:'#111827', card:'#1F2937', border:'#374151',
    text:'#F9FAFB', muted:'#9CA3AF', surface:'#0F172A'
  } : {
    bg:G.surface, card:G.white, border:G.border,
    text:G.text, muted:G.muted, surface:G.surface
  }
  const T = SHOP_STRINGS[lang] || SHOP_STRINGS.en
  const setLang = (l) => { localStorage.setItem('gvr_lang',l); setLangState(l) }
  const navigate = useNavigate()

  const [tab, setTab]             = useState('shop')
  // FIX #3: switchTab defined at top level so it can be passed to child components
  const switchTab = useCallback((t) => {
    setTab(t)
    if (t === 'myorders') loadMyOrders()
  }, [])

  // FIX #14: load cart keyed by user ID so different users don't share carts
  const cartKey = `gvr_cart_${user?.id || 'guest'}`
  const [products, setProducts]   = useState([])
  const [cart, setCart]           = useState(() => {
    try { return JSON.parse(localStorage.getItem(cartKey) || '{}') } catch { return {} }
  })
  const [step, setStep]           = useState('shop')
  const [address, setAddress]     = useState(user?.address || localStorage.getItem('gvr_address') || '')
  const [phone, setPhone]         = useState(user?.phone || '')
  const [payMethod, setPayMethod] = useState('cod')
  const [orderType, setOrderType] = useState('delivery')
  const [pickupBranch, setPickupBranch] = useState('')
  const [pickupTime, setPickupTime]     = useState('')
  const [utrRef, setUtrRef]       = useState('')
  const [placing, setPlacing]     = useState(false)
  const placingRef                = useRef(false)
  const [orderNum, setOrderNum]   = useState('')
  const [myOrders, setMyOrders]   = useState([])
  const [reviews, setReviews]     = useState({})
  const [reviewModal, setRevModal]  = useState(null)
  const [reportModal, setRepModal]  = useState(null)
  const [notifyModal, setNotifyModal] = useState(null)
  const [notified, setNotified]   = useState({})
  const [ordersLoading, setOL]    = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [topModal, setTopModal]   = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [points, setPoints]       = useState(0)

  useEffect(() => {
    loadProducts()
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => Notification.requestPermission(), 3000)
      }
    } catch(e) {}
    if (user?.id) {
      supabase.from('profiles').select('wallet_balance,total_orders,total_spent')
        .eq('id', user.id).single()
        .then(({ data }) => { if (data) setPoints(Math.floor((data.total_spent||0)/100)) })
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(cartKey, JSON.stringify(cart)) } catch {}
  }, [cart, cartKey])

  useEffect(() => {
    if (address.trim()) {
      try { localStorage.setItem('gvr_address', address) } catch {}
    }
  }, [address])

  useEffect(() => { if (tab === 'myorders') { setOL(true); loadMyOrders() } }, [tab])

  useEffect(() => {
    if (tab !== 'myorders') return
    const interval = setInterval(() => { loadMyOrders() }, 30000)
    return () => clearInterval(interval)
  }, [tab])

  async function loadProducts() {
    setLoading(true)
    try {
      const { data } = await supabase.from('products').select('*').eq('active', true).order('weight_kg')
      setProducts(data || [])
    } catch(e) { setError('Failed to load products') }
    finally { setLoading(false) }
  }

  async function loadMyOrders() {
    if (!user) return
    setOL(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(name,weight_kg,quantity,price_per_unit)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setMyOrders(data || [])
    } catch(e) {
      console.error(e)
      setMyOrders([])
    } finally { setOL(false) }
  }

  // FIX #14: clear this user's cart on logout
  const handleLogout = async () => {
    try { localStorage.removeItem(cartKey) } catch {}
    await signOut()
    navigate('/login')
  }

  function printInvoice(order) {
    const items = order.order_items || []
    const subtotal = items.reduce((s,i)=>s+(i.price_per_unit*i.quantity),0)
    const gst = Math.round(subtotal*0.05)
    const total = subtotal + gst
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${order.order_number}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;max-width:700px;margin:0 auto}h1{color:#3B6D11}table{width:100%;border-collapse:collapse}th{background:#3B6D11;color:#fff;padding:10px;text-align:left}td{padding:10px;border-bottom:1px solid #eee}.total{font-size:18px;font-weight:700;color:#3B6D11}@media print{button{display:none}}</style></head>
    <body><h1>🌾 Green Village Rice</h1><p>Invoice: ${order.order_number} · ${new Date(order.created_at).toLocaleDateString('en-IN')}</p>
    <p>Customer: ${order.customer_name} · ${order.delivery_address}</p>
    <table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>
    ${items.map(i=>`<tr><td>${i.name}</td><td>${i.quantity}</td><td>₹${i.price_per_unit}</td><td>₹${i.price_per_unit*i.quantity}</td></tr>`).join('')}
    </tbody></table>
    <p>Subtotal: ₹${subtotal} | GST 5%: ₹${gst}</p>
    <p class="total">Total: ₹${total}</p>
    <button onclick="window.print()" style="padding:12px 32px;background:#3B6D11;color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer;margin-top:16px">🖨 Print</button>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 600)
  }

  function NotifyModal({ product, onClose }) {
    const [ph, setPh]       = useState(user?.phone || '')
    const [saving, setSaving] = useState(false)
    const [done, setDone]   = useState(false)

    async function save() {
      if (!ph.trim()) return
      setSaving(true)
      try {
        const { data: existing } = await supabase
          .from('stock_notifications').select('id')
          .eq('product_id', product.id).eq('customer_id', user.id).eq('notified', false).single()
        if (!existing) {
          await supabase.from('stock_notifications').insert({
            product_id: product.id, product_name: product.name,
            customer_id: user.id, customer_name: user.full_name || user.username,
            phone: ph.trim(), notified: false, created_at: new Date().toISOString()
          })
        }
        setNotified(prev => ({ ...prev, [product.id]: true }))
        setDone(true)
        setTimeout(() => onClose(), 2000)
      } catch(e) { console.error(e) }
      finally { setSaving(false) }
    }

    return (
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:16 }}>
        <div style={{ background:D.card,borderRadius:'20px 20px 0 0',width:'100%',maxWidth:480,padding:28 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
            <p style={{ margin:0,fontSize:17,fontWeight:700,color:D.text }}>🔔 Notify Me</p>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:D.muted }}>✕</button>
          </div>
          {done ? (
            <div style={{ textAlign:'center',padding:'24px 0' }}>
              <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
              <p style={{ fontSize:16,fontWeight:700,color:G.green }}>You are on the list!</p>
            </div>
          ) : (
            <>
              <p style={{ margin:'0 0 14px',fontSize:13,color:D.muted,lineHeight:1.7 }}>We'll notify you on WhatsApp when <strong>{product.name}</strong> is back in stock.</p>
              <input type="tel" value={ph} onChange={e=>setPh(e.target.value)}
                placeholder="Your mobile number"
                style={{ width:'100%',padding:'12px 14px',borderRadius:10,border:`1.5px solid ${ph?G.green:D.border}`,fontSize:14,outline:'none',background:D.bg,color:D.text,boxSizing:'border-box',marginBottom:14 }} />
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                <button onClick={onClose} style={{ padding:12,background:'transparent',border:`1px solid ${D.border}`,borderRadius:10,fontSize:13,fontWeight:600,color:D.muted,cursor:'pointer' }}>Cancel</button>
                <button onClick={save} disabled={saving||!ph.trim()} style={{ padding:12,background:saving||!ph.trim()?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer' }}>
                  {saving ? 'Saving...' : '🔔 Notify Me'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  function ReportModal({ order, onClose }) {
    const [issue, setIssue]     = useState('')
    const [details, setDetails] = useState('')
    const [saving, setSaving]   = useState(false)
    const [done, setDone]       = useState(false)
    const ISSUES = ['📦 Wrong item received','⚖️ Less quantity / short weight','🍚 Poor rice quality','💧 Damaged / wet packaging','🚚 Late delivery','💰 Payment issue','📱 App / order problem','🔄 Other issue']
    async function submit() {
      if (!issue) return
      setSaving(true)
      try {
        await supabase.from('orders').update({ notes: (order.notes||'') + ` | ⚠️ ISSUE: ${issue} — ${details}` }).eq('id', order.id)
        setDone(true); setTimeout(() => onClose(), 2000)
      } catch(e) { console.error(e) } finally { setSaving(false) }
    }
    return (
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:16 }}>
        <div style={{ background:D.card,borderRadius:'20px 20px 0 0',width:'100%',maxWidth:500,padding:28,maxHeight:'85vh',overflowY:'auto' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
            <p style={{ margin:0,fontSize:17,fontWeight:700,color:D.text }}>⚠️ Report an Issue</p>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:D.muted }}>✕</button>
          </div>
          {done ? <div style={{ textAlign:'center',padding:'24px 0' }}><p style={{ fontSize:40,marginBottom:10 }}>✅</p><p style={{ fontSize:16,fontWeight:700,color:G.green }}>Issue reported!</p><p style={{ fontSize:13,color:D.muted,marginTop:6 }}>Our team will contact you within 24 hours.</p></div> : <>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14 }}>
              {ISSUES.map(i=>(<button key={i} onClick={()=>setIssue(i)} style={{ padding:'10px 8px',borderRadius:10,border:`1.5px solid ${issue===i?G.red:D.border}`,background:issue===i?G.redLight:'transparent',color:issue===i?G.red:D.text,fontSize:12,fontWeight:issue===i?700:400,cursor:'pointer',textAlign:'left' }}>{i}</button>))}
            </div>
            <textarea value={details} onChange={e=>setDetails(e.target.value)} rows={3} placeholder="Describe the issue..." style={{ width:'100%',padding:'10px 12px',borderRadius:10,border:`1.5px solid ${D.border}`,fontSize:13,outline:'none',resize:'none',fontFamily:'inherit',background:D.bg,color:D.text,boxSizing:'border-box',marginBottom:14 }} />
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <button onClick={onClose} style={{ padding:12,background:'transparent',border:`1px solid ${D.border}`,borderRadius:10,fontSize:13,fontWeight:600,color:D.muted,cursor:'pointer' }}>Cancel</button>
              <button onClick={submit} disabled={saving||!issue} style={{ padding:12,background:saving||!issue?'#9CA3AF':G.red,color:G.white,border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer' }}>{saving?'Reporting...':'Report Issue'}</button>
            </div>
          </>}
        </div>
      </div>
    )
  }

  function ReviewModal({ order, onClose }) {
    const [rating, setRating]   = useState(5)
    const [comment, setComment] = useState('')
    const [saving, setSaving]   = useState(false)
    const [done, setDone]       = useState(false)
    async function submit() {
      setSaving(true)
      try {
        await supabase.from('orders').update({ notes: (order.notes||'') + ` | ⭐${rating} — ${comment}` }).eq('id', order.id)
        setReviews(prev => ({ ...prev, [order.id]: { rating, comment } }))
        setDone(true); setTimeout(() => onClose(), 1500)
      } catch(e) { console.error(e) } finally { setSaving(false) }
    }
    return (
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:16 }}>
        <div style={{ background:D.card,borderRadius:'20px 20px 0 0',width:'100%',maxWidth:500,padding:28 }}>
          <p style={{ margin:'0 0 4px',fontSize:17,fontWeight:700,color:D.text }}>Rate Your Order</p>
          <p style={{ margin:'0 0 16px',fontSize:13,color:D.muted }}>{order.order_number}</p>
          {done ? <div style={{ textAlign:'center',padding:'20px 0' }}><p style={{ fontSize:40,marginBottom:10 }}>🙏</p><p style={{ fontSize:16,fontWeight:700,color:G.green }}>Thank you!</p></div> : <>
            <div style={{ display:'flex',gap:8,justifyContent:'center',marginBottom:16 }}>
              {[1,2,3,4,5].map(s=>(<button key={s} onClick={()=>setRating(s)} style={{ fontSize:36,background:'none',border:'none',cursor:'pointer',opacity:s<=rating?1:0.3 }}>★</button>))}
            </div>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={2} placeholder="Tell us more..." style={{ width:'100%',padding:'10px 12px',borderRadius:10,border:`1.5px solid ${D.border}`,fontSize:13,outline:'none',resize:'none',fontFamily:'inherit',background:D.bg,color:D.text,boxSizing:'border-box',marginBottom:14 }} />
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <button onClick={onClose} style={{ padding:12,background:'transparent',border:`1px solid ${D.border}`,borderRadius:10,fontSize:13,fontWeight:600,color:D.muted,cursor:'pointer' }}>Skip</button>
              <button onClick={submit} disabled={saving} style={{ padding:12,background:saving?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer' }}>{saving?'Saving...':'Submit ⭐'}</button>
            </div>
          </>}
        </div>
      </div>
    )
  }

  const totalItems  = Object.values(cart).reduce((s,q) => s+q, 0)
  const totalAmount = products.reduce((s,p) => s+(cart[p.id]||0)*p.price_per_bag, 0)
  const gst         = Math.round(totalAmount * 0.05)
  const grand       = totalAmount + gst

  const updateCart = (id, delta) => {
    setCart(prev => {
      const product = products.find(p => p.id === id)
      const maxStock = Number(product?.stock_bags || 0)
      const nextQty = Math.max(0, (prev[id] || 0) + delta)
      const qty = Math.min(nextQty, maxStock)

      if (qty === 0) {
        const n = { ...prev }
        delete n[id]
        return n
      }

      return { ...prev, [id]: qty }
    })
  }

  async function placeOrder() {
    // Prevent double-click / repeated submit from creating duplicate orders
    if (placingRef.current || placing) return

    if (orderType === 'delivery' && !address.trim()) {
      setError('Please enter delivery address')
      return
    }

    if (orderType === 'pickup' && !pickupBranch) {
      setError('Please select a pickup branch')
      return
    }

    if (payMethod === 'upi' && !utrRef.trim()) {
      setError('Please enter UPI transaction ID after payment')
      return
    }

    placingRef.current = true
    setError('')
    setPlacing(true)

    let order = null

    try {
      // Check wallet balance and deduct from order total
      let walletDeduction = 0
      let finalTotal = grand

      if (user?.id) {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('wallet_balance,referred_by,total_orders')
          .eq('id', user.id)
          .single()

        if (!profErr && prof) {
          const walletBal = Number(prof.wallet_balance || 0)
          if (walletBal > 0) {
            walletDeduction = Math.min(walletBal, grand)
            finalTotal = Math.max(0, grand - walletDeduction)
          }
        }
      }

      const orderNumber = await getNextOrderNumber('GVR')

      const { data: newOrder, error: oErr } = await supabase
        .from('orders')
        .insert({
          order_number:     orderNumber,
          customer_id:      user?.id || null,
          customer_name:    user?.full_name || user?.username || 'Customer',
          delivery_address: orderType === 'pickup' ? `Pickup: ${pickupBranch}` : address,
          total_amount:     finalTotal,
          status:           'pending',
          order_type:       orderType,
          pickup_branch:    orderType === 'pickup' ? pickupBranch : null,
          pickup_time:      orderType === 'pickup' ? pickupTime : null,
          payment_status:   utrRef.trim() ? 'verification_pending' : 'pending',
          payment_method:   payMethod,
          notes:            [
            utrRef.trim() ? `Payment Ref: ${utrRef.trim()}` : null,
            walletDeduction > 0 ? `Wallet used: ₹${walletDeduction}` : null
          ].filter(Boolean).join(' · ') || null,
          created_at:       new Date().toISOString()
        })
        .select()
        .single()

      if (oErr || !newOrder) {
        throw new Error(oErr?.message || 'Failed to create order')
      }

      order = newOrder

      // Critical step: create order items.
      // Do NOT reduce product stock here. Stock is deducted only when admin confirms the order.
      for (const p of products.filter(p => cart[p.id])) {
        const { error: itemErr } = await supabase.from('order_items').insert({
          order_id:       order.id,
          product_id:     p.id,
          name:           p.name,
          weight_kg:      p.weight_kg,
          quantity:       cart[p.id],
          price_per_unit: p.price_per_bag
        })

        if (itemErr) {
          throw itemErr
        }
      }

      // Non-critical updates below must not fail the completed order.
      // If any of these fail, the order still remains created and customer sees success.
      if (user?.id) {
        if (walletDeduction > 0) {
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('wallet_balance')
              .eq('id', user.id)
              .single()

            const newBal = Math.max(0, Number(prof?.wallet_balance || 0) - walletDeduction)

            await supabase
              .from('profiles')
              .update({ wallet_balance: newBal })
              .eq('id', user.id)

            await supabase.from('wallet_transactions').insert({
              user_id:    user.id,
              amount:     walletDeduction,
              type:       'debit',
              reason:     `Wallet applied to order ${orderNumber}`,
              order_id:   order.id,
              created_at: new Date().toISOString()
            })
          } catch (walletErr) {
            console.error('Wallet update failed:', walletErr)
          }
        }

        try {
          const { error: statsErr } = await supabase.rpc('increment_customer_stats', {
            user_id: user.id,
            order_amount: finalTotal
          })

          if (statsErr) {
            const { data: statsProfile } = await supabase
              .from('profiles')
              .select('total_spent,total_orders')
              .eq('id', user.id)
              .single()

            if (statsProfile) {
              await supabase
                .from('profiles')
                .update({
                  total_spent: Number(statsProfile.total_spent || 0) + finalTotal,
                  total_orders: Number(statsProfile.total_orders || 0) + 1
                })
                .eq('id', user.id)
            }
          }
        } catch (statsErr) {
          console.error('Customer stats update failed:', statsErr)
        }

        try {
          const { data: profCheck } = await supabase
            .from('profiles')
            .select('referred_by,total_orders')
            .eq('id', user.id)
            .single()

          if (profCheck?.referred_by && Number(profCheck.total_orders || 0) <= 1) {
            await supabase.rpc('credit_referral_reward', {
              new_customer_id: user.id,
              referrer_code:   profCheck.referred_by
            })
          }
        } catch (referralErr) {
          console.error('Referral reward failed:', referralErr)
        }
      }

      try { localStorage.removeItem(cartKey) } catch {}

      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🌾 Order Placed! ✅', {
            body: `Order ${orderNumber} for ₹${finalTotal} received.`
          })
        }
      } catch (notificationErr) {
        console.error('Notification failed:', notificationErr)
      }

      setOrderNum(orderNumber)
      setCart({})
      setAddress('')
      setUtrRef('')
      setStep('success')
    } catch (e) {
      console.error('Place order failed:', e)

      // Roll back only if the critical item insert failed after the order was created.
      if (order?.id) {
        try {
          await supabase.from('order_items').delete().eq('order_id', order.id)
          await supabase.from('orders').delete().eq('id', order.id)
        } catch (rollbackErr) {
          console.error('Order rollback failed:', rollbackErr)
        }
      }

      setError(e.message || 'Failed to place order')
    } finally {
      placingRef.current = false
      setPlacing(false)
    }
  }

  const UPI_ID = import.meta.env.VITE_UPI_ID || '19120sathish.ss1@ybl'
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Green+Village+Rice&am=${grand}&cu=INR&tn=GVR+Order`
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`

  if (step === 'success') return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:G.surface,padding:20 }}>
      <div style={{ textAlign:'center',background:G.white,borderRadius:20,padding:'48px 40px',maxWidth:400,width:'100%',boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:60,marginBottom:16 }}>✅</div>
        <h2 style={{ fontSize:24,fontWeight:800,color:G.greenDark,margin:'0 0 8px' }}>{T.orderPlaced}</h2>
        <p style={{ color:G.muted,margin:'0 0 4px',fontSize:14 }}>Order: <strong style={{color:G.green}}>{orderNum}</strong></p>
        <p style={{ color:G.green,margin:'0 0 4px',fontSize:13 }}>⭐ +{Math.floor(grand/100)} loyalty points earned!</p>
        <p style={{ color:G.muted,margin:'0 0 28px',fontSize:13 }}>We will deliver your fresh rice soon 🌾</p>
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <button onClick={()=>{ setStep('shop'); setTab('myorders') }} style={{ background:G.green,color:G.white,border:'none',borderRadius:12,padding:'12px',fontSize:14,fontWeight:700,cursor:'pointer' }}>{T.trackOrder} →</button>
          <button onClick={()=>{ setStep('shop'); setTab('shop') }} style={{ background:G.greenLight,color:G.green,border:'none',borderRadius:12,padding:'12px',fontSize:14,fontWeight:600,cursor:'pointer' }}>{T.orderMore}</button>
        </div>
      </div>
    </div>
  )

  if (step === 'checkout') return (
    <div style={{ minHeight:'100vh',background:D.bg }}>
      <TopNavModal modal={topModal} onClose={()=>setTopModal(null)} />
      <header style={{ background:G.green,padding:'14px 20px',display:'flex',alignItems:'center',gap:12 }}>
        <button onClick={()=>{ setStep('shop'); setError('') }} style={{ background:'none',border:'none',color:G.white,fontSize:22,cursor:'pointer' }}>←</button>
        <span style={{ color:G.white,fontWeight:700,fontSize:16 }}>Checkout</span>
      </header>
      <div style={{ maxWidth:500,margin:'0 auto',padding:'16px 16px 100px' }}>
        {error && <div style={{ background:G.redLight,border:`1px solid #FECACA`,borderRadius:10,padding:'10px 14px',marginBottom:14,color:G.red,fontSize:13,display:'flex',justifyContent:'space-between' }}>
          <span>{error}</span><button onClick={()=>setError('')} style={{ background:'none',border:'none',cursor:'pointer',color:G.red,fontSize:16 }}>✕</button>
        </div>}

        <div style={{ background:G.white,borderRadius:14,padding:18,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700,margin:'0 0 12px',fontSize:15 }}>Your Order</p>
          {products.filter(p=>cart[p.id]).map(p=>(
            <div key={p.id} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${G.border}` }}>
              <div><p style={{ margin:'0 0 2px',fontSize:14,fontWeight:500 }}>{p.name}</p><p style={{ margin:0,fontSize:12,color:G.muted }}>₹{p.price_per_bag} × {cart[p.id]}</p></div>
              <span style={{ fontWeight:700 }}>₹{cart[p.id]*p.price_per_bag}</span>
            </div>
          ))}
          <div style={{ marginTop:10,fontSize:13 }}>
            <div style={{ display:'flex',justifyContent:'space-between',padding:'3px 0',color:G.muted }}><span>Subtotal</span><span>₹{totalAmount}</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',padding:'3px 0',color:G.muted }}><span>GST (5%)</span><span>₹{gst}</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',padding:'8px 0 0',fontWeight:700,fontSize:15,color:G.green,borderTop:`1px solid ${G.border}`,marginTop:4 }}><span>Total</span><span>₹{grand}</span></div>
          </div>
        </div>

        <div style={{ background:G.white,borderRadius:14,padding:18,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700,margin:'0 0 12px',fontSize:15 }}>How do you want your order?</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14 }}>
            {[['delivery','🚚',T.homeDelivery,'₹15 delivery fee'],['pickup','🏪',T.storePickup,'Free — collect at branch']].map(([val,icon,label,sub])=>(
              <div key={val} onClick={()=>setOrderType(val)} style={{ padding:12,borderRadius:12,cursor:'pointer',border:`2px solid ${orderType===val?G.green:G.border}`,background:orderType===val?G.greenLight:G.white,textAlign:'center' }}>
                <div style={{ fontSize:24,marginBottom:4 }}>{icon}</div>
                <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:13,color:orderType===val?G.greenDark:G.text }}>{label}</p>
                <p style={{ margin:0,fontSize:11,color:G.muted }}>{sub}</p>
              </div>
            ))}
          </div>
          {orderType==='delivery' && (
            <>
              <textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="House/flat number, street, area, landmark..." rows={3}
                style={{ width:'100%',padding:12,borderRadius:10,border:`1.5px solid ${address?G.green:G.border}`,fontSize:14,resize:'none',outline:'none',boxSizing:'border-box',fontFamily:'inherit',marginBottom:8 }} />
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number for delivery" type="tel"
                style={{ width:'100%',padding:12,borderRadius:10,border:`1.5px solid ${G.border}`,fontSize:14,outline:'none',boxSizing:'border-box' }} />
            </>
          )}
          {orderType==='pickup' && (
            <>
              <p style={{ margin:'0 0 8px',fontSize:13,fontWeight:600 }}>Select Pickup Branch *</p>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
                {BRANCHES.map(b=>(
                  <div key={b} onClick={()=>setPickupBranch(b)} style={{ padding:'9px 12px',borderRadius:10,cursor:'pointer',border:`2px solid ${pickupBranch===b?G.green:G.border}`,background:pickupBranch===b?G.greenLight:G.white,display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:14 }}>🏪</span>
                    <span style={{ fontSize:13,fontWeight:pickupBranch===b?700:400 }}>{b}</span>
                  </div>
                ))}
              </div>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number" type="tel"
                style={{ width:'100%',padding:12,borderRadius:10,border:`1.5px solid ${G.border}`,fontSize:14,outline:'none',boxSizing:'border-box',marginTop:10 }} />
            </>
          )}
        </div>

        <div style={{ background:G.white,borderRadius:14,padding:18,marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700,margin:'0 0 12px',fontSize:15 }}>Payment Method</p>
          {[['cod','💵',T.cashOnDelivery,'Pay when your order arrives'],['upi','📱',T.upiPayment,'GPay, PhonePe, Paytm']].map(([val,icon,label,sub])=>(
            <div key={val} onClick={()=>setPayMethod(val)} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:10,marginBottom:8,cursor:'pointer',border:`2px solid ${payMethod===val?G.green:G.border}`,background:payMethod===val?G.greenLight:G.white }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <div style={{ flex:1 }}><p style={{ margin:0,fontWeight:600,fontSize:14 }}>{label}</p><p style={{ margin:0,fontSize:12,color:G.muted }}>{sub}</p></div>
              {payMethod===val && <span style={{ color:G.green,fontWeight:700 }}>✓</span>}
            </div>
          ))}
          {payMethod==='cod' && (
            <div style={{ marginTop:10,padding:14,background:G.greenLight,borderRadius:12,border:`1px solid #97C459` }}>
              <button onClick={placeOrder} disabled={placing||(orderType==='delivery'&&!address.trim())} style={{ width:'100%',padding:13,background:placing?'#9CA3AF':G.greenDark,color:G.white,border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer' }}>
                {placing?'⏳ Placing...':'⚡ Place COD Order Now'}
              </button>
            </div>
          )}
          {payMethod==='upi' && (
            <div style={{ marginTop:12,padding:16,background:'#F9FAF7',borderRadius:12,border:`1px solid ${G.border}`,textAlign:'center' }}>
              <p style={{ margin:'0 0 12px',fontSize:13,fontWeight:700 }}>Scan & Pay — ₹{grand}</p>
              <div style={{ background:G.white,display:'inline-block',padding:12,borderRadius:12,border:`1px solid ${G.border}`,marginBottom:10 }}>
                <img src={qrUrl} alt="UPI QR" width={160} height={160} style={{ display:'block',borderRadius:8 }} />
              </div>
              <div style={{ borderTop:`1px solid ${G.border}`,paddingTop:12,marginTop:8 }}>
                <p style={{ margin:'0 0 6px',fontSize:12,fontWeight:700 }}>Enter Transaction ID after payment</p>
                <input type="text" value={utrRef} onChange={e=>setUtrRef(e.target.value.trim())}
                  placeholder="12-digit UTR / Transaction ID"
                  style={{ width:'100%',padding:'11px 14px',borderRadius:10,border:`2px solid ${utrRef.length>=10?G.green:G.border}`,fontSize:14,outline:'none',boxSizing:'border-box' }} />
              </div>
            </div>
          )}
        </div>

        {payMethod!=='cod' && (
          <button onClick={placeOrder} disabled={placing||(orderType==='delivery'&&!address.trim())||(payMethod==='upi'&&!utrRef.trim())} style={{ width:'100%',padding:14,background:placing||(orderType==='delivery'&&!address.trim())||(payMethod==='upi'&&!utrRef.trim())?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:14,fontSize:15,fontWeight:700,cursor:'pointer' }}>
            {placing?'⏳ Placing...':`${orderType==='pickup'?'🏪 Place Pickup Order':'✅ Place Order'} — ₹${grand}`}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:D.bg }}>
      <TopNavModal modal={topModal} onClose={()=>setTopModal(null)} />
      {showProfile && <ProfilePage onClose={()=>setShowProfile(false)} />}
      {reviewModal && <ReviewModal order={reviewModal} onClose={()=>setRevModal(null)} />}
      {reportModal && <ReportModal order={reportModal} onClose={()=>setRepModal(null)} />}
      {notifyModal && <NotifyModal product={notifyModal} onClose={()=>setNotifyModal(null)} />}

      <header style={{ background:G.green,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <span style={{ fontSize:22 }}>🌾</span>
          <div>
            <p style={{ color:G.white,fontWeight:700,margin:0,fontSize:15 }}>Green Village Rice</p>
            <p style={{ color:'rgba(255,255,255,0.6)',margin:0,fontSize:11 }}>Fresh Sona Masoori</p>
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          {totalItems>0 && tab==='shop' && (
            <button onClick={()=>{ setStep('checkout'); setError('') }} style={{ background:G.white,border:'none',borderRadius:20,padding:'6px 14px',fontWeight:700,color:G.green,cursor:'pointer',fontSize:13 }}>
              🛒 {totalItems} · ₹{totalAmount}
            </button>
          )}
          <button onClick={()=>setShowProfile(true)} style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:20,padding:'4px 12px 4px 4px',cursor:'pointer' }}>
            <div style={{ width:26,height:26,borderRadius:'50%',background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:G.white,overflow:'hidden',flexShrink:0 }}>
              {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : (user?.full_name?.[0]||user?.username?.[0]?.toUpperCase()||'U')}
            </div>
            <span style={{ color:G.white,fontSize:12,fontWeight:600,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.full_name?.split(' ')[0]||user?.username}</span>
          </button>
          <ShopLangToggle lang={lang} setLang={setLang} />
          <button onClick={handleLogout} style={{ background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:8,padding:'5px 12px',color:G.white,fontSize:12,fontWeight:600,cursor:'pointer' }}>
            {T.logout}
          </button>
        </div>
      </header>

      <div style={{ background:G.white,borderBottom:`1px solid ${G.border}`,padding:'0 16px',display:'flex',alignItems:'center' }}>
        {[['where','📍 '+T.whereWeWork],['what','🌾 '+T.whatWeDo],['about','ℹ️ '+T.about]].map(([key,label])=>(
          <button key={key} onClick={()=>setTopModal(key)} style={{ padding:'10px 14px',border:'none',background:'none',cursor:'pointer',fontSize:12,fontWeight:600,color:G.green }}>{label}</button>
        ))}
      </div>

      {/* FIX #3: tabs array is now flat — was double-nested before causing only 1 tab to render */}
      <div style={{ background:G.white,borderBottom:`1px solid ${G.border}`,display:'flex',overflowX:'auto' }}>
        {[
          ['shop',    `🌾 ${T.orderRice}`],
          ['myorders',`📋 ${T.myOrders}`],
          ['subscribe',`🔄 ${T.subscribe}`],
          ['referral', `🎁 ${T.referEarn}`],
        ].map(([key,label])=>(
          <button key={key} onClick={()=>switchTab(key)} style={{ padding:'10px 16px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:600,borderBottom:`3px solid ${tab===key?G.green:'transparent'}`,color:tab===key?G.green:G.muted,whiteSpace:'nowrap',flex:1,textAlign:'center' }}>
            {label}
          </button>
        ))}
      </div>

      {/* FIX #1 & #2: pass D and switchTab as props */}
      {tab==='subscribe' && <SubscribeSection user={user} D={D} switchTab={switchTab} />}
      {tab==='referral'  && <ReferralSection  user={user} D={D} />}

      {tab==='myorders' && (
        <div style={{ maxWidth:600,margin:'0 auto',padding:16 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',margin:'4px 0 16px' }}>
            <p style={{ margin:0,fontSize:15,fontWeight:700 }}>My Orders</p>
            <button onClick={loadMyOrders} style={{ background:G.greenLight,border:'none',borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,color:G.green,cursor:'pointer' }}>↻ Refresh</button>
          </div>
          {ordersLoading && <p style={{ textAlign:'center',color:G.muted,padding:40 }}>Loading...</p>}
          {!ordersLoading && myOrders.length===0 && (
            <div style={{ textAlign:'center',padding:'40px 20px',background:D.card,borderRadius:14,border:`1px solid ${D.border}` }}>
              <div style={{ fontSize:48,marginBottom:12 }}>📦</div>
              <p style={{ fontWeight:700,color:D.text,margin:'0 0 6px',fontSize:16 }}>No orders yet</p>
              <button onClick={()=>switchTab('shop')} style={{ background:G.green,color:G.white,border:'none',borderRadius:10,padding:'10px 20px',fontWeight:700,cursor:'pointer',fontSize:13,marginTop:12 }}>
                Order Now →
              </button>
            </div>
          )}
          {myOrders.map(order=>(
            <div key={order.id} style={{ background:D.card,borderRadius:14,padding:16,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${D.border}` }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
                <div>
                  <p style={{ margin:'0 0 3px',fontWeight:700,fontSize:15,color:G.green }}>{order.order_number}</p>
                  <p style={{ margin:0,fontSize:12,color:G.muted }}>{new Date(order.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>
                <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4 }}>
                  <span style={{ fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:20,background:STATUS_BG[order.status]||'#F3F4F6',color:STATUS_COLOR[order.status]||G.muted }}>
                    {order.status?.charAt(0).toUpperCase()+order.status?.slice(1)}
                  </span>
                  {order.status==='delivered' && !reviews[order.id] && (
                    <button onClick={()=>setRevModal(order)} style={{ fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'#FEF9C3',color:'#854D0E',border:'none',cursor:'pointer' }}>⭐ Rate</button>
                  )}
                  {order.status==='delivered' && (
                    <button onClick={()=>setRepModal(order)} style={{ fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,background:G.amberLight,color:G.amber,border:'none',cursor:'pointer' }}>⚠️ Issue</button>
                  )}
                  {(order.status==='delivered'||order.status==='dispatched') && (
                    <button onClick={()=>printInvoice(order)} style={{ fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,background:G.blueLight,color:G.blue,border:'none',cursor:'pointer' }}>🧾 Invoice</button>
                  )}
                </div>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginBottom:10 }}>
                {(order.order_items||[]).map((item,i)=>(
                  <span key={i} style={{ fontSize:11,padding:'3px 10px',borderRadius:20,background:G.greenLight,color:G.greenDark,fontWeight:600 }}>{item.name} × {item.quantity}</span>
                ))}
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:order.status!=='cancelled'?12:0 }}>
                <span style={{ fontSize:12,color:G.muted }}>{order.order_type==='pickup'?`🏪 Pickup: ${order.pickup_branch}`:`📍 ${order.delivery_address?.slice(0,40)}`} · {order.payment_method?.toUpperCase()}</span>
                <span style={{ fontWeight:700,fontSize:15,color:G.green }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
              </div>
              {order.status!=='cancelled' && (
                <div>
                  <div style={{ display:'flex',gap:3 }}>
                    {['pending','confirmed','packed','dispatched','delivered'].map((s,i)=>{ const idx=['pending','confirmed','packed','dispatched','delivered'].indexOf(order.status); return <div key={s} style={{ flex:1,height:4,borderRadius:2,background:i<=idx?G.green:'#E5E7EB' }} /> })}
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginTop:4 }}>
                    {['Placed','Confirmed','Packed','Shipped','Delivered'].map((s,i)=>{ const idx=['pending','confirmed','packed','dispatched','delivered'].indexOf(order.status); return <span key={s} style={{ fontSize:9,color:i<=idx?G.green:'#9CA3AF',fontWeight:i<=idx?600:400 }}>{s}</span> })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==='shop' && (
        <div style={{ maxWidth:600,margin:'0 auto',padding:16 }}>
          {error && <div style={{ background:G.redLight,border:`1px solid #FECACA`,borderRadius:10,padding:'10px 14px',marginBottom:16,color:G.red,fontSize:13,display:'flex',justifyContent:'space-between' }}>
            <span>{error}</span><button onClick={()=>setError('')} style={{ background:'none',border:'none',cursor:'pointer',color:G.red,fontSize:16 }}>✕</button>
          </div>}
          <p style={{ fontSize:13,color:G.muted,margin:'12px 0 16px' }}>
            👋 Hello, <strong style={{color:G.text}}>{user?.full_name||user?.username}</strong> · {T.freshStock}
          </p>
          {loading && <p style={{ textAlign:'center',color:G.muted,padding:40 }}>Loading products...</p>}
          {products.map(p=>(
            <div key={p.id} style={{ background:D.card,borderRadius:14,padding:16,marginBottom:12,display:'flex',alignItems:'center',gap:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${D.border}` }}>
              <div style={{ width:56,height:56,borderRadius:12,background:G.greenLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0 }}>🌾</div>
              <div style={{ flex:1,minWidth:0 }}>
                <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:15 }}>{p.name}</p>
                <p style={{ margin:'0 0 2px',fontSize:12,color:G.muted }}>{p.name_telugu} · {p.weight_kg}kg</p>
                {p.packing_date && <p style={{ margin:0,fontSize:11,color:G.green }}>✓ Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</p>}
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <p style={{ margin:'0 0 8px',fontWeight:800,fontSize:17 }}>₹{p.price_per_bag}</p>
                {p.stock_bags<=0
                  ? <button onClick={()=>setNotifyModal(p)} style={{ background:G.amberLight,color:G.amber,border:'none',borderRadius:8,padding:'7px 12px',fontWeight:700,cursor:'pointer',fontSize:12 }}>
                      {notified[p.id] ? '✓ Notified' : '🔔 Notify Me'}
                    </button>
                  : !cart[p.id]
                    ? <button onClick={()=>updateCart(p.id,1)} style={{ background:G.green,color:G.white,border:'none',borderRadius:8,padding:'7px 18px',fontWeight:700,cursor:'pointer',fontSize:13 }}>{T.addToCart}</button>
                    : <div style={{ display:'flex',alignItems:'center',gap:10,background:G.greenLight,borderRadius:8,padding:'5px 10px' }}>
                        <button onClick={()=>updateCart(p.id,-1)} style={{ background:'none',border:'none',color:G.green,fontSize:22,cursor:'pointer',fontWeight:700,lineHeight:1,padding:0 }}>−</button>
                        <span style={{ fontWeight:700,color:G.greenDark,minWidth:20,textAlign:'center',fontSize:15 }}>{cart[p.id]}</span>
                        <button disabled={(cart[p.id] || 0) >= Number(p.stock_bags || 0)} onClick={()=>updateCart(p.id,1)} style={{ background:'none',border:'none',color:(cart[p.id] || 0) >= Number(p.stock_bags || 0)?G.muted:G.green,fontSize:22,cursor:(cart[p.id] || 0) >= Number(p.stock_bags || 0)?'not-allowed':'pointer',fontWeight:700,lineHeight:1,padding:0 }}>+</button>
                      </div>
                }
              </div>
            </div>
          ))}
          {totalItems>0 && (
            <div style={{ position:'sticky',bottom:'calc(16px + env(safe-area-inset-bottom))',marginTop:16 }}>
              <button onClick={()=>{ setStep('checkout'); setError('') }} style={{ width:'100%',padding:16,background:G.green,color:G.white,border:'none',borderRadius:14,fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 14px rgba(59,109,17,0.35)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <span>🛒 {totalItems} item{totalItems>1?'s':''}</span>
                <span>{T.checkout} · ₹{totalAmount} →</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

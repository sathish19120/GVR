import { useState, useEffect, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'
import ProfilePage from './ProfilePage'

// ── Language strings ──────────────────────────────────────
const SHOP_STRINGS = {
  en: {
    myOrders:'My Orders', subscribe:'Subscribe', referEarn:'Refer & Earn',
    home:'Home', checkout:'Checkout', placeOrder:'Place Order',
    homeDelivery:'Home Delivery', storePickup:'Store Pickup',
    cashOnDelivery:'Cash on Delivery', upiPayment:'UPI Payment',
    orderPlaced:'Order Placed!', trackOrder:'Track My Order',
    orderMore:'Order More Rice', outOfStock:'Out of Stock', logout:'Logout',
    whereWeWork:'Where We Work', whatWeDo:'What We Do', about:'About',
    orderNow:'Order Now', callUs:'Call Us', whatsappUs:'WhatsApp Us',
    freshStock:'Fresh stock available today',
    heroTitle:'Fresh Rice, Delivered Daily',
    heroSub:'Premium Sona Masoori from Telangana farms — direct to your kitchen.',
    stat1:'Farm Direct', stat2:'FSSAI Certified', stat3:'Same Day Delivery',
  },
  te: {
    myOrders:'నా ఆర్డర్లు', subscribe:'సభ్యత్వం', referEarn:'రెఫర్ & సంపాదించండి',
    home:'హోమ్', checkout:'చెక్అవుట్', placeOrder:'ఆర్డర్ పెట్టండి',
    homeDelivery:'ఇంటికి డెలివరీ', storePickup:'స్టోర్ పికప్',
    cashOnDelivery:'డెలివరీలో నగదు', upiPayment:'UPI చెల్లింపు',
    orderPlaced:'ఆర్డర్ పెట్టారు!', trackOrder:'ఆర్డర్ ట్రాక్ చేయండి',
    orderMore:'మరింత బియ్యం', outOfStock:'స్టాక్ లేదు', logout:'లాగ్ అవుట్',
    whereWeWork:'మేము ఎక్కడ పని చేస్తాం', whatWeDo:'మేము ఏమి చేస్తాం', about:'గురించి',
    orderNow:'ఇప్పుడే ఆర్డర్ చేయండి', callUs:'కాల్ చేయండి', whatsappUs:'వాట్సాప్ చేయండి',
    freshStock:'ఈరోజు తాజా స్టాక్ అందుబాటులో ఉంది',
    heroTitle:'తాజా బియ్యం, రోజూ డెలివరీ',
    heroSub:'తెలంగాణ పొలాల నుండి నేరుగా మీ వంటగదికి సోనా మసూరి.',
    stat1:'నేరుగా పొలం నుండి', stat2:'FSSAI సర్టిఫైడ్', stat3:'అదే రోజు డెలివరీ',
  }
}

const G = {
  green:'#3B6D11', greenDark:'#27500A', greenLight:'#EAF3DE', green2:'#639922',
  amber:'#BA7517', amberLight:'#FAEEDA', blue:'#1E5FA5', blueLight:'#E6F1FB',
  red:'#DC2626', redLight:'#FEE2E2',
  border:'#E5E7EB', text:'#111827', muted:'#6B7280', white:'#fff', surface:'#F4F6F3'
}

const STATUS_COLOR = { pending:G.amber, confirmed:G.blue, packed:G.green2, dispatched:'#7C3AED', delivered:G.green, cancelled:G.red }
const STATUS_BG    = { pending:G.amberLight, confirmed:G.blueLight, packed:G.greenLight, dispatched:'#EDE9FE', delivered:G.greenLight, cancelled:G.redLight }
const BRANCHES     = ['Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu']

function ShopLangToggle({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setOpen(!open)} style={{ display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:20,padding:'4px 10px',cursor:'pointer',color:'#fff',fontSize:11,fontWeight:600 }}>
        {lang==='te'?'🇮🇳':'🌐'} {lang==='te'?'తె':'EN'}
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

// ── Top nav modals ────────────────────────────────────────
function TopNavModal({ modal, onClose }) {
  if (!modal) return null
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:560,maxHeight:'85vh',overflowY:'auto',padding:28 }}>
        {modal==='where' && <>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:'#27500A' }}>📍 Where We Work</h2>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#6B7280' }}>✕</button>
          </div>
          <p style={{ color:'#6B7280',fontSize:14,lineHeight:1.7,marginBottom:18 }}>Green Village Rice serves customers across <strong style={{color:'#3B6D11'}}>Hyderabad and Secunderabad</strong>, delivering farm-fresh Sona Masoori rice to homes, apartments, and businesses.</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {[{area:'Kukatpally',icon:'🏙️',desc:'KPHB, JNTU, Miyapur'},{area:'Hitech City',icon:'💻',desc:'Madhapur, Gachibowli, Kondapur'},{area:'Secunderabad',icon:'🏛️',desc:'Trimulgherry, Karkhana'},{area:'Dilsukhnagar',icon:'🌆',desc:'LB Nagar, Malakpet'},{area:'Ameerpet',icon:'🏢',desc:'SR Nagar, Punjagutta'},{area:'Uppal',icon:'🏭',desc:'Nacharam, Habsiguda'}].map(a=>(
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
          {[{icon:'🌱',title:'Farm Sourcing',desc:'Directly from certified paddy farmers in Nalgonda, Khammam, and Warangal.'},{icon:'⚙️',title:'Fresh Milling',desc:'Milled in small batches with packing date on every pack.'},{icon:'📦',title:'Quality Packing',desc:'1kg and 5kg packs. FSSAI-compliant with best-before dates.'},{icon:'🚪',title:'Doorstep Delivery',desc:'Orders delivered to your home within hours.'},{icon:'💰',title:'Fair Pricing',desc:'₹60/kg for 1kg packs, ₹250 for 5kg packs.'}].map(item=>(
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
          <p style={{ color:'#6B7280',fontSize:14,lineHeight:1.8,marginBottom:16 }}>We are a <strong style={{color:'#3B6D11'}}>direct-to-consumer rice brand</strong> sourcing premium Sona Masoori from Telangana farms, milling fresh, and delivering to your kitchen.</p>
          <div style={{ background:'#EAF3DE',borderRadius:12,padding:'12px 16px' }}>
            <p style={{ margin:'0 0 8px',fontWeight:700,fontSize:13,color:'#27500A' }}>Our Products</p>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {[['Sona Masoori 1kg','₹60'],['Sona Masoori 5kg','₹250']].map(([name,price])=>(
                <span key={name} style={{ fontSize:12,padding:'4px 12px',borderRadius:20,background:'#fff',color:'#3B6D11',fontWeight:600 }}>{name} — {price}</span>
              ))}
            </div>
          </div>
        </>}
      </div>
    </div>
  )
}

// ── Referral section ──────────────────────────────────────
function ReferralSection({ user }) {
  const [profile, setProfile] = useState(null)
  const [copied, setCopied]   = useState(false)
  const [wallet, setWallet]   = useState([])

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('profiles').select('referral_code,wallet_balance').eq('id',user.id).single(),
      supabase.from('wallet_transactions').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5)
    ]).then(([p,w]) => { setProfile(p.data); setWallet(w.data||[]) })
  }, [user])

  function copyCode() {
    navigator.clipboard.writeText(profile?.referral_code||'').then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2500) })
  }

  return (
    <div style={{ maxWidth:560,margin:'0 auto',padding:'16px 16px 32px' }}>
      <div style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`,borderRadius:16,padding:'20px 22px',marginBottom:16,color:G.white }}>
        <p style={{ margin:'0 0 4px',fontSize:12,color:'rgba(255,255,255,0.7)' }}>GVR Wallet</p>
        <p style={{ margin:'0 0 12px',fontSize:36,fontWeight:800 }}>₹{Number(profile?.wallet_balance||0).toFixed(0)}</p>
        <p style={{ margin:0,fontSize:12,color:'rgba(255,255,255,0.7)' }}>Earn ₹20 for every friend you refer</p>
      </div>
      <div style={{ background:G.white,borderRadius:14,padding:18,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ margin:'0 0 4px',fontSize:14,fontWeight:700 }}>🎁 Your Referral Code</p>
        <p style={{ margin:'0 0 14px',fontSize:12,color:G.muted }}>Share with friends — you both get ₹20 when they place their first order</p>
        <div style={{ padding:'14px 18px',background:'#F9FAF7',borderRadius:12,border:`2px dashed ${G.green}`,textAlign:'center',marginBottom:12 }}>
          <p style={{ margin:0,fontSize:26,fontWeight:900,letterSpacing:'4px',color:G.greenDark,fontFamily:'monospace' }}>{profile?.referral_code||'Loading...'}</p>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          <button onClick={copyCode} style={{ padding:'11px',background:copied?G.green:G.greenLight,color:copied?G.white:G.green,border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer' }}>
            {copied?'✓ Copied!':'📋 Copy Code'}
          </button>
          <button onClick={()=>{ const code=profile?.referral_code||''; window.open(`https://wa.me/?text=${encodeURIComponent(`🌾 Order fresh rice from Green Village Rice!\nUse code *${code}* — get ₹20 off!\nhttps://gvr-lemon.vercel.app`)}`, '_blank') }}
            style={{ padding:'11px',background:'#25D366',color:G.white,border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer' }}>
            💬 WhatsApp
          </button>
        </div>
      </div>
      {wallet.length>0 && (
        <div style={{ background:G.white,borderRadius:14,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin:'0 0 12px',fontSize:13,fontWeight:700 }}>💳 Recent Wallet Activity</p>
          {wallet.map((w,i)=>(
            <div key={w.id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<wallet.length-1?`1px solid ${G.border}`:'none' }}>
              <div>
                <p style={{ margin:'0 0 1px',fontSize:13,fontWeight:500 }}>{w.reason||'Transaction'}</p>
                <p style={{ margin:0,fontSize:11,color:G.muted }}>{new Date(w.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
              </div>
              <span style={{ fontWeight:700,fontSize:14,color:w.type==='credit'?G.green:G.red }}>{w.type==='credit'?'+':'−'}₹{Number(w.amount).toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Subscribe section ─────────────────────────────────────
function SubscribeSection({ user }) {
  const [products, setProducts] = useState([])
  const [mySubs, setMySubs]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [subTab, setSubTab]     = useState('browse')

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*').eq('active',true).order('weight_kg'),
      supabase.from('subscriptions').select('*').eq('customer_id',user.id).order('created_at',{ascending:false})
    ]).then(([pRes,sRes]) => { setProducts(pRes.data||[]); setMySubs(sRes.data||[]); setLoading(false) })
    .catch(()=>setLoading(false))
  }, [])

  async function subscribe(product, freq) {
    const days = freq==='weekly'?7:freq==='biweekly'?14:30
    const disc = freq==='weekly'?3:freq==='biweekly'?4:5
    const next = new Date(); next.setDate(next.getDate()+days)
    try {
      await supabase.from('subscriptions').insert({ customer_id:user.id, customer_name:user.full_name||user.username, product_id:product.id, product_name:product.name, quantity_bags:1, frequency:freq, next_order_date:next.toISOString().split('T')[0], discount_pct:disc, status:'active', address:user.address||'', phone:user.phone||'', payment_method:'upi', created_at:new Date().toISOString() })
      const { data } = await supabase.from('subscriptions').select('*').eq('customer_id',user.id).order('created_at',{ascending:false})
      setMySubs(data||[])
      setSubTab('mysubs')
    } catch(e) { alert('Subscribe failed: '+e.message) }
  }

  async function updateSub(id, status) {
    await supabase.from('subscriptions').update({status}).eq('id',id)
    setMySubs(prev=>prev.map(s=>s.id===id?{...s,status}:s))
  }

  if (loading) return <div style={{ textAlign:'center',padding:40,color:G.muted }}>Loading...</div>

  return (
    <div style={{ maxWidth:560,margin:'0 auto',padding:'16px 16px 32px' }}>
      <div style={{ display:'flex',gap:6,marginBottom:14 }}>
        {[['browse','🛒 Plans'],['mysubs',`📋 My Subs (${mySubs.filter(s=>s.status==='active').length})`]].map(([key,label])=>(
          <button key={key} onClick={()=>setSubTab(key)} style={{ padding:'7px 16px',borderRadius:20,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:subTab===key?G.green:'#F3F4F6',color:subTab===key?G.white:G.muted }}>
            {label}
          </button>
        ))}
      </div>
      {subTab==='browse' && (
        <>
          <div style={{ background:G.greenLight,borderRadius:12,padding:'12px 14px',marginBottom:14,fontSize:12,color:G.greenDark }}>
            💡 Subscribe and save 3–5% on every delivery. Cancel anytime.
          </div>
          {products.map(p=>(
            <div key={p.id} style={{ background:G.white,borderRadius:14,padding:16,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${G.border}` }}>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12 }}>
                <div style={{ width:44,height:44,borderRadius:10,background:G.greenLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>🌾</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:14 }}>{p.name}</p>
                  <p style={{ margin:0,fontSize:12,color:G.muted }}>₹{p.price_per_bag}/bag · {p.weight_kg}kg</p>
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
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
      {subTab==='mysubs' && (
        <>
          {mySubs.length===0 && <div style={{ textAlign:'center',padding:'40px 20px',background:G.white,borderRadius:14,color:G.muted }}><p style={{ fontSize:36,marginBottom:8 }}>🔄</p><p>No subscriptions yet</p></div>}
          {mySubs.map(s=>(
            <div key={s.id} style={{ background:G.white,borderRadius:14,padding:16,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.status==='active'?G.green:s.status==='paused'?G.amber:G.red}` }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                <div>
                  <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:14 }}>{s.product_name}</p>
                  <p style={{ margin:0,fontSize:12,color:G.muted }}>{s.frequency} · {s.discount_pct}% off · {s.total_orders??0} orders so far</p>
                </div>
                <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:s.status==='active'?G.greenLight:s.status==='paused'?G.amberLight:G.redLight,color:s.status==='active'?G.green:s.status==='paused'?G.amber:G.red,textTransform:'capitalize',height:'fit-content' }}>
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

// ── Main component ────────────────────────────────────────
export default function CustomerShop() {
  const { user, signOut }             = useAuth()
  const navigate                      = useNavigate()
  const [lang, setLangState]          = useState(localStorage.getItem('gvr_lang')||'en')
  const [tab, setTab]                 = useState('home')
  const [products, setProducts]       = useState([])
  const [cart, setCart]               = useState(()=>{ try { return JSON.parse(localStorage.getItem('gvr_cart')||'{}') } catch { return {} } })
  const [step, setStep]               = useState('shop')
  const [address, setAddress]         = useState(user?.address||localStorage.getItem('gvr_address')||'')
  const [phone, setPhone]             = useState(user?.phone||'')
  const [payMethod, setPayMethod]     = useState('cod')
  const [orderType, setOrderType]     = useState('delivery')
  const [pickupBranch, setPickupBranch] = useState('')
  const [pickupTime, setPickupTime]   = useState('')
  const [utrRef, setUtrRef]           = useState('')
  const [placing, setPlacing]         = useState(false)
  const [orderNum, setOrderNum]       = useState('')
  const [myOrders, setMyOrders]       = useState([])
  const [reviews, setReviews]         = useState({})
  const [reviewModal, setRevModal]    = useState(null)
  const [reportModal, setRepModal]    = useState(null)
  const [ordersLoading, setOL]        = useState(false)
  const [error, setError]             = useState('')
  const [topModal, setTopModal]       = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  const T   = SHOP_STRINGS[lang] || SHOP_STRINGS.en
  const setLang = (l) => { localStorage.setItem('gvr_lang',l); setLangState(l) }

  const totalItems  = Object.values(cart).reduce((s,q)=>s+q,0)
  const totalAmount = products.reduce((s,p)=>s+(cart[p.id]||0)*p.price_per_bag,0)
  const gst         = Math.round(totalAmount*0.05)
  const grand       = totalAmount+gst

  useEffect(()=>{ loadProducts() },[])
  useEffect(()=>{ try { localStorage.setItem('gvr_cart',JSON.stringify(cart)) } catch {} },[cart])
  useEffect(()=>{ if(address.trim()) { try { localStorage.setItem('gvr_address',address) } catch {} } },[address])
  useEffect(()=>{ if(tab==='myorders') loadMyOrders() },[tab])

  async function loadProducts() {
    try { const { data } = await supabase.from('products').select('*').eq('active',true).order('weight_kg'); setProducts(data||[]) }
    catch(e) { setError('Failed to load products') }
  }

  async function loadMyOrders() {
    if (!user) return
    setOL(true)
    try {
      const { data } = await supabase.from('orders').select('*,order_items(name,weight_kg,quantity,price_per_unit)').eq('customer_id',user.id).order('created_at',{ascending:false})
      setMyOrders(data||[])
    } catch { setMyOrders([]) }
    finally { setOL(false) }
  }

  // Auto-refresh orders tab
  useEffect(()=>{ if(tab!=='myorders') return; const t=setInterval(loadMyOrders,30000); return()=>clearInterval(t) },[tab])

  const handleLogout = async () => { await signOut(); navigate('/login') }

  const updateCart = (id,delta) => {
    setCart(prev=>{ const qty=Math.max(0,(prev[id]||0)+delta); if(qty===0){const n={...prev};delete n[id];return n} return {...prev,[id]:qty} })
  }

  // ── PDF invoice ───────────────────────────────────────
  function printInvoice(order) {
    const items=order.order_items||[]; const subtotal=items.reduce((s,i)=>s+i.price_per_unit*i.quantity,0); const gst=Math.round(subtotal*0.05); const total=subtotal+gst
    const date=new Date(order.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})
    const w=window.open('','_blank')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${order.order_number}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:30px;max-width:700px;margin:0 auto}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #3B6D11}
    .logo{width:50px;height:50px;background:#3B6D11;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:26px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#3B6D11;color:#fff;padding:10px 12px;text-align:left;font-size:12px}
    td{padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:13px}th:last-child,td:last-child{text-align:right}
    @media print{button{display:none}}</style></head><body>
    <div class="hdr"><div style="display:flex;gap:12px;align-items:center"><div class="logo">🌾</div><div><div style="font-size:18px;font-weight:800;color:#3B6D11">Green Village Rice</div><div style="font-size:11px;color:#6B7280">FSSAI Licensed · Hyderabad</div></div></div>
    <div style="text-align:right"><div style="font-size:22px;font-weight:800;color:#3B6D11">TAX INVOICE</div><div style="font-size:13px;color:#6B7280">${order.order_number} · ${date}</div></div></div>
    <table><thead><tr><th>#</th><th>Product</th><th>Weight</th><th>Qty</th><th>Rate (₹)</th><th>Amount (₹)</th></tr></thead><tbody>
    ${items.map((item,i)=>`<tr><td>${i+1}</td><td>${item.name}</td><td>${item.weight_kg}kg</td><td>${item.quantity}</td><td>₹${item.price_per_unit}</td><td>₹${item.price_per_unit*item.quantity}</td></tr>`).join('')}
    </tbody></table>
    <div style="margin-left:auto;width:260px">
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #E5E7EB;font-size:13px"><span>Subtotal</span><span>₹${subtotal}</span></div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #E5E7EB;font-size:13px"><span>GST 5%</span><span>₹${gst}</span></div>
    <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:800;color:#3B6D11;border-top:2px solid #3B6D11;margin-top:4px"><span>Total</span><span>₹${total}</span></div></div>
    <div style="text-align:center;margin-top:32px"><button onclick="window.print()" style="padding:12px 32px;background:#3B6D11;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">🖨 Print / Save as PDF</button></div>
    </body></html>`)
    w.document.close(); setTimeout(()=>w.print(),800)
  }

  // ── Review modal ──────────────────────────────────────
  function ReviewModal({ order, onClose }) {
    const [rating,setRating]=useState(5); const [comment,setComment]=useState(''); const [saving,setSaving]=useState(false); const [done,setDone]=useState(false)
    async function submit() {
      setSaving(true)
      try { await supabase.from('orders').update({notes:(order.notes||'')+` | ⭐${rating} — ${comment}`}).eq('id',order.id); setReviews(p=>({...p,[order.id]:{rating,comment}})); setDone(true); setTimeout(()=>onClose(),1500) }
      catch(e){ console.error(e) } finally { setSaving(false) }
    }
    return (
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:16 }}>
        <div style={{ background:G.white,borderRadius:'20px 20px 0 0',width:'100%',maxWidth:500,padding:28 }}>
          <p style={{ margin:'0 0 16px',fontSize:17,fontWeight:700 }}>Rate Your Order — {order.order_number}</p>
          {done ? <div style={{ textAlign:'center',padding:'20px 0' }}><p style={{ fontSize:40,marginBottom:8 }}>🙏</p><p style={{ fontWeight:700,color:G.green }}>Thanks for your feedback!</p></div> : <>
            <div style={{ display:'flex',gap:8,justifyContent:'center',marginBottom:16 }}>
              {[1,2,3,4,5].map(s=><button key={s} onClick={()=>setRating(s)} style={{ fontSize:36,background:'none',border:'none',cursor:'pointer',opacity:s<=rating?1:0.3 }}>★</button>)}
            </div>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={2} placeholder="Tell us about your experience..." style={{ width:'100%',padding:'10px 12px',borderRadius:10,border:`1.5px solid ${G.border}`,fontSize:13,outline:'none',resize:'none',fontFamily:'inherit',marginBottom:14,boxSizing:'border-box' }} />
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <button onClick={onClose} style={{ padding:12,background:'transparent',border:`1px solid ${G.border}`,borderRadius:10,fontSize:13,fontWeight:600,color:G.muted,cursor:'pointer' }}>Skip</button>
              <button onClick={submit} disabled={saving} style={{ padding:12,background:saving?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer' }}>{saving?'Saving...':'Submit ⭐'}</button>
            </div>
          </>}
        </div>
      </div>
    )
  }

  // ── Report modal ──────────────────────────────────────
  function ReportModal({ order, onClose }) {
    const [issue,setIssue]=useState(''); const [details,setDetails]=useState(''); const [saving,setSaving]=useState(false); const [done,setDone]=useState(false)
    const ISSUES=['📦 Wrong item received','⚖️ Less quantity','🍚 Poor quality','💧 Damaged packaging','🚚 Late delivery','💰 Payment issue','🔄 Other']
    async function submit() {
      if(!issue) return; setSaving(true)
      try { await supabase.from('orders').update({notes:(order.notes||'')+` | ⚠️ ${issue} — ${details}`}).eq('id',order.id); setDone(true); setTimeout(()=>onClose(),2000) }
      catch(e){ console.error(e) } finally { setSaving(false) }
    }
    return (
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:16 }}>
        <div style={{ background:G.white,borderRadius:'20px 20px 0 0',width:'100%',maxWidth:500,padding:28,maxHeight:'85vh',overflowY:'auto' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
            <p style={{ margin:0,fontSize:17,fontWeight:700 }}>⚠️ Report an Issue</p>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
          </div>
          {done ? <div style={{ textAlign:'center',padding:'24px 0' }}><p style={{ fontSize:40,marginBottom:8 }}>✅</p><p style={{ fontWeight:700,color:G.green }}>Issue reported! We will contact you within 24 hours.</p></div> : <>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14 }}>
              {ISSUES.map(i=><button key={i} onClick={()=>setIssue(i)} style={{ padding:'10px 8px',borderRadius:10,border:`1.5px solid ${issue===i?G.red:G.border}`,background:issue===i?G.redLight:'transparent',color:issue===i?G.red:G.text,fontSize:12,fontWeight:issue===i?700:400,cursor:'pointer',textAlign:'left' }}>{i}</button>)}
            </div>
            <textarea value={details} onChange={e=>setDetails(e.target.value)} rows={3} placeholder="Describe the issue..." style={{ width:'100%',padding:'10px 12px',borderRadius:10,border:`1.5px solid ${G.border}`,fontSize:13,outline:'none',resize:'none',fontFamily:'inherit',marginBottom:14,boxSizing:'border-box' }} />
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <button onClick={onClose} style={{ padding:12,background:'transparent',border:`1px solid ${G.border}`,borderRadius:10,fontSize:13,fontWeight:600,color:G.muted,cursor:'pointer' }}>Cancel</button>
              <button onClick={submit} disabled={saving||!issue} style={{ padding:12,background:saving||!issue?'#9CA3AF':G.red,color:G.white,border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer' }}>{saving?'Reporting...':'Report Issue'}</button>
            </div>
          </>}
        </div>
      </div>
    )
  }

  async function placeOrder() {
    if(orderType==='delivery'&&!address.trim()){setError('Please enter delivery address');return}
    if(orderType==='pickup'&&!pickupBranch){setError('Please select a pickup branch');return}
    setError(''); setPlacing(true)
    try {
      const { count } = await supabase.from('orders').select('*',{count:'exact',head:true})
      const orderNumber = `GVR-${String((count||0)+1).padStart(4,'0')}`
      const { data:order,error:oErr } = await supabase.from('orders').insert({
        order_number:orderNumber, customer_id:user?.id||null, customer_name:user?.full_name||user?.username||'Customer',
        delivery_address:orderType==='pickup'?`Pickup: ${pickupBranch}`:address,
        total_amount:grand, status:'pending', order_type:orderType,
        pickup_branch:orderType==='pickup'?pickupBranch:null, pickup_time:orderType==='pickup'?pickupTime:null,
        payment_status:utrRef.trim()?'paid':'pending', payment_method:payMethod,
        notes:utrRef.trim()?`Payment Ref: ${utrRef.trim()}`:null, created_at:new Date().toISOString()
      }).select().single()
      if(oErr||!order) throw new Error(oErr?.message||'Failed to create order')
      for(const p of products.filter(p=>cart[p.id])) {
        await supabase.from('order_items').insert({ order_id:order.id,product_id:p.id,name:p.name,weight_kg:p.weight_kg,quantity:cart[p.id],price_per_unit:p.price_per_bag })
        await supabase.from('products').update({ stock_bags:Math.max(0,p.stock_bags-cart[p.id]) }).eq('id',p.id)
      }
      localStorage.removeItem('gvr_cart')
      setOrderNum(orderNumber); setCart({}); setAddress(''); setStep('success')
    } catch(e) { setError(e.message||'Failed to place order') }
    finally { setPlacing(false) }
  }

  const UPI_ID = import.meta.env.VITE_UPI_ID || '19120sathish.ss1@ybl'
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Green+Village+Rice&am=${grand}&cu=INR&tn=GVR+Order`
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`

  // ── Success screen ────────────────────────────────────
  if (step==='success') return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:G.surface,padding:20 }}>
      <div style={{ textAlign:'center',background:G.white,borderRadius:20,padding:'48px 32px',maxWidth:400,width:'100%',boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:60,marginBottom:16 }}>✅</div>
        <h2 style={{ fontSize:24,fontWeight:800,color:G.greenDark,margin:'0 0 8px' }}>{T.orderPlaced}</h2>
        <p style={{ color:G.muted,margin:'0 0 4px',fontSize:14 }}>Order: <strong style={{color:G.green}}>{orderNum}</strong></p>
        <p style={{ color:G.muted,margin:'0 0 28px',fontSize:13 }}>Fresh rice coming soon 🌾</p>
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <button onClick={()=>{setStep('shop');setTab('myorders')}} style={{ background:G.green,color:G.white,border:'none',borderRadius:12,padding:'12px',fontSize:14,fontWeight:700,cursor:'pointer' }}>{T.trackOrder} →</button>
          <button onClick={()=>{setStep('shop');setTab('home')}} style={{ background:G.greenLight,color:G.green,border:'none',borderRadius:12,padding:'12px',fontSize:14,fontWeight:600,cursor:'pointer' }}>Back to Home</button>
        </div>
      </div>
    </div>
  )

  // ── Checkout screen ───────────────────────────────────
  if (step==='checkout') return (
    <div style={{ minHeight:'100vh',background:G.surface }}>
      <TopNavModal modal={topModal} onClose={()=>setTopModal(null)} />
      <header style={{ background:G.green,padding:'14px 20px',display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:100 }}>
        <button onClick={()=>{setStep('shop');setError('')}} style={{ background:'none',border:'none',color:G.white,fontSize:22,cursor:'pointer',lineHeight:1 }}>←</button>
        <span style={{ color:G.white,fontWeight:700,fontSize:16 }}>Checkout</span>
      </header>
      <div style={{ maxWidth:560,margin:'0 auto',padding:'16px 16px 100px' }}>
        {error && <div style={{ background:G.redLight,border:`1px solid #FECACA`,borderRadius:10,padding:'10px 14px',marginBottom:14,color:G.red,fontSize:13,display:'flex',justifyContent:'space-between' }}>
          <span>{error}</span><button onClick={()=>setError('')} style={{ background:'none',border:'none',cursor:'pointer',color:G.red,fontSize:16 }}>✕</button>
        </div>}
        {/* Cart summary */}
        <div style={{ background:G.white,borderRadius:14,padding:18,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700,margin:'0 0 12px',fontSize:15 }}>Your Order</p>
          {products.filter(p=>cart[p.id]).map(p=>(
            <div key={p.id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${G.border}` }}>
              <div>
                <p style={{ margin:'0 0 2px',fontSize:14,fontWeight:500 }}>{p.name}</p>
                <p style={{ margin:0,fontSize:12,color:G.muted }}>₹{p.price_per_bag} × {cart[p.id]}</p>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,background:G.greenLight,borderRadius:8,padding:'4px 8px' }}>
                  <button onClick={()=>updateCart(p.id,-1)} style={{ background:'none',border:'none',color:G.green,fontSize:18,cursor:'pointer',fontWeight:700,lineHeight:1,padding:0 }}>−</button>
                  <span style={{ fontWeight:700,color:G.greenDark,minWidth:16,textAlign:'center' }}>{cart[p.id]}</span>
                  <button onClick={()=>updateCart(p.id,1)} style={{ background:'none',border:'none',color:G.green,fontSize:18,cursor:'pointer',fontWeight:700,lineHeight:1,padding:0 }}>+</button>
                </div>
                <span style={{ fontWeight:700,minWidth:48,textAlign:'right' }}>₹{cart[p.id]*p.price_per_bag}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop:10,fontSize:13 }}>
            <div style={{ display:'flex',justifyContent:'space-between',padding:'3px 0',color:G.muted }}><span>Subtotal</span><span>₹{totalAmount}</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',padding:'3px 0',color:G.muted }}><span>GST (5%)</span><span>₹{gst}</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',padding:'8px 0 0',fontWeight:700,fontSize:15,color:G.green,borderTop:`1px solid ${G.border}`,marginTop:4 }}><span>Total</span><span>₹{grand}</span></div>
          </div>
        </div>
        {/* Order type */}
        <div style={{ background:G.white,borderRadius:14,padding:18,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700,margin:'0 0 12px',fontSize:15 }}>Delivery or Pickup?</p>
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
              <textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="House/flat, street, area, landmark..." rows={3}
                style={{ width:'100%',padding:12,borderRadius:10,border:`1.5px solid ${address?G.green:G.border}`,fontSize:14,resize:'none',outline:'none',boxSizing:'border-box',fontFamily:'inherit',marginBottom:8 }} />
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number" type="tel"
                style={{ width:'100%',padding:12,borderRadius:10,border:`1.5px solid ${G.border}`,fontSize:14,outline:'none',boxSizing:'border-box' }} />
            </>
          )}
          {orderType==='pickup' && (
            <>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
                {BRANCHES.map(b=>(
                  <div key={b} onClick={()=>setPickupBranch(b)} style={{ padding:'9px 12px',borderRadius:10,cursor:'pointer',border:`2px solid ${pickupBranch===b?G.green:G.border}`,background:pickupBranch===b?G.greenLight:G.white,display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:14 }}>🏪</span>
                    <span style={{ fontSize:13,fontWeight:pickupBranch===b?700:400 }}>{b}</span>
                    {pickupBranch===b&&<span style={{ marginLeft:'auto',color:G.green,fontWeight:700 }}>✓</span>}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:10 }}>
                {['9–11 AM','11 AM–1 PM','1–3 PM','3–5 PM','5–7 PM'].map(t=>(
                  <button key={t} onClick={()=>setPickupTime(t)} style={{ padding:'6px 12px',borderRadius:20,border:`1.5px solid ${pickupTime===t?G.green:G.border}`,background:pickupTime===t?G.greenLight:G.white,cursor:'pointer',fontSize:11,fontWeight:600,color:pickupTime===t?G.greenDark:G.muted }}>{t}</button>
                ))}
              </div>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number" type="tel" style={{ width:'100%',padding:12,borderRadius:10,border:`1.5px solid ${G.border}`,fontSize:14,outline:'none',boxSizing:'border-box' }} />
            </>
          )}
        </div>
        {/* Payment */}
        <div style={{ background:G.white,borderRadius:14,padding:18,marginBottom:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700,margin:'0 0 12px',fontSize:15 }}>Payment</p>
          {[['cod','💵',T.cashOnDelivery,'Pay when order arrives'],['upi','📱',T.upiPayment,'GPay, PhonePe, Paytm']].map(([val,icon,label,sub])=>(
            <div key={val} onClick={()=>setPayMethod(val)} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:10,marginBottom:8,cursor:'pointer',border:`2px solid ${payMethod===val?G.green:G.border}`,background:payMethod===val?G.greenLight:G.white }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <div style={{ flex:1 }}><p style={{ margin:0,fontWeight:600,fontSize:14 }}>{label}</p><p style={{ margin:0,fontSize:12,color:G.muted }}>{sub}</p></div>
              {payMethod===val&&<span style={{ color:G.green,fontWeight:700 }}>✓</span>}
            </div>
          ))}
          {payMethod==='cod' && (
            <div style={{ marginTop:10,padding:14,background:G.greenLight,borderRadius:12 }}>
              <button onClick={placeOrder} disabled={placing||(orderType==='delivery'&&!address.trim())} style={{ width:'100%',padding:13,background:placing?'#9CA3AF':G.greenDark,color:G.white,border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer' }}>
                {placing?'⏳ Placing...':'⚡ Place COD Order'}
              </button>
            </div>
          )}
          {payMethod==='upi' && (
            <div style={{ marginTop:12,padding:16,background:'#F9FAF7',borderRadius:12,border:`1px solid ${G.border}`,textAlign:'center' }}>
              <p style={{ margin:'0 0 12px',fontSize:13,fontWeight:700 }}>Scan & Pay — ₹{grand}</p>
              <div style={{ background:G.white,display:'inline-block',padding:12,borderRadius:12,border:`1px solid ${G.border}`,marginBottom:10 }}>
                <img src={qrUrl} alt="UPI QR" width={160} height={160} style={{ display:'block',borderRadius:8 }} />
              </div>
              <div style={{ display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:14 }}>
                {[{name:'GPay',color:'#1A73E8'},{name:'PhonePe',color:'#5F259F'},{name:'Paytm',color:'#00BAF2'}].map(app=>(
                  <a key={app.name} href={upiUrl} style={{ padding:'5px 14px',borderRadius:20,background:app.color+'18',color:app.color,fontSize:12,fontWeight:700,textDecoration:'none',border:`1px solid ${app.color}40` }}>{app.name}</a>
                ))}
              </div>
              <p style={{ margin:'0 0 8px',fontSize:12,fontWeight:700 }}>Enter Transaction ID to confirm</p>
              <input type="text" value={utrRef} onChange={e=>setUtrRef(e.target.value.trim())}
                placeholder="12-digit UTR / Transaction ID"
                style={{ width:'100%',padding:'11px 14px',borderRadius:10,border:`2px solid ${utrRef.length>=10?G.green:G.border}`,fontSize:14,outline:'none',boxSizing:'border-box' }} />
            </div>
          )}
        </div>
        {payMethod!=='cod' && (
          <button onClick={placeOrder} disabled={placing||(orderType==='delivery'&&!address.trim())} style={{ width:'100%',padding:14,background:placing?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:14,fontSize:15,fontWeight:700,cursor:'pointer' }}>
            {placing?'⏳ Placing...':`✅ Place Order — ₹${grand}`}
          </button>
        )}
      </div>
    </div>
  )

  // ── Main layout ───────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:G.surface, overflowX:'hidden' }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        @media (max-width: 480px) {
          .top-nav-links { display: none !important; }
          .header-name   { display: none !important; }
        }
      `}</style>

      <TopNavModal modal={topModal} onClose={()=>setTopModal(null)} />
      {showProfile  && <ProfilePage onClose={()=>setShowProfile(false)} />}
      {reviewModal  && <ReviewModal order={reviewModal}  onClose={()=>setRevModal(null)} />}
      {reportModal  && <ReportModal order={reportModal}  onClose={()=>setRepModal(null)} />}

      {/* ── Sticky header ──────────────────────────────── */}
      <header style={{ background:G.green, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <span style={{ fontSize:22 }}>🌾</span>
          <div>
            <p style={{ color:G.white, fontWeight:700, margin:0, fontSize:15, lineHeight:1.2 }}>Green Village Rice</p>
            <p style={{ color:'rgba(255,255,255,0.6)', margin:0, fontSize:10 }}>Fresh Sona Masoori</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {totalItems>0 && (
            <button onClick={()=>setStep('checkout')} style={{ background:G.white, border:'none', borderRadius:20, padding:'6px 12px', fontWeight:700, color:G.green, cursor:'pointer', fontSize:12, flexShrink:0 }}>
              🛒 {totalItems} · ₹{totalAmount}
            </button>
          )}
          <button onClick={()=>setShowProfile(true)} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:20, padding:'4px 10px 4px 4px', cursor:'pointer', flexShrink:0 }}>
            <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:G.white, overflow:'hidden', flexShrink:0 }}>
              {user?.avatar_url ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (user?.full_name?.[0]||user?.username?.[0]?.toUpperCase()||'U')}
            </div>
            <span className="header-name" style={{ color:G.white, fontSize:12, fontWeight:600, maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.full_name?.split(' ')[0]||user?.username}</span>
          </button>
          <ShopLangToggle lang={lang} setLang={setLang} />
        </div>
      </header>

      {/* ── Info nav bar ───────────────────────────────── */}
      <div className="top-nav-links" style={{ background:G.white, borderBottom:`1px solid ${G.border}`, padding:'0 16px', display:'flex', alignItems:'center', overflowX:'auto' }}>
        {[['where','📍 '+T.whereWeWork],['what','🌾 '+T.whatWeDo],['about','ℹ️ '+T.about]].map(([key,label])=>(
          <button key={key} onClick={()=>setTopModal(key)} style={{ padding:'10px 14px', border:'none', background:'none', cursor:'pointer', fontSize:12, fontWeight:600, color:G.green, whiteSpace:'nowrap' }}>{label}</button>
        ))}
      </div>

      {/* ── Bottom tab bar ─────────────────────────────── */}
      <div style={{ background:G.white, borderBottom:`1px solid ${G.border}`, display:'flex', position:'sticky', top:56, zIndex:99, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        {[['home','🏠 '+T.home],['myorders','📋 '+T.myOrders],['subscribe','🔄 '+T.subscribe],['referral','🎁 '+T.referEarn]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{ flex:1, padding:'11px 4px', border:'none', background:'none', cursor:'pointer', fontSize:11, fontWeight:600, borderBottom:`3px solid ${tab===key?G.green:'transparent'}`, color:tab===key?G.green:G.muted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Home (replaces product listing) ───────── */}
      {tab==='home' && (
        <div style={{ maxWidth:600, margin:'0 auto', padding:'0 0 32px' }}>

          {/* Hero banner */}
          <div style={{ background:`linear-gradient(135deg,${G.green} 0%,${G.greenDark} 100%)`, padding:'32px 24px 28px', textAlign:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, fontSize:120, opacity:0.08, lineHeight:1 }}>🌾</div>
            <p style={{ margin:'0 0 6px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'1.5px' }}>Welcome back, {user?.full_name?.split(' ')[0]||user?.username} 👋</p>
            <h1 style={{ margin:'0 0 10px', fontSize:26, fontWeight:800, color:G.white, lineHeight:1.2 }}>{T.heroTitle}</h1>
            <p style={{ margin:'0 0 20px', fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.6 }}>{T.heroSub}</p>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
              {[[T.stat1,'🌱'],[T.stat2,'✅'],[T.stat3,'⚡']].map(([label,icon])=>(
                <span key={label} style={{ fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:20, background:'rgba(255,255,255,0.15)', color:G.white, border:'1px solid rgba(255,255,255,0.2)' }}>
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ padding:'20px 16px 0' }}>
            <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.8px' }}>Quick Actions</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>

              {/* Order via WhatsApp */}
              <a href={`https://wa.me/919999999999?text=${encodeURIComponent('Hi, I want to order Sona Masoori rice.')}`} target="_blank" rel="noreferrer"
                style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:'18px 12px', background:'#25D366', borderRadius:16, textDecoration:'none', boxShadow:'0 2px 8px rgba(37,211,102,0.3)' }}>
                <span style={{ fontSize:28 }}>💬</span>
                <div style={{ textAlign:'center' }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:13, color:G.white }}>{T.whatsappUs}</p>
                  <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.8)' }}>Order via WhatsApp</p>
                </div>
              </a>

              {/* Call to order */}
              <a href="tel:+919999999999"
                style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:'18px 12px', background:G.white, borderRadius:16, textDecoration:'none', border:`1.5px solid ${G.border}`, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize:28 }}>📞</span>
                <div style={{ textAlign:'center' }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:13, color:G.text }}>{T.callUs}</p>
                  <p style={{ margin:0, fontSize:11, color:G.muted }}>Mon–Sat, 8 AM–8 PM</p>
                </div>
              </a>

              {/* My Orders shortcut */}
              <div onClick={()=>setTab('myorders')} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:'18px 12px', background:G.white, borderRadius:16, cursor:'pointer', border:`1.5px solid ${G.border}`, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize:28 }}>📋</span>
                <div style={{ textAlign:'center' }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:13, color:G.text }}>{T.myOrders}</p>
                  <p style={{ margin:0, fontSize:11, color:G.muted }}>Track your deliveries</p>
                </div>
              </div>

              {/* Subscribe shortcut */}
              <div onClick={()=>setTab('subscribe')} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:'18px 12px', background:G.greenLight, borderRadius:16, cursor:'pointer', border:`1.5px solid ${G.green}33`, boxShadow:'0 1px 4px rgba(59,109,17,0.1)' }}>
                <span style={{ fontSize:28 }}>🔄</span>
                <div style={{ textAlign:'center' }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:13, color:G.greenDark }}>{T.subscribe}</p>
                  <p style={{ margin:0, fontSize:11, color:G.green2 }}>Save up to 5%</p>
                </div>
              </div>
            </div>

            {/* Products available — compact cards (no cart, just info) */}
            <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.8px' }}>Available Products</p>
            {products.map(p=>(
              <div key={p.id} style={{ background:G.white, borderRadius:14, padding:'14px 16px', marginBottom:10, display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:`1px solid ${G.border}` }}>
                <div style={{ width:48, height:48, borderRadius:12, background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🌾</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:14 }}>{p.name}</p>
                  <p style={{ margin:'0 0 2px', fontSize:12, color:G.muted }}>{p.name_telugu} · {p.weight_kg}kg</p>
                  {p.packing_date && <p style={{ margin:0, fontSize:11, color:G.green }}>✓ Packed {new Date(p.packing_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ margin:'0 0 4px', fontWeight:800, fontSize:18, color:G.green }}>₹{p.price_per_bag}</p>
                  {p.stock_bags>0
                    ? <span style={{ fontSize:11, color:G.green, fontWeight:600 }}>✓ In stock</span>
                    : <span style={{ fontSize:11, color:G.red, fontWeight:600 }}>Out of stock</span>
                  }
                </div>
              </div>
            ))}

            {/* Refer & Earn banner */}
            <div onClick={()=>setTab('referral')} style={{ marginTop:8, background:`linear-gradient(135deg,#7C3AED,#5B21B6)`, borderRadius:16, padding:'18px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:16 }}>
              <span style={{ fontSize:32 }}>🎁</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:14, color:G.white }}>{T.referEarn}</p>
                <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.75)' }}>Share your code — you both get ₹20</p>
              </div>
              <span style={{ color:'rgba(255,255,255,0.7)', fontSize:18 }}>›</span>
            </div>

            {/* Logout */}
            <button onClick={handleLogout} style={{ width:'100%', marginTop:20, padding:'11px', background:'transparent', border:`1px solid ${G.border}`, borderRadius:12, fontSize:13, fontWeight:600, color:G.muted, cursor:'pointer' }}>
              ↩ {T.logout}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: My Orders ─────────────────────────────── */}
      {tab==='myorders' && (
        <div style={{ maxWidth:600, margin:'0 auto', padding:'16px 16px 32px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <p style={{ margin:0, fontSize:15, fontWeight:700 }}>My Orders</p>
            <button onClick={loadMyOrders} style={{ background:G.greenLight, border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600, color:G.green, cursor:'pointer' }}>↻ Refresh</button>
          </div>
          {ordersLoading && <p style={{ textAlign:'center', color:G.muted, padding:40 }}>Loading...</p>}
          {!ordersLoading && myOrders.length===0 && (
            <div style={{ textAlign:'center', padding:'40px 20px', background:G.white, borderRadius:14, border:`1px solid ${G.border}` }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
              <p style={{ fontWeight:700, margin:'0 0 6px', fontSize:16 }}>No orders yet</p>
              <p style={{ fontSize:13, color:G.muted, margin:'0 0 16px' }}>Order via WhatsApp or Call to get started.</p>
              <button onClick={()=>setTab('home')} style={{ background:G.green, color:G.white, border:'none', borderRadius:10, padding:'10px 24px', fontWeight:700, cursor:'pointer', fontSize:13 }}>Go to Home →</button>
            </div>
          )}
          {myOrders.map(order=>(
            <div key={order.id} style={{ background:G.white, borderRadius:14, padding:16, marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:`1px solid ${G.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:15, color:G.green }}>{order.order_number}</p>
                  <p style={{ margin:0, fontSize:12, color:G.muted }}>{new Date(order.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                  <span style={{ fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:20, background:STATUS_BG[order.status]||'#F3F4F6', color:STATUS_COLOR[order.status]||G.muted, whiteSpace:'nowrap' }}>
                    {order.status?.charAt(0).toUpperCase()+order.status?.slice(1)}
                  </span>
                  {order.status==='dispatched' && order.delivery_address && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`} target="_blank" rel="noreferrer"
                      style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:G.blueLight, color:G.blue, textDecoration:'none' }}>🗺 Track</a>
                  )}
                  {order.status==='delivered' && !reviews[order.id] && (
                    <button onClick={()=>setRevModal(order)} style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#FEF9C3', color:'#854D0E', border:'none', cursor:'pointer' }}>⭐ Rate</button>
                  )}
                  {order.status==='delivered' && (
                    <button onClick={()=>setRepModal(order)} style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:G.amberLight, color:G.amber, border:'none', cursor:'pointer' }}>⚠️ Issue</button>
                  )}
                  {(order.status==='delivered'||order.status==='dispatched') && (
                    <button onClick={()=>printInvoice(order)} style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:G.blueLight, color:G.blue, border:'none', cursor:'pointer' }}>🧾 Invoice</button>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                {(order.order_items||[]).map((item,i)=>(
                  <span key={i} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:G.greenLight, color:G.greenDark, fontWeight:600 }}>{item.name} × {item.quantity}</span>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontSize:12, color:G.muted }}>
                  {order.order_type==='pickup'?`🏪 ${order.pickup_branch}`:`📍 ${(order.delivery_address||'').slice(0,35)}…`} · {(order.payment_method||'').toUpperCase()}
                </span>
                <span style={{ fontWeight:700, fontSize:15, color:G.green }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
              </div>
              {order.status!=='cancelled' && (
                <>
                  <div style={{ display:'flex', gap:3 }}>
                    {['pending','confirmed','packed','dispatched','delivered'].map((s,i)=>{ const idx=['pending','confirmed','packed','dispatched','delivered'].indexOf(order.status); return <div key={s} style={{ flex:1, height:4, borderRadius:2, background:i<=idx?G.green:'#E5E7EB' }} /> })}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                    {['Placed','Confirmed','Packed','Shipped','Delivered'].map((s,i)=>{ const idx=['pending','confirmed','packed','dispatched','delivered'].indexOf(order.status); return <span key={s} style={{ fontSize:9, color:i<=idx?G.green:'#9CA3AF', fontWeight:i<=idx?600:400 }}>{s}</span> })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Subscribe ─────────────────────────────── */}
      {tab==='subscribe' && <SubscribeSection user={user} />}

      {/* ── Tab: Refer & Earn ──────────────────────────── */}
      {tab==='referral' && <ReferralSection user={user} />}
    </div>
  )
}

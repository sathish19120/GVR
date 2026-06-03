import { useState, useEffect } from 'react'
import ProfilePage from './ProfilePage'
import ReferralPage from './ReferralPage'
import SubscriptionPage from './SubscriptionPage'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',
  red:'#DC2626',redLight:'#FEE2E2',white:'#fff',surface:'#F4F6F3'
}

const STATUS_COLOR = { pending:G.amber,confirmed:G.blue,packed:G.green2,dispatched:'#7C3AED',delivered:G.green,cancelled:G.red }
const STATUS_BG = { pending:G.amberLight,confirmed:G.blueLight,packed:G.greenLight,dispatched:'#EDE9FE',delivered:G.greenLight,cancelled:G.redLight }

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
          <p style={{ color:'#6B7280',fontSize:14,lineHeight:1.7,marginBottom:18 }}>
            Green Village Rice serves customers across <strong style={{color:'#3B6D11'}}>Hyderabad and Secunderabad</strong>, delivering farm-fresh Sona Masoori rice to homes, apartments, and businesses.
          </p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18 }}>
            {[{area:'Kukatpally',icon:'🏙️',desc:'KPHB, JNTU, Miyapur'},{area:'Hitech City',icon:'💻',desc:'Madhapur, Gachibowli, Kondapur'},{area:'Secunderabad',icon:'🏛️',desc:'Trimulgherry, Karkhana, SP Road'},{area:'Dilsukhnagar',icon:'🌆',desc:'LB Nagar, Malakpet, Kothapet'},{area:'Ameerpet',icon:'🏢',desc:'SR Nagar, Punjagutta, Begumpet'},{area:'Uppal',icon:'🏭',desc:'Nacharam, Habsiguda, Tarnaka'}].map(a=>(
              <div key={a.area} style={{ background:'#F4F6F3',borderRadius:12,padding:'12px 14px',display:'flex',gap:10 }}>
                <span style={{ fontSize:20 }}>{a.icon}</span>
                <div><p style={{ margin:'0 0 2px',fontWeight:700,fontSize:13,color:'#111827' }}>{a.area}</p><p style={{ margin:0,fontSize:11,color:'#6B7280' }}>{a.desc}</p></div>
              </div>
            ))}
          </div>
          <div style={{ background:'#EAF3DE',borderRadius:12,padding:'12px 16px',display:'flex',gap:10,alignItems:'center' }}>
            <span style={{ fontSize:18 }}>🚚</span>
            <p style={{ margin:0,fontSize:13,color:'#27500A' }}>Same-day delivery for orders before <strong>12:00 PM</strong>. Free delivery on orders above <strong>₹500</strong>.</p>
          </div>
        </>}
        {modal==='what' && <>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:'#27500A' }}>🌾 What We Do</h2>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#6B7280' }}>✕</button>
          </div>
          <p style={{ color:'#6B7280',fontSize:14,lineHeight:1.7,marginBottom:20 }}>
            We are a <strong style={{color:'#3B6D11'}}>direct-to-consumer rice brand</strong> sourcing premium Sona Masoori from Telangana farms, milling fresh, and delivering to your kitchen.
          </p>
          <div style={{ display:'grid',gap:12 }}>
            {[{icon:'🌱',title:'Farm Sourcing',desc:'Directly from certified paddy farmers in Nalgonda, Khammam, and Warangal.'},{icon:'⚙️',title:'Fresh Milling',desc:'Milled in small batches with packing date on every pack.'},{icon:'📦',title:'Quality Packing',desc:'1kg and 5kg packs. FSSAI-compliant with best-before dates.'},{icon:'🚪',title:'Doorstep Delivery',desc:'Orders delivered to your home within hours.'},{icon:'💰',title:'Fair Pricing',desc:'₹68/kg for 1kg packs, ₹64/kg for 5kg packs.'}].map(item=>(
              <div key={item.title} style={{ display:'flex',gap:12,padding:'12px 14px',background:'#F9FAF7',borderRadius:12,borderLeft:'3px solid #3B6D11' }}>
                <span style={{ fontSize:22,flexShrink:0 }}>{item.icon}</span>
                <div><p style={{ margin:'0 0 3px',fontWeight:700,fontSize:14,color:'#111827' }}>{item.title}</p><p style={{ margin:0,fontSize:13,color:'#6B7280',lineHeight:1.6 }}>{item.desc}</p></div>
              </div>
            ))}
          </div>
        </>}
        {modal==='about' && <>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:'#27500A' }}>🌾 About Green Village Rice</h2>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#6B7280' }}>✕</button>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:20,padding:'16px 18px',background:'linear-gradient(135deg,#3B6D11,#27500A)',borderRadius:14 }}>
            <div style={{ width:52,height:52,borderRadius:12,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0 }}>🌾</div>
            <div>
              <p style={{ margin:'0 0 3px',fontWeight:800,fontSize:16,color:'#fff' }}>Green Village Rice</p>
              <p style={{ margin:'0 0 2px',fontSize:12,color:'rgba(255,255,255,0.7)' }}>గ్రీన్ విలేజ్ రైస్ · Hyderabad, Telangana</p>
              <p style={{ margin:0,fontSize:11,color:'rgba(255,255,255,0.5)' }}>Est. 2026 · FSSAI Licensed</p>
            </div>
          </div>
          <p style={{ color:'#6B7280',fontSize:14,lineHeight:1.8,marginBottom:16 }}>
            Founded with a simple belief — every family deserves fresh, clean rice at a fair price. We source directly from Telangana farms and deliver to your door.
          </p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18 }}>
            {[{icon:'🏆',label:'Our Mission',value:'Make fresh rice accessible to every household in Hyderabad'},{icon:'👁️',label:'Our Vision',value:"Become Telangana's most trusted farm-to-home rice brand"},{icon:'💚',label:'Our Values',value:'Freshness, Transparency, Fair Pricing, Community'},{icon:'📞',label:'Contact Us',value:'admin@greenvillagerice.in · Hyderabad'}].map(item=>(
              <div key={item.label} style={{ background:'#F4F6F3',borderRadius:12,padding:'14px' }}>
                <p style={{ margin:'0 0 5px',fontSize:18 }}>{item.icon}</p>
                <p style={{ margin:'0 0 3px',fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.6px' }}>{item.label}</p>
                <p style={{ margin:0,fontSize:12,color:'#374151',lineHeight:1.5 }}>{item.value}</p>
              </div>
            ))}
          </div>
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

export default function CustomerShop() {
  const { user, signOut }         = useAuth()
  const navigate                  = useNavigate()
  const [tab, setTab]             = useState('shop')
  const [products, setProducts]   = useState([])
  const [cart, setCart]           = useState({})
  const [step, setStep]           = useState('shop')
  const [address, setAddress]     = useState(user?.address || '')
  const [phone, setPhone]         = useState(user?.phone || '')
  const [payMethod, setPayMethod] = useState('cod')
  const [placing, setPlacing]     = useState(false)
  const [autoPlacing, setAutoPlacing] = useState(false)

  // Auto-place order when user returns from UPI payment app
  useEffect(() => {
    if (step !== 'checkout' || payMethod !== 'upi') return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && utrRef.trim().length === 0) {
        // User returned from payment app — show prompt to enter UTR
        setAutoPlacing(true)
        setTimeout(() => setAutoPlacing(false), 4000)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [step, payMethod, utrRef])
  const [orderNum, setOrderNum]   = useState('')
  const [myOrders, setMyOrders]   = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [topModal, setTopModal]   = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [utrRef, setUtrRef]         = useState('')

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { if (tab === 'myorders') loadMyOrders() }, [tab])

  async function loadProducts() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('products').select('*').eq('active', true).order('weight_kg')
      if (error) throw error
      setProducts(data || [])
    } catch(e) { setError('Failed to load products. Please refresh.') }
    finally { setLoading(false) }
  }

  async function loadMyOrders() {
    if (!user) return
    setOrdersLoading(true)
    try {
      const { data } = await supabase.from('orders').select('*, order_items(name, weight_kg, quantity, price_per_unit)').eq('customer_id', user.id).order('created_at', { ascending: false })
      setMyOrders(data || [])
    } catch(e) { console.error(e) }
    finally { setOrdersLoading(false) }
  }

  const handleLogout = async () => { await signOut(); navigate('/login') }

  const totalItems  = Object.values(cart).reduce((s, q) => s + q, 0)
  const totalAmount = products.reduce((s, p) => s + (cart[p.id] || 0) * p.price_per_bag, 0)
  const gst         = Math.round(totalAmount * 0.05)
  const deliveryFee = orderType === 'pickup' ? 0 : (totalItems > 0 ? 0 : 0)
  const grand       = totalAmount + gst

  const updateCart = (id, delta) => {
    setCart(prev => {
      const qty = Math.max(0, (prev[id] || 0) + delta)
      if (qty === 0) { const n = { ...prev }; delete n[id]; return n }
      return { ...prev, [id]: qty }
    })
  }

  async function placeOrder() {
    if (orderType === 'delivery' && !address.trim()) { setError('Please enter delivery address'); return }
    if (orderType === 'pickup' && !pickupBranch) { setError('Please select a pickup branch'); return }
    setError(''); setPlacing(true)
    try {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true })
      const orderNumber = `GVR-${String((count || 0) + 1).padStart(4, '0')}`
      const paymentConfirmed = payMethod === 'cod' || (utrRef.trim().length > 0)
      const { data: order, error: oErr } = await supabase.from('orders').insert({
        order_number: orderNumber, customer_id: user?.id || null,
        customer_name: user?.full_name || user?.username || 'Customer',
        delivery_address: address, total_amount: grand,
        status: 'pending',
        payment_status: paymentConfirmed ? 'paid' : 'pending',
        payment_method: payMethod,
        notes: utrRef.trim() ? `Payment Ref: ${utrRef.trim()}` : null,
        created_at: new Date().toISOString()
      }).select().single()
      if (oErr || !order) throw new Error(oErr?.message || 'Failed to create order')
      for (const p of products.filter(p => cart[p.id])) {
        await supabase.from('order_items').insert({ order_id: order.id, product_id: p.id, name: p.name, weight_kg: p.weight_kg, quantity: cart[p.id], price_per_unit: p.price_per_bag })
        await supabase.from('products').update({ stock_bags: Math.max(0, p.stock_bags - cart[p.id]) }).eq('id', p.id)
      }
      setOrderNum(orderNumber); setCart({}); setAddress(''); setStep('success')
    } catch(e) { setError(e.message || 'Failed to place order. Please try again.') }
    finally { setPlacing(false) }
  }

  // Reload user from localStorage when profile updates
  const refreshUser = () => {
    const saved = localStorage.getItem('gvr_user')
    if (saved) { /* auth store will re-read on next render */ }
  }

  const TopNav = () => (
    <div style={{ background: G.white, borderBottom: `1px solid ${G.border}`, padding: '0 16px', display: 'flex', alignItems: 'center' }}>
      {[['where', '📍 Where We Work'], ['what', '🌾 What We Do'], ['about', 'ℹ️ About']].map(([key, label]) => (
        <button key={key} onClick={() => setTopModal(key)} style={{ padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: G.green }}
          onMouseEnter={e => e.currentTarget.style.background = G.greenLight}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >{label}</button>
      ))}
    </div>
  )

  const upiId = import.meta.env.VITE_UPI_ID || ''
  const upiUrl = `upi://pay?pa=${upiId}&pn=Green+Village+Rice&am=${grand}&cu=INR&tn=GVR+Rice+Order`
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`

  if (step === 'success') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: G.surface, padding: 20 }}>
      <TopNavModal modal={topModal} onClose={() => setTopModal(null)} />
      <div style={{ textAlign: 'center', background: G.white, borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: 400, width: '100%' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: G.greenDark, margin: '0 0 8px' }}>Order Placed!</h2>
        <p style={{ color: G.muted, margin: '0 0 4px', fontSize: 14 }}>Order: <strong style={{ color: G.green }}>{orderNum}</strong></p>
        <p style={{ color: G.muted, margin: '0 0 28px', fontSize: 13 }}>We will deliver your fresh rice soon 🌾</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => { setStep('shop'); setTab('myorders') }} style={{ background: G.green, color: G.white, border: 'none', borderRadius: 12, padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Track My Order →</button>
          <button onClick={() => { setStep('shop'); setTab('shop') }} style={{ background: G.greenLight, color: G.green, border: 'none', borderRadius: 12, padding: '12px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Order More Rice</button>
        </div>
      </div>
    </div>
  )

  if (step === 'checkout') return (
    <div style={{ minHeight: '100vh', background: G.surface }}>
      <TopNavModal modal={topModal} onClose={() => setTopModal(null)} />
      <header style={{ background: G.green, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => { setStep('shop'); setError('') }} style={{ background: 'none', border: 'none', color: G.white, fontSize: 22, cursor: 'pointer' }}>←</button>
        <span style={{ color: G.white, fontWeight: 700, fontSize: 16 }}>Checkout</span>
      </header>
      {autoPlacing && (
        <div style={{ background: G.amber, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, animation: 'pulse 1s ease-in-out' }}>
          <span style={{ fontSize: 16 }}>📱</span>
          <p style={{ margin: 0, fontSize: 13, color: G.white, fontWeight: 600 }}>Payment done? Enter your UTR/Transaction ID above to confirm your order automatically!</p>
        </div>
      )}
      <TopNav />
      <div style={{ maxWidth: 500, margin: '0 auto', padding: `16px 16px calc(100px + env(safe-area-inset-bottom))` }}>
        {error && <div style={{ background: G.redLight, border: `1px solid #FECACA`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: G.red, fontSize: 13 }}>{error}</div>}

        {/* Cart summary */}
        <div style={{ background: G.white, borderRadius: 14, padding: 18, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight: 700, margin: '0 0 12px', color: G.text, fontSize: 15 }}>Your Order</p>
          {products.filter(p => cart[p.id]).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${G.border}` }}>
              <div><p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 500 }}>{p.name}</p><p style={{ margin: 0, fontSize: 12, color: G.muted }}>₹{p.price_per_bag} × {cart[p.id]}</p></div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>₹{cart[p.id] * p.price_per_bag}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: G.muted }}><span>Subtotal</span><span>₹{totalAmount}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: G.muted }}><span>GST (5%)</span><span>₹{gst}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontWeight: 700, fontSize: 15, color: G.green, borderTop: `1px solid ${G.border}`, marginTop: 4 }}><span>Total</span><span>₹{grand}</span></div>
          </div>
        </div>

        {/* Order Type */}
        <div style={{ background: G.white, borderRadius: 14, padding: 18, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight: 700, margin: '0 0 12px', color: G.text, fontSize: 15 }}>How do you want your order?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              ['delivery', '🚚', 'Home Delivery', `₹15 delivery fee`],
              ['pickup',   '🏪', 'Store Pickup',  'Free — collect at branch'],
            ].map(([val, icon, label, sub]) => (
              <div key={val} onClick={() => setOrderType(val)} style={{ padding: '12px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${orderType === val ? G.green : G.border}`, background: orderType === val ? G.greenLight : G.white, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 13, color: orderType === val ? G.greenDark : G.text }}>{label}</p>
                <p style={{ margin: 0, fontSize: 11, color: orderType === val ? G.green2 : G.muted }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Delivery fields */}
          {orderType === 'delivery' && (
            <>
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="House/flat number, street, area, landmark..." rows={3}
                style={{ width: '100%', padding: 12, borderRadius: 10, border: `1.5px solid ${G.border}`, fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 8 }} />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number for delivery" type="tel"
                style={{ width: '100%', padding: 12, borderRadius: 10, border: `1.5px solid ${G.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </>
          )}

          {/* Pickup fields */}
          {orderType === 'pickup' && (
            <>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: G.text }}>Select Pickup Branch *</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {['Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu'].map(b => (
                  <div key={b} onClick={() => setPickupBranch(b)} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${pickupBranch === b ? G.green : G.border}`, background: pickupBranch === b ? G.greenLight : G.white, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>🏪</span>
                    <span style={{ fontSize: 13, fontWeight: pickupBranch === b ? 700 : 400, color: pickupBranch === b ? G.greenDark : G.text }}>{b}</span>
                    {pickupBranch === b && <span style={{ marginLeft: 'auto', color: G.green, fontWeight: 700 }}>✓</span>}
                  </div>
                ))}
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: G.text }}>Preferred Pickup Time</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['9 AM – 11 AM', '11 AM – 1 PM', '1 PM – 3 PM', '3 PM – 5 PM', '5 PM – 7 PM'].map(t => (
                  <button key={t} type="button" onClick={() => setPickupTime(t)} style={{ padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${pickupTime === t ? G.green : G.border}`, background: pickupTime === t ? G.greenLight : G.white, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: pickupTime === t ? G.greenDark : G.muted }}>{t}</button>
                ))}
              </div>
              {pickupBranch && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: G.greenLight, borderRadius: 10, fontSize: 12, color: G.greenDark }}>
                  ✅ Pickup at <strong>{pickupBranch}</strong> branch{pickupTime ? ` · ${pickupTime}` : ''} · No delivery charge
                </div>
              )}
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel"
                style={{ width: '100%', padding: 12, borderRadius: 10, border: `1.5px solid ${G.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginTop: 10 }} />
            </>
          )}
        </div>

        {/* Payment */}
        <div style={{ background: G.white, borderRadius: 14, padding: 18, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight: 700, margin: '0 0 12px', color: G.text, fontSize: 15 }}>Payment Method</p>
          {[
            ['cod',  '💵', 'Cash on Delivery',  'Pay when your order arrives'],
            ['upi',  '📱', 'UPI Payment',        'GPay, PhonePe, Paytm'],
            ['bank', '🏦', 'Bank Transfer',      'NEFT / IMPS / RTGS'],
          ].map(([val, icon, label, sub]) => (
            <div key={val} onClick={() => setPayMethod(val)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, marginBottom: 8, cursor: 'pointer', border: `2px solid ${payMethod === val ? G.green : G.border}`, background: payMethod === val ? G.greenLight : G.white }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{label}</p><p style={{ margin: 0, fontSize: 12, color: G.muted }}>{sub}</p></div>
              {payMethod === val && <span style={{ color: G.green, fontWeight: 700 }}>✓</span>}
            </div>
          ))}

          {/* UPI QR + confirmation */}
          {payMethod === 'upi' && (
            <div style={{ marginTop: 12, padding: 16, background: '#F9FAF7', borderRadius: 12, border: `1px solid ${G.border}` }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: G.text, textAlign: 'center' }}>Step 1 — Scan & Pay</p>
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: G.white, display: 'inline-block', padding: 12, borderRadius: 12, border: `1px solid ${G.border}`, marginBottom: 10 }}>
                  <img src={qrUrl} alt="UPI QR Code" width={180} height={180} style={{ display: 'block', borderRadius: 8 }} />
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: G.text }}>₹{grand}</p>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: G.muted }}>Powered by UPI · Green Village Rice</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                  {[
                    { name: 'GPay',    color: '#1A73E8', letter: 'G' },
                    { name: 'PhonePe', color: '#5F259F', letter: 'P' },
                    { name: 'Paytm',   color: '#00BAF2', letter: 'P' },
                    { name: 'BHIM',    color: '#00A650', letter: 'B' },
                  ].map(app => (
                    <a key={app.name} href={upiUrl}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: app.color + '18', color: app.color, fontSize: 12, fontWeight: 700, textDecoration: 'none', border: `1px solid ${app.color}40` }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: app.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{app.letter}</span>
                      {app.name}
                    </a>
                  ))}
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: G.text }}>Step 2 — Enter UPI Transaction ID</p>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: G.muted }}>After payment, enter the 12-digit UTR / transaction ID shown in your payment app</p>
                <input
                  type="text" value={utrRef} onChange={e => setUtrRef(e.target.value.trim())}
                  placeholder="e.g. 425318976234"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${utrRef.trim().length > 0 ? G.green : G.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: G.white }}
                />
                {utrRef.trim().length > 0 && (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: G.green }}>✓ Transaction ID saved — your order will be confirmed</p>
                )}
                {utrRef.trim().length === 0 && (
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: G.amber }}>⚠ Enter transaction ID to confirm payment. You can still place order without it.</p>
                )}
              </div>
            </div>
          )}

          {/* Bank transfer details */}
          {payMethod === 'bank' && (
            <div style={{ marginTop: 12, padding: 16, background: '#F9FAF7', borderRadius: 12, border: `1px solid ${G.border}` }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: G.text }}>Step 1 — Transfer to this account</p>
              <div style={{ background: G.white, borderRadius: 10, padding: 14, marginBottom: 14 }}>
                {[
                  ['Account Name', 'Green Village Rice'],
                  ['Bank', 'State Bank of India'],
                  ['Account No', 'XXXX XXXX XXXX'],
                  ['IFSC Code', 'SBIN0XXXXXX'],
                  ['Amount', `₹${grand}`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${G.border}`, fontSize: 13 }}>
                    <span style={{ color: G.muted }}>{label}</span>
                    <span style={{ fontWeight: 600, color: G.text }}>{val}</span>
                  </div>
                ))}
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: G.text }}>Step 2 — Enter Transaction Reference</p>
              <input
                type="text" value={utrRef} onChange={e => setUtrRef(e.target.value.trim())}
                placeholder="Enter NEFT/IMPS/RTGS reference number"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${utrRef.trim().length > 0 ? G.green : G.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: G.white }}
              />
              {utrRef.trim().length > 0 && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: G.green }}>✓ Reference saved — your order will be confirmed</p>
              )}
            </div>
          )}

          {/* COD — instant place */}
          {payMethod === 'cod' && (
            <div style={{ marginTop: 12, padding: 14, background: G.greenLight, borderRadius: 12, border: `1px solid #97C459` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>💵</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: G.greenDark }}>Cash on Delivery</p>
                  <p style={{ margin: 0, fontSize: 12, color: G.green2 }}>Pay ₹{grand} in cash when your order arrives</p>
                </div>
              </div>
              <button onClick={placeOrder} disabled={placing || (orderType==='delivery' && !address.trim())} style={{
                width: '100%', padding: 13, background: placing ? '#9CA3AF' : G.greenDark,
                color: G.white, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(39,80,10,0.3)'
              }}>
                {placing ? '⏳ Placing...' : `⚡ Place COD Order Now — ₹${grand}`}
              </button>
            </div>
          )}
        </div>

        {payMethod !== 'cod' && <button id="auto-place-btn" onClick={placeOrder} disabled={placing || !address.trim()} style={{ width: '100%', padding: 16, background: placing || !address.trim() ? '#9CA3AF' : G.green, color: G.white, border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: placing || !address.trim() ? 'not-allowed' : 'pointer' }}>
          {placing ? '⏳ Placing order...' : `${orderType === 'pickup' ? '🏪 Place Pickup Order' : '✅ Place Order'} — ₹${grand}`}
        </button>}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: G.surface }}>
      <TopNavModal modal={topModal} onClose={() => setTopModal(null)} />

      <header style={{ background: G.green, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌾</span>
          <div>
            <p style={{ color: G.white, fontWeight: 700, margin: 0, fontSize: 15 }}>Green Village Rice</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 11 }}>Fresh Sona Masoori</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {totalItems > 0 && tab === 'shop' && (
            <button onClick={() => { setStep('checkout'); setError('') }} style={{ background: G.white, border: 'none', borderRadius: 20, padding: '6px 14px', fontWeight: 700, color: G.green, cursor: 'pointer', fontSize: 13 }}>
              🛒 {totalItems} · ₹{totalAmount}
            </button>
          )}
          <button onClick={() => setShowProfile(true)} style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:20, padding:'4px 12px 4px 4px', cursor:'pointer' }}>
            <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:G.white, overflow:'hidden', flexShrink:0 }}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : (user?.full_name?.[0] || user?.username?.[0]?.toUpperCase() || 'U')
              }
            </div>
            <span style={{ color:G.white, fontSize:12, fontWeight:600, maxWidth:70, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.full_name?.split(' ')[0] || user?.username}
            </span>
          </button>
          <button onClick={handleLogout} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, padding:'5px 12px', color:G.white, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            Logout
          </button>
        </div>
      </header>

      <TopNav />

      <div style={{ background: G.white, borderBottom: `1px solid ${G.border}`, display: 'flex' }}>
        {[['shop','🌾 Order Rice'],['myorders','📋 My Orders'],['subscribe','🔄 Subscribe'],['referral','🎁 Refer & Earn']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderBottom: `3px solid ${tab === key ? G.green : 'transparent'}`, color: tab === key ? G.green : G.muted, flex: 1, textAlign: 'center' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'subscribe' && <div style={{ maxWidth:600,margin:'0 auto',padding:16 }}><SubscriptionPage /></div>}
      {tab === 'referral' && <div style={{ maxWidth:600,margin:'0 auto',padding:16 }}><ReferralPage /></div>}
      {tab === 'myorders' && (
        <div className='page-content' style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 16px' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: G.text }}>Orders for {user?.full_name || user?.username}</p>
            <button onClick={loadMyOrders} style={{ background: G.greenLight, border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: G.green, cursor: 'pointer' }}>↻ Refresh</button>
          </div>
          {ordersLoading && <p style={{ textAlign: 'center', color: G.muted, padding: 40 }}>Loading orders...</p>}
          {!ordersLoading && myOrders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: G.white, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <p style={{ fontWeight: 700, color: G.text, margin: '0 0 6px', fontSize: 16 }}>No orders yet</p>
              <p style={{ color: G.muted, fontSize: 13, margin: '0 0 20px' }}>Your orders will appear here</p>
              <button onClick={() => setTab('shop')} style={{ background: G.green, color: G.white, border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Order Now →</button>
            </div>
          )}
          {myOrders.map(order => (
            <div key={order.id} style={{ background: G.white, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 15, color: G.text }}>{order.order_number}</p>
                  <p style={{ margin: 0, fontSize: 12, color: G.muted }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: STATUS_BG[order.status] || '#F3F4F6', color: STATUS_COLOR[order.status] || G.muted, whiteSpace: 'nowrap' }}>
                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {(order.order_items || []).map((item, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: G.greenLight, color: G.greenDark, fontWeight: 600 }}>{item.name} × {item.quantity}</span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: order.status !== 'cancelled' ? 12 : 0 }}>
                <span style={{ fontSize: 12, color: G.muted }}>{order.order_type === 'pickup' ? `🏪 Pickup: ${order.pickup_branch}${order.pickup_time ? ' · ' + order.pickup_time : ''}` : `📍 ${order.delivery_address?.slice(0,40)}${(order.delivery_address?.length||0)>40?'…':''}`} · {order.payment_method?.toUpperCase()}</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: G.green }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
              </div>
              {order.status !== 'cancelled' && (
                <div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {['pending', 'confirmed', 'packed', 'dispatched', 'delivered'].map((s, i) => {
                      const idx = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered'].indexOf(order.status)
                      return <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= idx ? G.green : '#E5E7EB' }} />
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    {['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].map((s, i) => {
                      const idx = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered'].indexOf(order.status)
                      return <span key={s} style={{ fontSize: 9, color: i <= idx ? G.green : '#9CA3AF', fontWeight: i <= idx ? 600 : 400 }}>{s}</span>
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'shop' && (
        <div className='page-content' style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
          {error && (
            <div style={{ background: G.redLight, border: `1px solid #FECACA`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: G.red, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: G.red, fontSize: 16 }}>✕</button>
            </div>
          )}
          <p style={{ fontSize: 13, color: G.muted, margin: '12px 0 16px' }}>
            👋 Hello, <strong style={{ color: G.text }}>{user?.full_name || user?.username}</strong> · Fresh stock available today
          </p>
          {loading && <p style={{ textAlign: 'center', color: G.muted, padding: 40 }}>Loading products...</p>}
          {products.map(p => (
            <div key={p.id} style={{ background: G.white, borderRadius: 14, padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🌾</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 15, color: G.text }}>{p.name}</p>
                <p style={{ margin: '0 0 2px', fontSize: 12, color: G.muted }}>{p.name_telugu} · {p.weight_kg}kg pack</p>
                {p.packing_date && <p style={{ margin: 0, fontSize: 11, color: G.green }}>✓ Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</p>}
                {p.stock_bags <= p.low_stock_threshold && <p style={{ margin: 0, fontSize: 11, color: G.amber }}>⚠ Only {p.stock_bags} bags left</p>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 17, color: G.text }}>₹{p.price_per_bag}</p>
                {p.stock_bags <= 0 ? (
                  <span style={{ fontSize: 12, color: G.red, fontWeight: 600 }}>Out of Stock</span>
                ) : !cart[p.id] ? (
                  <button onClick={() => updateCart(p.id, 1)} style={{ background: G.green, color: G.white, border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Add +</button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: G.greenLight, borderRadius: 8, padding: '5px 10px' }}>
                    <button onClick={() => updateCart(p.id, -1)} style={{ background: 'none', border: 'none', color: G.green, fontSize: 22, cursor: 'pointer', fontWeight: 700, lineHeight: 1, padding: 0 }}>−</button>
                    <span style={{ fontWeight: 700, color: G.greenDark, minWidth: 20, textAlign: 'center', fontSize: 15 }}>{cart[p.id]}</span>
                    <button onClick={() => updateCart(p.id, 1)} style={{ background: 'none', border: 'none', color: G.green, fontSize: 22, cursor: 'pointer', fontWeight: 700, lineHeight: 1, padding: 0 }}>+</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {totalItems > 0 && (
            <div style={{ position: 'sticky', bottom: 16, marginTop: 16 }}>
              <button onClick={() => { setStep('checkout'); setError('') }} style={{ width: '100%', padding: 16, background: G.green, color: G.white, border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,109,17,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🛒 {totalItems} item{totalItems > 1 ? 's' : ''}</span>
                <span>Checkout · ₹{totalAmount} →</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

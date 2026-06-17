import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',purple:'#7C3AED',purpleLight:'#EDE9FE',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const STATUS_COLOR = {
  pending:G.amber, confirmed:G.blue, packed:G.green2,
  dispatched:'#7C3AED', delivered:G.green, cancelled:G.red
}
const STATUS_BG = {
  pending:G.amberLight, confirmed:G.blueLight, packed:G.greenLight,
  dispatched:'#EDE9FE', delivered:G.greenLight, cancelled:G.redLight
}

const UPI_ID = import.meta.env.VITE_UPI_ID || ''

function TopNavModal({ modal, onClose }) {
  if (!modal) return null
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:480,padding:28 }}>
        {modal==='about' && <>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:16 }}>
            <h2 style={{ margin:0,fontSize:18,fontWeight:700,color:G.greenDark }}>🌾 About GVR B2B</h2>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer' }}>✕</button>
          </div>
          <p style={{ fontSize:14,color:G.muted,lineHeight:1.8,marginBottom:16 }}>
            Green Village Rice offers <strong style={{color:G.green}}>bulk wholesale orders</strong> for vendors, distributors, and retailers across Telangana and Andhra Pradesh. Order directly through this portal and get delivery to your location.
          </p>
          {[
            ['📦','Minimum Order','10 bags per product'],
            ['🚚','Delivery','2–5 business days to your location'],
            ['💰','Payment','UPI / Bank Transfer before dispatch'],
            ['📞','Support','Contact us for custom pricing on large orders'],
          ].map(([icon,label,val])=>(
            <div key={label} style={{ display:'flex',gap:12,padding:'10px 0',borderBottom:`1px solid ${G.border}` }}>
              <span style={{ fontSize:20 }}>{icon}</span>
              <div><p style={{ margin:0,fontWeight:600,fontSize:13 }}>{label}</p><p style={{ margin:0,fontSize:12,color:G.muted }}>{val}</p></div>
            </div>
          ))}
        </>}
        {modal==='contact' && <>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:16 }}>
            <h2 style={{ margin:0,fontSize:18,fontWeight:700,color:G.greenDark }}>📞 Contact Us</h2>
            <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer' }}>✕</button>
          </div>
          {[
            ['📞','Phone','Call / WhatsApp for bulk orders'],
            ['📧','Email','admin@greenvillagerice.in'],
            ['📍','Location','Hyderabad, Telangana'],
            ['🕐','Timing','Mon–Sat, 9 AM – 6 PM'],
          ].map(([icon,label,val])=>(
            <div key={label} style={{ display:'flex',gap:12,padding:'10px 0',borderBottom:`1px solid ${G.border}` }}>
              <span style={{ fontSize:20 }}>{icon}</span>
              <div><p style={{ margin:0,fontWeight:600,fontSize:13 }}>{label}</p><p style={{ margin:0,fontSize:12,color:G.muted }}>{val}</p></div>
            </div>
          ))}
        </>}
      </div>
    </div>
  )
}

export default function VendorPortal() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]             = useState('order')
  const [products, setProducts]   = useState([])
  const [myOrders, setMyOrders]   = useState([])
  const [cart, setCart]           = useState({})
  const [step, setStep]           = useState('shop') // shop|checkout|success
  const [address, setAddress]     = useState(user?.address || '')
  const [phone, setPhone]         = useState(user?.phone || '')
  const [bizName, setBizName]     = useState(user?.full_name || '')
  const [payMethod, setPayMethod] = useState('upi')
  const [utrRef, setUtrRef]       = useState('')
  const [placing, setPlacing]     = useState(false)
  const [orderNum, setOrderNum]   = useState('')
  const [loading, setLoading]     = useState(true)
  const [ordersLoading, setOL]    = useState(false)
  const [error, setError]         = useState('')
  const [topModal, setTopModal]   = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { if (tab === 'orders') loadMyOrders() }, [tab])

  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').eq('active', true).order('weight_kg')
    setProducts(data || [])
    setLoading(false)
  }

  async function loadMyOrders() {
    if (!user) return
    setOL(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(name, weight_kg, quantity, price_per_unit)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
    setMyOrders(data || [])
    setOL(false)
  }

  const totalBags   = Object.values(cart).reduce((s,q) => s+q, 0)
  const totalAmount = products.reduce((s,p) => s+(cart[p.id]||0)*p.price_per_bag, 0)
  // B2B: no GST shown separately — included in price for vendors
  const grand = totalAmount

  const updateCart = (id, val) => {
    const n = Math.max(0, parseInt(val) || 0)
    setCart(prev => {
      if (n === 0) { const c={...prev}; delete c[id]; return c }
      return {...prev, [id]: n}
    })
  }

  async function placeOrder() {
    if (!address.trim()) { setError('Please enter your delivery address'); return }
    if (!bizName.trim()) { setError('Please enter your business name'); return }
    setError(''); setPlacing(true)
    try {
      const { count } = await supabase.from('orders').select('*',{count:'exact',head:true})
      const orderNumber = `GVR-B2B-${String((count||0)+1).padStart(4,'0')}`
      const { data: order, error: oErr } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_id: user?.id || null,
        customer_name: bizName,
        delivery_address: address,
        total_amount: grand,
        status: 'pending',
        payment_status: utrRef.trim() ? 'verification_pending' : 'pending',
        payment_method: payMethod,
        notes: `B2B Vendor Order${utrRef ? ` · Payment Ref: ${utrRef}` : ' · Payment Pending'}`,
        created_at: new Date().toISOString()
      }).select().single()
      if (oErr || !order) throw new Error(oErr?.message || 'Failed to create order')
      for (const p of products.filter(p => cart[p.id])) {
        await supabase.from('order_items').insert({
          order_id: order.id, product_id: p.id,
          name: p.name, weight_kg: p.weight_kg,
          quantity: cart[p.id], price_per_unit: p.price_per_bag
        })
      }
      setOrderNum(orderNumber); setCart({}); setAddress(''); setUtrRef('')
      setStep('success')
    } catch(e) { setError(e.message || 'Failed to place order. Try again.') }
    finally { setPlacing(false) }
  }

  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Green+Village+Rice&am=${grand}&cu=INR&tn=GVR+B2B+Order`
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`

  // ── SUCCESS ──────────────────────────────────────────────
  if (step === 'success') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:G.surface, padding:20 }}>
      <div style={{ textAlign:'center', background:G.white, borderRadius:20, padding:'48px 36px', maxWidth:420, width:'100%', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:G.greenDark, margin:'0 0 8px' }}>Order Placed!</h2>
        <p style={{ color:G.muted, fontSize:14, margin:'0 0 4px' }}>Order: <strong style={{color:G.green}}>{orderNum}</strong></p>
        <p style={{ color:G.muted, fontSize:13, margin:'0 0 8px' }}>Our team will review and confirm your order shortly.</p>
        <div style={{ background:G.amberLight, borderRadius:10, padding:'10px 14px', marginBottom:24, fontSize:12, color:G.amber }}>
          ⚠ Order will be dispatched only after payment confirmation
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={()=>{setStep('shop');setTab('orders')}} style={{ background:G.green, color:G.white, border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer' }}>Track My Order →</button>
          <button onClick={()=>{setStep('shop');setTab('order')}} style={{ background:G.greenLight, color:G.green, border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:600, cursor:'pointer' }}>Place Another Order</button>
        </div>
      </div>
    </div>
  )

  // ── CHECKOUT ─────────────────────────────────────────────
  if (step === 'checkout') return (
    <div style={{ minHeight:'100vh', background:G.surface }}>
      <TopNavModal modal={topModal} onClose={()=>setTopModal(null)} />
      <header style={{ background:G.green, padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={()=>{setStep('shop');setError('')}} style={{ background:'none', border:'none', color:G.white, fontSize:22, cursor:'pointer' }}>←</button>
        <span style={{ color:G.white, fontWeight:700, fontSize:16 }}>B2B Checkout</span>
      </header>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px 16px 80px' }}>
        {error && <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:10, padding:'10px 14px', marginBottom:14, color:G.red, fontSize:13 }}>{error}</div>}

        {/* Order summary */}
        <div style={{ background:G.white, borderRadius:14, padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700, margin:'0 0 12px', fontSize:15 }}>Order Summary</p>
          {products.filter(p=>cart[p.id]).map(p=>(
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${G.border}` }}>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:600 }}>{p.name}</p>
                <p style={{ margin:0, fontSize:12, color:G.muted }}>₹{p.price_per_bag}/bag × {cart[p.id]} bags = {cart[p.id]*p.weight_kg}kg total</p>
              </div>
              <span style={{ fontWeight:700 }}>₹{cart[p.id]*p.price_per_bag}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', fontWeight:800, fontSize:16, color:G.green }}>
            <span>Total ({totalBags} bags)</span><span>₹{grand}</span>
          </div>
        </div>

        {/* Business details */}
        <div style={{ background:G.white, borderRadius:14, padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700, margin:'0 0 12px', fontSize:15 }}>Business Details</p>
          <div style={{ display:'grid', gap:10 }}>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', marginBottom:5 }}>Business / Shop Name *</label>
              <input type="text" value={bizName} onChange={e=>setBizName(e.target.value)} placeholder="Your business name"
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:14, outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', marginBottom:5 }}>Delivery Address *</label>
              <textarea value={address} onChange={e=>setAddress(e.target.value)} rows={3}
                placeholder="Full delivery address — shop/warehouse address"
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:14, outline:'none', resize:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', marginBottom:5 }}>Contact Phone</label>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mobile number"
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:14, outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div style={{ background:G.white, borderRadius:14, padding:18, marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700, margin:'0 0 12px', fontSize:15 }}>Payment</p>
          {[
            ['upi','📱','UPI Payment','GPay, PhonePe, Paytm — instant'],
            ['cod','💵','Pay on Delivery','Cash payment when order arrives'],
          ].map(([val,icon,label,sub])=>(
            <div key={val} onClick={()=>setPayMethod(val)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:10, marginBottom:8, cursor:'pointer', border:`2px solid ${payMethod===val?G.green:G.border}`, background:payMethod===val?G.greenLight:G.white }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontWeight:600, fontSize:14 }}>{label}</p>
                <p style={{ margin:0, fontSize:12, color:G.muted }}>{sub}</p>
              </div>
              {payMethod===val && <span style={{ color:G.green, fontWeight:700 }}>✓</span>}
            </div>
          ))}

          {/* UPI QR */}
          {payMethod === 'upi' && (
            <div style={{ marginTop:12, padding:16, background:'#F9FAF7', borderRadius:12, border:`1px solid ${G.border}`, textAlign:'center' }}>
              <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:700 }}>Scan & Pay — ₹{grand}</p>
              <div style={{ background:G.white, display:'inline-block', padding:10, borderRadius:10, border:`1px solid ${G.border}`, marginBottom:10 }}>
                <img src={qrUrl} alt="UPI QR" width={160} height={160} style={{ display:'block', borderRadius:6 }} />
              </div>
              <p style={{ margin:'0 0 10px', fontSize:12, color:G.muted }}>Powered by UPI · Green Village Rice</p>
              <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:14, flexWrap:'wrap' }}>
                {[{name:'GPay',color:'#1A73E8',l:'G'},{name:'PhonePe',color:'#5F259F',l:'P'},{name:'Paytm',color:'#00BAF2',l:'P'}].map(app=>(
                  <a key={app.name} href={upiUrl} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, background:app.color+'18', color:app.color, fontSize:12, fontWeight:700, textDecoration:'none', border:`1px solid ${app.color}40` }}>
                    <span style={{ width:16,height:16,borderRadius:'50%',background:app.color,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0 }}>{app.l}</span>
                    {app.name}
                  </a>
                ))}
              </div>
              <div style={{ borderTop:`1px solid ${G.border}`, paddingTop:12 }}>
                <p style={{ margin:'0 0 6px', fontSize:12, fontWeight:700 }}>Enter UPI Transaction ID after payment</p>
                <input type="text" value={utrRef} onChange={e=>setUtrRef(e.target.value.trim())}
                  placeholder="12-digit UTR / Transaction ID"
                  style={{ width:'100%', padding:'10px 12px', borderRadius:9, border:`1.5px solid ${utrRef?G.green:G.border}`, fontSize:13, outline:'none', boxSizing:'border-box' }} />
                {utrRef && (
  <p style={{ margin:'4px 0 0', fontSize:11, color:G.green }}>
    ✓ Payment reference submitted for admin verification
  </p>
)}
              </div>
            </div>
          )}

          {payMethod === 'cod' && (
            <div style={{ marginTop:10, padding:'10px 14px', background:G.amberLight, borderRadius:10, fontSize:12, color:G.amber }}>
              ⚠ COD orders will only be dispatched after confirmation from our team
            </div>
          )}
        </div>

        <button onClick={placeOrder} disabled={placing||!address.trim()||!bizName.trim()} style={{
          width:'100%', padding:15, fontSize:16, fontWeight:700,
          background:placing||!address.trim()||!bizName.trim()?'#9CA3AF':G.green,
          color:G.white, border:'none', borderRadius:14, cursor:'pointer',
          boxShadow:'0 4px 14px rgba(59,109,17,0.3)'
        }}>
          {placing ? '⏳ Placing order...' : `✅ Place B2B Order — ₹${grand}`}
        </button>
      </div>
    </div>
  )

  // ── MAIN PORTAL ──────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:G.surface }}>
      <TopNavModal modal={topModal} onClose={()=>setTopModal(null)} />

      {/* Header */}
      <header style={{ background:G.green, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>🌾</span>
          <div>
            <p style={{ color:G.white, fontWeight:700, margin:0, fontSize:15 }}>GVR Vendor Portal</p>
            <p style={{ color:'rgba(255,255,255,0.6)', margin:0, fontSize:11 }}>B2B Wholesale Orders</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {totalBags > 0 && tab === 'order' && (
            <button onClick={()=>{setStep('checkout');setError('')}} style={{ background:G.white, border:'none', borderRadius:20, padding:'6px 14px', fontWeight:700, color:G.green, cursor:'pointer', fontSize:13 }}>
              🛒 {totalBags} bags · ₹{grand}
            </button>
          )}
          <button onClick={() => setTopModal('about')} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, padding:'5px 12px', color:G.white, fontSize:12, fontWeight:600, cursor:'pointer' }}>About</button>
          <button onClick={() => setTopModal('contact')} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, padding:'5px 12px', color:G.white, fontSize:12, fontWeight:600, cursor:'pointer' }}>Contact</button>
          <button onClick={async()=>{await signOut();navigate('/login')}} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, padding:'5px 12px', color:G.white, fontSize:12, fontWeight:600, cursor:'pointer' }}>Logout</button>
        </div>
      </header>

      {/* Vendor welcome strip */}
      <div style={{ background:G.greenLight, padding:'10px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid #97C459` }}>
        <p style={{ margin:0, fontSize:13, color:G.greenDark }}>
          👋 Welcome, <strong>{user?.full_name || user?.username}</strong> · Vendor Account
        </p>
        <span style={{ fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20, background:G.green, color:G.white }}>B2B</span>
      </div>

      {/* Tabs */}
      <div style={{ background:G.white, borderBottom:`1px solid ${G.border}`, display:'flex' }}>
        {[['order','🛒 Place Order'],['orders','📋 My Orders'],['pricing','💰 Pricing']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{ padding:'12px 24px', border:'none', background:'none', cursor:'pointer', fontSize:13, fontWeight:600, borderBottom:`3px solid ${tab===key?G.green:'transparent'}`, color:tab===key?G.green:G.muted }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── PLACE ORDER TAB ── */}
      {tab === 'order' && (
        <div style={{ maxWidth:700, margin:'0 auto', padding:16 }}>
          <div style={{ background:G.blueLight, borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:18 }}>ℹ️</span>
            <p style={{ margin:0, fontSize:12, color:G.blue, lineHeight:1.6 }}>
              Enter quantity in bags for each product. Minimum 10 bags per product. Orders are dispatched after payment confirmation.
            </p>
          </div>

          {loading && <p style={{ textAlign:'center', color:G.muted, padding:40 }}>Loading products...</p>}

          {products.map(p => {
            const qty = cart[p.id] || 0
            const isLow = p.stock_bags <= p.low_stock_threshold
            return (
              <div key={p.id} style={{ background:G.white, borderRadius:14, padding:18, marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:`1px solid ${qty>0?G.green:G.border}` }}>
                <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ width:52, height:52, borderRadius:12, background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>🌾</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div>
                        <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:15 }}>{p.name}</p>
                        <p style={{ margin:0, fontSize:12, color:G.muted }}>{p.name_telugu} · {p.weight_kg}kg per bag · SKU: {p.sku}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ margin:'0 0 2px', fontWeight:800, fontSize:17, color:G.green }}>₹{p.price_per_bag}<span style={{ fontSize:11, color:G.muted, fontWeight:400 }}>/bag</span></p>
                        <p style={{ margin:0, fontSize:11, color:G.muted }}>{p.weight_kg}kg · ₹{(p.price_per_bag/p.weight_kg).toFixed(0)}/kg</p>
                      </div>
                    </div>

                    {/* Stock availability */}
                    <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:isLow?G.redLight:G.greenLight, color:isLow?G.red:G.green }}>
                        {isLow ? `⚠ Low stock: ${p.stock_bags} bags` : `✓ Available: ${p.stock_bags} bags`}
                      </span>
                      {p.packing_date && <span style={{ fontSize:11, color:G.muted }}>Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</span>}
                    </div>

                    {/* Quantity input */}
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:0, border:`1.5px solid ${qty>0?G.green:G.border}`, borderRadius:10, overflow:'hidden', background:G.white }}>
                        <button onClick={()=>updateCart(p.id, qty-1)} style={{ width:38, height:38, border:'none', background:'none', cursor:'pointer', fontSize:20, color:G.green, fontWeight:700 }}>−</button>
                        <input type="number" min={0} value={qty || ''} onChange={e=>updateCart(p.id, e.target.value)}
                          placeholder="0"
                          style={{ width:64, height:38, border:'none', borderLeft:`1px solid ${G.border}`, borderRight:`1px solid ${G.border}`, textAlign:'center', fontSize:15, fontWeight:700, outline:'none', color:G.text }} />
                        <button onClick={()=>updateCart(p.id, qty+1)} style={{ width:38, height:38, border:'none', background:'none', cursor:'pointer', fontSize:20, color:G.green, fontWeight:700 }}>+</button>
                      </div>
                      <span style={{ fontSize:12, color:G.muted }}>bags</span>
                      {qty > 0 && (
                        <div style={{ marginLeft:'auto', textAlign:'right' }}>
                          <p style={{ margin:0, fontSize:12, color:G.muted }}>{qty * p.weight_kg}kg total</p>
                          <p style={{ margin:0, fontSize:14, fontWeight:700, color:G.green }}>₹{qty * p.price_per_bag}</p>
                        </div>
                      )}
                    </div>
                    {qty > 0 && qty < 10 && (
                      <p style={{ margin:'6px 0 0', fontSize:11, color:G.amber }}>⚠ Minimum 10 bags recommended for wholesale orders</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {totalBags > 0 && (
            <div style={{ position:'sticky', bottom:16, marginTop:8 }}>
              <button onClick={()=>{setStep('checkout');setError('')}} style={{ width:'100%', padding:15, background:G.green, color:G.white, border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(59,109,17,0.35)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>🛒 {totalBags} bags · {Object.keys(cart).length} product{Object.keys(cart).length>1?'s':''}</span>
                <span>Checkout · ₹{grand} →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MY ORDERS TAB ── */}
      {tab === 'orders' && (
        <div style={{ maxWidth:700, margin:'0 auto', padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'4px 0 16px' }}>
            <p style={{ margin:0, fontSize:15, fontWeight:700 }}>My B2B Orders</p>
            <button onClick={loadMyOrders} style={{ background:G.greenLight, border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600, color:G.green, cursor:'pointer' }}>↻ Refresh</button>
          </div>
          {ordersLoading && <p style={{ textAlign:'center', color:G.muted, padding:40 }}>Loading...</p>}
          {!ordersLoading && myOrders.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px 20px', background:G.white, borderRadius:14 }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📦</div>
              <p style={{ fontWeight:700, color:G.text, margin:'0 0 4px' }}>No orders yet</p>
              <p style={{ color:G.muted, fontSize:13, margin:'0 0 16px' }}>Place your first wholesale order</p>
              <button onClick={()=>setTab('order')} style={{ background:G.green, color:G.white, border:'none', borderRadius:10, padding:'10px 24px', fontWeight:700, cursor:'pointer' }}>Order Now →</button>
            </div>
          )}
          {myOrders.map(order => (
            <div key={order.id} style={{ background:G.white, borderRadius:14, padding:16, marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:15, color:G.green }}>{order.order_number}</p>
                  <p style={{ margin:0, fontSize:12, color:G.muted }}>{new Date(order.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:STATUS_BG[order.status]||'#F3F4F6', color:STATUS_COLOR[order.status]||G.muted, display:'block', marginBottom:4 }}>
                    {order.status?.charAt(0).toUpperCase()+order.status?.slice(1)}
                  </span>
                  <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:order.payment_status==='paid'?G.greenLight:G.amberLight, color:order.payment_status==='paid'?G.green:G.amber }}>
                    {order.payment_status==='paid'?'✓ Paid':'⏳ Payment Pending'}
                  </span>
                </div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                {(order.order_items||[]).map((item,i)=>(
                  <span key={i} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:G.greenLight, color:G.greenDark, fontWeight:600 }}>
                    {item.name} × {item.quantity} bags ({item.quantity*item.weight_kg}kg)
                  </span>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:order.status!=='cancelled'?12:0 }}>
                <span style={{ fontSize:12, color:G.muted }}>📍 {order.delivery_address?.slice(0,45)}{(order.delivery_address?.length||0)>45?'…':''}</span>
                <span style={{ fontWeight:800, fontSize:16, color:G.green }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
              </div>
              {order.notes && <p style={{ margin:'0 0 10px', fontSize:11, color:G.muted, fontStyle:'italic' }}>📝 {order.notes}</p>}
              {order.status !== 'cancelled' && (
                <div>
                  <div style={{ display:'flex', gap:3 }}>
                    {['pending','confirmed','packed','dispatched','delivered'].map((s,i)=>{
                      const idx=['pending','confirmed','packed','dispatched','delivered'].indexOf(order.status)
                      return <div key={s} style={{ flex:1, height:4, borderRadius:2, background:i<=idx?G.green:'#E5E7EB' }} />
                    })}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                    {['Placed','Confirmed','Packed','Dispatched','Delivered'].map((s,i)=>{
                      const idx=['pending','confirmed','packed','dispatched','delivered'].indexOf(order.status)
                      return <span key={s} style={{ fontSize:9, color:i<=idx?G.green:'#9CA3AF', fontWeight:i<=idx?600:400 }}>{s}</span>
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PRICING TAB ── */}
      {tab === 'pricing' && (
        <div style={{ maxWidth:700, margin:'0 auto', padding:16 }}>
          <div style={{ background:G.white, borderRadius:14, padding:20, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin:'0 0 16px', fontSize:15, fontWeight:700 }}>💰 Wholesale Price List</p>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F9FAF7' }}>
                  {['Product','Weight','Price/Bag','Price/Kg','Stock'].map(h=>(
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p,i)=>(
                  <tr key={p.id} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
                    <td style={{ padding:'12px', fontWeight:600 }}>{p.name}</td>
                    <td style={{ padding:'12px', color:G.muted }}>{p.weight_kg}kg</td>
                    <td style={{ padding:'12px', fontWeight:700, color:G.green }}>₹{p.price_per_bag}</td>
                    <td style={{ padding:'12px', color:G.muted }}>₹{(p.price_per_bag/p.weight_kg).toFixed(0)}/kg</td>
                    <td style={{ padding:'12px' }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:p.stock_bags>p.low_stock_threshold?G.greenLight:G.redLight, color:p.stock_bags>p.low_stock_threshold?G.green:G.red }}>
                        {p.stock_bags > p.low_stock_threshold ? `${p.stock_bags} bags` : 'Low stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:G.blueLight, borderRadius:14, padding:16, border:`1px solid #BFDBFE` }}>
            <p style={{ margin:'0 0 10px', fontWeight:700, fontSize:14, color:G.blue }}>📞 Need Custom Pricing?</p>
            <p style={{ margin:'0 0 10px', fontSize:13, color:G.blue, lineHeight:1.6 }}>
              For orders above 500 bags or for regular monthly contracts, contact us directly for special wholesale rates.
            </p>
            <p style={{ margin:0, fontSize:13, color:G.blue, fontWeight:600 }}>admin@greenvillagerice.in</p>
          </div>
        </div>
      )}
    </div>
  )
}

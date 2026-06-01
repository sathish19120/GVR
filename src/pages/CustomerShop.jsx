import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',
  red:'#DC2626',redLight:'#FEE2E2',white:'#fff',surface:'#F4F6F3'
}

const statusColor = {
  pending:G.amber, confirmed:G.blue, packed:G.green2,
  dispatched:'#7C3AED', delivered:G.green, cancelled:G.red
}
const statusBg = {
  pending:G.amberLight, confirmed:G.blueLight, packed:G.greenLight,
  dispatched:'#EDE9FE', delivered:G.greenLight, cancelled:G.redLight
}

export default function CustomerShop() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]             = useState('shop')
  const [products, setProducts]   = useState([])
  const [cart, setCart]           = useState({})
  const [step, setStep]           = useState('shop') // shop | checkout | success
  const [address, setAddress]     = useState('')
  const [phone, setPhone]         = useState(user?.phone || '')
  const [payMethod, setPayMethod] = useState('cod')
  const [placing, setPlacing]     = useState(false)
  const [orderNum, setOrderNum]   = useState('')
  const [myOrders, setMyOrders]   = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { if (tab === 'myorders') loadMyOrders() }, [tab])

  async function loadProducts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('weight_kg')
      if (error) throw error
      setProducts(data || [])
    } catch(e) {
      setError('Failed to load products. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  async function loadMyOrders() {
    if (!user) return
    setOrdersLoading(true)
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(name, weight_kg, quantity, price_per_unit)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
      setMyOrders(data || [])
    } catch(e) {
      console.error(e)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const totalItems  = Object.values(cart).reduce((s, q) => s + q, 0)
  const totalAmount = products.reduce((s, p) => s + (cart[p.id] || 0) * p.price_per_bag, 0)
  const gst         = Math.round(totalAmount * 0.05)
  const grand       = totalAmount + gst

  const updateCart = (id, delta) => {
    setCart(prev => {
      const qty = Math.max(0, (prev[id] || 0) + delta)
      if (qty === 0) { const n = { ...prev }; delete n[id]; return n }
      return { ...prev, [id]: qty }
    })
  }

  async function placeOrder() {
    if (!address.trim()) { setError('Please enter delivery address'); return }
    if (totalItems === 0) { setError('Please add items to cart'); return }
    setError('')
    setPlacing(true)
    try {
      // Get order count for order number
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      const orderNumber = `GVR-${String((count || 0) + 1).padStart(4, '0')}`

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number:     orderNumber,
          customer_id:      user?.id || null,
          customer_name:    user?.full_name || user?.username || 'Customer',
          delivery_address: address,
          total_amount:     grand,
          status:           'pending',
          payment_status:   'pending',
          payment_method:   payMethod,
          created_at:       new Date().toISOString()
        })
        .select()
        .single()

      if (orderErr || !order) throw new Error(orderErr?.message || 'Failed to create order')

      // Insert order items and update stock
      for (const p of products.filter(p => cart[p.id])) {
        const { error: itemErr } = await supabase.from('order_items').insert({
          order_id:       order.id,
          product_id:     p.id,
          name:           p.name,
          weight_kg:      p.weight_kg,
          quantity:       cart[p.id],
          price_per_unit: p.price_per_bag
        })
        if (itemErr) console.error('Item insert error:', itemErr)

        // Deduct stock
        await supabase
          .from('products')
          .update({ stock_bags: Math.max(0, p.stock_bags - cart[p.id]) })
          .eq('id', p.id)
      }

      // Success
      setOrderNum(orderNumber)
      setCart({})
      setAddress('')
      setStep('success')

    } catch(e) {
      console.error('Order error:', e)
      setError(e.message || 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  // ── SUCCESS SCREEN ──────────────────────────────────────
  if (step === 'success') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:G.surface, fontFamily:"'Inter',sans-serif", padding:20 }}>
      <div style={{ textAlign:'center', background:G.white, borderRadius:20, padding:'48px 40px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', maxWidth:400, width:'100%' }}>
        <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:G.greenDark, margin:'0 0 8px' }}>Order Placed!</h2>
        <p style={{ color:G.muted, margin:'0 0 4px', fontSize:14 }}>
          Order Number: <strong style={{ color:G.green }}>{orderNum}</strong>
        </p>
        <p style={{ color:G.muted, margin:'0 0 28px', fontSize:13 }}>
          We will deliver your fresh rice soon 🌾
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={() => { setStep('shop'); setTab('myorders') }} style={{
            background:G.green, color:G.white, border:'none',
            borderRadius:12, padding:'12px 32px', fontSize:15, fontWeight:700, cursor:'pointer'
          }}>Track My Order →</button>
          <button onClick={() => { setStep('shop'); setTab('shop') }} style={{
            background:G.greenLight, color:G.green, border:'none',
            borderRadius:12, padding:'12px 32px', fontSize:14, fontWeight:600, cursor:'pointer'
          }}>Order More Rice</button>
        </div>
      </div>
    </div>
  )

  // ── CHECKOUT SCREEN ─────────────────────────────────────
  if (step === 'checkout') return (
    <div style={{ minHeight:'100vh', background:G.surface, fontFamily:"'Inter',sans-serif" }}>
      {/* Header */}
      <header style={{ background:G.green, padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => { setStep('shop'); setError('') }} style={{ background:'none', border:'none', color:G.white, fontSize:22, cursor:'pointer', lineHeight:1 }}>←</button>
        <span style={{ color:G.white, fontWeight:700, fontSize:16 }}>Checkout</span>
      </header>

      <div style={{ maxWidth:500, margin:'0 auto', padding:'16px 16px 100px' }}>

        {error && (
          <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:10, padding:'10px 14px', marginBottom:16, color:G.red, fontSize:13 }}>
            {error}
          </div>
        )}

        {/* Cart summary */}
        <div style={{ background:G.white, borderRadius:14, padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700, margin:'0 0 12px', color:G.text, fontSize:15 }}>Your Order</p>
          {products.filter(p => cart[p.id]).map(p => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${G.border}` }}>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:500, color:G.text }}>{p.name}</p>
                <p style={{ margin:0, fontSize:12, color:G.muted }}>₹{p.price_per_bag} × {cart[p.id]}</p>
              </div>
              <span style={{ fontWeight:700, fontSize:14, color:G.text }}>₹{cart[p.id] * p.price_per_bag}</span>
            </div>
          ))}
          <div style={{ marginTop:10, fontSize:13 }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', color:G.muted }}><span>Subtotal</span><span>₹{totalAmount}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', color:G.muted }}><span>GST (5%)</span><span>₹{gst}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0 0', fontWeight:700, fontSize:15, color:G.green, borderTop:`1px solid ${G.border}`, marginTop:4 }}>
              <span>Total</span><span>₹{grand}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div style={{ background:G.white, borderRadius:14, padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700, margin:'0 0 12px', color:G.text, fontSize:15 }}>Delivery Address *</p>
          <textarea
            value={address} onChange={e => setAddress(e.target.value)}
            placeholder="House/flat number, street, area, landmark..."
            rows={3}
            style={{ width:'100%', padding:12, borderRadius:10, border:`1.5px solid ${!address.trim() && error ? G.red : G.border}`, fontSize:14, resize:'none', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
          />
          <input
            value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="Phone number for delivery"
            type="tel"
            style={{ width:'100%', padding:12, borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:14, marginTop:8, outline:'none', boxSizing:'border-box' }}
          />
        </div>

        {/* Payment method */}
        <div style={{ background:G.white, borderRadius:14, padding:18, marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight:700, margin:'0 0 12px', color:G.text, fontSize:15 }}>Payment Method</p>
          {[
            ['cod',  '💵', 'Cash on Delivery',  'Pay when your order arrives'],
            ['upi',  '📱', 'UPI Payment',        'GPay, PhonePe, Paytm'],
            ['bank', '🏦', 'Bank Transfer',      'NEFT / IMPS / RTGS'],
          ].map(([val, icon, label, sub]) => (
            <div key={val} onClick={() => setPayMethod(val)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
              borderRadius:10, marginBottom:8, cursor:'pointer',
              border:`2px solid ${payMethod === val ? G.green : G.border}`,
              background: payMethod === val ? G.greenLight : G.white
            }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontWeight:600, fontSize:14, color:G.text }}>{label}</p>
                <p style={{ margin:0, fontSize:12, color:G.muted }}>{sub}</p>
              </div>
              {payMethod === val && <span style={{ color:G.green, fontWeight:700, fontSize:16 }}>✓</span>}
            </div>
          ))}
        </div>

        {/* Place order button */}
        <button
          onClick={placeOrder}
          disabled={placing || !address.trim()}
          style={{
            width:'100%', padding:16,
            background: placing ? '#9CA3AF' : !address.trim() ? '#D1D5DB' : G.green,
            color:G.white, border:'none', borderRadius:14,
            fontSize:16, fontWeight:700,
            cursor: placing || !address.trim() ? 'not-allowed' : 'pointer',
            boxShadow: address.trim() && !placing ? '0 4px 14px rgba(59,109,17,0.3)' : 'none'
          }}
        >
          {placing ? '⏳ Placing order...' : `✅ Place Order — ₹${grand}`}
        </button>
      </div>
    </div>
  )

  // ── MAIN SHOP SCREEN ────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:G.surface, fontFamily:"'Inter',sans-serif" }}>

      {/* Header */}
      <header style={{ background:G.green, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>🌾</span>
          <div>
            <p style={{ color:G.white, fontWeight:700, margin:0, fontSize:15 }}>Green Village Rice</p>
            <p style={{ color:'rgba(255,255,255,0.6)', margin:0, fontSize:11 }}>Fresh Sona Masoori</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {totalItems > 0 && tab === 'shop' && (
            <button onClick={() => { setStep('checkout'); setError('') }} style={{
              background:G.white, border:'none', borderRadius:20,
              padding:'6px 14px', fontWeight:700, color:G.green,
              cursor:'pointer', fontSize:13
            }}>🛒 {totalItems} · ₹{totalAmount}</button>
          )}
          <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:G.white, flexShrink:0 }}>
            {user?.full_name?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span style={{ color:'rgba(255,255,255,0.85)', fontSize:12, display:'none' }}>{user?.full_name || user?.username}</span>
          <button onClick={handleLogout} style={{
            background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)',
            borderRadius:8, padding:'5px 12px', color:G.white,
            fontSize:12, fontWeight:600, cursor:'pointer'
          }}>Logout</button>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ background:G.white, borderBottom:`1px solid ${G.border}`, display:'flex' }}>
        {[['shop','🌾 Order Rice'],['myorders','📋 My Orders']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding:'12px 24px', border:'none', background:'none', cursor:'pointer',
            fontSize:13, fontWeight:600,
            borderBottom:`3px solid ${tab === key ? G.green : 'transparent'}`,
            color: tab === key ? G.green : G.muted,
          }}>{label}</button>
        ))}
      </div>

      {/* ── MY ORDERS TAB ── */}
      {tab === 'myorders' && (
        <div style={{ maxWidth:600, margin:'0 auto', padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'4px 0 16px' }}>
            <p style={{ margin:0, fontSize:15, fontWeight:700, color:G.text }}>
              Orders for {user?.full_name || user?.username}
            </p>
            <button onClick={loadMyOrders} style={{ background:G.greenLight, border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600, color:G.green, cursor:'pointer' }}>
              ↻ Refresh
            </button>
          </div>

          {ordersLoading && (
            <p style={{ textAlign:'center', color:G.muted, padding:40 }}>Loading orders...</p>
          )}

          {!ordersLoading && myOrders.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 20px', background:G.white, borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
              <p style={{ fontWeight:700, color:G.text, margin:'0 0 6px', fontSize:16 }}>No orders yet</p>
              <p style={{ color:G.muted, fontSize:13, margin:'0 0 20px' }}>Your orders will appear here</p>
              <button onClick={() => setTab('shop')} style={{ background:G.green, color:G.white, border:'none', borderRadius:10, padding:'10px 24px', fontWeight:700, cursor:'pointer', fontSize:14 }}>
                Order Now →
              </button>
            </div>
          )}

          {myOrders.map(order => (
            <div key={order.id} style={{ background:G.white, borderRadius:14, padding:16, marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              {/* Order header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:15, color:G.text }}>{order.order_number}</p>
                  <p style={{ margin:0, fontSize:12, color:G.muted }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    {' · '}
                    {new Date(order.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
                <span style={{ fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:20, background:statusBg[order.status]||'#F3F4F6', color:statusColor[order.status]||G.muted, whiteSpace:'nowrap' }}>
                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                </span>
              </div>

              {/* Items */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                {(order.order_items || []).map((item, i) => (
                  <span key={i} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:G.greenLight, color:G.greenDark, fontWeight:600 }}>
                    {item.name} × {item.quantity}
                  </span>
                ))}
              </div>

              {/* Address & amount */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:order.status !== 'cancelled' ? 12 : 0 }}>
                <span style={{ fontSize:12, color:G.muted, flex:1, marginRight:8 }}>
                  📍 {order.delivery_address?.slice(0, 40)}{(order.delivery_address?.length || 0) > 40 ? '…' : ''}
                  {' · '}{order.payment_method?.toUpperCase()}
                </span>
                <span style={{ fontWeight:700, fontSize:15, color:G.green, flexShrink:0 }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
              </div>

              {/* Progress bar */}
              {order.status !== 'cancelled' && (
                <div>
                  <div style={{ display:'flex', gap:3 }}>
                    {['pending','confirmed','packed','dispatched','delivered'].map((s, i) => {
                      const statusArr = ['pending','confirmed','packed','dispatched','delivered']
                      const idx = statusArr.indexOf(order.status)
                      return <div key={s} style={{ flex:1, height:4, borderRadius:2, background: i <= idx ? G.green : '#E5E7EB' }} />
                    })}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                    {['Placed','Confirmed','Packed','Shipped','Delivered'].map((s, i) => {
                      const statusArr = ['pending','confirmed','packed','dispatched','delivered']
                      const idx = statusArr.indexOf(order.status)
                      return <span key={s} style={{ fontSize:9, color: i <= idx ? G.green : '#9CA3AF', fontWeight: i <= idx ? 600 : 400 }}>{s}</span>
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── SHOP TAB ── */}
      {tab === 'shop' && (
        <div style={{ maxWidth:600, margin:'0 auto', padding:16 }}>

          {error && (
            <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:10, padding:'10px 14px', marginBottom:16, color:G.red, fontSize:13, display:'flex', justifyContent:'space-between' }}>
              <span>{error}</span>
              <button onClick={()=>setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:G.red, fontSize:16 }}>✕</button>
            </div>
          )}

          <p style={{ fontSize:13, color:G.muted, margin:'12px 0 16px' }}>
            👋 Hello, <strong style={{ color:G.text }}>{user?.full_name || user?.username}</strong> · Fresh stock available today
          </p>

          {loading && <p style={{ textAlign:'center', color:G.muted, padding:40 }}>Loading products...</p>}

          {!loading && products.length === 0 && (
            <p style={{ textAlign:'center', color:G.muted, padding:40 }}>No products available right now.</p>
          )}

          {products.map(p => (
            <div key={p.id} style={{ background:G.white, borderRadius:14, padding:16, marginBottom:12, display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ width:56, height:56, borderRadius:12, background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>🌾</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:15, color:G.text }}>{p.name}</p>
                <p style={{ margin:'0 0 2px', fontSize:12, color:G.muted }}>{p.name_telugu} · {p.weight_kg}kg pack</p>
                {p.packing_date && (
                  <p style={{ margin:0, fontSize:11, color:G.green }}>✓ Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</p>
                )}
                {p.stock_bags <= p.low_stock_threshold && (
                  <p style={{ margin:0, fontSize:11, color:G.amber }}>⚠ Only {p.stock_bags} bags left</p>
                )}
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ margin:'0 0 8px', fontWeight:800, fontSize:17, color:G.text }}>₹{p.price_per_bag}</p>
                {p.stock_bags <= 0 ? (
                  <span style={{ fontSize:12, color:G.red, fontWeight:600 }}>Out of Stock</span>
                ) : !cart[p.id] ? (
                  <button onClick={() => updateCart(p.id, 1)} style={{ background:G.green, color:G.white, border:'none', borderRadius:8, padding:'7px 18px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                    Add +
                  </button>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:10, background:G.greenLight, borderRadius:8, padding:'5px 10px' }}>
                    <button onClick={() => updateCart(p.id, -1)} style={{ background:'none', border:'none', color:G.green, fontSize:22, cursor:'pointer', fontWeight:700, lineHeight:1, padding:0 }}>−</button>
                    <span style={{ fontWeight:700, color:G.greenDark, minWidth:20, textAlign:'center', fontSize:15 }}>{cart[p.id]}</span>
                    <button onClick={() => updateCart(p.id, 1)} style={{ background:'none', border:'none', color:G.green, fontSize:22, cursor:'pointer', fontWeight:700, lineHeight:1, padding:0 }}>+</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Checkout bar */}
          {totalItems > 0 && (
            <div style={{ position:'sticky', bottom:16, marginTop:16 }}>
              <button onClick={() => { setStep('checkout'); setError('') }} style={{
                width:'100%', padding:16, background:G.green, color:G.white,
                border:'none', borderRadius:14, fontSize:16, fontWeight:700,
                cursor:'pointer', boxShadow:'0 4px 14px rgba(59,109,17,0.35)',
                display:'flex', justifyContent:'space-between', alignItems:'center'
              }}>
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

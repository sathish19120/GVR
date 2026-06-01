import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',
  green2:'#639922',amber:'#BA7517',amberLight:'#FAEEDA',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',
  red:'#DC2626',redLight:'#FEE2E2',white:'#fff',surface:'#F4F6F3'
}

export default function CustomerShop() {
  const { user } = useAuth()
  const [tab, setTab] = useState('shop') // shop | myorders
  const [myOrders, setMyOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [step, setStep] = useState('shop') // shop | checkout | success
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [payMethod, setPayMethod] = useState('cod')
  const [placing, setPlacing] = useState(false)
  const [orderNum, setOrderNum] = useState('')

  useEffect(() => { loadProducts() }, [])

  async function loadMyOrders() {
    if (!user) return
    setOrdersLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(name, weight_kg, quantity, price_per_unit)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
    setMyOrders(data || [])
    setOrdersLoading(false)
  }

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').eq('active', true).order('weight_kg')
    setProducts(data || [])
  }

  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0)
  const totalAmount = products.reduce((s, p) => s + (cart[p.id] || 0) * p.price_per_bag, 0)
  const gst = Math.round(totalAmount * 0.05)
  const grand = totalAmount + gst

  const updateCart = (id, delta) => {
    setCart(prev => {
      const qty = Math.max(0, (prev[id] || 0) + delta)
      if (qty === 0) { const n = { ...prev }; delete n[id]; return n }
      return { ...prev, [id]: qty }
    })
  }

  async function placeOrder() {
    if (!address.trim()) return
    setPlacing(true)
    try {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true })
      const orderNumber = `GVR-${String((count || 0) + 1).padStart(4, '0')}`

      const { data: order } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_id: user?.id || null,
        customer_id: user?.id || null,
        customer_name: user?.full_name || user?.username || 'Customer',
        delivery_address: address,
        total_amount: grand,
        status: 'pending',
        payment_status: 'pending',
        payment_method: payMethod,
        created_at: new Date().toISOString()
      }).select().single()

      for (const p of products.filter(p => cart[p.id])) {
        await supabase.from('order_items').insert({
          order_id: order.id, product_id: p.id,
          name: p.name, weight_kg: p.weight_kg,
          quantity: cart[p.id], price_per_unit: p.price_per_bag
        })
        await supabase.from('products').update({ stock_bags: p.stock_bags - cart[p.id] }).eq('id', p.id)
      }

      setOrderNum(orderNumber)
      setCart({})
      setStep('success')
    } catch (e) { console.error(e) }
    finally { setPlacing(false) }
  }

  if (step === 'success') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: G.surface }}>
      <div style={{ textAlign: 'center', background: G.white, borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: G.greenDark, margin: '0 0 8px' }}>Order Placed!</h2>
        <p style={{ color: G.muted, margin: '0 0 4px' }}>Order Number: <strong style={{ color: G.green }}>{orderNum}</strong></p>
        <p style={{ color: G.muted, margin: '0 0 28px' }}>We will deliver your rice soon 🌾</p>
        <button onClick={() => setStep('shop')} style={{
          background: G.green, color: G.white, border: 'none',
          borderRadius: 12, padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer'
        }}>Order More</button>
      </div>
    </div>
  )

  if (step === 'checkout') return (
    <div style={{ minHeight: '100vh', background: G.surface, fontFamily: "'Inter', sans-serif" }}>
      <header style={{ background: G.green, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setStep('shop')} style={{ background: 'none', border: 'none', color: G.white, fontSize: 20, cursor: 'pointer' }}>←</button>
        <span style={{ color: G.white, fontWeight: 700, fontSize: 16 }}>Checkout</span>
      </header>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
        {/* Cart summary */}
        <div style={{ background: G.white, borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, marginBottom: 12, color: G.text }}>Your Order</p>
          {products.filter(p => cart[p.id]).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: `1px solid ${G.border}` }}>
              <span>{p.name} × {cart[p.id]}</span>
              <span style={{ fontWeight: 600 }}>₹{cart[p.id] * p.price_per_bag}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 13, color: G.muted }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Subtotal</span><span>₹{totalAmount}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>GST (5%)</span><span>₹{gst}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: 700, fontSize: 15, color: G.text, borderTop: `1px solid ${G.border}`, marginTop: 4 }}><span>Total</span><span style={{ color: G.green }}>₹{grand}</span></div>
          </div>
        </div>

        {/* Address */}
        <div style={{ background: G.white, borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, marginBottom: 10, color: G.text }}>Delivery Address</p>
          <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full delivery address..." rows={3}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: `1.5px solid ${G.border}`, fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" type="tel"
            style={{ width: '100%', padding: 12, borderRadius: 10, border: `1.5px solid ${G.border}`, fontSize: 14, marginTop: 8, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Payment */}
        <div style={{ background: G.white, borderRadius: 14, padding: 18, marginBottom: 20 }}>
          <p style={{ fontWeight: 700, marginBottom: 10, color: G.text }}>Payment Method</p>
          {[['cod','💵','Cash on Delivery','Pay when delivered'],['upi','📱','UPI Payment','GPay, PhonePe, Paytm']].map(([val, icon, label, sub]) => (
            <div key={val} onClick={() => setPayMethod(val)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, marginBottom: 8, cursor: 'pointer',
              border: `2px solid ${payMethod === val ? G.green : G.border}`,
              background: payMethod === val ? G.greenLight : G.white
            }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: G.text }}>{label}</p>
                <p style={{ margin: 0, fontSize: 12, color: G.muted }}>{sub}</p>
              </div>
              {payMethod === val && <span style={{ marginLeft: 'auto', color: G.green, fontWeight: 700 }}>✓</span>}
            </div>
          ))}
        </div>

        <button onClick={placeOrder} disabled={placing || !address.trim()} style={{
          width: '100%', padding: 15, background: placing ? '#9CA3AF' : G.green,
          color: G.white, border: 'none', borderRadius: 14, fontSize: 16,
          fontWeight: 700, cursor: placing ? 'not-allowed' : 'pointer'
        }}>
          {placing ? 'Placing order...' : `Place Order — ₹${grand}`}
        </button>
      </div>
    </div>
  )

  // Load my orders when switching to that tab
  useEffect(() => { if (tab === 'myorders') loadMyOrders() }, [tab])

  return (
    <div style={{ minHeight: '100vh', background: G.surface, fontFamily: "'Inter', sans-serif" }}>
      <header style={{ background: G.green, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌾</span>
          <div>
            <p style={{ color: G.white, fontWeight: 700, margin: 0, fontSize: 15 }}>Green Village Rice</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 11 }}>Fresh Sona Masoori</p>
          </div>
        </div>
        {totalItems > 0 && (
          <button onClick={() => setStep('checkout')} style={{
            background: G.white, border: 'none', borderRadius: 20, padding: '7px 16px',
            fontWeight: 700, color: G.green, cursor: 'pointer', fontSize: 13
          }}>
            🛒 {totalItems} items · ₹{totalAmount}
          </button>
        )}
      </header>

      {/* Tab bar */}
      <div style={{ background: G.white, borderBottom: `1px solid ${G.border}`, padding: '0 16px', display: 'flex', gap: 0 }}>
        {[['shop','🌾 Order Rice'],['myorders','📋 My Orders']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, borderBottom: `3px solid ${tab === key ? G.green : 'transparent'}`,
            color: tab === key ? G.green : G.muted, transition: 'all 0.15s'
          }}>{label}</button>
        ))}
      </div>

      {/* MY ORDERS TAB */}
      {tab === 'myorders' && (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: G.text }}>
              Orders for {user?.full_name || user?.username}
            </p>
            <button onClick={loadMyOrders} style={{ background: G.greenLight, border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: G.green, cursor: 'pointer' }}>↻ Refresh</button>
          </div>
          {ordersLoading && <p style={{ textAlign: 'center', color: G.muted, padding: 40 }}>Loading orders...</p>}
          {!ordersLoading && myOrders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: G.white, borderRadius: 14 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <p style={{ fontWeight: 700, color: G.text, margin: '0 0 6px' }}>No orders yet</p>
              <p style={{ color: G.muted, fontSize: 13, margin: '0 0 20px' }}>Your orders will appear here</p>
              <button onClick={() => setTab('shop')} style={{ background: G.green, color: G.white, border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Order Now</button>
            </div>
          )}
          {myOrders.map(order => {
            const statusColor = { pending: G.amber, confirmed: '#1E5FA5', packed: G.green2, dispatched: '#7C3AED', delivered: G.green, cancelled: G.red }
            const statusBg = { pending: G.amberLight, confirmed: '#E6F1FB', packed: G.greenLight, dispatched: '#EDE9FE', delivered: G.greenLight, cancelled: G.redLight }
            return (
              <div key={order.id} style={{ background: G.white, borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: G.text }}>{order.order_number}</p>
                    <p style={{ margin: 0, fontSize: 12, color: G.muted }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: statusBg[order.status] || '#F3F4F6', color: statusColor[order.status] || G.muted }}>
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {(order.order_items || []).map((item, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: G.greenLight, color: G.greenDark, fontWeight: 600 }}>
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: G.muted }}>{order.payment_method?.toUpperCase()} · {order.delivery_address?.slice(0, 30)}{order.delivery_address?.length > 30 ? '…' : ''}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: G.green }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                </div>
                {/* Order progress bar */}
                {order.status !== 'cancelled' && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {['pending','confirmed','packed','dispatched','delivered'].map((s, i, arr) => {
                        const idx = arr.indexOf(order.status)
                        const done = i <= idx
                        return (
                          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: done ? G.green : '#E5E7EB', transition: 'background 0.3s' }} />
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      {['Placed','Confirmed','Packed','Shipped','Delivered'].map((s, i, arr) => {
                        const statusArr = ['pending','confirmed','packed','dispatched','delivered']
                        const idx = statusArr.indexOf(order.status)
                        return (
                          <span key={s} style={{ fontSize: 9, color: i <= idx ? G.green : '#9CA3AF', fontWeight: i <= idx ? 600 : 400 }}>{s}</span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* SHOP TAB */}
      {tab === 'shop' && <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
        <p style={{ fontSize: 13, color: G.muted, margin: '12px 0' }}>Fresh stock available — order now for same day delivery</p>
        {products.map(p => (
          <div key={p.id} style={{ background: G.white, borderRadius: 14, padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🌾</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 15, color: G.text }}>{p.name}</p>
              <p style={{ margin: '0 0 2px', fontSize: 12, color: G.muted }}>{p.name_telugu}</p>
              {p.packing_date && <p style={{ margin: 0, fontSize: 11, color: G.green }}>✓ Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 17, color: G.text }}>₹{p.price_per_bag}</p>
              {!cart[p.id] ? (
                <button onClick={() => updateCart(p.id, 1)} style={{ background: G.green, color: G.white, border: 'none', borderRadius: 8, padding: '7px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Add +</button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: G.greenLight, borderRadius: 8, padding: '5px 10px' }}>
                  <button onClick={() => updateCart(p.id, -1)} style={{ background: 'none', border: 'none', color: G.green, fontSize: 20, cursor: 'pointer', fontWeight: 700, lineHeight: 1 }}>−</button>
                  <span style={{ fontWeight: 700, color: G.greenDark, minWidth: 16, textAlign: 'center' }}>{cart[p.id]}</span>
                  <button onClick={() => updateCart(p.id, 1)} style={{ background: 'none', border: 'none', color: G.green, fontSize: 20, cursor: 'pointer', fontWeight: 700, lineHeight: 1 }}>+</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {totalItems > 0 && (
          <button onClick={() => setStep('checkout')} style={{
            width: '100%', padding: 15, background: G.green, color: G.white,
            border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8
          }}>
            Checkout — {totalItems} items · ₹{totalAmount} →
          </button>
        )}
      </div>}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const BRANCHES = ['Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu']

const BUSINESS_TYPES = ['Restaurant','Hotel','Hostel','Tiffin Center','Grocery Store','Canteen','Other']

export default function BulkOrderForm() {
  const { user } = useAuth()
  const [products, setProducts]     = useState([])
  const [cart, setCart]             = useState({})
  const [bizName, setBizName]       = useState('')
  const [bizType, setBizType]       = useState('')
  const [contactName, setContact]   = useState('')
  const [phone, setPhone]           = useState('')
  const [address, setAddress]       = useState('')
  const [branch, setBranch]         = useState('')
  const [orderType, setOrderType]   = useState('delivery')
  const [pickupTime, setPickupTime] = useState('')
  const [payMethod, setPay]         = useState('upi')
  const [utrRef, setUtrRef]         = useState('')
  const [notes, setNotes]           = useState('')
  const [placing, setPlacing]       = useState(false)
  const [success, setSuccess]       = useState(null)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).order('weight_kg')
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
  }, [])

  const totalBags   = Object.values(cart).reduce((s,q) => s+q, 0)
  const totalAmount = products.reduce((s,p) => s+(cart[p.id]||0)*p.price_per_bag, 0)
  const grand       = totalAmount

  const updateCart = (id, val) => {
    const n = Math.max(0, parseInt(val) || 0)
    setCart(prev => {
      if (n === 0) { const c = {...prev}; delete c[id]; return c }
      return {...prev, [id]: n}
    })
  }

  async function placeBulkOrder() {
    if (!bizName.trim()) { setError('Enter business name'); return }
    if (!phone.trim())   { setError('Enter contact phone'); return }
    if (totalBags < 10)  { setError('Minimum 10 bags for bulk orders'); return }
    if (orderType === 'delivery' && !address.trim()) { setError('Enter delivery address'); return }
    if (orderType === 'pickup' && !branch) { setError('Select pickup branch'); return }
    setError(''); setPlacing(true)
    try {
      const { count } = await supabase.from('orders').select('*',{count:'exact',head:true})
      const orderNumber = `GVR-BULK-${String((count||0)+1).padStart(4,'0')}`
      const { data: order, error: oErr } = await supabase.from('orders').insert({
        order_number:   orderNumber,
        customer_id:    user?.id || null,
        customer_name:  `${bizName} (${bizType||'Business'})`,
        delivery_address: orderType === 'pickup' ? `Pickup: ${branch}${pickupTime?' · '+pickupTime:''}` : address,
        total_amount:   grand,
        status:         'pending',
        order_type:     'bulk',
        pickup_branch:  orderType === 'pickup' ? branch : null,
        pickup_time:    orderType === 'pickup' ? pickupTime : null,
        business_name:  bizName,
        bag_count:      totalBags,
        payment_status: utrRef.trim() ? 'paid' : 'pending',
        payment_method: payMethod,
        notes:          `Bulk Order · ${contactName || user?.full_name || ''} · ${phone}${utrRef?' · Ref:'+utrRef:''}${notes?' · '+notes:''}`,
        created_at:     new Date().toISOString()
      }).select().single()
      if (oErr || !order) throw new Error(oErr?.message)

      // ✅ FIX: previously only inserted order_items and never touched
      // products.stock_bags — same gap already fixed in VendorPortal.jsx
      // for B2B orders. Bulk orders require a minimum of 10 bags per
      // product, so leaving stock untouched drifted recorded inventory
      // away from reality with every bulk order. Now mirrors the
      // pattern already used in CustomerShop.jsx, Dashboard.jsx's
      // NewOrderModal, and the fixed VendorPortal.jsx.
      for (const p of products.filter(p => cart[p.id])) {
    await supabase.from('order_items').insert({
      order_id: order.id, product_id: p.id,
      name: p.name, weight_kg: p.weight_kg,
      quantity: cart[p.id], price_per_unit: p.price_per_bag
    })
    await supabase.rpc('deplete_product_stock', {
      p_product_id: p.id, p_qty: cart[p.id],
      p_note: `Bulk order ${orderNumber} — ${bizName}`
    })
  }
      setSuccess(orderNumber)
      setCart({}); setBizName(''); setPhone(''); setAddress(''); setUtrRef(''); setNotes('')
    } catch(e) { setError(e.message || 'Failed to place order') }
    finally { setPlacing(false) }
  }

  const UPI_ID = import.meta.env.VITE_UPI_ID || ''
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Green+Village+Rice&am=${grand}&cu=INR&tn=GVR+Bulk+Order`
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}`

  if (loading) return <p style={{ textAlign:'center', color:G.muted, padding:30 }}>Loading...</p>

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", maxWidth:700 }}>
      {success && (
        <div style={{ background:G.greenLight, border:`1px solid #97C459`, borderRadius:14, padding:16, marginBottom:16, textAlign:'center' }}>
          <p style={{ margin:'0 0 4px', fontWeight:800, fontSize:17, color:G.greenDark }}>✅ Bulk Order Placed!</p>
          <p style={{ margin:'0 0 12px', fontSize:14, color:G.green }}>Order: <strong>{success}</strong></p>
          <p style={{ margin:'0 0 12px', fontSize:13, color:G.muted }}>Our team will contact you within 2 hours to confirm.</p>
          <button onClick={() => setSuccess(null)} style={{ background:G.green, color:G.white, border:'none', borderRadius:10, padding:'10px 24px', fontWeight:700, cursor:'pointer' }}>Place Another Order</button>
        </div>
      )}

      <div style={{ background:G.blueLight, borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:10, alignItems:'center' }}>
        <span style={{ fontSize:18 }}>ℹ️</span>
        <p style={{ margin:0, fontSize:12, color:G.blue, lineHeight:1.6 }}>
          Bulk orders for restaurants, hotels, hostels and canteens. Minimum <strong>10 bags</strong>. Enter quantity per product and submit — we will confirm and dispatch.
        </p>
      </div>

      {error && <div style={{ background:G.redLight, border:`1px solid #FECACA`, borderRadius:10, padding:'10px 14px', marginBottom:14, color:G.red, fontSize:13 }}>{error}</div>}

      <div style={{ background:G.white, borderRadius:14, padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ fontWeight:700, margin:'0 0 14px', fontSize:15 }}>Business Details</p>
        <div style={{ display:'grid', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Business Name *</label>
              <input type="text" value={bizName} onChange={e=>setBizName(e.target.value)} placeholder="Hotel / Restaurant name"
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Business Type</label>
              <select value={bizType} onChange={e=>setBizType(e.target.value)}
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box', background:G.white }}>
                <option value="">Select type...</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Contact Person</label>
              <input type="text" value={contactName} onChange={e=>setContact(e.target.value)} placeholder="Name"
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Phone *</label>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mobile number"
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ background:G.white, borderRadius:14, padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ fontWeight:700, margin:'0 0 14px', fontSize:15 }}>Order Quantity</p>
        {products.map(p => (
          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid ${G.border}` }}>
            <span style={{ fontSize:20 }}>🌾</span>
            <div style={{ flex:1 }}>
              <p style={{ margin:'0 0 2px', fontWeight:600, fontSize:14 }}>{p.name}</p>
              <p style={{ margin:0, fontSize:12, color:G.muted }}>₹{p.price_per_bag}/bag · {p.weight_kg}kg</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="number" min={0} value={cart[p.id]||''} onChange={e=>updateCart(p.id,e.target.value)}
                placeholder="0" style={{ width:72, padding:'8px', borderRadius:9, border:`1.5px solid ${cart[p.id]?G.green:G.border}`, fontSize:14, fontWeight:700, textAlign:'center', outline:'none' }}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=cart[p.id]?G.green:G.border} />
              <span style={{ fontSize:12, color:G.muted }}>bags</span>
              {cart[p.id] > 0 && <span style={{ fontWeight:700, color:G.green, minWidth:70, textAlign:'right' }}>₹{cart[p.id]*p.price_per_bag}</span>}
            </div>
          </div>
        ))}
        {totalBags > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0', fontWeight:800, fontSize:16, color:G.green }}>
            <span>Total — {totalBags} bags</span><span>₹{grand.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      <div style={{ background:G.white, borderRadius:14, padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ fontWeight:700, margin:'0 0 12px', fontSize:15 }}>Delivery / Pickup</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          {[['delivery','🚚','Delivery to Address'],['pickup','🏪','Branch Pickup (Free)']].map(([val,icon,label])=>(
            <div key={val} onClick={()=>setOrderType(val)} style={{ padding:'12px', borderRadius:12, cursor:'pointer', border:`2px solid ${orderType===val?G.green:G.border}`, background:orderType===val?G.greenLight:G.white, textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:orderType===val?G.greenDark:G.text }}>{label}</p>
            </div>
          ))}
        </div>
        {orderType === 'delivery' && (
          <textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="Full delivery address..." rows={2}
            style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', resize:'none', boxSizing:'border-box', fontFamily:'inherit' }}
            onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
        )}
        {orderType === 'pickup' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
              {BRANCHES.map(b=>(
                <div key={b} onClick={()=>setBranch(b)} style={{ padding:'9px 8px', borderRadius:9, cursor:'pointer', border:`2px solid ${branch===b?G.green:G.border}`, background:branch===b?G.greenLight:G.white, textAlign:'center', fontSize:12, fontWeight:branch===b?700:400, color:branch===b?G.greenDark:G.text }}>
                  {b}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['9 AM – 11 AM','11 AM – 1 PM','1 PM – 3 PM','3 PM – 5 PM','5 PM – 7 PM'].map(t=>(
                <button key={t} type="button" onClick={()=>setPickupTime(t)} style={{ padding:'6px 12px', borderRadius:20, border:`1.5px solid ${pickupTime===t?G.green:G.border}`, background:pickupTime===t?G.greenLight:G.white, cursor:'pointer', fontSize:11, fontWeight:600, color:pickupTime===t?G.greenDark:G.muted }}>{t}</button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ background:G.white, borderRadius:14, padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ fontWeight:700, margin:'0 0 12px', fontSize:15 }}>Payment</p>
        {[['upi','📱','UPI Payment','Scan QR — instant'],['cod','💵','Pay on Pickup/Delivery','Pay when order arrives']].map(([val,icon,label,sub])=>(
          <div key={val} onClick={()=>setPay(val)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px', borderRadius:10, marginBottom:8, cursor:'pointer', border:`2px solid ${payMethod===val?G.green:G.border}`, background:payMethod===val?G.greenLight:G.white }}>
            <span style={{ fontSize:20 }}>{icon}</span>
            <div style={{ flex:1 }}><p style={{ margin:0, fontWeight:600, fontSize:13 }}>{label}</p><p style={{ margin:0, fontSize:11, color:G.muted }}>{sub}</p></div>
            {payMethod===val && <span style={{ color:G.green, fontWeight:700 }}>✓</span>}
          </div>
        ))}
        {payMethod === 'upi' && grand > 0 && (
          <div style={{ marginTop:10, padding:14, background:'#F9FAF7', borderRadius:12, border:`1px solid ${G.border}`, textAlign:'center' }}>
            <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:700 }}>Scan & Pay — ₹{grand.toLocaleString('en-IN')}</p>
            <div style={{ background:G.white, display:'inline-block', padding:8, borderRadius:10, border:`1px solid ${G.border}`, marginBottom:10 }}>
              <img src={qrUrl} alt="UPI QR" width={140} height={140} style={{ display:'block', borderRadius:6 }} />
            </div>
            <p style={{ margin:'0 0 8px', fontSize:12, color:G.muted }}>Powered by UPI · Green Village Rice</p>
            <input type="text" value={utrRef} onChange={e=>setUtrRef(e.target.value.trim())} placeholder="Enter UPI Transaction ID after payment"
              style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${utrRef?G.green:G.border}`, fontSize:13, outline:'none', boxSizing:'border-box' }} />
            {utrRef && <p style={{ margin:'4px 0 0', fontSize:11, color:G.green }}>✓ Transaction ID saved</p>}
          </div>
        )}
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>Additional Notes</label>
        <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Monthly subscription, special instructions, etc."
          style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
      </div>

      <button onClick={placeBulkOrder} disabled={placing||totalBags<10} style={{ width:'100%', padding:14, background:placing||totalBags<10?'#9CA3AF':G.green, color:G.white, border:'none', borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(59,109,17,0.3)' }}>
        {placing ? '⏳ Placing...' : totalBags < 10 ? `Minimum 10 bags (${totalBags} selected)` : `✅ Place Bulk Order — ₹${grand.toLocaleString('en-IN')} · ${totalBags} bags`}
      </button>
    </div>
  )
}

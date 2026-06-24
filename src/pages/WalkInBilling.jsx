import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

// FIX #6: MAX-based order number — no duplicates when orders are deleted
async function getNextWalkInNumber() {
  const { data } = await supabase
    .from('orders')
    .select('order_number')
    .like('order_number', 'GVR-WI-%')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const lastNum = data?.order_number
    ? parseInt(data.order_number.replace('GVR-WI-', ''), 10) || 0
    : 0
  return `GVR-WI-${String(lastNum + 1).padStart(4, '0')}`
}

export default function WalkInBilling({ branch }) {
  const { user } = useAuth()
  const [products, setProducts]   = useState([])
  const [cart, setCart]           = useState({})
  const [custName, setCustName]   = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [payMethod, setPay]       = useState('cash')
  const [placing, setPlacing]     = useState(false)
  const [success, setSuccess]     = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).order('weight_kg')
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
  }, [])

  const totalBags   = Object.values(cart).reduce((s,q) => s+q, 0)
  const totalAmount = products.reduce((s,p) => s+(cart[p.id]||0)*p.price_per_bag, 0)
  const gst         = Math.round(totalAmount * 0.05)
  const grand       = totalAmount + gst

  const updateCart = (id, delta) => {
    setCart(prev => {
      const qty = Math.max(0, (prev[id]||0) + delta)
      if (qty === 0) { const n = {...prev}; delete n[id]; return n }
      return {...prev, [id]: qty}
    })
  }

  async function bill() {
    if (totalBags === 0) return
    setPlacing(true)
    try {
      // FIX #6: use MAX-based order number
      const orderNumber = await getNextWalkInNumber()

      const { data: order, error: oErr } = await supabase.from('orders').insert({
        order_number:     orderNumber,
        customer_id:      null,
        customer_name:    custName || 'Walk-in Customer',
        delivery_address: `Walk-in — ${branch} Branch`,
        total_amount:     grand,
        status:           'delivered',
        order_type:       'walkin',
        pickup_branch:    branch,
        pickup_ready:     true,
        payment_status:   'paid',
        payment_method:   payMethod,
        notes:            `Walk-in billing by ${user?.full_name || user?.username}${custPhone ? ` · Phone: ${custPhone}` : ''}`,
        created_at:       new Date().toISOString()
      }).select().single()
      if (oErr || !order) throw new Error(oErr?.message || 'Failed')

      for (const p of products.filter(p => cart[p.id])) {
        await supabase.from('order_items').insert({
          order_id: order.id, product_id: p.id,
          name: p.name, weight_kg: p.weight_kg,
          quantity: cart[p.id], price_per_unit: p.price_per_bag
        })
        // Reduce branch stock
        const { data: bs } = await supabase.from('branch_stock')
          .select('stock_bags').eq('branch_name', branch).eq('product_id', p.id).single()
        if (bs) {
          await supabase.from('branch_stock').update({
            stock_bags: Math.max(0, bs.stock_bags - cart[p.id]),
            updated_at: new Date().toISOString()
          }).eq('branch_name', branch).eq('product_id', p.id)
          await supabase.from('branch_stock_movements').insert({
            branch_name: branch, product_id: p.id,
            product_name: p.name, change_bags: -cart[p.id],
            type: 'sale', note: `Walk-in sale · ${orderNumber}`,
            created_at: new Date().toISOString()
          })
        }
      }

      setSuccess({ orderNumber, items: products.filter(p=>cart[p.id]).map(p=>({...p,qty:cart[p.id]})), grand, payMethod })
      setCart({}); setCustName(''); setCustPhone(''); setPay('cash')
    } catch(e) { alert('Error: ' + e.message) }
    finally { setPlacing(false) }
  }

  function printReceipt(bill) {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt ${bill.orderNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 80mm; margin: 0 auto; padding: 8mm; font-size: 12pt; }
      .center { text-align: center; }
      .bold { font-weight: 700; }
      .row { display: flex; justify-content: space-between; padding: 2mm 0; border-bottom: 0.5px dashed #ccc; }
      .total { display: flex; justify-content: space-between; padding: 3mm 0; font-size: 14pt; font-weight: 700; border-top: 1px solid #000; margin-top: 2mm; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <div class="center bold" style="font-size:16pt; margin-bottom:2mm;">🌾 Green Village Rice</div>
    <div class="center" style="font-size:10pt; color:#555; margin-bottom:4mm;">గ్రీన్ విలేజ్ రైస్ · ${bill.orderNumber}</div>
    <div class="center" style="font-size:10pt; margin-bottom:4mm;">${branch} Branch · ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} ${new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
    ${bill.items.map(item => `<div class="row"><span>${item.name}</span><span>₹${item.price_per_bag} × ${item.qty} = ₹${item.price_per_bag * item.qty}</span></div>`).join('')}
    <div class="total"><span>TOTAL</span><span>₹${bill.grand}</span></div>
    <div class="center" style="margin-top:4mm; font-size:10pt; color:#555;">Payment: ${bill.payMethod === 'cash' ? 'Cash' : bill.payMethod === 'upi' ? 'UPI' : 'Card'}</div>
    <div class="center" style="margin-top:6mm; font-size:9pt; color:#888;">Thank you for shopping at Green Village Rice!<br/>Fresh · Pure · Trusted</div>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 600)
  }

  if (loading) return <p style={{ textAlign:'center', color:G.muted, padding:30 }}>Loading products...</p>

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      {/* Success receipt */}
      {success && (
        <div style={{ background:G.greenLight, border:`1px solid #97C459`, borderRadius:14, padding:16, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <div>
            <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:15, color:G.greenDark }}>✅ Billed — {success.orderNumber}</p>
            <p style={{ margin:0, fontSize:13, color:G.green }}>{success.items.reduce((s,i)=>s+i.qty,0)} bags · ₹{success.grand}</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => printReceipt(success)} style={{ padding:'8px 16px', background:G.green, color:G.white, border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer' }}>🖨 Print Receipt</button>
            <button onClick={() => setSuccess(null)} style={{ padding:'8px 14px', background:'none', border:`1px solid ${G.border}`, borderRadius:9, fontSize:13, cursor:'pointer', color:G.muted }}>New Bill</button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, alignItems:'start' }}>
        {/* Products */}
        <div>
          <p style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:G.text }}>Select Products</p>
          {products.map(p => {
            const qty = cart[p.id] || 0
            return (
              <div key={p.id} style={{ background:G.white, borderRadius:12, padding:'14px 16px', marginBottom:10, display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:`1px solid ${qty>0?G.green:G.border}` }}>
                <div style={{ width:44, height:44, borderRadius:10, background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🌾</div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:14 }}>{p.name}</p>
                  <p style={{ margin:0, fontSize:12, color:G.muted }}>₹{p.price_per_bag}/bag · Stock: {p.stock_bags} bags</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:0, border:`1.5px solid ${qty>0?G.green:G.border}`, borderRadius:9, overflow:'hidden' }}>
                  <button onClick={() => updateCart(p.id, -1)} style={{ width:36, height:36, border:'none', background:'none', cursor:'pointer', fontSize:20, color:G.green, fontWeight:700 }}>−</button>
                  <span style={{ width:40, textAlign:'center', fontSize:15, fontWeight:700 }}>{qty||0}</span>
                  <button onClick={() => updateCart(p.id, 1)} style={{ width:36, height:36, border:'none', background:'none', cursor:'pointer', fontSize:20, color:G.green, fontWeight:700 }}>+</button>
                </div>
                {qty > 0 && <span style={{ fontWeight:700, color:G.green, minWidth:70, textAlign:'right' }}>₹{qty*p.price_per_bag}</span>}
              </div>
            )
          })}
        </div>

        {/* Bill panel */}
        <div style={{ background:G.white, borderRadius:14, padding:18, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', position:'sticky', top:70 }}>
          <p style={{ margin:'0 0 14px', fontWeight:700, fontSize:15 }}>Bill Summary</p>
          {totalBags === 0 ? (
            <p style={{ textAlign:'center', color:G.muted, fontSize:13, padding:'20px 0' }}>No items added yet</p>
          ) : (
            <>
              {products.filter(p=>cart[p.id]).map(p=>(
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:`1px solid ${G.border}` }}>
                  <span>{p.name} ×{cart[p.id]}</span>
                  <span style={{ fontWeight:600 }}>₹{cart[p.id]*p.price_per_bag}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:G.muted, padding:'5px 0' }}><span>GST (5%)</span><span>₹{gst}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:16, color:G.green, padding:'8px 0 12px', borderTop:`1px solid ${G.border}`, marginTop:4 }}>
                <span>Total</span><span>₹{grand}</span>
              </div>
            </>
          )}

          <div style={{ marginBottom:12 }}>
            <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px' }}>Customer (optional)</p>
            <input type="text" value={custName} onChange={e=>setCustName(e.target.value)} placeholder="Customer name"
              style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box', marginBottom:6 }}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            <input type="tel" value={custPhone} onChange={e=>setCustPhone(e.target.value)} placeholder="Phone number"
              style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box' }}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>

          <div style={{ marginBottom:14 }}>
            <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px' }}>Payment</p>
            <div style={{ display:'flex', gap:6 }}>
              {[['cash','💵','Cash'],['upi','📱','UPI'],['card','💳','Card']].map(([val,icon,label])=>(
                <button key={val} onClick={()=>setPay(val)} style={{ flex:1, padding:'9px 4px', borderRadius:9, border:`2px solid ${payMethod===val?G.green:G.border}`, background:payMethod===val?G.greenLight:G.white, cursor:'pointer', fontSize:11, fontWeight:600, color:payMethod===val?G.greenDark:G.muted }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={bill} disabled={placing||totalBags===0} style={{ width:'100%', padding:13, background:placing||totalBags===0?'#9CA3AF':G.green, color:G.white, border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer' }}>
            {placing ? '⏳ Billing...' : `🧾 Bill — ₹${grand}`}
          </button>
        </div>
      </div>
    </div>
  )
}

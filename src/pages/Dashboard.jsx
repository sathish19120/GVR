import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',text:'#111827',muted:'#6B7280',
  border:'#E5E7EB',surface:'#F4F6F3',white:'#fff'
}

const PAGES = [
  { key:'dashboard', icon:'⊞', label:'Dashboard' },
  { key:'orders',    icon:'📋', label:'Orders' },
  { key:'inventory', icon:'📦', label:'Inventory' },
  { key:'analytics', icon:'📊', label:'Analytics' },
  { key:'users',     icon:'👥', label:'Users' },
]
const TOP_LINKS = ['Where We Work','What We Do','About']

function Badge({ status }) {
  const map = {
    pending:   [G.amber,  G.amberLight],
    confirmed: [G.blue,   G.blueLight],
    packed:    [G.green2, G.greenLight],
    dispatched:['#7C3AED','#EDE9FE'],
    delivered: [G.green,  G.greenLight],
    cancelled: [G.red,    G.redLight],
  }
  const [color, bg] = map[status] || [G.muted,'#F3F4F6']
  return <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:bg, color }}>{status?.charAt(0).toUpperCase()+status?.slice(1)}</span>
}

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background:G.white, borderRadius:16, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${color}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <p style={{ margin:'0 0 8px', fontSize:12, color:G.muted }}>{label}</p>
          <p style={{ margin:0, fontSize:26, fontWeight:800, color }}>{value}</p>
        </div>
        <div style={{ width:42, height:42, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{icon}</div>
      </div>
    </div>
  )
}

// ── Invoice PDF Generator ──────────────────────────────────
function generateInvoice(order, items) {
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${i.name} (${i.weight_kg}kg)</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">₹${i.price_per_unit}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">₹${i.quantity * i.price_per_unit}</td>
    </tr>`).join('')
  const subtotal = items.reduce((s,i) => s + i.quantity * i.price_per_unit, 0)
  const gst = Math.round(subtotal * 0.05)
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${order.order_number}</title>
  <style>body{font-family:Arial,sans-serif;padding:40px;color:#111}h1{color:#3B6D11}table{width:100%;border-collapse:collapse}th{background:#3B6D11;color:#fff;padding:10px 12px;text-align:left}.total{font-size:18px;font-weight:700;color:#3B6D11}</style></head>
  <body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
    <div><h1>🌾 Green Village Rice</h1><p style="color:#666">గ్రీన్ విలేజ్ రైస్ · Hyderabad</p></div>
    <div style="text-align:right"><h2 style="color:#111">INVOICE</h2><p>#${order.order_number}</p><p>${new Date(order.created_at).toLocaleDateString('en-IN')}</p></div>
  </div>
  <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin-bottom:24px">
    <p><strong>Customer:</strong> ${order.customer_name || 'Customer'}</p>
    <p><strong>Address:</strong> ${order.delivery_address || '—'}</p>
    <p><strong>Payment:</strong> ${order.payment_method?.toUpperCase() || '—'}</p>
  </div>
  <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>${itemRows}</tbody></table>
  <div style="margin-top:20px;text-align:right">
    <p>Subtotal: ₹${subtotal}</p><p>GST (5%): ₹${gst}</p>
    <p class="total">Total: ₹${subtotal + gst}</p>
  </div>
  <p style="margin-top:40px;text-align:center;color:#999">Thank you for choosing Green Village Rice · ధన్యవాదాలు 🌾</p>
  </body></html>`
  const w = window.open('','_blank')
  w.document.write(html)
  w.document.close()
  w.print()
}

// ── New Order Modal ────────────────────────────────────────
function NewOrderModal({ products, onClose, onSaved }) {
  const [customerName, setCustomerName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [payMethod, setPayMethod] = useState('cod')
  const [cart, setCart] = useState({})
  const [saving, setSaving] = useState(false)

  const total = products.reduce((s,p) => s + (cart[p.id]||0) * p.price_per_bag, 0)
  const grand = total + Math.round(total * 0.05)

  const updateCart = (id, delta) => setCart(prev => {
    const qty = Math.max(0, (prev[id]||0) + delta)
    if (qty === 0) { const n={...prev}; delete n[id]; return n }
    return {...prev,[id]:qty}
  })

  async function save() {
    if (!customerName.trim() || Object.keys(cart).length === 0) return
    setSaving(true)
    try {
      const { count } = await supabase.from('orders').select('*',{count:'exact',head:true})
      const orderNumber = `GVR-${String((count||0)+1).padStart(4,'0')}`
      const { data: order } = await supabase.from('orders').insert({
        order_number: orderNumber, customer_name: customerName,
        delivery_address: address, total_amount: grand,
        status:'pending', payment_status:'pending', payment_method: payMethod,
        created_at: new Date().toISOString()
      }).select().single()
      for (const p of products.filter(p => cart[p.id])) {
        await supabase.from('order_items').insert({
          order_id:order.id, product_id:p.id, name:p.name,
          weight_kg:p.weight_kg, quantity:cart[p.id], price_per_unit:p.price_per_bag
        })
        await supabase.from('products').update({stock_bags: p.stock_bags - cart[p.id]}).eq('id',p.id)
      }
      onSaved(); onClose()
    } catch(e){ console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:G.white, borderRadius:20, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:G.text }}>New Order</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:G.muted }}>✕</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {[['Customer Name','text',customerName,setCustomerName],['Phone','tel',phone,setPhone]].map(([lbl,type,val,set]) => (
            <div key={lbl}>
              <label style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6, display:'block' }}>{lbl}</label>
              <input type={type} value={val} onChange={e=>set(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1.5px solid ${G.border}`, fontSize:14, outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6, display:'block' }}>Delivery Address</label>
          <textarea value={address} onChange={e=>setAddress(e.target.value)} rows={2} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1.5px solid ${G.border}`, fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8, display:'block' }}>Select Products</label>
          {products.filter(p=>p.active).map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${G.border}` }}>
              <div>
                <p style={{ margin:'0 0 2px', fontWeight:600, fontSize:13 }}>{p.name}</p>
                <p style={{ margin:0, fontSize:12, color:G.muted }}>₹{p.price_per_bag}/bag · {p.stock_bags} left</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button onClick={()=>updateCart(p.id,-1)} style={{ width:28, height:28, borderRadius:'50%', border:`1px solid ${G.border}`, background:'none', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color:G.green }}>−</button>
                <span style={{ fontWeight:700, minWidth:20, textAlign:'center', color:G.text }}>{cart[p.id]||0}</span>
                <button onClick={()=>updateCart(p.id,1)} style={{ width:28, height:28, borderRadius:'50%', border:`1px solid ${G.border}`, background:'none', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color:G.green }}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8, display:'block' }}>Payment</label>
          <div style={{ display:'flex', gap:8 }}>
            {[['cod','💵 COD'],['upi','📱 UPI'],['bank','🏦 Bank']].map(([val,lbl])=>(
              <button key={val} onClick={()=>setPayMethod(val)} style={{ flex:1, padding:'8px', borderRadius:8, border:`2px solid ${payMethod===val?G.green:G.border}`, background:payMethod===val?G.greenLight:G.white, fontWeight:600, fontSize:13, cursor:'pointer', color:payMethod===val?G.greenDark:G.muted }}>{lbl}</button>
            ))}
          </div>
        </div>
        {total > 0 && <div style={{ background:G.greenLight, borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:700, color:G.greenDark }}><span>Total (incl. GST)</span><span>₹{grand}</span></div>}
        <button onClick={save} disabled={saving || !customerName.trim() || Object.keys(cart).length===0} style={{ width:'100%', padding:13, background:saving?'#9CA3AF':G.green, color:G.white, border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer' }}>
          {saving ? 'Saving...' : 'Create Order'}
        </button>
      </div>
    </div>
  )
}

// ── Stock Modal ────────────────────────────────────────────
function StockModal({ product, onClose, onSaved }) {
  const [bags, setBags] = useState('')
  const [type, setType] = useState('add')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    const n = parseInt(bags)
    if (!n || n <= 0) return
    setSaving(true)
    const newStock = type === 'add' ? product.stock_bags + n : Math.max(0, product.stock_bags - n)
    await supabase.from('products').update({ stock_bags: newStock }).eq('id', product.id)
    await supabase.from('stock_movements').insert({
      product_id: product.id, change_bags: type === 'add' ? n : -n,
      type, note: note || 'Manual adjustment', created_at: new Date().toISOString()
    })
    onSaved(); onClose()
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:G.white, borderRadius:20, width:'100%', maxWidth:400, padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:700 }}>Update Stock</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:G.muted }}>✕</button>
        </div>
        <p style={{ color:G.muted, fontSize:13, marginBottom:16 }}>
          {product.name} · Current stock: <strong style={{ color:G.green }}>{product.stock_bags} bags</strong>
        </p>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[['add','➕ Add Stock'],['subtract','➖ Remove Stock']].map(([val,lbl])=>(
            <button key={val} onClick={()=>setType(val)} style={{ flex:1, padding:'9px', borderRadius:8, border:`2px solid ${type===val?G.green:G.border}`, background:type===val?G.greenLight:G.white, fontWeight:600, fontSize:13, cursor:'pointer', color:type===val?G.greenDark:G.muted }}>{lbl}</button>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6, display:'block' }}>Number of Bags</label>
          <input type="number" min={1} value={bags} onChange={e=>setBags(e.target.value)} placeholder="Enter quantity"
            style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1.5px solid ${G.border}`, fontSize:14, outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6, display:'block' }}>Note (optional)</label>
          <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. New stock arrived"
            style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1.5px solid ${G.border}`, fontSize:14, outline:'none', boxSizing:'border-box' }} />
        </div>
        <button onClick={save} disabled={saving || !bags} style={{ width:'100%', padding:13, background:saving?'#9CA3AF':type==='add'?G.green:G.red, color:G.white, border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer' }}>
          {saving ? 'Saving...' : type==='add' ? `Add ${bags||0} Bags` : `Remove ${bags||0} Bags`}
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [page, setPage]     = useState('dashboard')
  const [filter, setFilter] = useState('monthly')
  const [collapsed, setCollapsed] = useState(false)
  const [orders, setOrders]   = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers]     = useState([])
  const [movements, setMovements] = useState([])
  const [chart, setChart]     = useState([])
  const [stats, setStats]     = useState({ revenue:0, orders:0, bags:0, pending:0, lowStock:0, customers:0 })
  const [loading, setLoading] = useState(true)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [showStock, setShowStock] = useState(null)

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    const [oRes, pRes, uRes, mRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(quantity, price_per_unit, product_id, name, weight_kg)').order('created_at',{ascending:false}),
      supabase.from('products').select('*').order('weight_kg'),
      supabase.from('profiles').select('*'),
      supabase.from('stock_movements').select('*, products(name)').order('created_at',{ascending:false}).limit(20),
    ])
    const o = oRes.data || []
    const p = pRes.data || []
    const u = uRes.data || []
    const m = mRes.data || []
    const revenue = o.filter(x=>x.payment_status==='paid').reduce((s,x)=>s+Number(x.total_amount||0),0)
    const bags = o.flatMap(x=>x.order_items||[]).reduce((s,x)=>s+(x.quantity||0),0)
    setStats({ revenue, orders:o.length, bags, pending:o.filter(x=>x.status==='pending').length, lowStock:p.filter(x=>x.stock_bags<=x.low_stock_threshold).length, customers:u.filter(x=>x.role==='customer').length })
    setOrders(o); setProducts(p); setUsers(u); setMovements(m)
    setChart(buildChart(o, filter))
    setLoading(false)
  }

  function buildChart(o, f) {
    const now = new Date()
    const keys=[], labels=[]
    if (f==='daily') {
      for (let i=6;i>=0;i--) { const d=new Date(now); d.setDate(d.getDate()-i); keys.push(d.toISOString().split('T')[0]); labels.push(d.toLocaleDateString('en-IN',{weekday:'short'})) }
    } else if (f==='monthly') {
      for (let i=5;i>=0;i--) { const d=new Date(now.getFullYear(),now.getMonth()-i,1); keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); labels.push(d.toLocaleDateString('en-IN',{month:'short'})) }
    } else {
      for (let i=3;i>=0;i--) { keys.push(String(now.getFullYear()-i)); labels.push(String(now.getFullYear()-i)) }
    }
    return keys.map((k,i)=>({ name:labels[i], revenue:o.filter(x=>x.created_at?.startsWith(k)).reduce((s,x)=>s+Number(x.total_amount||0),0), orders:o.filter(x=>x.created_at?.startsWith(k)).length }))
  }

  async function updateOrderStatus(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const fmtRs = v => `₹${Number(v).toLocaleString('en-IN')}`

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:G.surface, fontFamily:"'Inter', sans-serif" }}>

      {showNewOrder && <NewOrderModal products={products} onClose={()=>setShowNewOrder(false)} onSaved={load} />}
      {showStock && <StockModal product={showStock} onClose={()=>setShowStock(null)} onSaved={load} />}

      {/* SIDEBAR */}
      <aside style={{ width:collapsed?60:220, flexShrink:0, background:G.white, borderRight:`1px solid ${G.border}`, display:'flex', flexDirection:'column', transition:'width 0.2s', position:'sticky', top:0, height:'100vh', overflow:'hidden' }}>
        <div style={{ padding:collapsed?'18px 10px':'18px 18px', borderBottom:`1px solid ${G.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:G.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🌾</div>
          {!collapsed && <div><p style={{ margin:0, fontSize:13, fontWeight:700, color:G.greenDark }}>Green Village</p><p style={{ margin:0, fontSize:10, color:G.green2, fontWeight:600 }}>Rice Admin</p></div>}
        </div>
        <nav style={{ flex:1, padding:'10px 6px' }}>
          {PAGES.map(item => (
            <button key={item.key} onClick={()=>setPage(item.key)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:collapsed?'10px':'10px 12px', borderRadius:10, border:'none', cursor:'pointer', marginBottom:2, justifyContent:collapsed?'center':'flex-start', background:page===item.key?G.greenLight:'transparent', color:page===item.key?G.greenDark:G.muted, fontWeight:page===item.key?600:500, fontSize:13 }}>
              <span style={{ fontSize:17, flexShrink:0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:'10px 6px', borderTop:`1px solid ${G.border}` }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', marginBottom:4 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:G.greenDark, flexShrink:0 }}>
                {profile?.full_name?.[0] || profile?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ margin:0, fontSize:12, fontWeight:600, color:G.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile?.full_name || profile?.username}</p>
                <p style={{ margin:0, fontSize:10, color:G.muted }}>{profile?.role}</p>
              </div>
            </div>
          )}
          <button onClick={async()=>{ await signOut(); navigate('/login') }} style={{ width:'100%', padding:collapsed?'8px':'8px 12px', borderRadius:10, border:'none', background:'transparent', color:G.red, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:collapsed?'center':'flex-start', gap:6 }}>
            <span>↩</span>{!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* TOPBAR */}
        <header style={{ background:G.white, borderBottom:`1px solid ${G.border}`, height:58, padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={()=>setCollapsed(!collapsed)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:G.muted, padding:4 }}>☰</button>
            <span style={{ fontSize:15, fontWeight:700, color:G.text }}>{PAGES.find(p=>p.key===page)?.label}</span>
          </div>
          <div style={{ display:'flex', gap:2 }}>
            {TOP_LINKS.map(l=>(
              <button key={l} style={{ background:'none', border:'none', cursor:'pointer', padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:600, color:G.green }}
                onMouseEnter={e=>e.currentTarget.style.background=G.greenLight}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>{l}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {['daily','monthly','yearly'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{ padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background:filter===f?G.green:'#F3F4F6', color:filter===f?'#fff':G.muted }}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </header>

        <main style={{ flex:1, padding:'24px', overflowY:'auto' }}>
          {loading ? <div style={{ textAlign:'center', padding:80, color:G.muted }}>Loading...</div> : <>

          {/* DASHBOARD */}
          {page==='dashboard' && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
              <StatCard label="Revenue" value={fmtRs(stats.revenue)} icon="💰" color={G.green} bg={G.greenLight} />
              <StatCard label="Orders" value={stats.orders} icon="📋" color={G.blue} bg={G.blueLight} />
              <StatCard label="Bags Sold" value={stats.bags} icon="🌾" color={G.green2} bg={G.greenLight} />
              <StatCard label="Pending" value={stats.pending} icon="⏳" color={G.amber} bg={G.amberLight} />
              <StatCard label="Low Stock" value={stats.lowStock} icon="⚠️" color={G.red} bg={G.redLight} />
              <StatCard label="Customers" value={stats.customers} icon="👥" color="#7C3AED" bg="#EDE9FE" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:24 }}>
              <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700 }}>Revenue — {filter}</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chart} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize:11,fill:G.muted}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:11,fill:G.muted}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`} />
                    <Tooltip formatter={v=>[fmtRs(v),'Revenue']} contentStyle={{borderRadius:10,fontSize:12}} />
                    <Bar dataKey="revenue" radius={[6,6,0,0]}>
                      {chart.map((_,i)=><Cell key={i} fill={i===chart.length-1?G.green:G.green2} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700 }}>Orders — {filter}</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize:11,fill:G.muted}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:11,fill:G.muted}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{borderRadius:10,fontSize:12}} />
                    <Line type="monotone" dataKey="orders" stroke={G.green} strokeWidth={2.5} dot={{fill:G.green,r:4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:700 }}>Recent Orders</p>
                <button onClick={()=>setShowNewOrder(true)} style={{ background:G.green, color:G.white, border:'none', borderRadius:8, padding:'7px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ New Order</button>
              </div>
              <Table headers={['Order #','Customer','Amount','Method','Status','Action']}>
                {orders.slice(0,8).map((o,i)=>(
                  <tr key={o.id} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
                    <td style={{ padding:'11px 14px', fontWeight:600, color:G.green }}>{o.order_number}</td>
                    <td style={{ padding:'11px 14px' }}>{o.customer_name||'—'}</td>
                    <td style={{ padding:'11px 14px', fontWeight:600 }}>{fmtRs(o.total_amount)}</td>
                    <td style={{ padding:'11px 14px', color:G.muted, fontSize:11, textTransform:'uppercase' }}>{o.payment_method||'—'}</td>
                    <td style={{ padding:'11px 14px' }}><Badge status={o.status} /></td>
                    <td style={{ padding:'11px 14px' }}>
                      <button onClick={()=>generateInvoice(o, o.order_items||[])} style={{ background:G.blueLight, border:'none', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:600, color:G.blue, cursor:'pointer' }}>🖨 Invoice</button>
                    </td>
                  </tr>
                ))}
                {orders.length===0 && <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:G.muted }}>No orders yet</td></tr>}
              </Table>
            </div>
          </>}

          {/* ORDERS */}
          {page==='orders' && <>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
              <button onClick={()=>setShowNewOrder(true)} style={{ background:G.green, color:G.white, border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, fontWeight:700, cursor:'pointer' }}>+ New Order</button>
            </div>
            <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <Table headers={['Order #','Customer','Address','Amount','Method','Status','Actions']}>
                {orders.map((o,i)=>(
                  <tr key={o.id} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
                    <td style={{ padding:'11px 14px', fontWeight:600, color:G.green }}>{o.order_number}</td>
                    <td style={{ padding:'11px 14px' }}>{o.customer_name||'—'}</td>
                    <td style={{ padding:'11px 14px', color:G.muted, fontSize:12, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.delivery_address||'—'}</td>
                    <td style={{ padding:'11px 14px', fontWeight:600 }}>{fmtRs(o.total_amount)}</td>
                    <td style={{ padding:'11px 14px', color:G.muted, fontSize:11, textTransform:'uppercase' }}>{o.payment_method||'—'}</td>
                    <td style={{ padding:'11px 14px' }}><Badge status={o.status} /></td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {o.status==='pending' && <button onClick={()=>updateOrderStatus(o.id,'confirmed')} style={{ background:G.greenLight, border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, fontWeight:600, color:G.green, cursor:'pointer' }}>Confirm</button>}
                        {o.status==='confirmed' && <button onClick={()=>updateOrderStatus(o.id,'packed')} style={{ background:G.blueLight, border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, fontWeight:600, color:G.blue, cursor:'pointer' }}>Pack</button>}
                        {o.status==='packed' && <button onClick={()=>updateOrderStatus(o.id,'dispatched')} style={{ background:'#EDE9FE', border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, fontWeight:600, color:'#7C3AED', cursor:'pointer' }}>Dispatch</button>}
                        {o.status==='dispatched' && <button onClick={()=>updateOrderStatus(o.id,'delivered')} style={{ background:G.greenLight, border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, fontWeight:600, color:G.green, cursor:'pointer' }}>Delivered</button>}
                        <button onClick={()=>generateInvoice(o, o.order_items||[])} style={{ background:G.blueLight, border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, fontWeight:600, color:G.blue, cursor:'pointer' }}>🖨 Invoice</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length===0 && <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:G.muted }}>No orders yet</td></tr>}
              </Table>
            </div>
          </>}

          {/* INVENTORY */}
          {page==='inventory' && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:24 }}>
              {products.map(p=>{
                const isLow = p.stock_bags <= p.low_stock_threshold
                const pct = Math.min(100, Math.round(p.stock_bags / Math.max(p.stock_bags, p.low_stock_threshold*3) * 100))
                return (
                  <div key={p.id} style={{ background:G.white, borderRadius:16, padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${isLow?G.red:G.green}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                      <div>
                        <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:700 }}>{p.name}</p>
                        <p style={{ margin:0, fontSize:11, color:G.muted }}>{p.sku} · {p.weight_kg}kg</p>
                      </div>
                      <span style={{ fontSize:24 }}>🌾</span>
                    </div>
                    <p style={{ margin:'0 0 8px', fontSize:28, fontWeight:800, color:isLow?G.red:G.green }}>
                      {p.stock_bags} <span style={{ fontSize:13, color:G.muted, fontWeight:400 }}>bags</span>
                    </p>
                    <div style={{ height:6, background:'#F3F4F6', borderRadius:3, overflow:'hidden', marginBottom:10 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:isLow?G.red:G.green, borderRadius:3 }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:G.muted, marginBottom:12 }}>
                      <span>{fmtRs(p.price_per_bag)}/bag</span>
                      {isLow && <span style={{ color:G.red, fontWeight:600 }}>⚠ Low stock</span>}
                    </div>
                    {p.packing_date && <p style={{ margin:'0 0 4px', fontSize:11, color:G.muted }}>📅 Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</p>}
                    {p.best_before_date && <p style={{ margin:'0 0 12px', fontSize:11, color:G.muted }}>⏳ Best before: {new Date(p.best_before_date).toLocaleDateString('en-IN')}</p>}
                    <button onClick={()=>setShowStock(p)} style={{ width:'100%', padding:'8px', background:G.greenLight, border:'none', borderRadius:8, color:G.green, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      📦 Update Stock
                    </button>
                  </div>
                )
              })}
            </div>
            {/* Stock movements log */}
            <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700 }}>Stock Movement History</p>
              <Table headers={['Product','Change','Type','Note','Date']}>
                {movements.map((m,i)=>(
                  <tr key={m.id} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
                    <td style={{ padding:'11px 14px', fontWeight:600 }}>{m.products?.name||'—'}</td>
                    <td style={{ padding:'11px 14px', fontWeight:700, color:m.change_bags>0?G.green:G.red }}>{m.change_bags>0?'+':''}{m.change_bags} bags</td>
                    <td style={{ padding:'11px 14px' }}><span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:m.type==='add'?G.greenLight:G.redLight, color:m.type==='add'?G.green:G.red, fontWeight:600 }}>{m.type}</span></td>
                    <td style={{ padding:'11px 14px', color:G.muted, fontSize:12 }}>{m.note||'—'}</td>
                    <td style={{ padding:'11px 14px', color:G.muted, fontSize:12 }}>{new Date(m.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {movements.length===0 && <tr><td colSpan={5} style={{ padding:40, textAlign:'center', color:G.muted }}>No stock movements yet</td></tr>}
              </Table>
            </div>
          </>}

          {/* ANALYTICS */}
          {page==='analytics' && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
              <StatCard label="Total Revenue" value={fmtRs(stats.revenue)} icon="💰" color={G.green} bg={G.greenLight} />
              <StatCard label="Total Bags Sold" value={stats.bags} icon="🌾" color={G.green2} bg={G.greenLight} />
              <StatCard label="Total Customers" value={stats.customers} icon="👥" color="#7C3AED" bg="#EDE9FE" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:24 }}>
              <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700 }}>Revenue ({filter})</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chart} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize:11,fill:G.muted}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:11,fill:G.muted}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`} />
                    <Tooltip formatter={v=>[fmtRs(v),'Revenue']} contentStyle={{borderRadius:10,fontSize:12}} />
                    <Bar dataKey="revenue" fill={G.green} radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700 }}>Orders Trend ({filter})</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize:11,fill:G.muted}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:11,fill:G.muted}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{borderRadius:10,fontSize:12}} />
                    <Line type="monotone" dataKey="orders" stroke={G.green} strokeWidth={2.5} dot={{fill:G.green,r:4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700 }}>Product Performance</p>
              {products.map(p=>{
                const sold = orders.flatMap(o=>(o.order_items||[]).filter(i=>i.product_id===p.id)).reduce((s,i)=>s+i.quantity,0)
                const rev  = orders.flatMap(o=>(o.order_items||[]).filter(i=>i.product_id===p.id)).reduce((s,i)=>s+i.quantity*i.price_per_unit,0)
                const maxSold = Math.max(...products.map(pp=>orders.flatMap(o=>(o.order_items||[]).filter(i=>i.product_id===pp.id)).reduce((s,i)=>s+i.quantity,0)),1)
                return (
                  <div key={p.id} style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}>
                      <span style={{ fontWeight:500 }}>{p.name}</span>
                      <span style={{ color:G.muted }}>{sold} bags · {fmtRs(rev)}</span>
                    </div>
                    <div style={{ height:8, background:'#F3F4F6', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.round(sold/maxSold*100)}%`, background:G.green, borderRadius:4 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>}

          {/* USERS */}
          {page==='users' && <>
            <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700 }}>All Users</p>
              <Table headers={['#','Name','Username','Role','Joined']}>
                {users.map((u,i)=>(
                  <tr key={u.id} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
                    <td style={{ padding:'11px 14px', color:G.muted }}>{i+1}</td>
                    <td style={{ padding:'11px 14px', fontWeight:600 }}>{u.full_name||'—'}</td>
                    <td style={{ padding:'11px 14px', color:G.muted }}>{u.username||'—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:u.role==='superadmin'?'#EDE9FE':G.greenLight, color:u.role==='superadmin'?'#7C3AED':G.green }}>{u.role}</span>
                    </td>
                    <td style={{ padding:'11px 14px', color:G.muted, fontSize:12 }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {users.length===0 && <tr><td colSpan={5} style={{ padding:40, textAlign:'center', color:G.muted }}>No users yet</td></tr>}
              </Table>
            </div>
          </>}

          </>}
        </main>
      </div>
    </div>
  )
}

function Table({ headers, children }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ background:'#F9FAF7' }}>
            {headers.map(h=>(
              <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

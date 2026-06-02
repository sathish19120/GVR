import { useState, useEffect } from 'react'
import ProfilePage from './ProfilePage'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',purple:'#7C3AED',purpleLight:'#EDE9FE',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const PAGES = [
  { key:'dashboard', icon:'⊞', label:'Dashboard' },
  { key:'orders',    icon:'📋', label:'Orders' },
  { key:'inventory', icon:'📦', label:'Inventory' },
  { key:'stock',     icon:'🏭', label:'My Stock' },
]

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
  return (
    <span style={{ fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:bg,color }}>
      {status?.charAt(0).toUpperCase()+status?.slice(1)}
    </span>
  )
}

export default function BranchDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const branch = user?.branch || 'Hyderabad'

  const [page, setPage]         = useState('dashboard')
  const [collapsed, setCol]     = useState(false)
  const [orders, setOrders]     = useState([])
  const [products, setProducts] = useState([])
  const [branchStock, setBStock]= useState([])
  const [chart, setChart]       = useState([])
  const [stats, setStats]       = useState({ orders:0, revenue:0, pending:0, delivered:0 })
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setSF]   = useState('all')
  const [updateModal, setUpdate]= useState(null)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [oRes, pRes, bRes] = await Promise.all([
      supabase.from('orders')
        .select('*, order_items(name,weight_kg,quantity,price_per_unit)')
        .order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('active', true).order('weight_kg'),
      supabase.from('branch_stock').select('*').eq('branch_name', branch),
    ])
    const o = oRes.data || []
    const p = pRes.data || []
    const b = bRes.data || []

    setOrders(o)
    setProducts(p)
    setBStock(b)

    const revenue = o.filter(x => x.payment_status === 'paid').reduce((s,x) => s+Number(x.total_amount||0), 0)
    setStats({
      orders: o.length,
      revenue,
      pending: o.filter(x => x.status === 'pending').length,
      delivered: o.filter(x => x.status === 'delivered').length,
    })

    // Chart — last 7 days
    const now = new Date()
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      chartData.push({
        name: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        orders: o.filter(x => x.created_at?.startsWith(key)).length,
        revenue: o.filter(x => x.created_at?.startsWith(key)).reduce((s,x) => s+Number(x.total_amount||0), 0),
      })
    }
    setChart(chartData)
    setLoading(false)
  }

  async function updateOrderStatus(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function updateBranchStock(productId, productName, delta, type, note) {
    const existing = branchStock.find(b => b.product_id === productId)
    const newStock = Math.max(0, (existing?.stock_bags || 0) + delta)
    await supabase.from('branch_stock').upsert({
      branch_name: branch, product_id: productId,
      product_name: productName, stock_bags: newStock,
      updated_at: new Date().toISOString()
    }, { onConflict: 'branch_name,product_id' })
    await supabase.from('branch_stock_movements').insert({
      branch_name: branch, product_id: productId,
      product_name: productName, change_bags: delta,
      type, note: note || null, created_at: new Date().toISOString()
    })
    load()
  }

  const fmtRs = v => `₹${Number(v).toLocaleString('en-IN')}`

  const filteredOrders = orders.filter(o => {
    const ms = !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.customer_name?.toLowerCase().includes(search.toLowerCase())
    const mst = statusFilter === 'all' || o.status === statusFilter
    return ms && mst
  })

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:G.surface, fontFamily:"'Inter', sans-serif" }}>
      {showProfile && <ProfilePage onClose={() => setShowProfile(false)} />}

      {/* SIDEBAR */}
      <aside style={{ width:collapsed?60:220, flexShrink:0, background:G.white, borderRight:`1px solid ${G.border}`, display:'flex', flexDirection:'column', transition:'width 0.2s', position:'sticky', top:0, height:'100vh', overflow:'hidden' }}>
        <div style={{ padding:collapsed?'16px 10px':'16px 16px', borderBottom:`1px solid ${G.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:G.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🌾</div>
          {!collapsed && (
            <div>
              <p style={{ margin:0, fontSize:12, fontWeight:700, color:G.greenDark }}>GVR — {branch}</p>
              <p style={{ margin:0, fontSize:10, color:G.green2 }}>Branch Portal</p>
            </div>
          )}
        </div>
        <nav style={{ flex:1, padding:'10px 6px' }}>
          {PAGES.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:10,
              padding:collapsed?'10px':'10px 12px', borderRadius:10, border:'none',
              cursor:'pointer', marginBottom:2,
              justifyContent:collapsed?'center':'flex-start',
              background: page===item.key ? G.greenLight : 'transparent',
              color: page===item.key ? G.greenDark : G.muted,
              fontWeight: page===item.key ? 600 : 500, fontSize:13,
            }}>
              <span style={{ fontSize:17, flexShrink:0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:'10px 6px', borderTop:`1px solid ${G.border}` }}>
          {!collapsed && (
            <div style={{ padding:'8px 12px', marginBottom:4 }}>
              <button type="button" onClick={() => setShowProfile(true)} style={{ width:34, height:34, borderRadius:'50%', background:G.greenLight, border:`2px solid ${G.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', padding:0, marginBottom:4 }}>
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:12, fontWeight:700, color:G.greenDark }}>{user?.full_name?.[0] || user?.username?.[0]?.toUpperCase() || 'E'}</span>
                }
              </button>
              <p style={{ margin:0, fontSize:12, fontWeight:600, color:G.text }}>{user?.full_name || user?.username}</p>
              <p style={{ margin:0, fontSize:10, color:G.muted }}>Branch Executive · {branch}</p>
            </div>
          )}
          <button onClick={async()=>{ await signOut(); navigate('/login') }} style={{
            width:'100%', padding:collapsed?'8px':'8px 12px', borderRadius:10, border:'none',
            background:'transparent', color:G.red, fontSize:12, fontWeight:600, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:collapsed?'center':'flex-start', gap:6
          }}>
            <span>↩</span>{!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* TOPBAR */}
        <header style={{ background:G.white, borderBottom:`1px solid ${G.border}`, height:56, padding:'0 22px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={() => setCol(!collapsed)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:G.muted }}>☰</button>
            <span style={{ fontSize:15, fontWeight:700, color:G.text }}>
              {PAGES.find(p => p.key === page)?.label} — {branch}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={load} style={{ background:'#F3F4F6', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600, color:G.muted, cursor:'pointer' }}>↻ Refresh</button>
            <span style={{ fontSize:12, color:G.muted }}>Branch Executive</span>
          </div>
        </header>

        <main style={{ flex:1, padding:'22px', overflowY:'auto' }}>
          {loading ? <div style={{ textAlign:'center', padding:60, color:G.muted }}>Loading...</div> : <>

          {/* ── DASHBOARD ── */}
          {page === 'dashboard' && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:22 }}>
              {[
                { label:'Total Orders',  value:stats.orders,        icon:'📋', color:G.blue,  bg:G.blueLight },
                { label:'Revenue',       value:fmtRs(stats.revenue), icon:'💰', color:G.green, bg:G.greenLight },
                { label:'Pending',       value:stats.pending,        icon:'⏳', color:G.amber, bg:G.amberLight },
                { label:'Delivered',     value:stats.delivered,      icon:'✅', color:G.green2,bg:G.greenLight },
              ].map((s,i) => (
                <div key={i} style={{ background:G.white, borderRadius:16, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${s.color}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ margin:'0 0 6px', fontSize:12, color:G.muted }}>{s.label}</p>
                      <p style={{ margin:0, fontSize:24, fontWeight:800, color:s.color }}>{s.value}</p>
                    </div>
                    <div style={{ width:38, height:38, borderRadius:9, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ background:G.white, borderRadius:16, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:20 }}>
              <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700 }}>Orders — Last 7 Days</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chart} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:G.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:G.muted }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                  <Bar dataKey="orders" radius={[6,6,0,0]}>
                    {chart.map((_,i) => <Cell key={i} fill={i===chart.length-1?G.green:G.green2} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent orders */}
            <div style={{ background:G.white, borderRadius:16, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:700 }}>Recent Orders</p>
              {orders.slice(0,5).map((o,i) => (
                <div key={o.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<4?`1px solid ${G.border}`:'none' }}>
                  <div>
                    <p style={{ margin:'0 0 2px', fontWeight:600, fontSize:13, color:G.green }}>{o.order_number}</p>
                    <p style={{ margin:0, fontSize:11, color:G.muted }}>{o.customer_name} · {new Date(o.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontWeight:700, fontSize:13 }}>{fmtRs(o.total_amount)}</span>
                    <Badge status={o.status} />
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p style={{ textAlign:'center', color:G.muted, fontSize:13 }}>No orders yet</p>}
            </div>
          </>}

          {/* ── ORDERS ── */}
          {page === 'orders' && <>
            <div style={{ background:G.white, borderRadius:14, padding:'12px 16px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ position:'relative', flex:1, minWidth:200 }}>
                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color:G.muted }}>🔍</span>
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search order or customer..."
                  style={{ width:'100%', padding:'9px 9px 9px 32px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box', background:'#FAFAFA' }}
                  onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
              </div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {['all','pending','confirmed','packed','dispatched','delivered','cancelled'].map(s=>(
                  <button key={s} onClick={()=>setSF(s)} style={{ padding:'6px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:statusFilter===s?G.green:'#F3F4F6', color:statusFilter===s?G.white:G.muted }}>
                    {s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {filteredOrders.map((o,i) => (
                <div key={o.id} style={{ background:G.white, borderRadius:14, overflow:'hidden', border:`1px solid ${G.border}`, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex' }}>
                    {/* Left — items */}
                    <div style={{ width:200, flexShrink:0, background:'#F9FAF7', borderRight:`1px solid ${G.border}`, padding:'12px 14px' }}>
                      <p style={{ margin:'0 0 8px', fontSize:10, fontWeight:700, color:G.muted, textTransform:'uppercase' }}>Items</p>
                      {(o.order_items||[]).map((item,idx) => (
                        <div key={idx} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6, padding:'6px 8px', background:G.white, borderRadius:7, border:`1px solid ${G.border}` }}>
                          <span style={{ fontSize:14 }}>🌾</span>
                          <div>
                            <p style={{ margin:0, fontSize:11, fontWeight:700, color:G.text }}>{item.name}</p>
                            <p style={{ margin:0, fontSize:10, color:G.muted }}>×{item.quantity} = <strong style={{ color:G.green }}>₹{item.quantity*item.price_per_unit}</strong></p>
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop:6, padding:'6px 8px', background:G.greenLight, borderRadius:7, display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:11, color:G.greenDark, fontWeight:600 }}>Total</span>
                        <span style={{ fontSize:13, fontWeight:800, color:G.green }}>{fmtRs(o.total_amount)}</span>
                      </div>
                    </div>
                    {/* Right — details */}
                    <div style={{ flex:1, padding:'12px 14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <div>
                          <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:14, color:G.green }}>{o.order_number}</p>
                          <p style={{ margin:0, fontSize:11, color:G.muted }}>{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                        </div>
                        <Badge status={o.status} />
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10, fontSize:12 }}>
                        <div><p style={{ margin:'0 0 1px', fontSize:10, color:G.muted, textTransform:'uppercase', fontWeight:600 }}>Customer</p><p style={{ margin:0, fontWeight:600 }}>{o.customer_name||'—'}</p></div>
                        <div><p style={{ margin:'0 0 1px', fontSize:10, color:G.muted, textTransform:'uppercase', fontWeight:600 }}>Payment</p><p style={{ margin:0, fontWeight:600, textTransform:'uppercase' }}>{o.payment_method||'—'} · <span style={{ color:o.payment_status==='paid'?G.green:G.amber }}>{o.payment_status}</span></p></div>
                        <div style={{ gridColumn:'1/-1' }}><p style={{ margin:'0 0 1px', fontSize:10, color:G.muted, textTransform:'uppercase', fontWeight:600 }}>Address</p><p style={{ margin:0 }}>{o.delivery_address||'—'}</p></div>
                      </div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {o.status==='pending' && <button onClick={()=>updateOrderStatus(o.id,'confirmed')} style={{ background:G.greenLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.green, cursor:'pointer' }}>✓ Confirm</button>}
                        {o.status==='confirmed' && <button onClick={()=>updateOrderStatus(o.id,'packed')} style={{ background:G.blueLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.blue, cursor:'pointer' }}>📦 Pack</button>}
                        {o.status==='packed' && <button onClick={()=>updateOrderStatus(o.id,'dispatched')} style={{ background:'#EDE9FE', border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:'#7C3AED', cursor:'pointer' }}>🚚 Dispatch</button>}
                        {o.status==='dispatched' && <button onClick={()=>updateOrderStatus(o.id,'delivered')} style={{ background:G.greenLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.green, cursor:'pointer' }}>✅ Delivered</button>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && <div style={{ textAlign:'center', padding:40, color:G.muted, background:G.white, borderRadius:14 }}>No orders found</div>}
            </div>
          </>}

          {/* ── INVENTORY ── */}
          {page === 'inventory' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
              {products.map(p => {
                const isLow = p.stock_bags <= p.low_stock_threshold
                const pct = Math.min(100, Math.round(p.stock_bags/Math.max(p.stock_bags,p.low_stock_threshold*3)*100))
                return (
                  <div key={p.id} style={{ background:G.white, borderRadius:16, padding:'18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${isLow?G.red:G.green}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <div>
                        <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:700 }}>{p.name}</p>
                        <p style={{ margin:0, fontSize:11, color:G.muted }}>{p.sku} · {p.weight_kg}kg</p>
                      </div>
                      <span style={{ fontSize:22 }}>🌾</span>
                    </div>
                    <p style={{ margin:'0 0 6px', fontSize:26, fontWeight:800, color:isLow?G.red:G.green }}>
                      {p.stock_bags} <span style={{ fontSize:12, color:G.muted, fontWeight:400 }}>bags</span>
                    </p>
                    <div style={{ height:5, background:'#F3F4F6', borderRadius:3, overflow:'hidden', marginBottom:8 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:isLow?G.red:G.green, borderRadius:3 }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:G.muted }}>
                      <span>₹{p.price_per_bag}/bag</span>
                      {isLow && <span style={{ color:G.red, fontWeight:600 }}>⚠ Low</span>}
                    </div>
                    {p.packing_date && <p style={{ margin:'6px 0 0', fontSize:11, color:G.muted }}>📅 Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</p>}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── MY BRANCH STOCK ── */}
          {page === 'stock' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
                <div style={{ background:G.white, borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${G.green}` }}>
                  <p style={{ margin:'0 0 6px', fontSize:12, color:G.muted }}>Total Bags at {branch}</p>
                  <p style={{ margin:0, fontSize:26, fontWeight:800, color:G.green }}>{branchStock.reduce((s,b)=>s+(b.stock_bags||0),0)}</p>
                </div>
                <div style={{ background:G.white, borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${G.red}` }}>
                  <p style={{ margin:'0 0 6px', fontSize:12, color:G.muted }}>Low Stock Products</p>
                  <p style={{ margin:0, fontSize:26, fontWeight:800, color:G.red }}>{products.filter(p=>{ const bs=branchStock.find(b=>b.product_id===p.id); return (bs?.stock_bags||0)<=p.low_stock_threshold }).length}</p>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14 }}>
                {products.map(p => {
                  const bs = branchStock.find(b => b.product_id === p.id)
                  const stock = bs?.stock_bags || 0
                  const isLow = stock <= p.low_stock_threshold
                  const pct = Math.min(100, Math.round(stock/Math.max(stock,p.low_stock_threshold*3,1)*100))
                  return (
                    <div key={p.id} style={{ background:G.white, borderRadius:16, padding:'18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${isLow?G.red:G.green}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                        <div>
                          <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:700 }}>{p.name}</p>
                          <p style={{ margin:0, fontSize:11, color:G.muted }}>{branch} · {p.weight_kg}kg</p>
                        </div>
                        <span style={{ fontSize:22 }}>🌾</span>
                      </div>
                      <p style={{ margin:'0 0 6px', fontSize:28, fontWeight:800, color:isLow?G.red:G.green }}>
                        {stock} <span style={{ fontSize:12, color:G.muted, fontWeight:400 }}>bags</span>
                      </p>
                      <div style={{ height:5, background:'#F3F4F6', borderRadius:3, overflow:'hidden', marginBottom:10 }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:isLow?G.red:stock>p.low_stock_threshold*2?G.green:G.amber, borderRadius:3 }} />
                      </div>
                      {isLow && <p style={{ margin:'0 0 10px', fontSize:11, color:G.red, fontWeight:600 }}>⚠ Stock running low — request refill from HQ</p>}
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>{ const n=prompt(`Add bags to ${p.name} at ${branch}:`); if(n&&parseInt(n)>0) updateBranchStock(p.id,p.name,parseInt(n),'add','Stock added') }}
                          style={{ flex:1, padding:'7px', background:G.greenLight, border:'none', borderRadius:8, fontSize:12, fontWeight:700, color:G.green, cursor:'pointer' }}>
                          + Add Stock
                        </button>
                        <button onClick={()=>{ const n=prompt(`Remove bags from ${p.name} at ${branch}:`); if(n&&parseInt(n)>0) updateBranchStock(p.id,p.name,-parseInt(n),'sale','Dispatched') }}
                          style={{ flex:1, padding:'7px', background:G.amberLight, border:'none', borderRadius:8, fontSize:12, fontWeight:700, color:G.amber, cursor:'pointer' }}>
                          − Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          </>}
        </main>
      </div>
    </div>
  )
}

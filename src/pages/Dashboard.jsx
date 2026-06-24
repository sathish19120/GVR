import AdminPage from './AdminPage'
import BatchPage from './BatchPage'
import PickupQueue from './PickupQueue'
import WalkInBilling from './WalkInBilling'
import BulkOrderForm from './BulkOrderForm'
import SupplierPage from './SupplierPage'
import HomePage from './HomePage'
import VendorPage from './VendorPage'
import BranchStockPage from './BranchStockPage'
import React, { useState, useEffect, useRef } from 'react'
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
  { key:'dashboard',   icon:'⊞',  label:'Dashboard' },
  { key:'orders',      icon:'📋', label:'Orders' },
  { key:'inventory',   icon:'📦', label:'Inventory' },
  { key:'analytics',   icon:'📊', label:'Analytics' },
  { key:'users',       icon:'👥', label:'Users' },
  { key:'admin',       icon:'⚙️', label:'Admin' },
  { key:'branches',    icon:'🏪', label:'Branches' },
  { key:'vendors',     icon:'🌾', label:'Vendors' },
  { key:'batches',     icon:'📦', label:'Batches' },
  { key:'pickup',      icon:'🏪', label:'Pickup Queue' },
  { key:'bulk',        icon:'🏢', label:'Bulk Orders' },
  { key:'suppliers',   icon:'🏭', label:'Suppliers' },
  { key:'branchstock', icon:'📊', label:'Branch Stock' }, // FIX #8: unique icon
  { key:'home',        icon:'🏠', label:'Home' },         // FIX #9: added to PAGES so it's reachable
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

  // FIX #6: wrapped in try/catch with rollback on failure
  async function save() {
    if (!customerName.trim() || Object.keys(cart).length === 0) return
    setSaving(true)
    let order = null
    try {
      // FIX #5: use MAX order_number to avoid duplicates when orders are deleted
      const { data: maxRow } = await supabase
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const lastNum = maxRow?.order_number
        ? parseInt(maxRow.order_number.replace('GVR-', ''), 10)
        : 0
      const orderNumber = `GVR-${String(lastNum + 1).padStart(4, '0')}`

      const { data: newOrder, error: orderErr } = await supabase.from('orders').insert({
        order_number: orderNumber, customer_name: customerName,
        delivery_address: address, total_amount: grand,
        status:'pending', payment_status:'pending', payment_method: payMethod,
        created_at: new Date().toISOString()
      }).select().single()

      if (orderErr) throw orderErr
      order = newOrder

      for (const p of products.filter(p => cart[p.id])) {
        const { error: itemErr } = await supabase.from('order_items').insert({
          order_id: order.id, product_id: p.id, name: p.name,
          weight_kg: p.weight_kg, quantity: cart[p.id], price_per_unit: p.price_per_bag
        })
        if (itemErr) throw itemErr
        await supabase.from('products').update({ stock_bags: p.stock_bags - cart[p.id] }).eq('id', p.id)
      }
      onSaved(); onClose()
    } catch(e) {
      console.error('Order save failed:', e)
      // Rollback: delete the order if it was created but items failed
      if (order?.id) {
        await supabase.from('order_items').delete().eq('order_id', order.id)
        await supabase.from('orders').delete().eq('id', order.id)
      }
      alert('Failed to save order. Please try again.')
    } finally {
      setSaving(false)
    }
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
          {/* FIX #1: removed stray logout button that was here */}
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
  const { user: profile, signOut } = useAuth()
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
  const [topModal, setTopModal] = useState(null)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [newOrderAlert, setNewOrderAlert] = useState(0)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderBranchFilter, setOrderBranchFilter] = useState('all') // FIX #4: separate state for order branch filter
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderPayFilter, setOrderPayFilter] = useState('all')
  const [orderDateFilter, setOrderDateFilter] = useState('all')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [stockBranchFilter, setStockBranchFilter] = useState('all') // inventory-only branch filter
  const [showStock, setShowStock] = useState(null)

  // FIX #7: use a ref so auto-refresh always reads the latest pending count
  const statsPendingRef = useRef(stats.pending)
  useEffect(() => { statsPendingRef.current = stats.pending }, [stats.pending])

  useEffect(() => { load() }, [filter])

  // FIX #10: wire up mobile overlay — toggle body class when sidebar opens
  useEffect(() => {
    const overlay = document.querySelector('.dash-overlay')
    if (!overlay) return
    if (!collapsed) {
      overlay.style.display = 'block'
    } else {
      overlay.style.display = 'none'
    }
  }, [collapsed])

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || page !== 'orders') return
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*, order_items(quantity, price_per_unit, product_id, name, weight_kg)')
          .order('created_at', { ascending: false })
        const newOrders = data || []
        const pendingCount = newOrders.filter(o => o.status === 'pending').length
        // FIX #7: read from ref instead of stale closure
        if (pendingCount > statsPendingRef.current) {
          setNewOrderAlert(pendingCount - statsPendingRef.current)
        }
        setOrders(newOrders)
        setLastRefresh(new Date())
      } catch(e) { console.error('Auto refresh error:', e) }
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, page])

  async function load() {
    setLoading(true)
    const [oRes, pRes, uRes, mRes] = await Promise.all([
      supabase.from('orders').select('id,order_number,customer_name,customer_id,delivery_address,total_amount,status,payment_status,payment_method,notes,created_at,order_items(quantity,price_per_unit,product_id,name,weight_kg)').order('created_at',{ascending:false}).limit(200),
      supabase.from('products').select('*').order('weight_kg'),
      supabase.from('profiles').select('id,username,full_name,role,phone,branch,created_at,active').order('created_at',{ascending:false}),
      supabase.from('stock_movements').select('id,product_id,change_bags,type,note,created_at,products(name)').order('created_at',{ascending:false}).limit(30),
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

  // FIX #3 & #4: compute filtered orders once, applied everywhere in the Orders page
  const filteredOrders = orders.filter(o => {
    const matchSearch = !orderSearch ||
      o.order_number?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.delivery_address?.toLowerCase().includes(orderSearch.toLowerCase())
    const matchInvoice = !invoiceSearch || o.order_number?.toLowerCase().includes(invoiceSearch.toLowerCase())
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter
    const matchPay = orderPayFilter === 'all' || o.payment_method === orderPayFilter
    const matchBranch = orderBranchFilter === 'all' || o.branch === orderBranchFilter
    const now = new Date()
    let matchDate = true
    if (orderDateFilter === 'today') matchDate = o.created_at?.startsWith(now.toISOString().split('T')[0])
    else if (orderDateFilter === 'week') matchDate = new Date(o.created_at) >= new Date(now - 7*86400000)
    else if (orderDateFilter === 'month') matchDate = o.created_at?.startsWith(now.toISOString().slice(0,7))
    return matchSearch && matchInvoice && matchStatus && matchPay && matchBranch && matchDate
  })

  // Reusable order action buttons
  function OrderActions({ o }) {
    return (
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {o.payment_status==='pending' && o.payment_method!=='cod' && (
          <button onClick={async()=>{ await supabase.from('orders').update({payment_status:'paid'}).eq('id',o.id); load() }}
            style={{ background:'#EAF3DE', border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.green, cursor:'pointer' }}>
            💰 Mark Paid
          </button>
        )}
        {o.payment_method==='cod' && o.payment_status==='pending' && (
          <button onClick={async()=>{
            await supabase.from('orders').update({ payment_status:'paid', notes:(o.notes?o.notes+' · ':'')+'Cash collected by admin' }).eq('id',o.id)
            load()
          }} style={{ background:G.amberLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.amber, cursor:'pointer' }}>
            💵 Mark Cash Collected
          </button>
        )}
        {o.payment_method==='cod' && o.payment_status==='paid' && (
          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:G.greenLight, color:G.green }}>
            ✅ Cash Collected
          </span>
        )}
        {o.status==='pending'    && <button onClick={()=>updateOrderStatus(o.id,'confirmed')}  style={{ background:G.greenLight,  border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.green,     cursor:'pointer' }}>✓ Confirm</button>}
        {o.status==='confirmed'  && <button onClick={()=>updateOrderStatus(o.id,'packed')}     style={{ background:G.blueLight,   border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.blue,      cursor:'pointer' }}>📦 Pack</button>}
        {o.status==='packed'     && <button onClick={()=>updateOrderStatus(o.id,'dispatched')} style={{ background:'#EDE9FE',     border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:'#7C3AED',   cursor:'pointer' }}>🚚 Dispatch</button>}
        {o.status==='dispatched' && <button onClick={()=>updateOrderStatus(o.id,'delivered')}  style={{ background:G.greenLight,  border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.green,     cursor:'pointer' }}>✅ Delivered</button>}
        {o.status==='dispatched' && o.payment_status!=='paid' && (
          <button onClick={async()=>{
            await supabase.from('orders').update({ payment_status:'paid', notes:(o.notes||'')+' · UPI paid on delivery' }).eq('id',o.id)
            load()
          }} style={{ background:G.blueLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.blue, cursor:'pointer' }}>
            📱 UPI Paid
          </button>
        )}
        {['pending','confirmed'].includes(o.status) && <button onClick={()=>updateOrderStatus(o.id,'cancelled')} style={{ background:G.redLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.red, cursor:'pointer' }}>✕ Cancel</button>}
        <button onClick={()=>generateInvoice(o, o.order_items||[])} style={{ background:G.blueLight, border:'none', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:700, color:G.blue, cursor:'pointer' }}>🖨 Invoice</button>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:G.surface, fontFamily:"'Inter', sans-serif" }}>
      {/* FIX #10: mobile overlay — display toggled via useEffect above */}
      <div className="dash-overlay" style={{ display:'none', position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:199 }} onClick={() => setCollapsed(true)} />

      {/* TOP NAV MODALS */}
      {topModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={()=>setTopModal(null)}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:600, maxHeight:'85vh', overflowY:'auto', padding:36 }} onClick={e=>e.stopPropagation()}>

            {topModal==='where' && <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#27500A' }}>📍 Where We Work</h2>
                <button onClick={()=>setTopModal(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#6B7280' }}>✕</button>
              </div>
              <p style={{ color:'#6B7280', fontSize:14, lineHeight:1.7, marginBottom:20 }}>
                Green Village Rice proudly serves customers across <strong style={{color:'#3B6D11'}}>Hyderabad and Secunderabad</strong>, delivering farm-fresh Sona Masoori rice directly to homes, apartments, and businesses.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                {[
                  { area:'Kukatpally', icon:'🏙️', desc:'KPHB, JNTU, Miyapur' },
                  { area:'Hitech City', icon:'💻', desc:'Madhapur, Gachibowli, Kondapur' },
                  { area:'Secunderabad', icon:'🏛️', desc:'Trimulgherry, Karkhana, SP Road' },
                  { area:'Dilsukhnagar', icon:'🌆', desc:'LB Nagar, Malakpet, Kothapet' },
                  { area:'Ameerpet', icon:'🏢', desc:'SR Nagar, Punjagutta, Begumpet' },
                  { area:'Uppal', icon:'🏭', desc:'Nacharam, Habsiguda, Tarnaka' },
                ].map(a => (
                  <div key={a.area} style={{ background:'#F4F6F3', borderRadius:12, padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
                    <span style={{ fontSize:22 }}>{a.icon}</span>
                    <div>
                      <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:14, color:'#111827' }}>{a.area}</p>
                      <p style={{ margin:0, fontSize:12, color:'#6B7280' }}>{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:'#EAF3DE', borderRadius:12, padding:'14px 18px', display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:20 }}>🚚</span>
                <p style={{ margin:0, fontSize:13, color:'#27500A' }}>Same-day delivery available for orders placed before <strong>12:00 PM</strong>. Free delivery on orders above <strong>₹500</strong>.</p>
              </div>
            </>}

            {topModal==='what' && <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#27500A' }}>🌾 What We Do</h2>
                <button onClick={()=>setTopModal(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#6B7280' }}>✕</button>
              </div>
              <p style={{ color:'#6B7280', fontSize:14, lineHeight:1.7, marginBottom:24 }}>
                We are a <strong style={{color:'#3B6D11'}}>direct-to-consumer rice brand</strong> that sources premium Sona Masoori paddy from trusted farms in Telangana, mills it fresh, and delivers it straight to your kitchen — eliminating middlemen and ensuring maximum freshness.
              </p>
              <div style={{ display:'grid', gap:14, marginBottom:24 }}>
                {[
                  { icon:'🌱', title:'Farm Sourcing', desc:'We source directly from certified paddy farmers in Nalgonda, Khammam, and Warangal districts of Telangana. Every batch is traceable to its farm.' },
                  { icon:'⚙️', title:'Fresh Milling', desc:'Rice is milled in small batches to preserve freshness. Every pack carries the milling date — you always know how fresh your rice is.' },
                  { icon:'📦', title:'Quality Packing', desc:'Available in 1 kg, 5 kg and 25 kg packs (25 kg coming soon). FSSAI-compliant packaging with best-before dates.' },
                  { icon:'🚪', title:'Doorstep Delivery', desc:'Orders placed through our app are delivered to your home within hours. Track your delivery in real time.' },
                  { icon:'💰', title:'Fair Pricing', desc:'By cutting out wholesalers and retailers, we offer premium rice at transparent prices — ₹60/kg for 1 kg packs, ₹50/kg for 5 kg packs.' },
                ].map(item => (
                  <div key={item.title} style={{ display:'flex', gap:14, padding:'14px 16px', background:'#F9FAF7', borderRadius:12, borderLeft:'3px solid #3B6D11' }}>
                    <span style={{ fontSize:24, flexShrink:0 }}>{item.icon}</span>
                    <div>
                      <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:14, color:'#111827' }}>{item.title}</p>
                      <p style={{ margin:0, fontSize:13, color:'#6B7280', lineHeight:1.6 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>}

            {topModal==='about' && <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#27500A' }}>🌾 About Green Village Rice</h2>
                <button onClick={()=>setTopModal(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#6B7280' }}>✕</button>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, padding:'18px 20px', background:'linear-gradient(135deg,#3B6D11,#27500A)', borderRadius:14 }}>
                <div style={{ width:60, height:60, borderRadius:14, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, flexShrink:0 }}>🌾</div>
                <div>
                  <p style={{ margin:'0 0 4px', fontWeight:800, fontSize:18, color:'#fff' }}>Green Village Rice</p>
                  <p style={{ margin:'0 0 2px', fontSize:13, color:'rgba(255,255,255,0.7)' }}>గ్రీన్ విలేజ్ రైస్ · Hyderabad, Telangana</p>
                  <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.5)' }}>Est. 2026 · FSSAI Licensed</p>
                </div>
              </div>
              <p style={{ color:'#6B7280', fontSize:14, lineHeight:1.8, marginBottom:20 }}>
                Green Village Rice was founded with a simple belief — <em style={{color:'#3B6D11', fontStyle:'italic'}}>every family deserves fresh, clean rice at a fair price</em>. We saw that most rice sold in Hyderabad had been sitting in warehouses for 6–12 months before reaching the customer. We decided to change that.
              </p>
              <p style={{ color:'#6B7280', fontSize:14, lineHeight:1.8, marginBottom:24 }}>
                Today we operate a fully digital ordering system, a direct supply chain from Telangana farms, and a small but dedicated delivery team serving thousands of households across Hyderabad.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
                {[
                  { icon:'🏆', label:'Our Mission', value:'Make fresh rice accessible to every household in Hyderabad' },
                  { icon:'👁️', label:'Our Vision', value:"Become Telangana's most trusted farm-to-home rice brand" },
                  { icon:'💚', label:'Our Values', value:'Freshness, Transparency, Fair Pricing, Community' },
                  { icon:'📞', label:'Contact Us', value:'admin@greenvillagerice.in · Hyderabad' },
                ].map(item => (
                  <div key={item.label} style={{ background:'#F4F6F3', borderRadius:12, padding:'16px' }}>
                    <p style={{ margin:'0 0 6px', fontSize:18 }}>{item.icon}</p>
                    <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.6px' }}>{item.label}</p>
                    <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.5 }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ background:'#EAF3DE', borderRadius:12, padding:'14px 18px' }}>
                <p style={{ margin:'0 0 8px', fontWeight:700, fontSize:13, color:'#27500A' }}>Product Range</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[['Sona Masoori 1kg','₹60'],['Sona Masoori 5kg','₹250'],['Sona Masoori 25kg','Coming Soon']].map(([name,price])=>(
                    <span key={name} style={{ fontSize:12, padding:'4px 12px', borderRadius:20, background:'#fff', color:'#3B6D11', fontWeight:600 }}>{name} — {price}</span>
                  ))}
                </div>
              </div>
            </>}
          </div>
        </div>
      )}

      {showNewOrder && <NewOrderModal products={products} onClose={()=>setShowNewOrder(false)} onSaved={load} />}
      {showStock && <StockModal product={showStock} onClose={()=>setShowStock(null)} onSaved={load} />}

      {/* SIDEBAR */}
      <aside className={`dash-sidebar${!collapsed?' open':''}`} style={{ width:collapsed?60:220, flexShrink:0, background:G.white, borderRight:`1px solid ${G.border}`, display:'flex', flexDirection:'column', transition:'width 0.2s, transform 0.25s', position:'sticky', top:0, height:'100vh', overflow:'hidden', zIndex:50 }}>
        <div style={{ padding:collapsed?'18px 10px':'18px 18px', borderBottom:`1px solid ${G.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:G.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🌾</div>
          {!collapsed && <div><p style={{ margin:0, fontSize:13, fontWeight:700, color:G.greenDark }}>Green Village</p><p style={{ margin:0, fontSize:10, color:G.green2, fontWeight:600 }}>Rice Admin</p></div>}
        </div>
        <nav style={{ flex:1, padding:'10px 6px', overflowY:'auto' }}>
          <style>{`
            .nav-item { position: relative; }
            .nav-tooltip {
              position: absolute;
              left: calc(100% + 10px);
              top: 50%;
              transform: translateY(-50%);
              background: #1F2937;
              color: #fff;
              font-size: 12px;
              font-weight: 600;
              padding: 5px 10px;
              border-radius: 7px;
              white-space: nowrap;
              pointer-events: none;
              opacity: 0;
              transition: opacity 0.15s;
              z-index: 9999;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            }
            .nav-tooltip::before {
              content: '';
              position: absolute;
              right: 100%;
              top: 50%;
              transform: translateY(-50%);
              border: 5px solid transparent;
              border-right-color: #1F2937;
            }
            .nav-item:hover .nav-tooltip { opacity: 1; }
          `}</style>
          {PAGES.map(item => (
            <div key={item.key} className="nav-item">
              <button onClick={()=>{ setPage(item.key); setCollapsed(true) }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:collapsed?'10px':'10px 12px', borderRadius:10, border:'none', cursor:'pointer', marginBottom:2, justifyContent:collapsed?'center':'flex-start', background:page===item.key?G.greenLight:'transparent', color:page===item.key?G.greenDark:G.muted, fontWeight:page===item.key?600:500, fontSize:13 }}>
                <span style={{ fontSize:17, flexShrink:0 }}>{item.icon}</span>
                {!collapsed && item.label}
              </button>
              {collapsed && <span className="nav-tooltip">{item.label}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding:'8px 6px', borderTop:`1px solid ${G.border}`, flexShrink:0 }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginBottom:6, background:'#F9FAF7', borderRadius:10 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:G.greenDark, flexShrink:0, overflow:'hidden' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : (profile?.full_name?.[0] || profile?.username?.[0]?.toUpperCase() || 'A')
                }
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ margin:0, fontSize:12, fontWeight:600, color:G.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile?.full_name || profile?.username}</p>
                <p style={{ margin:0, fontSize:10, color:G.muted, textTransform:'capitalize' }}>{profile?.role}</p>
              </div>
            </div>
          )}
          <div className="nav-item" style={{ position:'relative' }}>
            <button onClick={async()=>{ await signOut(); navigate('/login') }}
              style={{ width:'100%', padding:collapsed?'9px 0':'9px 12px', borderRadius:10, border:'none', background:G.redLight, color:G.red, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:collapsed?'center':'flex-start', gap:8, transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#FECACA'}
              onMouseLeave={e=>e.currentTarget.style.background=G.redLight}>
              <span style={{ fontSize:16, flexShrink:0 }}>↩</span>
              {!collapsed && <span>Logout</span>}
            </button>
            {collapsed && <span className="nav-tooltip">Logout</span>}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* TOPBAR */}
        <header className="dash-topbar" style={{ background:G.white, borderBottom:`1px solid ${G.border}`, height:58, padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={()=>setCollapsed(!collapsed)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:G.muted, padding:4 }}>☰</button>
            <span style={{ fontSize:15, fontWeight:700, color:G.text }}>{PAGES.find(p=>p.key===page)?.label}</span>
          </div>
          <div className="dash-topbar-center" style={{ display:'flex', gap:2 }}>
            {[['Where We Work','where'],['What We Do','what'],['About','about']].map(([label,key])=>(
              <button key={key} onClick={()=>setTopModal(key)} style={{ background:'none', border:'none', cursor:'pointer', padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:600, color:G.green, transition:'background 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background=G.greenLight}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>{label}</button>
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

        <main className="dash-main" style={{ flex:1, padding:'24px', overflowY:'auto', minWidth:0, maxWidth:'100%', height:'100vh' }}>
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
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:700 }}>Recent Orders</p>
                  {newOrderAlert > 0 && (
                    <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:G.amberLight, color:G.amber }}>
                      🔔 {newOrderAlert} new
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>{ load(); setLastRefresh(new Date()); setNewOrderAlert(0) }} style={{ background:'#F3F4F6', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:600, cursor:'pointer', color:G.muted }}>↻ Refresh</button>
                  <button onClick={()=>setShowNewOrder(true)} style={{ background:G.green, color:G.white, border:'none', borderRadius:8, padding:'7px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ New Order</button>
                </div>
              </div>
              {orders.length===0 && <p style={{ textAlign:'center', padding:40, color:G.muted }}>No orders yet</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {orders.slice(0,8).map((o)=>(
                <div key={o.id} style={{ display:'flex', gap:0, border:`1px solid ${G.border}`, borderRadius:12, overflow:'hidden', background:G.white }}>
                  <div style={{ width:200, flexShrink:0, background:'#F9FAF7', borderRight:`1px solid ${G.border}`, padding:'10px 12px' }}>
                    <p style={{ margin:'0 0 6px', fontSize:10, fontWeight:700, color:G.muted, textTransform:'uppercase' }}>Items</p>
                    {(o.order_items||[]).map((item,idx)=>(
                      <div key={idx} style={{ fontSize:11, display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ color:G.text, fontWeight:600 }}>🌾 {item.name}</span>
                        <span style={{ color:G.green, fontWeight:700 }}>×{item.quantity}</span>
                      </div>
                    ))}
                    {(o.order_items||[]).length===0 && <p style={{ margin:0, fontSize:11, color:G.muted }}>—</p>}
                    <div style={{ marginTop:6, paddingTop:6, borderTop:`1px solid ${G.border}`, display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:11, color:G.muted }}>Total</span>
                      <span style={{ fontSize:12, fontWeight:800, color:G.green }}>{fmtRs(o.total_amount)}</span>
                    </div>
                  </div>
                  <div style={{ flex:1, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <div>
                      <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:13, color:G.green }}>{o.order_number}</p>
                      <p style={{ margin:0, fontSize:12, color:G.text }}>{o.customer_name||'—'}</p>
                      <p style={{ margin:0, fontSize:11, color:G.muted }}>{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, color:G.muted, textTransform:'uppercase' }}>{o.payment_method||'—'}</span>
                      <Badge status={o.status} />
                      <button onClick={()=>generateInvoice(o, o.order_items||[])} style={{ background:G.blueLight, border:'none', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:600, color:G.blue, cursor:'pointer' }}>🖨</button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </>}

          {/* ORDERS — FIX #2: single render using filteredOrders; FIX #3: filter computed once above */}
          {page==='orders' && <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button onClick={()=>{ load(); setLastRefresh(new Date()); setNewOrderAlert(0) }} style={{
                  display:'flex', alignItems:'center', gap:6,
                  background:G.white, border:`1px solid ${G.border}`, borderRadius:10,
                  padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', color:G.text,
                  boxShadow:'0 1px 4px rgba(0,0,0,0.06)'
                }}>
                  <span style={{ fontSize:15 }}>↻</span> Refresh
                </button>
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', background:G.white, borderRadius:10, border:`1px solid ${G.border}`, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div onClick={()=>setAutoRefresh(!autoRefresh)} style={{
                    width:36, height:20, borderRadius:10, cursor:'pointer', transition:'background 0.2s', position:'relative',
                    background: autoRefresh ? G.green : '#D1D5DB'
                  }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', background:'white', position:'absolute', top:2, transition:'left 0.2s', left: autoRefresh ? 18 : 2 }} />
                  </div>
                  <span style={{ fontSize:12, color:G.muted, fontWeight:500 }}>
                    {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                  </span>
                </div>
                <span style={{ fontSize:11, color:G.muted }}>
                  Last updated: {lastRefresh.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                </span>
              </div>
              <button onClick={()=>setShowNewOrder(true)} style={{ background:G.green, color:G.white, border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, fontWeight:700, cursor:'pointer' }}>+ New Order</button>
            </div>

            {newOrderAlert > 0 && (
              <div style={{ background:G.amberLight, border:`1px solid ${G.amber}`, borderRadius:10, padding:'10px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:G.amber, fontWeight:600, fontSize:13 }}>
                  🔔 {newOrderAlert} new order{newOrderAlert > 1 ? 's' : ''} received!
                </span>
                <button onClick={()=>setNewOrderAlert(0)} style={{ background:'none', border:'none', cursor:'pointer', color:G.amber, fontSize:16 }}>✕</button>
              </div>
            )}

            {/* Filter UI */}
            <div style={{ background:G.white, borderRadius:14, padding:'14px 16px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                <div style={{ position:'relative', flex:1 }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, color:G.muted }}>🔍</span>
                  <input type="text" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)}
                    placeholder="Search by order number or customer name..."
                    style={{ width:'100%', padding:'10px 36px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box', background:'#FAFAFA' }}
                    onFocus={e=>e.target.style.borderColor=G.green}
                    onBlur={e=>e.target.style.borderColor=G.border} />
                  {orderSearch && <button onClick={()=>setOrderSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:G.muted, fontSize:16 }}>✕</button>}
                </div>
                <div style={{ position:'relative', width:200 }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:G.muted }}>🧾</span>
                  <input type="text" value={invoiceSearch} onChange={e=>setInvoiceSearch(e.target.value)}
                    placeholder="Invoice / GVR-XXXX"
                    style={{ width:'100%', padding:'10px 10px 10px 34px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box', background:'#FAFAFA' }}
                    onFocus={e=>e.target.style.borderColor=G.amber}
                    onBlur={e=>e.target.style.borderColor=G.border} />
                  {invoiceSearch && <button onClick={()=>setInvoiceSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:G.muted, fontSize:14 }}>✕</button>}
                </div>
              </div>
              {/* FIX #4: branch filter now uses orderBranchFilter and actually filters orders */}
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10, alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:600, color:G.muted, marginRight:4 }}>Branch:</span>
                {['all','Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu'].map(b=>(
                  <button key={b} onClick={()=>setOrderBranchFilter(b)} style={{ padding:'4px 10px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:orderBranchFilter===b?'#7C3AED':'#F3F4F6', color:orderBranchFilter===b?G.white:G.muted }}>
                    {b==='all'?'All':b}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {[['all','All'],['pending','Pending'],['confirmed','Confirmed'],['packed','Packed'],['dispatched','Dispatched'],['delivered','Delivered'],['cancelled','Cancelled']].map(([val,lbl])=>(
                    <button key={val} onClick={()=>setOrderStatusFilter(val)} style={{ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:orderStatusFilter===val?G.green:'#F3F4F6', color:orderStatusFilter===val?G.white:G.muted }}>{lbl}</button>
                  ))}
                </div>
                <div style={{ width:1, height:20, background:G.border }} />
                <div style={{ display:'flex', gap:4 }}>
                  {[['all','All Pay'],['cod','COD'],['upi','UPI'],['bank','Bank']].map(([val,lbl])=>(
                    <button key={val} onClick={()=>setOrderPayFilter(val)} style={{ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:orderPayFilter===val?G.amber:'#F3F4F6', color:orderPayFilter===val?G.white:G.muted }}>{lbl}</button>
                  ))}
                </div>
                <div style={{ width:1, height:20, background:G.border }} />
                <div style={{ display:'flex', gap:4 }}>
                  {[['all','All Time'],['today','Today'],['week','This Week'],['month','This Month']].map(([val,lbl])=>(
                    <button key={val} onClick={()=>setOrderDateFilter(val)} style={{ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:orderDateFilter===val?G.blue:'#F3F4F6', color:orderDateFilter===val?G.white:G.muted }}>{lbl}</button>
                  ))}
                </div>
                <span style={{ marginLeft:'auto', fontSize:12, color:G.muted, fontWeight:500 }}>
                  {filteredOrders.length} of {orders.length} orders
                </span>
              </div>
            </div>

            {/* FIX #2: single orders list using filteredOrders */}
            {filteredOrders.length === 0 && (
              <div style={{ textAlign:'center', padding:60, background:G.white, borderRadius:14, color:G.muted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                <p style={{ fontWeight:600, color:G.text, margin:'0 0 4px' }}>No orders found</p>
                <p style={{ fontSize:13 }}>Try a different search or filter</p>
                <button onClick={()=>{ setOrderSearch(''); setInvoiceSearch(''); setOrderStatusFilter('all'); setOrderPayFilter('all'); setOrderDateFilter('all'); setOrderBranchFilter('all') }}
                  style={{ marginTop:12, background:G.green, color:G.white, border:'none', borderRadius:8, padding:'8px 20px', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                  Clear Filters
                </button>
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filteredOrders.map((o)=>(
              <div key={o.id} style={{ background:G.white, borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden', border:`1px solid ${G.border}` }}>
                <div style={{ display:'flex' }}>
                  <div style={{ width:220, flexShrink:0, background:'#F9FAF7', borderRight:`1px solid ${G.border}`, padding:'14px 16px' }}>
                    <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px' }}>Items Ordered</p>
                    {(o.order_items||[]).length===0 && <p style={{ margin:0, fontSize:12, color:G.muted }}>No items found</p>}
                    {(o.order_items||[]).map((item,idx)=>(
                      <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'8px 10px', background:G.white, borderRadius:8, border:`1px solid ${G.border}` }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:G.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🌾</div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ margin:'0 0 1px', fontSize:12, fontWeight:700, color:G.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</p>
                          <p style={{ margin:0, fontSize:11, color:G.muted }}>{item.weight_kg}kg × {item.quantity} = <strong style={{ color:G.green }}>₹{item.quantity*item.price_per_unit}</strong></p>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop:8, padding:'8px 10px', background:G.greenLight, borderRadius:8, display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:12, fontWeight:600, color:G.greenDark }}>Total</span>
                      <span style={{ fontSize:14, fontWeight:800, color:G.green }}>{fmtRs(o.total_amount)}</span>
                    </div>
                  </div>
                  <div style={{ flex:1, padding:'14px 16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:15, color:G.green }}>{o.order_number}</p>
                        <p style={{ margin:0, fontSize:12, color:G.muted }}>{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} · {new Date(o.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
                      </div>
                      <Badge status={o.status} />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                      <div><p style={{ margin:'0 0 2px', color:G.muted, fontSize:10, fontWeight:600, textTransform:'uppercase' }}>Customer</p><p style={{ margin:0, fontWeight:600, fontSize:13, color:G.text }}>{o.customer_name||'—'}</p></div>
                      <div>
                        <p style={{ margin:'0 0 2px', color:G.muted, fontSize:10, fontWeight:600, textTransform:'uppercase' }}>Payment</p>
                        <p style={{ margin:0, fontWeight:600, fontSize:13, color:G.text, textTransform:'uppercase' }}>{o.payment_method||'—'}</p>
                        <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:10,
                          background: o.payment_status==='paid' ? G.greenLight : o.payment_method==='cod' ? G.amberLight : G.redLight,
                          color: o.payment_status==='paid' ? G.green : o.payment_method==='cod' ? G.amber : G.red }}>
                          {o.payment_status==='paid' ? '✅ Paid' : o.payment_method==='cod' ? '💵 COD Pending' : '⏳ Unpaid'}
                        </span>
                      </div>
                      <div style={{ gridColumn:'1/-1' }}><p style={{ margin:'0 0 2px', color:G.muted, fontSize:10, fontWeight:600, textTransform:'uppercase' }}>Address</p><p style={{ margin:0, fontSize:13, color:G.text }}>{o.delivery_address||'—'}</p></div>
                      {o.notes && (
                        <div style={{ gridColumn:'1/-1' }}>
                          <p style={{ margin:'0 0 2px', color:G.muted, fontSize:10, fontWeight:600, textTransform:'uppercase' }}>Payment Reference</p>
                          <p style={{ margin:0, fontSize:13, color:G.green, fontWeight:600 }}>🧾 {o.notes}</p>
                        </div>
                      )}
                    </div>
                    <OrderActions o={o} />
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>}

          {/* INVENTORY */}
          {page==='inventory' && <>
            <div style={{ background:G.white, borderRadius:14, padding:'14px 16px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, fontWeight:600, color:G.muted, padding:'5px 4px' }}>Branch:</span>
                {['all','Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu'].map(b=>(
                  <button key={b} onClick={()=>setStockBranchFilter(b)} style={{ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:stockBranchFilter===b?G.green:'#F3F4F6', color:stockBranchFilter===b?G.white:G.muted }}>
                    {b==='all'?'All Branches':b}
                  </button>
                ))}
              </div>
            </div>
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

          {page==='vendors'     && <VendorPage />}
          {page==='batches'     && <BatchPage />}
          {page==='pickup'      && <PickupQueue />}
          {page==='bulk'        && <BulkOrderForm />}
          {page==='home'        && <HomePage />}
          {page==='suppliers'   && <SupplierPage />}
          {page==='branchstock' && <BranchStockPage />}

          {/* BRANCHES */}
          {page==='branches' && <>
            <div style={{ marginBottom:20 }}>
              <h2 style={{ margin:'0 0 6px', fontSize:18, fontWeight:700, color:G.greenDark }}>🏪 Our Branches</h2>
              <p style={{ margin:0, fontSize:13, color:G.muted }}>Green Village Rice locations across Andhra Pradesh & Telangana</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:24 }}>
              {[
                { city:'Hyderabad', state:'Telangana', icon:'🏙️', address:'Kukatpally, Hyderabad - 500072', phone:'+91 98765 43210', status:'Main Branch', color:G.green, timings:'Mon-Sat: 8AM - 8PM' },
                { city:'Vijayawada', state:'Andhra Pradesh', icon:'🌉', address:'MG Road, Vijayawada - 520010', phone:'+91 98765 43211', status:'Active', color:G.blue, timings:'Mon-Sat: 9AM - 7PM' },
                { city:'Kadapa', state:'Andhra Pradesh', icon:'🏛️', address:'Gandhi Nagar, Kadapa - 516001', phone:'+91 98765 43212', status:'Active', color:G.blue, timings:'Mon-Sat: 9AM - 7PM' },
                { city:'Anantapur', state:'Andhra Pradesh', icon:'🌾', address:'Subash Road, Anantapur - 515001', phone:'+91 98765 43213', status:'Active', color:G.blue, timings:'Mon-Sat: 9AM - 7PM' },
                { city:'Tadipatri', state:'Andhra Pradesh', icon:'🏘️', address:'Main Bazaar, Tadipatri - 515411', phone:'+91 98765 43214', status:'Active', color:G.green2, timings:'Mon-Sat: 9AM - 6PM' },
                { city:'Jammalamadugu', state:'Andhra Pradesh', icon:'🌿', address:'Bus Stand Road, Jammalamadugu - 516434', phone:'+91 98765 43215', status:'Active', color:G.green2, timings:'Mon-Sat: 9AM - 6PM' },
              ].map((b)=>(
                <div key={b.city} style={{ background:G.white, borderRadius:16, padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderTop:`4px solid ${b.color}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:b.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{b.icon}</div>
                      <div>
                        <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:15, color:G.text }}>{b.city}</p>
                        <p style={{ margin:0, fontSize:11, color:G.muted }}>{b.state}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:b.color+'18', color:b.color }}>{b.status}</span>
                  </div>
                  <div style={{ display:'grid', gap:8, fontSize:13 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}><span style={{ fontSize:14, flexShrink:0 }}>📍</span><span style={{ color:G.muted, lineHeight:1.5 }}>{b.address}</span></div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}><span style={{ fontSize:14 }}>📞</span><span style={{ color:G.text, fontWeight:500 }}>{b.phone}</span></div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}><span style={{ fontSize:14 }}>🕐</span><span style={{ color:G.muted }}>{b.timings}</span></div>
                  </div>
                  <div style={{ marginTop:14, display:'flex', gap:8 }}>
                    <a href={`https://maps.google.com/?q=${b.city}+Green+Village+Rice`} target="_blank" rel="noreferrer"
                      style={{ flex:1, padding:'8px', background:G.blueLight, border:'none', borderRadius:8, fontSize:12, fontWeight:600, color:G.blue, textAlign:'center', textDecoration:'none' }}>
                      🗺 Navigate
                    </a>
                    <a href={`tel:${b.phone.replace(/ /g,'')}`}
                      style={{ flex:1, padding:'8px', background:G.greenLight, border:'none', borderRadius:8, fontSize:12, fontWeight:600, color:G.green, textAlign:'center', textDecoration:'none' }}>
                      📞 Call
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:G.white, borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ margin:'0 0 16px', fontSize:13, fontWeight:700 }}>Branch Network Summary</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
                {[
                  { label:'Total Branches', value:'6', icon:'🏪', color:G.green },
                  { label:'Telangana', value:'1', icon:'🏙️', color:G.blue },
                  { label:'Andhra Pradesh', value:'5', icon:'🌾', color:G.green2 },
                  { label:'Cities Covered', value:'6', icon:'📍', color:G.amber },
                ].map((s,i)=>(
                  <div key={i} style={{ background:'#F9FAF7', borderRadius:12, padding:'14px 16px', borderLeft:`3px solid ${s.color}` }}>
                    <p style={{ margin:'0 0 4px', fontSize:11, color:G.muted }}>{s.label}</p>
                    <p style={{ margin:0, fontSize:24, fontWeight:800, color:s.color }}>{s.value}</p>
                    <span style={{ fontSize:18 }}>{s.icon}</span>
                  </div>
                ))}
              </div>
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

          {page==='admin' && <AdminPage />}

          </>}
        </main>
      </div>
    </div>
  )
}

function Table({ headers, children }) {
  return (
    <div className='table-scroll' style={{ overflowX:'auto' }}>
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

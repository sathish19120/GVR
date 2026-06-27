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
  { key:'inventory',   icon:'📦', label:'Stock' },
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
  { key:'walkin',      icon:'🧾', label:'Walk-in Billing' }, // FIX #6: now reachable from sidebar
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
        branch: 'Hyderabad', order_type: 'delivery',
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
  // Sidebar is kept permanently open so the left navigation column stays fixed
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
  const [orderBranchFilter, setOrderBranchFilter] = useState('all')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderPayFilter, setOrderPayFilter] = useState('all')
  const [orderDateFilter, setOrderDateFilter] = useState('all')
  const [orderView, setOrderView] = useState('active')
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [ordersCompact, setOrdersCompact] = useState(true)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [stockBranchFilter, setStockBranchFilter] = useState('all')
  const [showStock, setShowStock] = useState(null)
  // Orders V2 server-side pagination state
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotalCount, setOrdersTotalCount] = useState(0)
  const [serverOrders, setServerOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderQueueCounts, setOrderQueueCounts] = useState({ active:0, pending:0, payment:0, confirmed:0, packed:0, dispatched:0, history:0 })
  const ORDERS_PER_PAGE = 25
  const statsPendingRef = useRef(0)

  // FIX #10: reset to page 1 when any filter changes
  useEffect(() => { setOrdersPage(1); setSelectedOrderIds([]) }, [orderSearch, invoiceSearch, orderStatusFilter, orderPayFilter, orderBranchFilter, orderDateFilter, orderView])
  useEffect(() => { statsPendingRef.current = stats.pending }, [stats.pending])

  useEffect(() => { load() }, [filter])

  // Load only one server-side page when Orders screen is open.
  useEffect(() => {
    if (page !== 'orders') return
    loadOrdersPage()
    loadOrderQueueCounts()
  }, [page, ordersPage, orderSearch, invoiceSearch, orderStatusFilter, orderPayFilter, orderBranchFilter, orderDateFilter, orderView])

  // Auto refresh Orders page without loading thousands of rows.
  useEffect(() => {
    if (!autoRefresh || page !== 'orders') return
    const interval = setInterval(async () => {
      try {
        await Promise.all([loadOrdersPage({ silent:true }), loadOrderQueueCounts()])
      } catch(e) {
        console.error('Orders auto refresh error:', e)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, page, ordersPage, orderSearch, invoiceSearch, orderStatusFilter, orderPayFilter, orderBranchFilter, orderDateFilter, orderView])

  async function load() {
    setLoading(true)
    const [oRes, pRes, uRes, mRes] = await Promise.all([
      supabase.from('orders').select('id,order_number,customer_name,customer_id,delivery_address,total_amount,status,payment_status,payment_method,order_type,branch,pickup_branch,pickup_time,notes,created_at,stock_deducted,stock_deducted_at,stock_deducted_note,order_items(quantity,price_per_unit,product_id,name,weight_kg)').order('created_at',{ascending:false}).limit(500),
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

  // Stock is now handled by Supabase triggers:
  // - order_items insert automatically deducts branch_stock
  // - orders status changed to cancelled automatically restores branch_stock
  // Keep Dashboard status changes simple to prevent double deduction/restoration.
  async function updateOrderStatus(id, status) {
    const order = serverOrders.find(o => o.id === id) || orders.find(o => o.id === id)

    if (!order) {
      alert('Order not found.')
      return
    }

    if (status === 'cancelled' && !window.confirm('Cancel this order?')) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      await refreshOrdersAfterChange()
    } catch (error) {
      console.error('Order status update failed:', error)
      alert(error.message || 'Unable to update order status.')
    }
  }

  const fmtRs = v => `₹${Number(v).toLocaleString('en-IN')}`


  function getOrderBranch(order) {
    return order?.pickup_branch || order?.branch || 'Hyderabad'
  }

  const ACTIVE_STATUSES = ['pending','confirmed','packed','dispatched']
  const HISTORY_STATUSES = ['delivered','cancelled']
  const ORDER_QUEUE_TABS = [
    { key:'active',     label:'Active',        icon:'⚡', statuses:ACTIVE_STATUSES },
    { key:'pending',    label:'New',           icon:'🆕', statuses:['pending'] },
    { key:'payment',    label:'Payment Check', icon:'💳' },
    { key:'confirmed',  label:'Confirmed',     icon:'✅', statuses:['confirmed'] },
    { key:'packed',     label:'Packed',        icon:'📦', statuses:['packed'] },
    { key:'dispatched', label:'Dispatched',    icon:'🚚', statuses:['dispatched'] },
    { key:'history',    label:'History',       icon:'🗄️', statuses:HISTORY_STATUSES },
  ]

  function escapeOrderSearch(value) {
    return String(value || '').trim().replace(/[,%]/g, ' ')
  }

  function getOrderDateRange(dateFilter) {
    const now = new Date()
    if (dateFilter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      return { start:start.toISOString(), end:end.toISOString() }
    }
    if (dateFilter === 'week') {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      return { start:start.toISOString(), end:null }
    }
    if (dateFilter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return { start:start.toISOString(), end:end.toISOString() }
    }
    return { start:null, end:null }
  }

  function applyOrderQueueFilter(query, view = orderView) {
    if (view === 'active') return query.in('status', ACTIVE_STATUSES)
    if (view === 'history') return query.in('status', HISTORY_STATUSES)
    if (view === 'payment') return query.neq('payment_status', 'paid').neq('payment_method', 'cod')
    if (view && view !== 'all') return query.eq('status', view)
    return query
  }

  function applyOrderServerFilters(query, options = {}) {
    const view = options.view ?? orderView
    const includeStatusFilter = options.includeStatusFilter !== false

    query = applyOrderQueueFilter(query, view)

    const searchText = escapeOrderSearch(orderSearch)
    if (searchText) {
      query = query.or(`order_number.ilike.%${searchText}%,customer_name.ilike.%${searchText}%,delivery_address.ilike.%${searchText}%`)
    }

    const invoiceText = escapeOrderSearch(invoiceSearch)
    if (invoiceText) query = query.ilike('order_number', `%${invoiceText}%`)

    if (includeStatusFilter && orderStatusFilter !== 'all') query = query.eq('status', orderStatusFilter)

    if (orderPayFilter === 'unpaid') {
      query = query.neq('payment_status', 'paid').neq('payment_method', 'cod')
    } else if (orderPayFilter !== 'all') {
      query = query.eq('payment_method', orderPayFilter)
    }

    if (orderBranchFilter !== 'all') {
      query = query.or(`branch.eq.${orderBranchFilter},pickup_branch.eq.${orderBranchFilter}`)
    }

    const { start, end } = getOrderDateRange(orderDateFilter)
    if (start) query = query.gte('created_at', start)
    if (end) query = query.lt('created_at', end)

    return query
  }

  async function loadOrdersPage(options = {}) {
    if (!options.silent) setOrdersLoading(true)
    try {
      const from = (ordersPage - 1) * ORDERS_PER_PAGE
      const to = from + ORDERS_PER_PAGE - 1

      let query = supabase
        .from('orders')
        .select('id,order_number,customer_name,customer_id,delivery_address,total_amount,status,payment_status,payment_method,order_type,branch,pickup_branch,pickup_time,notes,created_at,stock_deducted,stock_deducted_at,stock_deducted_note,order_items(quantity,price_per_unit,product_id,name,weight_kg)', { count:'exact' })
        .order('created_at', { ascending:false })
        .range(from, to)

      query = applyOrderServerFilters(query)

      const { data, error, count } = await query
      if (error) throw error

      setServerOrders(data || [])
      setOrdersTotalCount(count || 0)
      setLastRefresh(new Date())

      const maxPage = Math.max(1, Math.ceil((count || 0) / ORDERS_PER_PAGE))
      if (ordersPage > maxPage) setOrdersPage(maxPage)
    } catch (error) {
      console.error('Server-side order load failed:', error)
    } finally {
      if (!options.silent) setOrdersLoading(false)
    }
  }

  async function loadOrderQueueCounts() {
    try {
      const nextCounts = {}

      await Promise.all(ORDER_QUEUE_TABS.map(async tab => {
        let query = supabase
          .from('orders')
          .select('id', { count:'exact', head:true })

        query = applyOrderServerFilters(query, { view:tab.key, includeStatusFilter:false })

        const { count, error } = await query
        if (error) throw error
        nextCounts[tab.key] = count || 0
      }))

      if (nextCounts.pending > statsPendingRef.current) {
        setNewOrderAlert(nextCounts.pending - statsPendingRef.current)
      }

      setOrderQueueCounts(nextCounts)
    } catch (error) {
      console.error('Order queue count load failed:', error)
    }
  }

  async function refreshOrdersAfterChange() {
    await Promise.all([loadOrdersPage(), loadOrderQueueCounts()])
    load()
  }

  function isPaymentPending(order) {
    const paymentStatus = order?.payment_status || 'pending'
    const method = order?.payment_method || ''
    return paymentStatus !== 'paid' && method !== 'cod'
  }

  function orderMatchesQueue(order, view) {
    if (view === 'all') return true
    if (view === 'active') return ACTIVE_STATUSES.includes(order.status)
    if (view === 'history') return HISTORY_STATUSES.includes(order.status)
    if (view === 'payment') return isPaymentPending(order)
    return order.status === view
  }

  // Orders V2 now loads filtered rows directly from Supabase.
  const filteredOrders = serverOrders

  const selectedOrders = filteredOrders.filter(o => selectedOrderIds.includes(o.id))

  function toggleOrderSelection(id) {
    setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleCurrentPageSelection() {
    const pageIds = paginatedOrders.map(o => o.id)
    setSelectedOrderIds(prev => {
      const allSelected = pageIds.length > 0 && pageIds.every(id => prev.includes(id))
      if (allSelected) return prev.filter(id => !pageIds.includes(id))
      return Array.from(new Set([...prev, ...pageIds]))
    })
  }

  async function bulkUpdateSelectedStatus(status) {
    if (!selectedOrderIds.length) return
    if (status === 'cancelled' && !window.confirm(`Cancel ${selectedOrderIds.length} selected order(s)?`)) return
    try {
      const { error } = await supabase.from('orders').update({ status }).in('id', selectedOrderIds)
      if (error) throw error
      setSelectedOrderIds([])
      await refreshOrdersAfterChange()
    } catch (e) {
      console.error('Bulk status update failed:', e)
      alert(e.message || 'Unable to update selected orders')
    }
  }

  async function bulkMarkSelectedPaid() {
    if (!selectedOrderIds.length) return
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status:'paid' })
        .in('id', selectedOrderIds)
      if (error) throw error
      setSelectedOrderIds([])
      await refreshOrdersAfterChange()
    } catch (e) {
      console.error('Bulk payment update failed:', e)
      alert(e.message || 'Unable to mark selected orders as paid')
    }
  }

  function bulkPrintInvoices() {
    selectedOrders.forEach(o => generateInvoice(o, o.order_items || []))
  }

  // FIX #9: export orders CSV — inline, no external dependency
  function handleExportOrders() {
    if (!filteredOrders.length) { alert('No orders to export'); return }
    const headers = ['Order Number','Date','Customer','Address','Items','Total','Status','Payment','Payment Status']
    const rows = filteredOrders.map(o => [
      o.order_number,
      o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '',
      o.customer_name || '',
      o.delivery_address || '',
      (o.order_items||[]).map(i=>`${i.name}x${i.quantity}`).join(' | '),
      Number(o.total_amount||0).toFixed(2),
      o.status || '',
      o.payment_method || '',
      o.payment_status || ''
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `GVR_Orders_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // FIX #9: export stock CSV — inline
  function handleExportStock() {
    const headers = ['Product','SKU','Weight(kg)','Price/Bag','Stock(Bags)','Low Stock Threshold','Status']
    const rows = products.map(p => [p.name, p.sku||'', p.weight_kg, p.price_per_bag, p.stock_bags||0, p.low_stock_threshold||50, p.active?'Active':'Inactive'])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `GVR_Stock_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Server-side pagination: Supabase already returned only this page.
  const totalOrderPages = Math.max(1, Math.ceil(ordersTotalCount / ORDERS_PER_PAGE))
  const paginatedOrders = filteredOrders
  const allCurrentPageSelected = paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id))
  function OrderActions({ o }) {
    return (
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {o.payment_status==='pending' && o.payment_method!=='cod' && (
          <button onClick={async()=>{ await supabase.from('orders').update({payment_status:'paid'}).eq('id',o.id); refreshOrdersAfterChange() }}
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
      {/* Overlay removed — not needed on web */}

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
                  { icon:'💰', title:'Fair Pricing', desc:'By cutting out wholesalers and retailers, we offer premium rice at transparent prices — Sona Masoori 1kg ₹68, Sona Masoori 5kg ₹320, Basmati 1kg ₹95, and Basmati 5kg ₹440.' },
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
                  {[['Sona Masoori 1kg','₹68'],['Sona Masoori 5kg','₹320'],['Basmati 1kg','₹95'],['Basmati 5kg','₹440']].map(([name,price])=>(
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
      <aside className="dash-sidebar open" style={{ width:220, minWidth:220, maxWidth:220, flexShrink:0, background:G.white, borderRight:`1px solid ${G.border}`, display:'flex', flexDirection:'column', transition:'none', position:'sticky', top:0, height:'100vh', overflow:'hidden', zIndex:50 }}>
        <div style={{ padding:'18px 18px', borderBottom:`1px solid ${G.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:G.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🌾</div>
          <div><p style={{ margin:0, fontSize:13, fontWeight:700, color:G.greenDark }}>Green Village</p><p style={{ margin:0, fontSize:10, color:G.green2, fontWeight:600 }}>Rice Admin</p></div>
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
              <button onClick={()=>setPage(item.key)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer', marginBottom:2, justifyContent:'flex-start', background:page===item.key?G.greenLight:'transparent', color:page===item.key?G.greenDark:G.muted, fontWeight:page===item.key?600:500, fontSize:13 }}>
                <span style={{ fontSize:17, flexShrink:0 }}>{item.icon}</span>
                {item.label}
              </button>
              
            </div>
          ))}
        </nav>
        <div style={{ padding:'8px 6px', borderTop:`1px solid ${G.border}`, flexShrink:0 }}>
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
          <div className="nav-item" style={{ position:'relative' }}>
            <button onClick={async()=>{ await signOut(); navigate('/login') }}
              style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'none', background:G.redLight, color:G.red, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'flex-start', gap:8, transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#FECACA'}
              onMouseLeave={e=>e.currentTarget.style.background=G.redLight}>
              <span style={{ fontSize:16, flexShrink:0 }}>↩</span>
              <span>Logout</span>
            </button>
            
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* TOPBAR */}
        <header className="dash-topbar" style={{ background:G.white, borderBottom:`1px solid ${G.border}`, height:58, padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button type="button" onClick={()=>setCollapsed(false)} title="Sidebar is fixed" style={{ background:'none', border:'none', cursor:'default', fontSize:18, color:G.muted, padding:4 }}>☰</button>
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
                  <button onClick={()=>{ loadOrdersPage(); loadOrderQueueCounts(); setNewOrderAlert(0) }} style={{ background:'#F3F4F6', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:600, cursor:'pointer', color:G.muted }}>↻ Refresh</button>
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

          {/* ORDERS V2 — queue board for high order volume */}
          {page==='orders' && <>
            <style>{`
              .orders-v2-table { width: 100%; border-collapse: collapse; font-size: 13px; }
              .orders-v2-table th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 800; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; background: #F9FAF7; }
              .orders-v2-table td { padding: 11px 12px; border-top: 1px solid #E5E7EB; vertical-align: middle; }
              .orders-v2-row:hover { background: #F9FAF7; }
              @media (max-width: 760px) {
                .orders-v2-table { display: none; }
                .orders-v2-mobile-list { display: flex !important; }
              }
            `}</style>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <div>
                <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:G.text }}>📋 Orders Queue</h2>
                <p style={{ margin:0, fontSize:12, color:G.muted }}>Active orders first. Delivered and cancelled orders stay in History.</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <button onClick={()=>{ loadOrdersPage(); loadOrderQueueCounts(); setNewOrderAlert(0) }} style={{ display:'flex', alignItems:'center', gap:6, background:G.white, border:`1px solid ${G.border}`, borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:700, cursor:'pointer', color:G.text, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  ↻ Refresh
                </button>
                <button onClick={()=>setOrdersCompact(v=>!v)} style={{ background:G.white, border:`1px solid ${G.border}`, borderRadius:10, padding:'9px 14px', fontSize:13, fontWeight:700, cursor:'pointer', color:G.blue }}>
                  {ordersCompact ? '▦ Compact' : '▤ Detailed'}
                </button>
                <button onClick={()=>setShowNewOrder(true)} style={{ background:G.green, color:G.white, border:'none', borderRadius:10, padding:'10px 18px', fontSize:14, fontWeight:800, cursor:'pointer' }}>+ New Order</button>
              </div>
            </div>

            {newOrderAlert > 0 && (
              <div style={{ background:G.amberLight, border:`1px solid ${G.amber}`, borderRadius:12, padding:'10px 16px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                <span style={{ color:G.amber, fontWeight:700, fontSize:13 }}>🔔 {newOrderAlert} new order{newOrderAlert > 1 ? 's' : ''} received.</span>
                <button onClick={()=>setNewOrderAlert(0)} style={{ background:'none', border:'none', cursor:'pointer', color:G.amber, fontSize:16 }}>✕</button>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(135px,1fr))', gap:10, marginBottom:14 }}>
              {ORDER_QUEUE_TABS.map(q => (
                <button key={q.key} onClick={()=>{ setOrderView(q.key); setOrderStatusFilter('all') }} style={{ textAlign:'left', background:orderView===q.key?G.green:G.white, color:orderView===q.key?G.white:G.text, border:`1px solid ${orderView===q.key?G.green:G.border}`, borderRadius:14, padding:'12px 14px', cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:18 }}>{q.icon}</span>
                    <span style={{ fontSize:20, fontWeight:900 }}>{orderQueueCounts[q.key] || 0}</span>
                  </div>
                  <p style={{ margin:0, fontSize:12, fontWeight:800 }}>{q.label}</p>
                </button>
              ))}
            </div>

            <div style={{ background:G.white, borderRadius:14, padding:'14px 16px', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'minmax(220px,1fr) 180px', gap:10, marginBottom:12 }}>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, color:G.muted }}>🔍</span>
                  <input type="text" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="Search order number, customer, address..." style={{ width:'100%', padding:'10px 36px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box', background:'#FAFAFA' }} />
                  {orderSearch && <button onClick={()=>setOrderSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:G.muted, fontSize:16 }}>✕</button>}
                </div>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:G.muted }}>🧾</span>
                  <input type="text" value={invoiceSearch} onChange={e=>setInvoiceSearch(e.target.value)} placeholder="GVR-XXXX" style={{ width:'100%', padding:'10px 10px 10px 34px', borderRadius:10, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', boxSizing:'border-box', background:'#FAFAFA' }} />
                </div>
              </div>

              <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:800, color:G.muted }}>Branch:</span>
                {['all','Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu'].map(b=>(
                  <button key={b} onClick={()=>setOrderBranchFilter(b)} style={{ padding:'5px 11px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:orderBranchFilter===b?'#7C3AED':'#F3F4F6', color:orderBranchFilter===b?G.white:G.muted }}>
                    {b==='all'?'All':b}
                  </button>
                ))}
                <div style={{ width:1, height:20, background:G.border, margin:'0 4px' }} />
                {[['all','All Pay'],['cod','COD'],['upi','UPI'],['wallet','Wallet'],['bank','Bank'],['unpaid','Payment Pending']].map(([val,lbl])=>(
                  <button key={val} onClick={()=>setOrderPayFilter(val)} style={{ padding:'5px 11px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:orderPayFilter===val?G.amber:'#F3F4F6', color:orderPayFilter===val?G.white:G.muted }}>{lbl}</button>
                ))}
                <div style={{ width:1, height:20, background:G.border, margin:'0 4px' }} />
                {[['all','All Time'],['today','Today'],['week','This Week'],['month','This Month']].map(([val,lbl])=>(
                  <button key={val} onClick={()=>setOrderDateFilter(val)} style={{ padding:'5px 11px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:orderDateFilter===val?G.blue:'#F3F4F6', color:orderDateFilter===val?G.white:G.muted }}>{lbl}</button>
                ))}
                <button onClick={handleExportOrders} style={{ marginLeft:'auto', padding:'5px 12px',borderRadius:20,border:`1px solid ${G.border}`,background:G.white,cursor:'pointer',fontSize:11,fontWeight:700,color:G.blue,display:'flex',alignItems:'center',gap:4 }}>
                  ⬇ Export CSV
                </button>
              </div>
            </div>

            {selectedOrderIds.length > 0 && (
              <div style={{ background:'#111827', color:G.white, borderRadius:14, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <strong style={{ fontSize:13 }}>{selectedOrderIds.length} selected</strong>
                <button onClick={()=>bulkUpdateSelectedStatus('confirmed')} style={{ background:G.green, color:G.white, border:'none', borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:800, cursor:'pointer' }}>Confirm</button>
                <button onClick={()=>bulkUpdateSelectedStatus('packed')} style={{ background:G.blue, color:G.white, border:'none', borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:800, cursor:'pointer' }}>Pack</button>
                <button onClick={()=>bulkUpdateSelectedStatus('dispatched')} style={{ background:'#7C3AED', color:G.white, border:'none', borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:800, cursor:'pointer' }}>Dispatch</button>
                <button onClick={()=>bulkUpdateSelectedStatus('delivered')} style={{ background:G.green2, color:G.white, border:'none', borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:800, cursor:'pointer' }}>Delivered</button>
                <button onClick={bulkMarkSelectedPaid} style={{ background:G.amber, color:G.white, border:'none', borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:800, cursor:'pointer' }}>Mark Paid</button>
                <button onClick={bulkPrintInvoices} style={{ background:G.blueLight, color:G.blue, border:'none', borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:800, cursor:'pointer' }}>Print Invoices</button>
                <button onClick={()=>bulkUpdateSelectedStatus('cancelled')} style={{ background:G.red, color:G.white, border:'none', borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:800, cursor:'pointer' }}>Cancel</button>
                <button onClick={()=>setSelectedOrderIds([])} style={{ marginLeft:'auto', background:'transparent', color:G.white, border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:800, cursor:'pointer' }}>Clear</button>
              </div>
            )}

            <div style={{ background:G.white, borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden', border:`1px solid ${G.border}` }}>
              <div style={{ padding:'10px 14px', borderBottom:`1px solid ${G.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <p style={{ margin:0, fontSize:13, fontWeight:800, color:G.text }}>{ordersLoading ? 'Loading orders…' : `${ordersTotalCount} order${ordersTotalCount===1?'':'s'} in ${ORDER_QUEUE_TABS.find(q=>q.key===orderView)?.label || 'All'}`}</p>
                <p style={{ margin:0, fontSize:11, color:G.muted }}>Last updated: {lastRefresh.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</p>
              </div>
              {filteredOrders.length === 0 ? (
                <div style={{ textAlign:'center', padding:60, color:G.muted }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                  <p style={{ fontWeight:700, color:G.text, margin:'0 0 4px' }}>No orders found</p>
                  <button onClick={()=>{ setOrderSearch(''); setInvoiceSearch(''); setOrderStatusFilter('all'); setOrderPayFilter('all'); setOrderDateFilter('all'); setOrderBranchFilter('all'); setOrderView('active') }} style={{ marginTop:12, background:G.green, color:G.white, border:'none', borderRadius:8, padding:'8px 20px', fontWeight:700, cursor:'pointer', fontSize:13 }}>Clear Filters</button>
                </div>
              ) : (
                <>
                  <div style={{ overflowX:'auto' }}>
                    <table className="orders-v2-table">
                      <thead>
                        <tr>
                          <th><input type="checkbox" checked={allCurrentPageSelected} onChange={toggleCurrentPageSelection} /></th>
                          <th>Order</th>
                          <th>Customer</th>
                          <th>Branch</th>
                          <th>Items</th>
                          <th>Amount</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOrders.map(o => (
                          <tr key={o.id} className="orders-v2-row">
                            <td><input type="checkbox" checked={selectedOrderIds.includes(o.id)} onChange={()=>toggleOrderSelection(o.id)} /></td>
                            <td style={{ whiteSpace:'nowrap' }}>
                              <p style={{ margin:'0 0 3px', fontWeight:900, color:G.green }}>{o.order_number}</p>
                              <p style={{ margin:0, fontSize:11, color:G.muted }}>{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · {new Date(o.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
                            </td>
                            <td><p style={{ margin:0, fontWeight:700 }}>{o.customer_name || '—'}</p><p style={{ margin:0, fontSize:11, color:G.muted, maxWidth:170, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.delivery_address || '—'}</p></td>
                            <td style={{ fontWeight:700, color:G.blue }}>{getOrderBranch(o)}</td>
                            <td style={{ maxWidth:210 }}>{(o.order_items||[]).map(i => <span key={`${o.id}-${i.product_id}-${i.name}`} style={{ display:'inline-block', margin:'0 4px 4px 0', fontSize:11, padding:'3px 8px', borderRadius:20, background:G.greenLight, color:G.greenDark, fontWeight:700 }}>{i.name} × {i.quantity}</span>)}</td>
                            <td style={{ fontWeight:900, color:G.green }}>{fmtRs(o.total_amount)}</td>
                            <td>
                              <p style={{ margin:'0 0 4px', fontSize:12, fontWeight:800, textTransform:'uppercase' }}>{o.payment_method || '—'}</p>
                              <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:10, background:o.payment_status==='paid'?G.greenLight:isPaymentPending(o)?G.redLight:G.amberLight, color:o.payment_status==='paid'?G.green:isPaymentPending(o)?G.red:G.amber }}>
                                {o.payment_status==='paid'?'Paid':isPaymentPending(o)?'Verify':'Pending'}
                              </span>
                            </td>
                            <td><Badge status={o.status} /></td>
                            <td><OrderActions o={o} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="orders-v2-mobile-list" style={{ display:'none', flexDirection:'column', gap:10, padding:12 }}>
                    {paginatedOrders.map(o => (
                      <div key={o.id} style={{ border:`1px solid ${G.border}`, borderRadius:14, padding:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', gap:10, marginBottom:8 }}>
                          <div style={{ display:'flex', gap:8 }}>
                            <input type="checkbox" checked={selectedOrderIds.includes(o.id)} onChange={()=>toggleOrderSelection(o.id)} />
                            <div><p style={{ margin:'0 0 2px', fontWeight:900, color:G.green }}>{o.order_number}</p><p style={{ margin:0, fontSize:11, color:G.muted }}>{new Date(o.created_at).toLocaleString('en-IN')}</p></div>
                          </div>
                          <Badge status={o.status} />
                        </div>
                        <p style={{ margin:'0 0 4px', fontWeight:800 }}>{o.customer_name || '—'} · {fmtRs(o.total_amount)}</p>
                        <p style={{ margin:'0 0 8px', fontSize:12, color:G.muted }}>{getOrderBranch(o)} · {(o.payment_method||'—').toUpperCase()} · {o.payment_status}</p>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                          {(o.order_items||[]).map(i => <span key={`${o.id}-${i.product_id}-${i.name}`} style={{ fontSize:11, padding:'3px 8px', borderRadius:20, background:G.greenLight, color:G.greenDark, fontWeight:700 }}>{i.name} × {i.quantity}</span>)}
                        </div>
                        <OrderActions o={o} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {totalOrderPages > 1 && (
              <div style={{ display:'flex',justifyContent:'center',alignItems:'center',gap:8,padding:'20px 0',flexWrap:'wrap' }}>
                <button onClick={()=>setOrdersPage(1)} disabled={ordersPage===1} style={{ padding:'6px 12px',borderRadius:8,border:`1px solid ${G.border}`,background:ordersPage===1?'#F3F4F6':G.white,cursor:ordersPage===1?'not-allowed':'pointer',fontSize:12,color:ordersPage===1?G.muted:G.text }}>«</button>
                <button onClick={()=>setOrdersPage(p=>Math.max(1,p-1))} disabled={ordersPage===1} style={{ padding:'6px 12px',borderRadius:8,border:`1px solid ${G.border}`,background:ordersPage===1?'#F3F4F6':G.white,cursor:ordersPage===1?'not-allowed':'pointer',fontSize:12,color:ordersPage===1?G.muted:G.text }}>‹ Prev</button>
                {Array.from({length:Math.min(5,totalOrderPages)},(_,i)=>{
                  let p = i+1
                  if(totalOrderPages>5){
                    if(ordersPage<=3) p=i+1
                    else if(ordersPage>=totalOrderPages-2) p=totalOrderPages-4+i
                    else p=ordersPage-2+i
                  }
                  return <button key={p} onClick={()=>setOrdersPage(p)} style={{ padding:'6px 12px',borderRadius:8,border:`1px solid ${ordersPage===p?G.green:G.border}`,background:ordersPage===p?G.green:G.white,cursor:'pointer',fontSize:12,fontWeight:ordersPage===p?800:500,color:ordersPage===p?G.white:G.text }}>{p}</button>
                })}
                <button onClick={()=>setOrdersPage(p=>Math.min(totalOrderPages,p+1))} disabled={ordersPage===totalOrderPages} style={{ padding:'6px 12px',borderRadius:8,border:`1px solid ${G.border}`,background:ordersPage===totalOrderPages?'#F3F4F6':G.white,cursor:ordersPage===totalOrderPages?'not-allowed':'pointer',fontSize:12,color:ordersPage===totalOrderPages?G.muted:G.text }}>Next ›</button>
                <button onClick={()=>setOrdersPage(totalOrderPages)} disabled={ordersPage===totalOrderPages} style={{ padding:'6px 12px',borderRadius:8,border:`1px solid ${G.border}`,background:ordersPage===totalOrderPages?'#F3F4F6':G.white,cursor:ordersPage===totalOrderPages?'not-allowed':'pointer',fontSize:12,color:ordersPage===totalOrderPages?G.muted:G.text }}>»</button>
                <span style={{ fontSize:12,color:G.muted }}>Page {ordersPage} of {totalOrderPages} · showing {paginatedOrders.length} of {ordersTotalCount}</span>
              </div>
            )}
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
              {/* FIX #9: export stock */}
              <button onClick={handleExportStock} style={{ marginLeft:'auto',padding:'6px 14px',borderRadius:20,border:`1px solid ${G.border}`,background:G.white,cursor:'pointer',fontSize:11,fontWeight:600,color:G.blue }}>
                ⬇ Export CSV
              </button>
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
          {/* FIX #6: WalkInBilling now receives branch prop from profile */}
          {page==='walkin'      && <WalkInBilling branch={profile?.branch || 'Hyderabad'} />}

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

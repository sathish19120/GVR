import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'

const G = {
  green: '#3B6D11', greenDark: '#27500A', greenLight: '#EAF3DE',
  green2: '#639922', amber: '#BA7517', amberLight: '#FAEEDA',
  blue: '#1E5FA5', blueLight: '#E6F1FB', red: '#DC2626', redLight: '#FEE2E2',
  text: '#111827', muted: '#6B7280', border: '#E5E7EB',
  surface: '#F4F6F3', white: '#fff',
}

const SIDEBAR_ITEMS = [
  { key: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { key: 'orders',    icon: '📋', label: 'Orders' },
  { key: 'inventory', icon: '📦', label: 'Inventory' },
  { key: 'analytics', icon: '📊', label: 'Analytics' },
  { key: 'users',     icon: '👥', label: 'Users' },
]

const TOP_LINKS = ['Where We Work', 'What We Do', 'About']

function Badge({ status }) {
  const map = {
    pending:   [G.amber,   G.amberLight],
    confirmed: [G.blue,    G.blueLight],
    packed:    [G.green2,  G.greenLight],
    dispatched:['#7C3AED', '#EDE9FE'],
    delivered: [G.green,   G.greenLight],
    cancelled: [G.red,     G.redLight],
  }
  const [color, bg] = map[status] || [G.muted, '#F3F4F6']
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: bg, color }}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  )
}

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background: G.white, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: G.muted, fontWeight: 500 }}>{label}</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color }}>{value}</p>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          {icon}
        </div>
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
  const [orders, setOrders]       = useState([])
  const [products, setProducts]   = useState([])
  const [users, setUsers]         = useState([])
  const [chart, setChart]         = useState([])
  const [stats, setStats]         = useState({ revenue: 0, orders: 0, bags: 0, pending: 0, lowStock: 0, customers: 0 })
  const [loading, setLoading]     = useState(true)

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    const [oRes, pRes, uRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(quantity, price_per_unit)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('weight_kg'),
      supabase.from('profiles').select('*').eq('role', 'customer'),
    ])
    const o = oRes.data || []
    const p = pRes.data || []
    const u = uRes.data || []

    const revenue = o.filter(x => x.payment_status === 'paid').reduce((s, x) => s + Number(x.total_amount || 0), 0)
    const bags    = o.flatMap(x => x.order_items || []).reduce((s, x) => s + (x.quantity || 0), 0)

    setStats({
      revenue, orders: o.length, bags,
      pending:   o.filter(x => x.status === 'pending').length,
      lowStock:  p.filter(x => x.stock_bags <= x.low_stock_threshold).length,
      customers: u.length,
    })
    setOrders(o)
    setProducts(p)
    setUsers(u)
    setChart(buildChart(o, filter))
    setLoading(false)
  }

  function buildChart(o, f) {
    const now = new Date()
    const keys = [], labels = []
    if (f === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i)
        keys.push(d.toISOString().split('T')[0])
        labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }))
      }
    } else if (f === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
        labels.push(d.toLocaleDateString('en-IN', { month: 'short' }))
      }
    } else {
      for (let i = 3; i >= 0; i--) {
        keys.push(String(now.getFullYear() - i))
        labels.push(String(now.getFullYear() - i))
      }
    }
    return keys.map((k, i) => ({
      name: labels[i],
      revenue: o.filter(x => x.created_at?.startsWith(k)).reduce((s, x) => s + Number(x.total_amount || 0), 0),
      orders:  o.filter(x => x.created_at?.startsWith(k)).length,
    }))
  }

  const handleLogout = async () => { await signOut(); navigate('/login') }

  const fmtRs = v => `₹${Number(v).toLocaleString('en-IN')}`

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: G.surface, fontFamily: "'Inter', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: collapsed ? 60 : 220, flexShrink: 0, background: G.white,
        borderRight: `1px solid ${G.border}`, display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '18px 10px' : '18px 18px', borderBottom: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: G.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🌾</div>
          {!collapsed && (
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: G.greenDark }}>Green Village</p>
              <p style={{ margin: 0, fontSize: 10, color: G.green2, fontWeight: 600 }}>Rice Admin</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 6px' }}>
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 10, padding: collapsed ? '10px' : '10px 12px',
              borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 2,
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: page === item.key ? G.greenLight : 'transparent',
              color: page === item.key ? G.greenDark : G.muted,
              fontWeight: page === item.key ? 600 : 500, fontSize: 13,
            }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 6px', borderTop: `1px solid ${G.border}` }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: G.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: G.greenDark, flexShrink: 0 }}>
                {profile?.full_name?.[0] || profile?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: G.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || profile?.username || 'Admin'}</p>
                <p style={{ margin: 0, fontSize: 10, color: G.muted }}>{profile?.role || 'superadmin'}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', padding: collapsed ? '8px' : '8px 12px', borderRadius: 10,
            border: 'none', background: 'transparent', color: G.red, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 6,
          }}>
            <span style={{ fontSize: 15 }}>↩</span>{!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* TOP BAR */}
        <header style={{
          background: G.white, borderBottom: `1px solid ${G.border}`,
          height: 58, padding: '0 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setCollapsed(!collapsed)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 18, color: G.muted, padding: 4, lineHeight: 1
            }}>☰</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: G.text }}>
              {SIDEBAR_ITEMS.find(s => s.key === page)?.label || 'Dashboard'}
            </span>
          </div>

          {/* Center — nav links */}
          <div style={{ display: 'flex', gap: 2 }}>
            {TOP_LINKS.map(l => (
              <button key={l} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: G.green, transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = G.greenLight}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >{l}</button>
            ))}
          </div>

          {/* Right — filter */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['daily', 'monthly', 'yearly'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: filter === f ? G.green : '#F3F4F6',
                color: filter === f ? '#fff' : G.muted,
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {loading
            ? <div style={{ textAlign: 'center', padding: 80, color: G.muted }}>Loading...</div>
            : <>

            {/* ── DASHBOARD ── */}
            {page === 'dashboard' && <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
                <StatCard label="Revenue" value={fmtRs(stats.revenue)} icon="💰" color={G.green} bg={G.greenLight} />
                <StatCard label="Orders" value={stats.orders} icon="📋" color={G.blue} bg={G.blueLight} />
                <StatCard label="Bags Sold" value={stats.bags} icon="🌾" color={G.green2} bg={G.greenLight} />
                <StatCard label="Pending" value={stats.pending} icon="⏳" color={G.amber} bg={G.amberLight} />
                <StatCard label="Low Stock" value={stats.lowStock} icon="⚠️" color={G.red} bg={G.redLight} />
                <StatCard label="Customers" value={stats.customers} icon="👥" color="#7C3AED" bg="#EDE9FE" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
                <div style={{ background: G.white, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: G.text }}>Revenue — {filter}</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chart} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
                      <Tooltip formatter={v => [fmtRs(v), 'Revenue']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="revenue" radius={[6,6,0,0]}>
                        {chart.map((_, i) => <Cell key={i} fill={i === chart.length-1 ? G.green : G.green2} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: G.white, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: G.text }}>Orders — {filter}</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="orders" stroke={G.green} strokeWidth={2.5} dot={{ fill: G.green, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: G.white, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: G.text }}>Recent Orders</p>
                <Table headers={['Order #','Amount','Method','Status','Date']}>
                  {orders.slice(0,8).map((o,i) => (
                    <tr key={o.id} style={{ borderTop: `1px solid ${G.border}`, background: i%2?'#FAFAFA':G.white }}>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: G.green }}>{o.order_number}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600 }}>{fmtRs(o.total_amount)}</td>
                      <td style={{ padding: '11px 14px', color: G.muted, fontSize: 11, textTransform: 'uppercase' }}>{o.payment_method || '—'}</td>
                      <td style={{ padding: '11px 14px' }}><Badge status={o.status} /></td>
                      <td style={{ padding: '11px 14px', color: G.muted, fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: G.muted }}>No orders yet</td></tr>}
                </Table>
              </div>
            </>}

            {/* ── ORDERS ── */}
            {page === 'orders' && <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard label="Total Orders" value={stats.orders} icon="📋" color={G.blue} bg={G.blueLight} />
                <StatCard label="Pending" value={stats.pending} icon="⏳" color={G.amber} bg={G.amberLight} />
                <StatCard label="Revenue" value={fmtRs(stats.revenue)} icon="💰" color={G.green} bg={G.greenLight} />
              </div>
              <div style={{ background: G.white, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: G.text }}>All Orders</p>
                <Table headers={['Order #','Customer','Amount','Method','Status','Date']}>
                  {orders.map((o,i) => (
                    <tr key={o.id} style={{ borderTop: `1px solid ${G.border}`, background: i%2?'#FAFAFA':G.white }}>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: G.green }}>{o.order_number}</td>
                      <td style={{ padding: '11px 14px', color: G.text }}>{o.customer_name || '—'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600 }}>{fmtRs(o.total_amount)}</td>
                      <td style={{ padding: '11px 14px', color: G.muted, fontSize: 11, textTransform: 'uppercase' }}>{o.payment_method || '—'}</td>
                      <td style={{ padding: '11px 14px' }}><Badge status={o.status} /></td>
                      <td style={{ padding: '11px 14px', color: G.muted, fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: G.muted }}>No orders yet</td></tr>}
                </Table>
              </div>
            </>}

            {/* ── INVENTORY ── */}
            {page === 'inventory' && <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
                {products.map(p => {
                  const isLow = p.stock_bags <= p.low_stock_threshold
                  const pct = Math.min(100, Math.round(p.stock_bags / Math.max(p.stock_bags, p.low_stock_threshold*3) * 100))
                  return (
                    <div key={p.id} style={{ background: G.white, borderRadius: 16, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `4px solid ${isLow?G.red:G.green}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: G.text }}>{p.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: G.muted }}>{p.sku} · {p.weight_kg}kg</p>
                        </div>
                        <span style={{ fontSize: 24 }}>🌾</span>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: isLow?G.red:G.green }}>
                        {p.stock_bags} <span style={{ fontSize: 13, color: G.muted, fontWeight: 400 }}>bags</span>
                      </p>
                      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isLow?G.red:G.green, borderRadius: 3 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: G.muted }}>
                        <span>{fmtRs(p.price_per_bag)}/bag</span>
                        {isLow && <span style={{ color: G.red, fontWeight: 600 }}>⚠ Low stock</span>}
                      </div>
                      {p.packing_date && <p style={{ margin: '8px 0 0', fontSize: 11, color: G.muted }}>📅 Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</p>}
                      {p.best_before_date && <p style={{ margin: '4px 0 0', fontSize: 11, color: G.muted }}>⏳ Best before: {new Date(p.best_before_date).toLocaleDateString('en-IN')}</p>}
                    </div>
                  )
                })}
                {products.length === 0 && <p style={{ color: G.muted }}>No products yet. Add them in Supabase → products table.</p>}
              </div>
            </>}

            {/* ── ANALYTICS ── */}
            {page === 'analytics' && <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard label="Total Revenue" value={fmtRs(stats.revenue)} icon="💰" color={G.green} bg={G.greenLight} />
                <StatCard label="Total Bags Sold" value={stats.bags} icon="🌾" color={G.green2} bg={G.greenLight} />
                <StatCard label="Total Customers" value={stats.customers} icon="👥" color="#7C3AED" bg="#EDE9FE" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
                <div style={{ background: G.white, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700 }}>Revenue ({filter})</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chart} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
                      <Tooltip formatter={v => [fmtRs(v), 'Revenue']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="revenue" fill={G.green} radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: G.white, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700 }}>Orders Trend ({filter})</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: G.muted }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="orders" stroke={G.green} strokeWidth={2.5} dot={{ fill: G.green, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ background: G.white, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700 }}>Product Performance</p>
                {products.map(p => {
                  const sold = orders.flatMap(o => (o.order_items||[]).filter(i => i.product_id === p.id)).reduce((s,i) => s + i.quantity, 0)
                  const rev  = orders.flatMap(o => (o.order_items||[]).filter(i => i.product_id === p.id)).reduce((s,i) => s + i.quantity * i.price_per_unit, 0)
                  const maxSold = Math.max(...products.map(pp => orders.flatMap(o => (o.order_items||[]).filter(i => i.product_id === pp.id)).reduce((s,i) => s + i.quantity, 0)), 1)
                  return (
                    <div key={p.id} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                        <span style={{ color: G.muted }}>{sold} bags · {fmtRs(rev)}</span>
                      </div>
                      <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round(sold/maxSold*100)}%`, background: G.green, borderRadius: 4 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>}

            {/* ── USERS ── */}
            {page === 'users' && <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard label="Total Users" value={users.length} icon="👥" color="#7C3AED" bg="#EDE9FE" />
                <StatCard label="New This Month" value={users.filter(u => new Date(u.created_at) > new Date(Date.now()-30*86400000)).length} icon="🆕" color={G.green} bg={G.greenLight} />
                <StatCard label="Active" value={users.length} icon="✅" color={G.blue} bg={G.blueLight} />
              </div>
              <div style={{ background: G.white, borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700 }}>All Customers</p>
                <Table headers={['#','Name','Username','Role','Joined']}>
                  {users.map((u,i) => (
                    <tr key={u.id} style={{ borderTop: `1px solid ${G.border}`, background: i%2?'#FAFAFA':G.white }}>
                      <td style={{ padding: '11px 14px', color: G.muted }}>{i+1}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: G.text }}>{u.full_name || '—'}</td>
                      <td style={{ padding: '11px 14px', color: G.muted }}>{u.username || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: u.role === 'superadmin' ? '#EDE9FE' : G.greenLight, color: u.role === 'superadmin' ? '#7C3AED' : G.green }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', color: G.muted, fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: G.muted }}>No users yet</td></tr>}
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
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F9FAF7' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

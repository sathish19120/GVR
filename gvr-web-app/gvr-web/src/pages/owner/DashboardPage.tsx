import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts'

type Filter = 'daily' | 'monthly' | 'yearly'
type Page = 'dashboard' | 'stocks' | 'purchased' | 'users' | 'storage'

interface Stats {
  totalOrders: number
  totalRevenue: number
  totalBagsSold: number
  pendingOrders: number
  lowStockProducts: number
  totalCustomers: number
}

const NAV_ITEMS: { key: Page; icon: string; label: string }[] = [
  { key: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { key: 'stocks',    icon: '📦', label: 'Stocks' },
  { key: 'purchased', icon: '🛒', label: 'Purchased' },
  { key: 'users',     icon: '👥', label: 'Users' },
  { key: 'storage',   icon: '🏭', label: 'Storage' },
]

const TOP_NAV = ['Where We Work', 'What We Do', 'About']

const COLORS = ['#3B6D11', '#639922', '#97C459', '#C0DD97']

export default function DashboardPage() {
  const { user, logout, language } = useAuthStore()
  const navigate = useNavigate()
  const [page, setPage] = useState<Page>('dashboard')
  const [filter, setFilter] = useState<Filter>('monthly')
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, totalRevenue: 0, totalBagsSold: 0,
    pendingOrders: 0, lowStockProducts: 0, totalCustomers: 0
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => { loadData() }, [filter, page])

  async function loadData() {
    setLoading(true)
    const [ordersRes, productsRes, usersRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(quantity, price_per_unit, weight_kg)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('weight_kg'),
      supabase.from('users').select('*').eq('role', 'customer'),
    ])

    const allOrders = ordersRes.data || []
    const allProducts = productsRes.data || []
    const allUsers = usersRes.data || []

    const totalRevenue = allOrders.filter(o => o.payment_status === 'paid').reduce((s: number, o: any) => s + Number(o.total_amount), 0)
    const totalBagsSold = allOrders.flatMap((o: any) => o.order_items || []).reduce((s: number, i: any) => s + i.quantity, 0)

    setStats({
      totalOrders: allOrders.length,
      totalRevenue,
      totalBagsSold,
      pendingOrders: allOrders.filter(o => o.status === 'pending').length,
      lowStockProducts: allProducts.filter(p => p.stock_bags <= p.low_stock_threshold).length,
      totalCustomers: allUsers.length,
    })

    setProducts(allProducts)
    setOrders(allOrders.slice(0, 20))
    setUsers(allUsers)

    // Build chart data based on filter
    const now = new Date()
    let labels: string[] = []
    let grouped: Record<string, number> = {}

    if (filter === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('en-IN', { weekday: 'short' })
        labels.push(label)
        grouped[key] = 0
      }
      allOrders.forEach((o: any) => {
        const key = o.created_at?.split('T')[0]
        if (grouped[key] !== undefined) grouped[key] += Number(o.total_amount || 0)
      })
    } else if (filter === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleDateString('en-IN', { month: 'short' })
        labels.push(label)
        grouped[key] = 0
      }
      allOrders.forEach((o: any) => {
        const key = o.created_at?.slice(0, 7)
        if (grouped[key] !== undefined) grouped[key] += Number(o.total_amount || 0)
      })
    } else {
      for (let i = 3; i >= 0; i--) {
        const yr = now.getFullYear() - i
        labels.push(String(yr))
        grouped[String(yr)] = 0
      }
      allOrders.forEach((o: any) => {
        const key = o.created_at?.slice(0, 4)
        if (grouped[key] !== undefined) grouped[key] += Number(o.total_amount || 0)
      })
    }

    setChartData(Object.entries(grouped).map(([key, val], i) => ({
      name: labels[i] || key, revenue: val,
      orders: allOrders.filter((o: any) => o.created_at?.startsWith(key)).length
    })))
    setLoading(false)
  }

  const handleLogout = async () => { await logout(); navigate('/login') }

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: '#3B6D11', bg: '#EAF3DE' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '📋', color: '#1E5FA5', bg: '#E6F1FB' },
    { label: 'Bags Sold', value: stats.totalBagsSold, icon: '🌾', color: '#639922', bg: '#F0F7E6' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: '#BA7517', bg: '#FAEEDA' },
    { label: 'Low Stock', value: stats.lowStockProducts, icon: '⚠️', color: '#DC2626', bg: '#FEE2E2' },
    { label: 'Customers', value: stats.totalCustomers, icon: '👥', color: '#7C3AED', bg: '#EDE9FE' },
  ]

  const statusBadge = (s: string) => {
    const map: Record<string, [string, string]> = {
      pending: ['#BA7517', '#FAEEDA'], confirmed: ['#1E5FA5', '#E6F1FB'],
      packed: ['#639922', '#F0F7E6'], dispatched: ['#7C3AED', '#EDE9FE'],
      delivered: ['#3B6D11', '#EAF3DE'], cancelled: ['#DC2626', '#FEE2E2'],
    }
    const [color, bg] = map[s] || ['#6B7280', '#F3F4F6']
    return (
      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: bg, color }}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: '#F4F6F3' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarOpen ? 220 : 64, flexShrink: 0, background: '#fff',
        borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s', overflow: 'hidden', position: 'sticky', top: 0, height: '100vh'
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarOpen ? '20px 20px 16px' : '20px 12px 16px',
          borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: '#3B6D11',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0
          }}>🌾</div>
          {sidebarOpen && (
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#27500A', lineHeight: 1.2 }}>Green Village</p>
              <p style={{ margin: 0, fontSize: 11, color: '#639922', fontWeight: 600 }}>Rice</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 10, padding: sidebarOpen ? '10px 12px' : '10px',
              borderRadius: 10, border: 'none', cursor: 'pointer',
              marginBottom: 2, transition: 'all 0.15s', justifyContent: sidebarOpen ? 'flex-start' : 'center',
              background: page === item.key ? '#EAF3DE' : 'transparent',
              color: page === item.key ? '#27500A' : '#6B7280',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ fontSize: 13, fontWeight: page === item.key ? 600 : 500 }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #E5E7EB' }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: '#EAF3DE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#27500A', flexShrink: 0
              }}>
                {user?.name?.[0] || 'O'}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Owner'}</p>
                <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF' }}>{user?.role}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', padding: sidebarOpen ? '8px 12px' : '8px',
            borderRadius: 10, border: 'none', background: 'transparent',
            color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center', gap: 6
          }}>
            <span>↩</span>{sidebarOpen && ' Logout'}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── TOP NAV BAR ── */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #E5E7EB',
          padding: '0 28px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          {/* Left — hamburger + page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: '#6B7280', padding: 4
            }}>☰</button>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>
              {NAV_ITEMS.find(n => n.key === page)?.label || 'Dashboard'}
            </h2>
          </div>

          {/* Center — top nav links */}
          <div style={{ display: 'flex', gap: 4 }}>
            {TOP_NAV.map(label => (
              <button key={label} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: '#3B6D11', transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EAF3DE')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right — filter + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {(['daily', 'monthly', 'yearly'] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: filter === f ? '#3B6D11' : '#F3F4F6',
                color: filter === f ? '#fff' : '#6B7280',
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>
              Loading dashboard data...
            </div>
          )}

          {/* ── DASHBOARD PAGE ── */}
          {!loading && page === 'dashboard' && (
            <div>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                {statCards.map((s, i) => (
                  <div key={i} style={{
                    background: '#fff', borderRadius: 16, padding: '18px 20px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    borderLeft: `4px solid ${s.color}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{s.label}</p>
                        <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
                      </div>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, background: s.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                      }}>{s.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                {/* Revenue bar chart */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Revenue</h3>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{filter}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                      <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #E5E7EB' }} />
                      <Bar dataKey="revenue" fill="#3B6D11" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Orders line chart */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Orders Trend</h3>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{filter}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #E5E7EB' }} />
                      <Line type="monotone" dataKey="orders" stroke="#639922" strokeWidth={2.5} dot={{ fill: '#3B6D11', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent orders table */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Recent Orders</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F9FAF7' }}>
                        {['Order #', 'Customer', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 8).map((o: any, i: number) => (
                        <tr key={o.id} style={{ borderTop: '1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: '#3B6D11' }}>{o.order_number}</td>
                          <td style={{ padding: '11px 14px', color: '#374151' }}>{o.customer_name || '—'}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1A1A1A' }}>₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '11px 14px', color: '#6B7280', textTransform: 'uppercase', fontSize: 11 }}>{o.payment_method}</td>
                          <td style={{ padding: '11px 14px' }}>{statusBadge(o.status)}</td>
                          <td style={{ padding: '11px 14px', color: '#9CA3AF', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No orders yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── STOCKS PAGE ── */}
          {!loading && page === 'stocks' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                {products.map((p: any) => {
                  const pct = Math.min(100, Math.round((p.stock_bags / Math.max(p.stock_bags, p.low_stock_threshold * 3)) * 100))
                  const isLow = p.stock_bags <= p.low_stock_threshold
                  return (
                    <div key={p.id} style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `4px solid ${isLow ? '#DC2626' : '#3B6D11'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{p.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{p.sku}</p>
                        </div>
                        <span style={{ fontSize: 24 }}>🌾</span>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: isLow ? '#DC2626' : '#3B6D11' }}>
                        {p.stock_bags} <span style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>bags</span>
                      </p>
                      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isLow ? '#DC2626' : '#3B6D11', borderRadius: 3 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#6B7280' }}>₹{p.price_per_bag}/bag · {p.weight_kg}kg</span>
                        {isLow && <span style={{ color: '#DC2626', fontWeight: 600 }}>⚠ Low</span>}
                      </div>
                      {p.packing_date && <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9CA3AF' }}>Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</p>}
                    </div>
                  )
                })}
              </div>

              {/* Stock pie chart */}
              {products.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxWidth: 480 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Stock Distribution</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={products.map((p: any) => ({ name: p.name, value: p.stock_bags }))}
                           cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                           labelLine={false} fontSize={11}>
                        {products.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── PURCHASED PAGE ── */}
          {!loading && page === 'purchased' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Purchases', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: '💰', color: '#3B6D11' },
                  { label: 'Total Orders', value: stats.totalOrders, icon: '📋', color: '#1E5FA5' },
                  { label: 'Bags Sold', value: stats.totalBagsSold, icon: '🌾', color: '#639922' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `4px solid ${s.color}` }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B7280' }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Purchase History — {filter}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                    <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={i === chartData.length - 1 ? '#3B6D11' : '#97C459'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>All Orders</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F9FAF7' }}>
                        {['Order #', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o: any, i: number) => (
                        <tr key={o.id} style={{ borderTop: '1px solid #F3F4F6', background: i % 2 ? '#FAFAFA' : '#fff' }}>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: '#3B6D11' }}>{o.order_number}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 600 }}>₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '11px 14px', color: '#6B7280', textTransform: 'uppercase', fontSize: 11 }}>{o.payment_method || '—'}</td>
                          <td style={{ padding: '11px 14px' }}>{statusBadge(o.status)}</td>
                          <td style={{ padding: '11px 14px', color: '#9CA3AF', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS PAGE ── */}
          {!loading && page === 'users' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Customers', value: stats.totalCustomers, color: '#3B6D11' },
                  { label: 'Active This Month', value: Math.min(stats.totalCustomers, stats.totalOrders), color: '#1E5FA5' },
                  { label: 'New This Month', value: users.filter((u: any) => new Date(u.created_at) > new Date(Date.now() - 30 * 86400000)).length, color: '#639922' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `4px solid ${s.color}` }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B7280' }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>All Customers</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F9FAF7' }}>
                        {['#', 'Name', 'Phone', 'Area', 'Language', 'Joined'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: any, i: number) => (
                        <tr key={u.id} style={{ borderTop: '1px solid #F3F4F6', background: i % 2 ? '#FAFAFA' : '#fff' }}>
                          <td style={{ padding: '11px 14px', color: '#9CA3AF' }}>{i + 1}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1A1A1A' }}>{u.name || '—'}</td>
                          <td style={{ padding: '11px 14px', color: '#6B7280' }}>{u.phone || u.email?.split('@')[0] || '—'}</td>
                          <td style={{ padding: '11px 14px', color: '#6B7280' }}>{u.area || 'Hyderabad'}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: u.language === 'te' ? '#EAF3DE' : '#F3F4F6', color: u.language === 'te' ? '#27500A' : '#6B7280', fontWeight: 600 }}>
                              {u.language === 'te' ? 'తెలుగు' : 'English'}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', color: '#9CA3AF', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No customers yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── STORAGE PAGE ── */}
          {!loading && page === 'storage' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Bags in Stock', value: products.reduce((s: number, p: any) => s + p.stock_bags, 0), icon: '📦', color: '#3B6D11' },
                  { label: 'Total Weight (kg)', value: products.reduce((s: number, p: any) => s + p.stock_bags * p.weight_kg, 0).toLocaleString('en-IN'), icon: '⚖️', color: '#1E5FA5' },
                  { label: 'Stock Value', value: `₹${products.reduce((s: number, p: any) => s + p.stock_bags * p.price_per_bag, 0).toLocaleString('en-IN')}`, icon: '💰', color: '#639922' },
                  { label: 'Products Active', value: products.filter((p: any) => p.active).length, icon: '✅', color: '#7C3AED' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B7280' }}>{s.label}</p>
                        <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
                      </div>
                      <span style={{ fontSize: 28 }}>{s.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {products.map((p: any) => {
                  const totalWeight = p.stock_bags * p.weight_kg
                  const stockVal = p.stock_bags * p.price_per_bag
                  const isLow = p.stock_bags <= p.low_stock_threshold
                  return (
                    <div key={p.id} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{p.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{p.name_telugu} · {p.sku}</p>
                        </div>
                        <span style={{ fontSize: 28 }}>🌾</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        {[
                          { label: 'Bags', value: p.stock_bags },
                          { label: 'Weight', value: `${totalWeight}kg` },
                          { label: 'Value', value: `₹${stockVal.toLocaleString('en-IN')}` },
                        ].map((item, i) => (
                          <div key={i} style={{ background: '#F9FAF7', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9CA3AF' }}>{item.label}</p>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#3B6D11' }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                      {p.packing_date && (
                        <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF', display: 'flex', gap: 16 }}>
                          <span>📅 Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</span>
                          {p.best_before_date && <span>⏳ Best before: {new Date(p.best_before_date).toLocaleDateString('en-IN')}</span>}
                        </div>
                      )}
                      {isLow && (
                        <div style={{ marginTop: 10, padding: '6px 12px', background: '#FEE2E2', borderRadius: 8, fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                          ⚠ Stock below threshold — reorder soon
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

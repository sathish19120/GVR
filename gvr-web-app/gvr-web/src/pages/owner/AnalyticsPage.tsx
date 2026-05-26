import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, subMonths, startOfMonth } from 'date-fns'

export default function AnalyticsPage() {
  const { language } = useAuthStore()
  const t = useT(language)
  const [monthly, setMonthly] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [topCustomers, setTopCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const sixMonthsAgo = subMonths(new Date(), 6).toISOString()

    const [ordersRes, itemsRes, customersRes] = await Promise.all([
      supabase.from('orders').select('created_at, total_amount, payment_status').gte('created_at', sixMonthsAgo),
      supabase.from('order_items').select('name, weight_kg, quantity, price_per_unit, orders(created_at, payment_status)'),
      supabase.from('users').select('id, name, phone, orders(total_amount, payment_status)').eq('role', 'customer'),
    ])

    // Monthly revenue
    const monthMap: Record<string, { revenue: number; orders: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const m = format(startOfMonth(subMonths(new Date(), i)), 'MMM yyyy')
      monthMap[m] = { revenue: 0, orders: 0 }
    }
    ;(ordersRes.data || []).forEach(o => {
      const m = format(new Date(o.created_at), 'MMM yyyy')
      if (monthMap[m]) {
        monthMap[m].orders++
        if (o.payment_status === 'paid') monthMap[m].revenue += Number(o.total_amount)
      }
    })
    setMonthly(Object.entries(monthMap).map(([month, v]) => ({ month, ...v })))

    // Product performance
    const prodMap: Record<string, { name: string; bags: number; revenue: number }> = {}
    ;(itemsRes.data || []).forEach((item: any) => {
      const key = item.name
      if (!prodMap[key]) prodMap[key] = { name: key, bags: 0, revenue: 0 }
      if (item.orders?.payment_status === 'paid') {
        prodMap[key].bags += item.quantity
        prodMap[key].revenue += item.quantity * Number(item.price_per_unit)
      }
    })
    setProducts(Object.values(prodMap))

    // Top customers
    const top = (customersRes.data || []).map((c: any) => ({
      ...c,
      totalSpent: (c.orders || []).filter((o: any) => o.payment_status === 'paid').reduce((s: number, o: any) => s + Number(o.total_amount), 0),
    })).sort((a: any, b: any) => b.totalSpent - a.totalSpent).slice(0, 5)
    setTopCustomers(top)
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-gray-400">{t.common.loading}</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-display font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>{t.nav.analytics}</h1>

      {/* Monthly Revenue */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Monthly Revenue (₹)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                   tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`]}
                     contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }} />
            <Bar dataKey="revenue" fill="var(--gvr-green)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Product performance */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Product Performance</h3>
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{p.name}</span>
                  <span className="text-gray-500">{p.bags} bags · ₹{p.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, (p.bags / Math.max(...products.map(x => x.bags))) * 100)}%`,
                    background: 'var(--gvr-green)'
                  }} />
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-gray-400 text-sm">{t.common.noData}</p>}
          </div>
        </div>

        {/* Top customers */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                     style={{ background: 'var(--gvr-green-light)', color: 'var(--gvr-green-dark)' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.name || 'Customer'}</p>
                  <p className="text-xs text-gray-400">{c.phone}</p>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--gvr-green)' }}>
                  ₹{c.totalSpent.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
            {topCustomers.length === 0 && <p className="text-gray-400 text-sm">{t.common.noData}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

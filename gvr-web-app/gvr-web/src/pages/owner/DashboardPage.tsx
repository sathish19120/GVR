import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'

interface Stats { revenue: number; orders: number; pending: number; lowStock: number; inTransit: number }
interface WeekDay { day: string; orders: number; revenue: number }
interface RecentOrder { id: string; order_number: string; customer_name: string; total_amount: number; status: string; created_at: string }

export default function DashboardPage() {
  const { language, user } = useAuthStore()
  const t = useT(language)
  const [stats, setStats] = useState<Stats>({ revenue: 0, orders: 0, pending: 0, lowStock: 0, inTransit: 0 })
  const [weekData, setWeekData] = useState<WeekDay[]>([])
  const [recent, setRecent] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [ordersRes, productsRes, weekRes, recentRes] = await Promise.all([
      supabase.from('orders').select('total_amount, status, payment_status, created_at'),
      supabase.from('products').select('stock_bags, low_stock_threshold, active').eq('active', true),
      supabase.from('orders').select('created_at, total_amount').gte('created_at', subDays(new Date(), 7).toISOString()),
      supabase.from('orders').select('id, order_number, total_amount, status, created_at, users(name)').order('created_at', { ascending: false }).limit(5),
    ])

    const orders = ordersRes.data || []
    const todayOrders = orders.filter(o => o.created_at.startsWith(today))
    const revenue = todayOrders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0)
    const pending = orders.filter(o => o.status === 'pending').length
    const inTransit = orders.filter(o => o.status === 'dispatched').length
    const products = productsRes.data || []
    const lowStock = products.filter(p => p.stock_bags <= p.low_stock_threshold).length

    // Build week data
    const days: WeekDay[] = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const ds = d.toISOString().split('T')[0]
      const dayOrders = (weekRes.data || []).filter(o => o.created_at.startsWith(ds))
      days.push({ day: format(d, 'EEE'), orders: dayOrders.length, revenue: dayOrders.reduce((s, o) => s + Number(o.total_amount), 0) })
    }

    const recentData = (recentRes.data || []).map((o: any) => ({
      ...o, customer_name: o.users?.name || 'Customer'
    }))

    setStats({ revenue, orders: todayOrders.length, pending, lowStock, inTransit })
    setWeekData(days)
    setRecent(recentData)
    setLoading(false)
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: 'badge-pending', confirmed: 'badge-confirmed', dispatched: 'badge-dispatched', delivered: 'badge-delivered', cancelled: 'badge-cancelled', packed: 'badge-confirmed' }
    const labels: Record<string, string> = t.orders.status
    return <span className={map[s] || 'badge-pending'}>{labels[s as keyof typeof labels] || s}</span>
  }

  const hour = new Date().getHours()
  const greet = hour < 12 ? (language === 'te' ? 'శుభోదయం' : 'Good morning') : hour < 17 ? (language === 'te' ? 'శుభ మధ్యాహ్నం' : 'Good afternoon') : (language === 'te' ? 'శుభ సాయంత్రం' : 'Good evening')

  if (loading) return <div className="p-8 text-gray-400">{t.common.loading}</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">{greet}</p>
        <h1 className="text-2xl font-display font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>
          {language === 'te' ? 'డాష్‌బోర్డ్' : 'Dashboard'}
        </h1>
      </div>

      {/* Alert */}
      {stats.pending > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border"
             style={{ background: 'var(--gvr-green-light)', borderColor: '#97C459' }}>
          <span className="text-lg">🔔</span>
          <p className="text-sm font-medium" style={{ color: 'var(--gvr-green-dark)' }}>
            {stats.pending} {language === 'te' ? 'ఆర్డర్లు నిర్ధారణ కోసం వేచి ఉన్నాయి' : `orders waiting for confirmation`}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: t.dashboard.revenue, value: `₹${stats.revenue.toLocaleString('en-IN')}`, sub: language === 'te' ? 'చెల్లించబడింది' : 'collected today', color: 'var(--gvr-green)' },
          { label: t.dashboard.orders,  value: stats.orders,   sub: `${stats.pending} ${language === 'te' ? 'పెండింగ్' : 'pending'}`, color: 'var(--gvr-text)' },
          { label: t.dashboard.stockAlert, value: stats.lowStock > 0 ? `⚠ ${stats.lowStock}` : '✓ OK', sub: language === 'te' ? 'ఉత్పత్తులు' : 'products', color: stats.lowStock > 0 ? 'var(--gvr-amber)' : 'var(--gvr-green)' },
          { label: t.dashboard.deliveries, value: stats.inTransit, sub: language === 'te' ? 'రవాణాలో' : 'in transit', color: 'var(--gvr-text)' },
        ].map((s, i) => (
          <div key={i} className="card">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-semibold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Weekly chart */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-4">{t.dashboard.weeklySales}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData} barSize={28}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}
                formatter={(v: any) => [`${v} orders`]}
              />
              <Bar dataKey="orders" fill="var(--gvr-green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent orders */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-4">{t.dashboard.recentOrders}</h3>
          <div className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-gray-400">{t.common.noData}</p>}
            {recent.map(o => (
              <div key={o.id} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{o.customer_name}</p>
                  <p className="text-xs text-gray-400">{o.order_number} · {format(new Date(o.created_at), 'dd MMM, h:mm a')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₹{Number(o.total_amount).toLocaleString('en-IN')}</p>
                  {statusBadge(o.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

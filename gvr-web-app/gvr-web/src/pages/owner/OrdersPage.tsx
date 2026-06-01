import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'
import { format } from 'date-fns'

type Status = 'all' | 'pending' | 'confirmed' | 'packed' | 'dispatched' | 'delivered' | 'cancelled'

export default function OrdersPage() {
  const { language } = useAuthStore()
  const t = useT(language)
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState<Status>('all')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, users:customer_id(name, phone), order_items(name, weight_kg, quantity, price_per_unit)')
      .order('created_at', { ascending: false })
      .limit(100)
    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter
    const matchSearch = !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.users?.name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: 'badge-pending', confirmed: 'badge-confirmed', packed: 'badge-confirmed', dispatched: 'badge-dispatched', delivered: 'badge-delivered', cancelled: 'badge-cancelled' }
    const labels: Record<string, string> = t.orders.status
    return <span className={map[s] || 'badge-pending'}>{labels[s as keyof typeof labels] || s}</span>
  }

  const STATUSES: Status[] = ['all', 'pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled']

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>{t.orders.title}</h1>
        <span className="text-sm text-gray-500">{filtered.length} orders</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === s ? 'var(--gvr-green)' : '#F3F4F6',
              color: filter === s ? 'white' : '#6B7280'
            }}
          >
            {s === 'all' ? t.common.all : t.orders.status[s as keyof typeof t.orders.status]}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={`${t.common.search} order number or name…`}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input max-w-xs"
      />

      {loading && <p className="text-gray-400 text-sm">{t.common.loading}</p>}

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-800">{order.users?.name || 'Customer'}</p>
                <p className="text-xs text-gray-400">{order.order_number} · {order.users?.phone}</p>
                <p className="text-xs text-gray-400">{format(new Date(order.created_at), 'dd MMM yyyy, h:mm a')}</p>
              </div>
              <div className="text-right">
                {statusBadge(order.status)}
                <p className="text-base font-semibold mt-1">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400">{order.payment_method?.toUpperCase()}</p>
              </div>
            </div>

            {/* Items */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(order.order_items || []).map((item: any, i: number) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--gvr-green-light)', color: 'var(--gvr-green-dark)' }}>
                  {item.name} ({item.weight_kg}kg) × {item.quantity}
                </span>
              ))}
            </div>

            <p className="text-xs text-gray-500 mb-3">📍 {order.delivery_address}</p>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {order.status === 'pending' && (
                <button className="btn-primary text-xs px-4 py-1.5"
                        onClick={() => updateStatus(order.id, 'confirmed')}>
                  ✓ {t.orders.confirm}
                </button>
              )}
              {order.status === 'confirmed' && (
                <button className="btn-outline text-xs px-4 py-1.5"
                        onClick={() => updateStatus(order.id, 'packed')}>
                  📦 Mark Packed
                </button>
              )}
              {order.status === 'packed' && (
                <button className="btn-primary text-xs px-4 py-1.5"
                        onClick={() => updateStatus(order.id, 'dispatched')}>
                  🚚 Dispatch
                </button>
              )}
              {order.status === 'dispatched' && (
                <button className="btn-primary text-xs px-4 py-1.5"
                        onClick={() => updateStatus(order.id, 'delivered')}>
                  ✓ Mark Delivered
                </button>
              )}
              {['pending', 'confirmed'].includes(order.status) && (
                <button className="text-xs px-4 py-1.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-all"
                        onClick={() => updateStatus(order.id, 'cancelled')}>
                  ✕ Cancel
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-gray-400 text-sm py-8 text-center">{t.common.noData}</p>
        )}
      </div>
    </div>
  )
}

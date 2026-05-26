import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'
import { format } from 'date-fns'

export default function MyOrdersPage() {
  const { language, user } = useAuthStore()
  const t = useT(language)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadOrders()
  }, [user])

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(name, weight_kg, quantity, price_per_unit)')
      .eq('customer_id', user!.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: 'badge-pending', confirmed: 'badge-confirmed', packed: 'badge-confirmed', dispatched: 'badge-dispatched', delivered: 'badge-delivered', cancelled: 'badge-cancelled' }
    const labels: Record<string, string> = t.orders.status
    return <span className={map[s] || 'badge-pending'}>{labels[s as keyof typeof labels] || s}</span>
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>{t.nav.myOrders}</h2>

      {loading && <p className="text-gray-400 text-sm">{t.common.loading}</p>}

      {!loading && orders.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-gray-500">{language === 'te' ? 'ఆర్డర్లు లేవు' : 'No orders yet'}</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="card space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{order.order_number}</p>
                <p className="text-xs text-gray-400">{format(new Date(order.created_at), 'dd MMM yyyy, h:mm a')}</p>
              </div>
              <div className="text-right">
                {statusBadge(order.status)}
                <p className="text-base font-semibold mt-1">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(order.order_items || []).map((item: any, i: number) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--gvr-green-light)', color: 'var(--gvr-green-dark)' }}>
                  {item.name} × {item.quantity}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>📍 {order.delivery_address?.slice(0, 40)}…</span>
              <span>·</span>
              <span>{order.payment_method?.toUpperCase()}</span>
            </div>

            {/* Status tracker */}
            {order.status !== 'cancelled' && (
              <div className="flex items-center gap-1 pt-1">
                {['pending', 'confirmed', 'packed', 'dispatched', 'delivered'].map((s, i, arr) => {
                  const idx = arr.indexOf(order.status)
                  const done = i <= idx
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                           style={{ background: done ? 'var(--gvr-green)' : '#E5E7EB' }} />
                      {i < arr.length - 1 && (
                        <div className="h-0.5 flex-1 transition-all"
                             style={{ background: i < idx ? 'var(--gvr-green)' : '#E5E7EB' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

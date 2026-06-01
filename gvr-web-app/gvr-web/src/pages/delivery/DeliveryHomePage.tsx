import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'
import { format } from 'date-fns'

export default function DeliveryHomePage() {
  const { user, language } = useAuthStore()
  const t = useT(language)
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadRuns() }, [user])

  async function loadRuns() {
    const { data } = await supabase
      .from('orders')
      .select('*, users:customer_id(name, phone), order_items(name, weight_kg, quantity)')
      .eq('delivery_person_id', user!.id)
      .in('status', ['confirmed', 'packed', 'dispatched'])
      .order('created_at')
    setRuns(data || [])
    setLoading(false)
  }

  async function markDelivered(id: string) {
    await supabase.from('orders').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', id)
    setRuns(prev => prev.filter(r => r.id !== id))
  }

  const statusColor: Record<string, string> = { confirmed: '#185FA5', packed: '#BA7517', dispatched: '#3B6D11' }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>{t.delivery.title}</h2>
        <span className="text-sm text-gray-500">{runs.length} runs</span>
      </div>

      {loading && <p className="text-gray-400 text-sm">{t.common.loading}</p>}

      {!loading && runs.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-gray-500">{language === 'te' ? 'అన్ని డెలివరీలు పూర్తయ్యాయి!' : 'All deliveries done for today!'}</p>
        </div>
      )}

      <div className="space-y-3">
        {runs.map(run => (
          <div key={run.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor[run.status] || '#6B7280' }} />
                  <p className="font-semibold text-gray-800">{run.users?.name || 'Customer'}</p>
                </div>
                <p className="text-xs text-gray-400 ml-4">{run.order_number}</p>
              </div>
              <span className={`badge-${run.status === 'dispatched' ? 'dispatched' : run.status === 'packed' ? 'confirmed' : 'pending'}`}>
                {t.orders.status[run.status as keyof typeof t.orders.status]}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(run.order_items || []).map((item: any, i: number) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--gvr-green-light)', color: 'var(--gvr-green-dark)' }}>
                  {item.name} × {item.quantity}
                </span>
              ))}
            </div>

            <p className="text-sm text-gray-600">📍 {run.delivery_address}</p>
            <p className="text-xs text-gray-400">
              ₹{Number(run.total_amount).toLocaleString('en-IN')} · {run.payment_method?.toUpperCase()} ·
              {format(new Date(run.created_at), ' dd MMM, h:mm a')}
            </p>

            <div className="flex gap-2">
              <a href={`tel:${run.users?.phone}`}
                 className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
                📞 {t.delivery.call}
              </a>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(run.delivery_address)}`}
                 target="_blank" rel="noopener noreferrer"
                 className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
                🗺 {t.delivery.navigate}
              </a>
              <button onClick={() => markDelivered(run.id)}
                      className="flex-1 btn-primary text-sm py-2">
                ✓ {t.delivery.markDelivered}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

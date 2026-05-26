import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'
import { format } from 'date-fns'

export default function CustomersPage() {
  const { language } = useAuthStore()
  const t = useT(language)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadCustomers() }, [])

  async function loadCustomers() {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select(`*, orders:orders(id, total_amount, created_at, payment_status)`)
      .eq('role', 'customer')
      .eq('active', true)
    const enriched = (data || []).map(c => ({
      ...c,
      totalOrders: c.orders?.length || 0,
      totalSpent: (c.orders || []).filter((o: any) => o.payment_status === 'paid').reduce((s: number, o: any) => s + Number(o.total_amount), 0),
      lastOrder: c.orders?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at,
    })).sort((a, b) => b.totalSpent - a.totalSpent)
    setCustomers(enriched)
    setLoading(false)
  }

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>{t.nav.customers}</h1>
        <span className="text-sm text-gray-500">{filtered.length} customers</span>
      </div>
      <input className="input max-w-xs" placeholder={`${t.common.search} name or phone…`}
             value={search} onChange={e => setSearch(e.target.value)} />

      {loading && <p className="text-gray-400 text-sm">{t.common.loading}</p>}

      <div className="space-y-2">
        {filtered.map((c, i) => (
          <div key={c.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                 style={{ background: 'var(--gvr-green-light)', color: 'var(--gvr-green-dark)' }}>
              {i < 3 ? ['🥇','🥈','🥉'][i] : (c.name?.[0] || c.phone?.slice(-2) || 'C')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{c.name || 'No name'}</p>
              <p className="text-xs text-gray-400">{c.phone} · {c.area || 'Hyderabad'}</p>
              {c.lastOrder && <p className="text-xs text-gray-400">Last order: {format(new Date(c.lastOrder), 'dd MMM yyyy')}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-sm" style={{ color: 'var(--gvr-green)' }}>₹{c.totalSpent.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400">{c.totalOrders} orders</p>
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

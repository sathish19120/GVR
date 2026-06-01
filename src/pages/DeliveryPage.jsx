import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'
import { useNavigate } from 'react-router-dom'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',
  red:'#DC2626',redLight:'#FEE2E2',white:'#fff',surface:'#F4F6F3'
}

export default function DeliveryPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(null)

  useEffect(() => { loadRuns() }, [])

  async function loadRuns() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(name, weight_kg, quantity)')
      .in('status', ['confirmed', 'packed', 'dispatched'])
      .order('created_at')
    setRuns(data || [])
    setLoading(false)
  }

  async function markDelivered(id) {
    setMarking(id)
    await supabase.from('orders').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', id)
    setRuns(prev => prev.filter(r => r.id !== id))
    setMarking(null)
  }

  const statusColor = { confirmed: G.amber, packed: G.blue, dispatched: G.green }
  const statusLabel = { confirmed: 'For Pickup', packed: 'Ready to Dispatch', dispatched: 'On the Way' }

  return (
    <div style={{ minHeight: '100vh', background: G.surface, fontFamily: "'Inter', sans-serif" }}>
      <header style={{ background: G.green, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🚚</span>
          <div>
            <p style={{ color: G.white, fontWeight: 700, margin: 0, fontSize: 15 }}>My Deliveries</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 11 }}>{user?.full_name || user?.username}</p>
          </div>
        </div>
        <button onClick={async () => { await signOut(); navigate('/login') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: G.white, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
          Logout
        </button>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
        {loading && <p style={{ textAlign: 'center', color: G.muted, padding: 40 }}>Loading runs...</p>}

        {!loading && runs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 50, marginBottom: 12 }}>🎉</div>
            <p style={{ fontWeight: 700, color: G.text, fontSize: 16 }}>All deliveries done!</p>
            <p style={{ color: G.muted, fontSize: 13 }}>No pending runs for today</p>
          </div>
        )}

        {runs.map(run => (
          <div key={run.id} style={{ background: G.white, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 15, color: G.text }}>{run.customer_name || 'Customer'}</p>
                <p style={{ margin: 0, fontSize: 12, color: G.muted }}>{run.order_number}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: statusColor[run.status] + '20', color: statusColor[run.status] }}>
                {statusLabel[run.status] || run.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {(run.order_items || []).map((item, i) => (
                <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: G.greenLight, color: G.greenDark, fontWeight: 600 }}>
                  {item.name} × {item.quantity}
                </span>
              ))}
            </div>

            <div style={{ fontSize: 13, color: G.muted, marginBottom: 12 }}>
              <p style={{ margin: '0 0 3px' }}>📍 {run.delivery_address}</p>
              <p style={{ margin: 0 }}>💰 ₹{Number(run.total_amount).toLocaleString('en-IN')} · {run.payment_method?.toUpperCase()}</p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {run.delivery_address && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(run.delivery_address)}`} target="_blank" rel="noreferrer"
                  style={{ flex: 1, padding: '9px', borderRadius: 10, border: `1px solid ${G.border}`, textAlign: 'center', fontSize: 13, fontWeight: 600, color: G.blue, textDecoration: 'none', background: G.blueLight }}>
                  🗺 Navigate
                </a>
              )}
              <button onClick={() => markDelivered(run.id)} disabled={marking === run.id} style={{
                flex: 2, padding: '9px', borderRadius: 10, border: 'none',
                background: marking === run.id ? '#9CA3AF' : G.green, color: G.white,
                fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}>
                {marking === run.id ? 'Updating...' : '✓ Mark Delivered'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const BRANCHES = ['All','Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu']

export default function PickupQueue({ defaultBranch }) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [branch, setBranch]   = useState(defaultBranch || 'All')
  const [tab, setTab]         = useState('pending')

  useEffect(() => { load() }, [branch])

  async function load() {
    setLoading(true)
    try {
      // FIX #8: use OR filter to handle both old deployments (no order_type column)
      // and new ones. Filter on pickup_branch or delivery_address contains 'Pickup'
      // to catch walkin/pickup orders even without the order_type column.
      let q = supabase
        .from('orders')
        .select('*, order_items(name,weight_kg,quantity,price_per_unit)')
        .or('order_type.in.(pickup,walkin),delivery_address.ilike.%Walk-in%,delivery_address.ilike.%Pickup%')
        .order('created_at', { ascending: false })

      if (branch !== 'All') q = q.eq('pickup_branch', branch)
      const { data, error } = await q
      if (error) throw error
      setOrders(data || [])
    } catch(e) {
      console.error('PickupQueue load error:', e)
      setOrders([])
    }
    setLoading(false)
  }

  async function markReady(id) {
    await supabase.from('orders').update({ pickup_ready: true, status: 'packed' }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, pickup_ready: true, status: 'packed' } : o))
  }

  async function markCollected(id) {
    // FIX #16: also mark payment as paid when customer collects — cash is always
    // paid at pickup. This prevents the order showing as payment-pending forever.
    await supabase.from('orders').update({
      status: 'delivered',
      payment_status: 'paid',
    }).eq('id', id)
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status: 'delivered', payment_status: 'paid' } : o
    ))
  }

  const pending = orders.filter(o => !o.pickup_ready && o.status !== 'delivered' && o.status !== 'cancelled')
  const ready   = orders.filter(o => o.pickup_ready && o.status !== 'delivered' && o.status !== 'cancelled')
  const done    = orders.filter(o => o.status === 'delivered')

  const shown = tab === 'pending' ? pending : tab === 'ready' ? ready : done

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700 }}>🏪 Pickup Queue</h2>
          <p style={{ margin:0, fontSize:12, color:G.muted }}>Manage store pickup and walk-in orders</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={branch} onChange={e=>setBranch(e.target.value)}
            style={{ padding:'7px 12px', borderRadius:9, border:`1.5px solid ${G.border}`, fontSize:13, outline:'none', background:G.white, cursor:'pointer' }}>
            {BRANCHES.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
          </select>
          <button onClick={load} style={{ padding:'7px 14px', background:G.white, border:`1px solid ${G.border}`, borderRadius:9, fontSize:13, fontWeight:600, color:G.muted, cursor:'pointer' }}>↻</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Waiting',   count:pending.length, color:G.amber, bg:G.amberLight, icon:'⏳' },
          { label:'Ready',     count:ready.length,   color:G.blue,  bg:G.blueLight,  icon:'✅' },
          { label:'Collected', count:done.length,    color:G.green, bg:G.greenLight, icon:'🏠' },
        ].map(s => (
          <div key={s.label} style={{ background:G.white, borderRadius:12, padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${s.color}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ margin:'0 0 4px', fontSize:11, color:G.muted }}>{s.label}</p>
              <p style={{ margin:0, fontSize:24, fontWeight:800, color:s.color }}>{s.count}</p>
            </div>
            <span style={{ fontSize:22 }}>{s.icon}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:14 }}>
        {[
          ['pending', `⏳ Waiting (${pending.length})`],
          ['ready',   `✅ Ready (${ready.length})`],
          ['done',    `🏠 Collected (${done.length})`],
        ].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{ padding:'7px 16px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background:tab===key?G.green:'#F3F4F6', color:tab===key?G.white:G.muted }}>
            {label}
          </button>
        ))}
      </div>

      {loading && <p style={{ textAlign:'center', color:G.muted, padding:30 }}>Loading...</p>}

      {!loading && shown.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 20px', background:G.white, borderRadius:14, color:G.muted }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🏪</div>
          <p style={{ fontWeight:600, color:G.text, margin:'0 0 4px' }}>No {tab} orders</p>
          <p style={{ fontSize:13 }}>
            {tab === 'pending' ? 'All pickup orders are ready or collected.' :
             tab === 'ready'   ? 'No orders ready for pickup yet.' :
             'No orders collected yet today.'}
          </p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {shown.map(order => (
          <div key={order.id} style={{ background:G.white, borderRadius:14, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:`1px solid ${order.order_type==='walkin'?G.green:G.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:15, color:G.green }}>{order.order_number}</p>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
                    background: order.order_type==='walkin' ? G.greenLight : G.blueLight,
                    color: order.order_type==='walkin' ? G.green : G.blue }}>
                    {order.order_type === 'walkin' ? '🏪 Walk-in' : '📱 App Pickup'}
                  </span>
                </div>
                <p style={{ margin:0, fontSize:12, color:G.muted }}>
                  {order.customer_name} · {new Date(order.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} · {new Date(order.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                </p>
                {order.pickup_time && <p style={{ margin:'2px 0 0', fontSize:12, color:G.blue }}>🕐 Pickup: {order.pickup_time}</p>}
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={{ fontWeight:800, fontSize:16, color:G.green, display:'block' }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                {/* FIX #16: show payment status badge */}
                <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, marginTop:4, display:'inline-block',
                  background: order.payment_status==='paid' ? G.greenLight : G.amberLight,
                  color: order.payment_status==='paid' ? G.green : G.amber }}>
                  {order.payment_status==='paid' ? '✅ Paid' : '⏳ Unpaid'}
                </span>
              </div>
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
              {(order.order_items||[]).map((item,i)=>(
                <span key={i} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:G.greenLight, color:G.greenDark, fontWeight:600 }}>
                  {item.name} × {item.quantity}
                </span>
              ))}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              {tab === 'pending' && (
                <button onClick={() => markReady(order.id)} style={{ flex:1, padding:'9px', background:G.blue, color:G.white, border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  ✅ Mark Ready for Pickup
                </button>
              )}
              {tab === 'ready' && (
                // FIX #16: markCollected now sets payment_status=paid too
                <button onClick={() => markCollected(order.id)} style={{ flex:1, padding:'9px', background:G.green, color:G.white, border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  🏠 Mark Collected & Paid
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

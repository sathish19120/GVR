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
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [branch, setBranch]     = useState(defaultBranch || 'All')
  const [tab, setTab]           = useState('pending') // pending|ready|done

  useEffect(() => { load() }, [branch])

  async function load() {
    setLoading(true)
    let q = supabase.from('orders')
      .select('*, order_items(name,weight_kg,quantity,price_per_unit)')
      .in('order_type', ['pickup','walkin'])
      .order('created_at', { ascending: false })
    if (branch !== 'All') q = q.eq('pickup_branch', branch)
    const { data } = await q
    setOrders(data || [])
    setLoading(false)
  }

  async function markReady(id) {
    await supabase.from('orders').update({ pickup_ready: true, status: 'packed' }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, pickup_ready: true, status: 'packed' } : o))
  }

  async function markCollected(id) {
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'delivered' } : o))
  }

  const pending  = orders.filter(o => !o.pickup_ready && o.status !== 'delivered')
  const ready    = orders.filter(o => o.pickup_ready && o.status !== 'delivered')
  const done     = orders.filter(o => o.status === 'delivered')

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
          { label:'Waiting',   count:pending.length,  color:G.amber, bg:G.amberLight, icon:'⏳' },
          { label:'Ready',     count:ready.length,    color:G.blue,  bg:G.blueLight,  icon:'✅' },
          { label:'Collected', count:done.length,     color:G.green, bg:G.greenLight, icon:'🏠' },
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
        {[['pending',`⏳ Waiting (${pending.length})`],['ready',`✅ Ready (${ready.length})`],['done',`🏠 Collected (${done.length})`]].map(([key,label])=>(
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
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {shown.map(order => (
          <div key={order.id} style={{ background:G.white, borderRadius:14, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:`1px solid ${order.order_type==='walkin'?G.green:G.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:15, color:G.green }}>{order.order_number}</p>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:order.order_type==='walkin'?G.greenLight:G.blueLight, color:order.order_type==='walkin'?G.green:G.blue }}>
                    {order.order_type === 'walkin' ? '🏪 Walk-in' : '📱 App Pickup'}
                  </span>
                </div>
                <p style={{ margin:0, fontSize:12, color:G.muted }}>
                  {order.customer_name} · {new Date(order.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} · {new Date(order.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                </p>
                {order.pickup_time && <p style={{ margin:'2px 0 0', fontSize:12, color:G.blue }}>🕐 Pickup: {order.pickup_time}</p>}
              </div>
              <span style={{ fontWeight:800, fontSize:16, color:G.green }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
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
                <button onClick={() => markCollected(order.id)} style={{ flex:1, padding:'9px', background:G.green, color:G.white, border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  🏠 Mark Collected
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

export default function DeliveryPage() {
  const { user, signOut }       = useAuth()
  const navigate                = useNavigate()
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('pending')
  const [collected, setCollected] = useState({}) // track cash collected this session

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(name,weight_kg,quantity,price_per_unit)')
      .in('status', ['confirmed','packed','dispatched','delivered'])
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function markCashCollected(order) {
    await supabase.from('orders').update({
      payment_status: 'paid',
      status: 'delivered',
      notes: (order.notes ? order.notes + ' · ' : '') + `Cash collected by ${user?.full_name || user?.username}`
    }).eq('id', order.id)
    setCollected(prev => ({ ...prev, [order.id]: true }))
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status:'paid', status:'delivered' } : o))
  }

  const pending   = orders.filter(o => ['confirmed','packed'].includes(o.status))
  const outForDel = orders.filter(o => o.status === 'dispatched')
  const done      = orders.filter(o => o.status === 'delivered')

  const shown = tab === 'pending' ? pending : tab === 'out' ? outForDel : done

  // Today's cash collected
  const todayCash = orders.filter(o =>
    o.status === 'delivered' &&
    o.payment_method === 'cod' &&
    o.payment_status === 'paid' &&
    o.created_at?.startsWith(new Date().toISOString().split('T')[0])
  ).reduce((s,o) => s + Number(o.total_amount || 0), 0)

  return (
    <div style={{ minHeight:'100vh', background:G.surface, fontFamily:"'Inter',sans-serif" }}>

      {/* Header */}
      <header style={{ background:G.green, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>🚚</span>
          <div>
            <p style={{ color:G.white, fontWeight:700, margin:0, fontSize:15 }}>GVR Delivery</p>
            <p style={{ color:'rgba(255,255,255,0.65)', margin:0, fontSize:11 }}>{user?.full_name || user?.username}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={load} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, padding:'5px 12px', color:G.white, fontSize:12, fontWeight:600, cursor:'pointer' }}>↻</button>
          <button onClick={async()=>{ await signOut(); navigate('/login') }} style={{ background:G.redLight, border:'none', borderRadius:8, padding:'5px 12px', color:G.red, fontSize:12, fontWeight:700, cursor:'pointer' }}>↩ Logout</button>
        </div>
      </header>

      {/* Summary cards */}
      <div style={{ padding:'14px 16px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
          {[
            { label:'To Pack',     value:pending.length,   color:G.amber,  bg:G.amberLight,  icon:'📦' },
            { label:'Out for Del', value:outForDel.length, color:G.blue,   bg:G.blueLight,   icon:'🚚' },
            { label:'Delivered',   value:done.length,      color:G.green,  bg:G.greenLight,  icon:'✅' },
            { label:"Today's Cash", value:`₹${todayCash.toLocaleString('en-IN')}`, color:G.green2, bg:G.greenLight, icon:'💵' },
          ].map(s=>(
            <div key={s.label} style={{ background:G.white, borderRadius:12, padding:'10px 10px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`3px solid ${s.color}`, textAlign:'center' }}>
              <p style={{ margin:'0 0 3px', fontSize:16 }}>{s.icon}</p>
              <p style={{ margin:'0 0 2px', fontSize:s.label==="Today's Cash"?13:20, fontWeight:800, color:s.color }}>{s.value}</p>
              <p style={{ margin:0, fontSize:9, color:G.muted, lineHeight:1.3 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:14 }}>
          {[
            ['pending', `📦 To Pack (${pending.length})`],
            ['out',     `🚚 Out (${outForDel.length})`],
            ['done',    `✅ Done (${done.length})`],
          ].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{ flex:1, padding:'8px 4px', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background:tab===key?G.green:'#F3F4F6', color:tab===key?G.white:G.muted }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p style={{ textAlign:'center', color:G.muted, padding:40 }}>Loading orders...</p>}

      {!loading && shown.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:G.muted }}>
          <p style={{ fontSize:36, marginBottom:8 }}>
            {tab==='pending'?'📦':tab==='out'?'🚚':'✅'}
          </p>
          <p style={{ fontWeight:600, color:G.text, margin:'0 0 4px' }}>No orders here</p>
        </div>
      )}

      <div style={{ padding:'0 16px 80px', display:'flex', flexDirection:'column', gap:12 }}>
        {shown.map(order => {
          const isCOD        = order.payment_method === 'cod'
          const cashPending  = isCOD && order.payment_status !== 'paid'
          const cashDone     = isCOD && order.payment_status === 'paid'

          return (
            <div key={order.id} style={{ background:G.white, borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:`1px solid ${cashPending?G.amber:G.border}` }}>

              {/* COD alert banner */}
              {cashPending && (
                <div style={{ background:G.amberLight, padding:'8px 14px', display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${G.amber}40` }}>
                  <span style={{ fontSize:16 }}>💵</span>
                  <p style={{ margin:0, fontSize:12, color:G.amber, fontWeight:700 }}>COD — Collect ₹{Number(order.total_amount).toLocaleString('en-IN')} in cash</p>
                </div>
              )}
              {cashDone && (
                <div style={{ background:G.greenLight, padding:'8px 14px', display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid #97C459` }}>
                  <span style={{ fontSize:16 }}>✅</span>
                  <p style={{ margin:0, fontSize:12, color:G.greenDark, fontWeight:700 }}>Cash Collected — ₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                </div>
              )}
              {!isCOD && order.payment_status === 'paid' && (
                <div style={{ background:G.greenLight, padding:'6px 14px', borderBottom:`1px solid #97C459` }}>
                  <p style={{ margin:0, fontSize:11, color:G.green, fontWeight:600 }}>✅ UPI Paid — No cash collection needed</p>
                </div>
              )}

              <div style={{ padding:'14px 16px' }}>
                {/* Order header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:15, color:G.green }}>{order.order_number}</p>
                    <p style={{ margin:'0 0 3px', fontSize:13, fontWeight:600, color:G.text }}>{order.customer_name}</p>
                    <p style={{ margin:0, fontSize:12, color:G.muted }}>{new Date(order.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} · {new Date(order.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ margin:'0 0 4px', fontWeight:800, fontSize:16, color:G.green }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
                      background:order.status==='delivered'?G.greenLight:order.status==='dispatched'?'#EDE9FE':G.amberLight,
                      color:order.status==='delivered'?G.green:order.status==='dispatched'?'#7C3AED':G.amber
                    }}>
                      {order.status?.charAt(0).toUpperCase()+order.status?.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                  {(order.order_items||[]).map((item,i)=>(
                    <span key={i} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:G.greenLight, color:G.greenDark, fontWeight:600 }}>
                      🌾 {item.name} × {item.quantity}
                    </span>
                  ))}
                </div>

                {/* Address */}
                <div style={{ background:'#F9FAF7', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
                  <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.5px' }}>Delivery Address</p>
                  <p style={{ margin:0, fontSize:13, color:G.text, lineHeight:1.5 }}>{order.delivery_address || '—'}</p>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {/* Navigate */}
                  {order.delivery_address && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`}
                      target="_blank" rel="noreferrer"
                      style={{ flex:1, padding:'9px', background:G.blueLight, border:'none', borderRadius:9, fontSize:12, fontWeight:700, color:G.blue, textAlign:'center', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                      🗺 Navigate
                    </a>
                  )}

                  {/* Status actions */}
                  {order.status==='confirmed' && (
                    <button onClick={()=>updateStatus(order.id,'packed')} style={{ flex:1, padding:'9px', background:G.blueLight, border:'none', borderRadius:9, fontSize:12, fontWeight:700, color:G.blue, cursor:'pointer' }}>
                      📦 Mark Packed
                    </button>
                  )}
                  {order.status==='packed' && (
                    <button onClick={()=>updateStatus(order.id,'dispatched')} style={{ flex:1, padding:'9px', background:'#EDE9FE', border:'none', borderRadius:9, fontSize:12, fontWeight:700, color:'#7C3AED', cursor:'pointer' }}>
                      🚚 Out for Delivery
                    </button>
                  )}
                  {order.status==='dispatched' && !cashPending && (
                    <button onClick={()=>updateStatus(order.id,'delivered')} style={{ flex:1, padding:'9px', background:G.greenLight, border:'none', borderRadius:9, fontSize:12, fontWeight:700, color:G.green, cursor:'pointer' }}>
                      ✅ Mark Delivered
                    </button>
                  )}

                  {/* COD Cash Collection — main action */}
                  {cashPending && order.status==='dispatched' && (
                    <button onClick={()=>markCashCollected(order)}
                      style={{ flex:2, padding:'11px', background:G.amber, border:'none', borderRadius:9, fontSize:13, fontWeight:700, color:G.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:`0 3px 10px ${G.amber}44` }}>
                      💵 Collect ₹{Number(order.total_amount).toLocaleString('en-IN')} Cash
                    </button>
                  )}
                  {cashPending && order.status!=='dispatched' && (
                    <button onClick={()=>markCashCollected(order)}
                      style={{ flex:1, padding:'9px', background:G.amberLight, border:`1px solid ${G.amber}`, borderRadius:9, fontSize:12, fontWeight:700, color:G.amber, cursor:'pointer' }}>
                      💵 Mark Cash Collected
                    </button>
                  )}
                </div>

                {/* Notes */}
                {order.notes && (
                  <p style={{ margin:'10px 0 0', fontSize:11, color:G.muted, fontStyle:'italic' }}>📝 {order.notes}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

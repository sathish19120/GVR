import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',purple:'#7C3AED',purpleLight:'#EDE9FE',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const inp = {
  width:'100%', padding:'10px 12px', borderRadius:10,
  border:`1.5px solid ${G.border}`, fontSize:13,
  color:'#111827', outline:'none', background:'#FAFAFA', boxSizing:'border-box',
}

const FREQ = [
  { key:'weekly',    label:'Every Week',     days:7,  badge:'Most Fresh',  color:G.green },
  { key:'biweekly',  label:'Every 2 Weeks',  days:14, badge:'Popular',     color:G.blue  },
  { key:'monthly',   label:'Every Month',    days:30, badge:'Best Value',  color:G.amber },
]

// ── Subscribe Modal ───────────────────────────────────────
function SubscribeModal({ product, onClose, onSaved }) {
  const { user } = useAuth()
  const [qty, setQty]           = useState(1)
  const [freq, setFreq]         = useState('monthly')
  const [address, setAddress]   = useState(user?.address || '')
  const [phone, setPhone]       = useState(user?.phone || '')
  const [payMethod, setPay]     = useState('upi')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const freqObj     = FREQ.find(f=>f.key===freq)
  const discount    = freq === 'weekly' ? 3 : freq === 'biweekly' ? 4 : 5
  const origPrice   = product.price_per_bag * qty
  const discounted  = Math.round(origPrice * (1 - discount/100))
  const saving_amt  = origPrice - discounted
  const nextDate    = new Date(); nextDate.setDate(nextDate.getDate() + freqObj.days)

  async function save() {
    if (!address.trim()) { setError('Please enter delivery address'); return }
    setSaving(true); setError('')
    try {
      const { error: err } = await supabase.from('subscriptions').insert({
        customer_id:    user.id,
        customer_name:  user.full_name || user.username,
        product_id:     product.id,
        product_name:   product.name,
        quantity_bags:  qty,
        frequency:      freq,
        next_order_date: nextDate.toISOString().split('T')[0],
        discount_pct:   discount,
        status:         'active',
        address,
        phone,
        payment_method: payMethod,
        created_at:     new Date().toISOString()
      })
      if (err) throw err
      onSaved(); onClose()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:460,padding:26,maxHeight:'92vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
          <h3 style={{ margin:0,fontSize:17,fontWeight:700 }}>Subscribe — {product.name}</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>
        {error && <div style={{ background:G.redLight,border:`1px solid #FECACA`,borderRadius:8,padding:'8px 12px',marginBottom:12,color:G.red,fontSize:12 }}>{error}</div>}

        {/* Frequency */}
        <p style={{ margin:'0 0 10px',fontSize:12,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px' }}>Delivery Frequency</p>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16 }}>
          {FREQ.map(f => (
            <div key={f.key} onClick={()=>setFreq(f.key)} style={{ padding:'12px 8px',borderRadius:12,cursor:'pointer',border:`2px solid ${freq===f.key?f.color:G.border}`,background:freq===f.key?f.color+'18':G.white,textAlign:'center' }}>
              <p style={{ margin:'0 0 4px',fontSize:11,fontWeight:700,color:freq===f.key?f.color:G.text }}>{f.label}</p>
              <span style={{ fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:20,background:f.color+'22',color:f.color }}>{f.badge}</span>
            </div>
          ))}
        </div>

        {/* Quantity */}
        <p style={{ margin:'0 0 8px',fontSize:12,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px' }}>Quantity per delivery</p>
        <div style={{ display:'flex',alignItems:'center',gap:0,border:`2px solid ${G.green}`,borderRadius:12,overflow:'hidden',width:'fit-content',marginBottom:16 }}>
          <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:44,height:44,border:'none',background:'none',cursor:'pointer',fontSize:22,color:G.green,fontWeight:700 }}>−</button>
          <span style={{ width:60,textAlign:'center',fontSize:16,fontWeight:800,color:G.text }}>{qty}</span>
          <button onClick={()=>setQty(q=>q+1)} style={{ width:44,height:44,border:'none',background:'none',cursor:'pointer',fontSize:22,color:G.green,fontWeight:700 }}>+</button>
          <span style={{ padding:'0 14px',fontSize:13,color:G.muted }}>{qty} bag{qty>1?'s':''} · {qty*product.weight_kg}kg</span>
        </div>

        {/* Savings */}
        <div style={{ background:G.greenLight,borderRadius:12,padding:'14px 16px',marginBottom:16,border:`1px solid #97C459` }}>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
            <span style={{ fontSize:13,color:G.muted,textDecoration:'line-through' }}>Regular price: ₹{origPrice}</span>
            <span style={{ fontSize:13,color:G.green,fontWeight:700 }}>You save: ₹{saving_amt}</span>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <span style={{ fontSize:16,fontWeight:800,color:G.greenDark }}>₹{discounted} per delivery</span>
            <span style={{ fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:20,background:G.green,color:G.white }}>{discount}% OFF</span>
          </div>
          <p style={{ margin:'8px 0 0',fontSize:12,color:G.green2 }}>
            Next delivery: {nextDate.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'long'})}
          </p>
        </div>

        {/* Address */}
        <p style={{ margin:'0 0 8px',fontSize:12,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px' }}>Delivery Address *</p>
        <textarea value={address} onChange={e=>setAddress(e.target.value)} rows={2} placeholder="House/flat, street, area, landmark"
          style={{ ...inp,resize:'none',fontFamily:'inherit',marginBottom:10 }}
          onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
        <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number"
          style={{ ...inp,marginBottom:16 }}
          onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />

        {/* Payment */}
        <p style={{ margin:'0 0 8px',fontSize:12,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px' }}>Payment Method</p>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20 }}>
          {[['upi','📱','UPI Auto-pay'],['cod','💵','Cash on Delivery']].map(([val,icon,label])=>(
            <div key={val} onClick={()=>setPay(val)} style={{ padding:'10px',borderRadius:10,cursor:'pointer',border:`2px solid ${payMethod===val?G.green:G.border}`,background:payMethod===val?G.greenLight:G.white,textAlign:'center' }}>
              <p style={{ margin:'0 0 2px',fontSize:16 }}>{icon}</p>
              <p style={{ margin:0,fontSize:12,fontWeight:600,color:payMethod===val?G.greenDark:G.text }}>{label}</p>
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving} style={{ width:'100%',padding:13,background:saving?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer' }}>
          {saving ? 'Subscribing...' : `✅ Start Subscription — ₹${discounted}/${freq==='monthly'?'month':freq==='biweekly'?'2 weeks':'week'}`}
        </button>
        <p style={{ margin:'10px 0 0',fontSize:11,color:G.muted,textAlign:'center' }}>Cancel anytime. No lock-in period.</p>
      </div>
    </div>
  )
}

// ── Main SubscriptionPage ─────────────────────────────────
export default function SubscriptionPage() {
  const { user } = useAuth()
  const [products, setProducts]   = useState([])
  const [mySubs, setMySubs]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('browse')
  const [subscribeModal, setSub]  = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [pRes, sRes] = await Promise.all([
      supabase.from('products').select('*').eq('active', true).order('weight_kg'),
      supabase.from('subscriptions').select('*').eq('customer_id', user.id).order('created_at', { ascending: false }),
    ])
    setProducts(pRes.data || [])
    setMySubs(sRes.data || [])
    setLoading(false)
  }

  async function updateSub(id, status) {
    await supabase.from('subscriptions').update({ status }).eq('id', id)
    setMySubs(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'}) : '—'
  const activeSubs = mySubs.filter(s => s.status === 'active')

  if (loading) return <div style={{ textAlign:'center',padding:60,color:G.muted }}>Loading...</div>

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", maxWidth:600, margin:'0 auto' }}>
      {subscribeModal && <SubscribeModal product={subscribeModal} onClose={()=>setSub(null)} onSaved={load} />}

      {/* Active subscription summary */}
      {activeSubs.length > 0 && (
        <div style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`, borderRadius:16, padding:'18px 22px', marginBottom:16, color:G.white }}>
          <p style={{ margin:'0 0 4px', fontSize:13, color:'rgba(255,255,255,0.7)' }}>Active Subscriptions</p>
          <p style={{ margin:'0 0 12px', fontSize:30, fontWeight:800 }}>{activeSubs.length} plan{activeSubs.length>1?'s':''}</p>
          <div style={{ display:'flex', gap:10 }}>
            {activeSubs.slice(0,2).map(s=>(
              <div key={s.id} style={{ background:'rgba(255,255,255,0.15)', borderRadius:10, padding:'8px 12px', flex:1 }}>
                <p style={{ margin:'0 0 2px', fontSize:12, color:'rgba(255,255,255,0.8)', fontWeight:600 }}>{s.product_name}</p>
                <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.6)' }}>Next: {fmtDate(s.next_order_date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16 }}>
        {[['browse','🛒 Subscribe'],['mysubs',`📋 My Subscriptions (${mySubs.length})`]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{ padding:'8px 18px',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,background:tab===key?G.green:G.white,color:tab===key?G.white:G.muted,boxShadow:tab===key?'none':'0 1px 4px rgba(0,0,0,0.06)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Browse products to subscribe */}
      {tab === 'browse' && (
        <>
          <div style={{ background:G.blueLight,borderRadius:12,padding:'12px 16px',marginBottom:14,display:'flex',gap:10,alignItems:'center' }}>
            <span style={{ fontSize:18 }}>💡</span>
            <p style={{ margin:0,fontSize:12,color:G.blue,lineHeight:1.6 }}>
              Subscribe and save! Get <strong>3–5% off</strong> on every order. Auto-delivered to your door. Cancel anytime.
            </p>
          </div>

          {products.map(p => (
            <div key={p.id} style={{ background:G.white,borderRadius:14,padding:18,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex',gap:14,alignItems:'center',marginBottom:12 }}>
                <div style={{ width:52,height:52,borderRadius:12,background:G.greenLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0 }}>🌾</div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:15 }}>{p.name}</p>
                  <p style={{ margin:0,fontSize:12,color:G.muted }}>{p.weight_kg}kg bag · {p.name_telugu}</p>
                  <p style={{ margin:'3px 0 0',fontWeight:800,fontSize:16,color:G.text }}>₹{p.price_per_bag} <span style={{ fontSize:11,color:G.muted,fontWeight:400 }}>/bag regular</span></p>
                </div>
              </div>

              {/* Subscription options preview */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12 }}>
                {FREQ.map(f => {
                  const disc = f.key==='weekly'?3:f.key==='biweekly'?4:5
                  const price = Math.round(p.price_per_bag*(1-disc/100))
                  return (
                    <div key={f.key} style={{ background:'#F9FAF7',borderRadius:10,padding:'10px 8px',textAlign:'center',border:`1px solid ${G.border}` }}>
                      <p style={{ margin:'0 0 3px',fontSize:10,fontWeight:700,color:G.muted,textTransform:'uppercase' }}>{f.label}</p>
                      <p style={{ margin:'0 0 3px',fontSize:15,fontWeight:800,color:G.green }}>₹{price}</p>
                      <span style={{ fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:20,background:f.color+'22',color:f.color }}>{disc}% off</span>
                    </div>
                  )
                })}
              </div>

              <button onClick={()=>setSub(p)} style={{ width:'100%',padding:11,background:G.green,color:G.white,border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                <span>🔄</span> Subscribe & Save
              </button>
            </div>
          ))}
        </>
      )}

      {/* My Subscriptions */}
      {tab === 'mysubs' && (
        <>
          {mySubs.length === 0 && (
            <div style={{ textAlign:'center',padding:'50px 20px',background:G.white,borderRadius:14,color:G.muted }}>
              <div style={{ fontSize:40,marginBottom:10 }}>🔄</div>
              <p style={{ fontWeight:600,color:G.text,margin:'0 0 4px' }}>No subscriptions yet</p>
              <p style={{ fontSize:13,margin:'0 0 16px' }}>Subscribe to get fresh rice auto-delivered</p>
              <button onClick={()=>setTab('browse')} style={{ background:G.green,color:G.white,border:'none',borderRadius:10,padding:'10px 24px',fontWeight:700,cursor:'pointer' }}>Browse Plans</button>
            </div>
          )}

          {mySubs.map(s => (
            <div key={s.id} style={{ background:G.white,borderRadius:14,padding:18,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.status==='active'?G.green:s.status==='paused'?G.amber:G.red}` }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
                <div>
                  <p style={{ margin:'0 0 3px',fontWeight:700,fontSize:15 }}>{s.product_name}</p>
                  <p style={{ margin:'0 0 3px',fontSize:12,color:G.muted }}>{s.quantity_bags} bag{s.quantity_bags>1?'s':''} · {FREQ.find(f=>f.key===s.frequency)?.label || s.frequency}</p>
                  <p style={{ margin:0,fontSize:13,fontWeight:700,color:G.green }}>₹{s.discount_pct}% off every delivery</p>
                </div>
                <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:s.status==='active'?G.greenLight:s.status==='paused'?G.amberLight:G.redLight,color:s.status==='active'?G.green:s.status==='paused'?G.amber:G.red,textTransform:'capitalize' }}>
                  {s.status}
                </span>
              </div>

              {s.status === 'active' && (
                <div style={{ background:G.greenLight,borderRadius:10,padding:'10px 14px',marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <div>
                    <p style={{ margin:'0 0 2px',fontSize:11,color:G.muted }}>Next Delivery</p>
                    <p style={{ margin:0,fontWeight:700,fontSize:14,color:G.greenDark }}>{fmtDate(s.next_order_date)}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ margin:'0 0 2px',fontSize:11,color:G.muted }}>Total orders</p>
                    <p style={{ margin:0,fontWeight:700,fontSize:14,color:G.green }}>{s.total_orders}</p>
                  </div>
                </div>
              )}

              <p style={{ margin:'0 0 10px',fontSize:12,color:G.muted }}>📍 {s.address?.slice(0,50)}{(s.address?.length||0)>50?'…':''}</p>

              <div style={{ display:'flex',gap:8 }}>
                {s.status === 'active' && (
                  <button onClick={()=>updateSub(s.id,'paused')} style={{ flex:1,padding:'8px',background:G.amberLight,border:'none',borderRadius:9,fontSize:12,fontWeight:700,color:G.amber,cursor:'pointer' }}>
                    ⏸ Pause
                  </button>
                )}
                {s.status === 'paused' && (
                  <button onClick={()=>updateSub(s.id,'active')} style={{ flex:1,padding:'8px',background:G.greenLight,border:'none',borderRadius:9,fontSize:12,fontWeight:700,color:G.green,cursor:'pointer' }}>
                    ▶ Resume
                  </button>
                )}
                {s.status !== 'cancelled' && (
                  <button onClick={()=>{ if(window.confirm('Cancel this subscription?')) updateSub(s.id,'cancelled') }} style={{ flex:1,padding:'8px',background:G.redLight,border:'none',borderRadius:9,fontSize:12,fontWeight:700,color:G.red,cursor:'pointer' }}>
                    ✕ Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

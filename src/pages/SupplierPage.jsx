import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',purple:'#7C3AED',purpleLight:'#EDE9FE',
  teal:'#0E7490',tealLight:'#ECFEFF',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const inp = {
  width:'100%', padding:'10px 12px', borderRadius:10,
  border:`1.5px solid ${G.border}`, fontSize:13,
  color:G.text, outline:'none', background:'#FAFAFA',
  boxSizing:'border-box',
}

const TYPES     = ['Rice Mill','Farmer','Packager','Wholesaler','Transport']
const VARIETIES = ['Sona Masoori','Basmati','Ponni','Raw Rice','Boiled Rice','Other']
const DISTRICTS = ['Nalgonda','Khammam','Warangal','Kurnool','Guntur','Krishna','Prakasam','Nellore','Karimnagar','Nizamabad']
const AGREEMENT_STATUS = ['none','negotiating','signed','expired']
const AGREEMENT_COLORS = {
  none:       [G.muted,  '#F3F4F6'],
  negotiating:[G.amber,  G.amberLight],
  signed:     [G.green,  G.greenLight],
  expired:    [G.red,    G.redLight],
}

// ── Star Rating ───────────────────────────────────────────
function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onClick={() => onChange && onChange(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ fontSize:size, cursor:onChange?'pointer':'default', color:(hover||value)>=s?'#F59E0B':'#D1D5DB', transition:'color 0.1s' }}>★</span>
      ))}
    </div>
  )
}

// ── Add/Edit Supplier Modal ───────────────────────────────
function SupplierModal({ supplier, onClose, onSaved }) {
  const isEdit = !!supplier
  const [form, setForm] = useState({
    name:             supplier?.name || '',
    type:             supplier?.type || 'Rice Mill',
    contact_name:     supplier?.contact_name || '',
    phone:            supplier?.phone || '',
    email:            supplier?.email || '',
    location:         supplier?.location || '',
    district:         supplier?.district || '',
    state:            supplier?.state || 'Telangana',
    fssai_no:         supplier?.fssai_no || '',
    gst_no:           supplier?.gst_no || '',
    varieties:        supplier?.varieties || [],
    min_order_bags:   supplier?.min_order_bags || '',
    price_per_bag:    supplier?.price_per_bag || '',
    quality_rating:   supplier?.quality_rating || 0,
    payment_terms:    supplier?.payment_terms || '',
    delivery_days:    supplier?.delivery_days || 2,
    notes:            supplier?.notes || '',
    agreement_date:   supplier?.agreement_date || '',
    agreement_status: supplier?.agreement_status || 'none',
    active:           supplier?.active !== false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const toggleVariety = (v) => {
    const arr = form.varieties || []
    set('varieties', arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v])
  }

  async function save() {
    if (!form.name.trim()) { setError('Supplier name is required'); return }
    setSaving(true); setError('')
    try {
      const payload = { ...form, min_order_bags: parseInt(form.min_order_bags)||0, price_per_bag: parseFloat(form.price_per_bag)||null, delivery_days: parseInt(form.delivery_days)||2 }
      if (isEdit) {
        const { error: err } = await supabase.from('suppliers').update(payload).eq('id', supplier.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('suppliers').insert({ ...payload, created_at: new Date().toISOString() })
        if (err) throw err
      }
      onSaved(); onClose()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const F = ({ label, children }) => (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.muted, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>{label}</label>
      {children}
    </div>
  )

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20,overflowY:'auto' }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:580,padding:28,maxHeight:'92vh',overflowY:'auto',margin:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:700 }}>{isEdit?'Edit Supplier':'Add New Supplier'}</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>
        {error && <div style={{ background:G.redLight,border:`1px solid #FECACA`,borderRadius:10,padding:'10px 14px',marginBottom:14,color:G.red,fontSize:13 }}>{error}</div>}

        <div style={{ display:'grid',gap:14 }}>
          {/* Basic info */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <F label="Supplier Name *">
              <input type="text" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Mill / Farmer name" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </F>
            <F label="Type">
              <select value={form.type} onChange={e=>set('type',e.target.value)} style={{ ...inp,cursor:'pointer' }}>
                {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </F>
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <F label="Contact Person">
              <input type="text" value={form.contact_name} onChange={e=>set('contact_name',e.target.value)} placeholder="Name" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </F>
            <F label="Phone">
              <input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="Mobile number" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </F>
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <F label="District">
              <select value={form.district} onChange={e=>set('district',e.target.value)} style={{ ...inp,cursor:'pointer' }}>
                <option value="">Select district...</option>
                {DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </F>
            <F label="Location / Village">
              <input type="text" value={form.location} onChange={e=>set('location',e.target.value)} placeholder="Village / Town" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </F>
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <F label="FSSAI License No.">
              <input type="text" value={form.fssai_no} onChange={e=>set('fssai_no',e.target.value)} placeholder="FSSAI number" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </F>
            <F label="GST Number">
              <input type="text" value={form.gst_no} onChange={e=>set('gst_no',e.target.value)} placeholder="GST number" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </F>
          </div>

          {/* Rice varieties */}
          <F label="Rice Varieties Supplied">
            <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginTop:4 }}>
              {VARIETIES.map(v=>(
                <button key={v} type="button" onClick={()=>toggleVariety(v)} style={{
                  padding:'5px 12px',borderRadius:20,border:`1.5px solid ${form.varieties?.includes(v)?G.green:G.border}`,
                  background:form.varieties?.includes(v)?G.greenLight:G.white,
                  cursor:'pointer',fontSize:12,fontWeight:600,
                  color:form.varieties?.includes(v)?G.greenDark:G.muted
                }}>{v}</button>
              ))}
            </div>
          </F>

          {/* Commercial terms */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
            <F label="Min Order (Bags)">
              <input type="number" min={0} value={form.min_order_bags} onChange={e=>set('min_order_bags',e.target.value)} placeholder="0" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </F>
            <F label="Price/Bag (₹)">
              <input type="number" min={0} value={form.price_per_bag} onChange={e=>set('price_per_bag',e.target.value)} placeholder="₹0.00" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </F>
            <F label="Delivery Days">
              <input type="number" min={1} max={30} value={form.delivery_days} onChange={e=>set('delivery_days',e.target.value)} placeholder="2" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </F>
          </div>

          <F label="Payment Terms">
            <input type="text" value={form.payment_terms} onChange={e=>set('payment_terms',e.target.value)} placeholder="e.g. 50% advance, 50% on delivery" style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </F>

          {/* Quality rating */}
          <F label="Quality Rating">
            <div style={{ marginTop:4 }}>
              <StarRating value={form.quality_rating} onChange={v=>set('quality_rating',v)} size={24} />
            </div>
          </F>

          {/* Agreement */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <F label="Agreement Status">
              <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                {AGREEMENT_STATUS.map(s=>{
                  const [color, bg] = AGREEMENT_COLORS[s]
                  return (
                    <button key={s} type="button" onClick={()=>set('agreement_status',s)} style={{
                      padding:'6px 12px',borderRadius:20,border:`1.5px solid ${form.agreement_status===s?color:G.border}`,
                      background:form.agreement_status===s?bg:G.white,
                      cursor:'pointer',fontSize:11,fontWeight:600,
                      color:form.agreement_status===s?color:G.muted,
                      textTransform:'capitalize'
                    }}>{s}</button>
                  )
                })}
              </div>
            </F>
            <F label="Agreement Date">
              <input type="date" value={form.agreement_date} onChange={e=>set('agreement_date',e.target.value)} style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </F>
          </div>

          <F label="Notes">
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2}
              placeholder="Quality notes, visit observations, special conditions..."
              style={{ ...inp,resize:'none',fontFamily:'inherit' }}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </F>

          {isEdit && (
            <F label="Status">
              <div style={{ display:'flex',gap:8 }}>
                {[true,false].map(v=>(
                  <button key={String(v)} type="button" onClick={()=>set('active',v)} style={{
                    flex:1,padding:'9px',borderRadius:9,border:`2px solid ${form.active===v?(v?G.green:G.red):G.border}`,
                    background:form.active===v?(v?G.greenLight:G.redLight):G.white,
                    cursor:'pointer',fontSize:12,fontWeight:600,
                    color:form.active===v?(v?G.green:G.red):G.muted
                  }}>{v?'✓ Active':'✕ Inactive'}</button>
                ))}
              </div>
            </F>
          )}
        </div>

        <button type="button" onClick={save} disabled={saving} style={{ width:'100%',marginTop:20,padding:13,background:saving?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer' }}>
          {saving ? 'Saving...' : isEdit ? '✓ Save Changes' : '+ Add Supplier'}
        </button>
      </div>
    </div>
  )
}

// ── Quality Log Modal ─────────────────────────────────────
function QualityModal({ supplier, onClose, onSaved }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ batch_no:'', product_name:'', bags_received:'', broken_pct:'', moisture_pct:'', quality_score:4, issues:'' })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.bags_received) return
    setSaving(true)
    try {
      await supabase.from('supplier_quality_logs').insert({
        supplier_id:    supplier.id,
        supplier_name:  supplier.name,
        batch_no:       form.batch_no||null,
        product_name:   form.product_name||null,
        bags_received:  parseInt(form.bags_received),
        broken_pct:     parseFloat(form.broken_pct)||null,
        moisture_pct:   parseFloat(form.moisture_pct)||null,
        quality_score:  form.quality_score,
        issues:         form.issues||null,
        checked_by:     user?.full_name||user?.username||null,
        checked_at:     new Date().toISOString()
      })
      // Update supplier quality rating average
      const { data: logs } = await supabase.from('supplier_quality_logs').select('quality_score').eq('supplier_id', supplier.id)
      if (logs && logs.length > 0) {
        const avg = (logs.reduce((s,l)=>s+l.quality_score,0)/logs.length).toFixed(1)
        await supabase.from('suppliers').update({ quality_rating: parseFloat(avg) }).eq('id', supplier.id)
      }
      onSaved(); onClose()
    } catch(e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const s = (k,v) => setForm(prev=>({...prev,[k]:v}))

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:150,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:440,padding:26 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
          <h3 style={{ margin:0,fontSize:17,fontWeight:700 }}>Log Quality Check</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>
        <p style={{ margin:'0 0 16px',fontSize:13,color:G.muted }}>Supplier: <strong style={{ color:G.text }}>{supplier.name}</strong></p>
        <div style={{ display:'grid',gap:12 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Batch No.</label>
              <input type="text" value={form.batch_no} onChange={e=>s('batch_no',e.target.value)} placeholder="GVR-..." style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Product</label>
              <input type="text" value={form.product_name} onChange={e=>s('product_name',e.target.value)} placeholder="Sona Masoori..." style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Bags Received *</label>
            <input type="number" min={1} value={form.bags_received} onChange={e=>s('bags_received',e.target.value)} placeholder="No. of bags" style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Broken Rice %</label>
              <input type="number" min={0} max={100} step={0.1} value={form.broken_pct} onChange={e=>s('broken_pct',e.target.value)} placeholder="e.g. 3.5" style={{ ...inp, borderColor: form.broken_pct > 5 ? G.red : G.border }} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=form.broken_pct>5?G.red:G.border} />
              {form.broken_pct > 5 && <p style={{ margin:'3px 0 0',fontSize:11,color:G.red }}>⚠ Above 5% threshold</p>}
            </div>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Moisture %</label>
              <input type="number" min={0} max={100} step={0.1} value={form.moisture_pct} onChange={e=>s('moisture_pct',e.target.value)} placeholder="e.g. 13.5" style={{ ...inp, borderColor: form.moisture_pct > 14 ? G.red : G.border }} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=form.moisture_pct>14?G.red:G.border} />
              {form.moisture_pct > 14 && <p style={{ margin:'3px 0 0',fontSize:11,color:G.red }}>⚠ Above 14% limit</p>}
            </div>
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Quality Score</label>
            <StarRating value={form.quality_score} onChange={v=>s('quality_score',v)} size={28} />
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Issues Found</label>
            <input type="text" value={form.issues} onChange={e=>s('issues',e.target.value)} placeholder="e.g. Slight discoloration, good aroma..." style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
        </div>
        <button type="button" onClick={save} disabled={saving||!form.bags_received} style={{ width:'100%',marginTop:18,padding:12,background:saving||!form.bags_received?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer' }}>
          {saving ? 'Saving...' : '✓ Save Quality Log'}
        </button>
      </div>
    </div>
  )
}

// ── Visit Modal ───────────────────────────────────────────
function VisitModal({ supplier, onClose, onSaved }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ visit_date: new Date().toISOString().split('T')[0], visit_type:'visit', outcome:'', next_followup:'' })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await supabase.from('supplier_visits').insert({
        supplier_id:    supplier.id,
        supplier_name:  supplier.name,
        visit_date:     form.visit_date,
        visit_type:     form.visit_type,
        outcome:        form.outcome||null,
        next_followup:  form.next_followup||null,
        done_by:        user?.full_name||user?.username||null,
        created_at:     new Date().toISOString()
      })
      onSaved(); onClose()
    } catch(e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const s = (k,v) => setForm(prev=>({...prev,[k]:v}))

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:150,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:420,padding:26 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
          <h3 style={{ margin:0,fontSize:17,fontWeight:700 }}>Log Visit / Follow-up</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>
        <p style={{ margin:'0 0 16px',fontSize:13,color:G.muted }}>Supplier: <strong style={{ color:G.text }}>{supplier.name}</strong></p>
        <div style={{ display:'grid',gap:12 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Date</label>
              <input type="date" value={form.visit_date} onChange={e=>s('visit_date',e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Type</label>
              <select value={form.visit_type} onChange={e=>s('visit_type',e.target.value)} style={{ ...inp,cursor:'pointer' }}>
                {['visit','call','meeting','inspection'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Outcome / Notes</label>
            <textarea value={form.outcome} onChange={e=>s('outcome',e.target.value)} rows={3} placeholder="What was discussed, agreed, observed..." style={{ ...inp,resize:'none',fontFamily:'inherit' }} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:5 }}>Next Follow-up Date</label>
            <input type="date" value={form.next_followup} onChange={e=>s('next_followup',e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
        </div>
        <button type="button" onClick={save} disabled={saving} style={{ width:'100%',marginTop:18,padding:12,background:saving?'#9CA3AF':G.blue,color:G.white,border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer' }}>
          {saving ? 'Saving...' : '✓ Save Visit Log'}
        </button>
      </div>
    </div>
  )
}

// ── Main SupplierPage ─────────────────────────────────────
export default function SupplierPage() {
  const [suppliers, setSuppliers]   = useState([])
  const [quality, setQuality]       = useState([])
  const [visits, setVisits]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('suppliers')
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAdd, setShowAdd]       = useState(false)
  const [editSupplier, setEdit]     = useState(null)
  const [qualityModal, setQModal]   = useState(null)
  const [visitModal, setVModal]     = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [sRes, qRes, vRes] = await Promise.all([
      supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
      supabase.from('supplier_quality_logs').select('*').order('checked_at', { ascending: false }),
      supabase.from('supplier_visits').select('*').order('visit_date', { ascending: false }),
    ])
    setSuppliers(sRes.data || [])
    setQuality(qRes.data || [])
    setVisits(vRes.data || [])
    setLoading(false)
  }

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'

  const filtered = suppliers.filter(s => {
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.district?.toLowerCase().includes(search.toLowerCase()) || s.contact_name?.toLowerCase().includes(search.toLowerCase())
    const mt = typeFilter === 'all' || s.type === typeFilter
    return ms && mt
  })

  const typeColor = { 'Rice Mill': [G.green,G.greenLight], 'Farmer': [G.green2,G.greenLight], 'Packager': [G.blue,G.blueLight], 'Wholesaler': [G.amber,G.amberLight], 'Transport': [G.purple,G.purpleLight] }

  // Follow-ups due
  const today = new Date().toISOString().split('T')[0]
  const duefollowups = visits.filter(v => v.next_followup && v.next_followup <= today)

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      {showAdd    && <SupplierModal onClose={()=>setShowAdd(false)} onSaved={load} />}
      {editSupplier && <SupplierModal supplier={editSupplier} onClose={()=>setEdit(null)} onSaved={load} />}
      {qualityModal && <QualityModal supplier={qualityModal} onClose={()=>setQModal(null)} onSaved={load} />}
      {visitModal   && <VisitModal   supplier={visitModal}   onClose={()=>setVModal(null)} onSaved={load} />}

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12 }}>
        <div>
          <h2 style={{ margin:'0 0 4px',fontSize:18,fontWeight:700 }}>🏭 Supplier Management</h2>
          <p style={{ margin:0,fontSize:13,color:G.muted }}>Rice mills, farmers and packagers — track tie-ups, quality and visits</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{ background:G.green,color:G.white,border:'none',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer' }}>
          + Add Supplier
        </button>
      </div>

      {/* Follow-up alerts */}
      {duefollowups.length > 0 && (
        <div style={{ background:G.amberLight,border:`1px solid #FCD34D`,borderRadius:12,padding:'12px 16px',marginBottom:16,display:'flex',gap:10,alignItems:'center' }}>
          <span style={{ fontSize:18 }}>📅</span>
          <p style={{ margin:0,fontSize:13,color:G.amber,fontWeight:600 }}>
            {duefollowups.length} follow-up{duefollowups.length>1?'s':''} due — {duefollowups.map(v=>v.supplier_name).join(', ')}
          </p>
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20 }}>
        {[
          { label:'Total Suppliers', value:suppliers.length,                                      color:G.green,  icon:'🏭' },
          { label:'Active',          value:suppliers.filter(s=>s.active).length,                  color:G.green2, icon:'✅' },
          { label:'Signed Tie-ups',  value:suppliers.filter(s=>s.agreement_status==='signed').length, color:G.blue, icon:'📝' },
          { label:'Negotiating',     value:suppliers.filter(s=>s.agreement_status==='negotiating').length, color:G.amber, icon:'🤝' },
          { label:'Quality Checks',  value:quality.length,                                        color:G.purple, icon:'🔬' },
          { label:'Total Visits',    value:visits.length,                                         color:G.teal,   icon:'🚗' },
        ].map((s,i)=>(
          <div key={i} style={{ background:G.white,borderRadius:14,padding:'14px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.color}` }}>
            <div style={{ display:'flex',justifyContent:'space-between' }}>
              <div>
                <p style={{ margin:'0 0 5px',fontSize:11,color:G.muted }}>{s.label}</p>
                <p style={{ margin:0,fontSize:22,fontWeight:800,color:s.color }}>{s.value}</p>
              </div>
              <span style={{ fontSize:20 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:6,marginBottom:16,flexWrap:'wrap' }}>
        {[['suppliers','🏭 Suppliers'],['quality','🔬 Quality Logs'],['visits','📅 Visits & Follow-ups']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{ padding:'8px 18px',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,background:tab===key?G.green:G.white,color:tab===key?G.white:G.muted,boxShadow:tab===key?'none':'0 1px 4px rgba(0,0,0,0.06)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── SUPPLIERS TAB ── */}
      {tab === 'suppliers' && (
        <>
          <div style={{ display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center' }}>
            <div style={{ position:'relative',flex:1,minWidth:200 }}>
              <span style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:13,color:G.muted }}>🔍</span>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, district..."
                style={{ ...inp,paddingLeft:30 }} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div style={{ display:'flex',gap:4 }}>
              {['all',...TYPES].map(t=>(
                <button key={t} onClick={()=>setTypeFilter(t)} style={{ padding:'6px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,background:typeFilter===t?G.green:'#F3F4F6',color:typeFilter===t?G.white:G.muted }}>
                  {t==='all'?'All':t}
                </button>
              ))}
            </div>
          </div>

          {loading && <p style={{ textAlign:'center',color:G.muted,padding:40 }}>Loading...</p>}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:'center',padding:'50px 20px',background:G.white,borderRadius:14,color:G.muted }}>
              <div style={{ fontSize:40,marginBottom:10 }}>🏭</div>
              <p style={{ fontWeight:600,color:G.text,margin:'0 0 4px' }}>No suppliers yet</p>
              <p style={{ fontSize:13,margin:'0 0 16px' }}>Add your first rice mill or farmer</p>
              <button onClick={()=>setShowAdd(true)} style={{ background:G.green,color:G.white,border:'none',borderRadius:10,padding:'10px 24px',fontWeight:700,cursor:'pointer' }}>+ Add Supplier</button>
            </div>
          )}

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14 }}>
            {filtered.map(s => {
              const [tc, tbg] = typeColor[s.type] || [G.muted,'#F3F4F6']
              const [ac, abg] = AGREEMENT_COLORS[s.agreement_status] || [G.muted,'#F3F4F6']
              const sVisits   = visits.filter(v=>v.supplier_id===s.id)
              const sQuality  = quality.filter(q=>q.supplier_id===s.id)
              const lastVisit = sVisits[0]
              const nextFU    = sVisits.find(v=>v.next_followup && v.next_followup >= today)

              return (
                <div key={s.id} style={{ background:G.white,borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderTop:`4px solid ${tc}`,opacity:s.active?1:0.6 }}>
                  <div style={{ padding:'16px 18px' }}>
                    {/* Header */}
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
                      <div>
                        <p style={{ margin:'0 0 3px',fontWeight:700,fontSize:15,color:G.text }}>{s.name}</p>
                        <p style={{ margin:0,fontSize:12,color:G.muted }}>
                          {[s.location,s.district].filter(Boolean).join(', ') || '—'}
                        </p>
                      </div>
                      <div style={{ display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end' }}>
                        <span style={{ fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:20,background:tbg,color:tc }}>{s.type}</span>
                        <span style={{ fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:20,background:abg,color:ac,textTransform:'capitalize' }}>{s.agreement_status}</span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div style={{ marginBottom:10 }}>
                      <StarRating value={s.quality_rating||0} size={16} />
                    </div>

                    {/* Info grid */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12,fontSize:12 }}>
                      {s.contact_name && <div><span style={{ color:G.muted }}>👤 </span>{s.contact_name}</div>}
                      {s.phone && <div><span style={{ color:G.muted }}>📞 </span><a href={`tel:${s.phone}`} style={{ color:G.blue,textDecoration:'none' }}>{s.phone}</a></div>}
                      {s.district && <div><span style={{ color:G.muted }}>📍 </span>{s.district}</div>}
                      {s.delivery_days && <div><span style={{ color:G.muted }}>🚚 </span>{s.delivery_days}d delivery</div>}
                      {s.price_per_bag && <div><span style={{ color:G.muted }}>₹ </span>₹{s.price_per_bag}/bag</div>}
                      {s.min_order_bags > 0 && <div><span style={{ color:G.muted }}>📦 </span>Min {s.min_order_bags} bags</div>}
                      {s.fssai_no && <div style={{ gridColumn:'1/-1' }}><span style={{ color:G.muted }}>✅ FSSAI: </span>{s.fssai_no}</div>}
                    </div>

                    {/* Varieties */}
                    {s.varieties?.length > 0 && (
                      <div style={{ display:'flex',gap:4,flexWrap:'wrap',marginBottom:10 }}>
                        {s.varieties.map(v=>(
                          <span key={v} style={{ fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:G.greenLight,color:G.greenDark }}>{v}</span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div style={{ display:'flex',gap:8,marginBottom:12,fontSize:11,color:G.muted }}>
                      <span>🔬 {sQuality.length} checks</span>
                      <span>🚗 {sVisits.length} visits</span>
                      {lastVisit && <span>Last: {fmtDate(lastVisit.visit_date)}</span>}
                    </div>

                    {nextFU && (
                      <div style={{ background:G.amberLight,borderRadius:8,padding:'6px 10px',marginBottom:10,fontSize:11,color:G.amber,fontWeight:600 }}>
                        📅 Follow-up due: {fmtDate(nextFU.next_followup)}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6 }}>
                      <button onClick={()=>setEdit(s)} style={{ padding:'7px 4px',background:G.blueLight,border:'none',borderRadius:8,fontSize:11,fontWeight:700,color:G.blue,cursor:'pointer' }}>✏️ Edit</button>
                      <button onClick={()=>setQModal(s)} style={{ padding:'7px 4px',background:G.greenLight,border:'none',borderRadius:8,fontSize:11,fontWeight:700,color:G.green,cursor:'pointer' }}>🔬 Quality</button>
                      <button onClick={()=>setVModal(s)} style={{ padding:'7px 4px',background:G.purpleLight,border:'none',borderRadius:8,fontSize:11,fontWeight:700,color:G.purple,cursor:'pointer' }}>📅 Visit</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── QUALITY LOGS TAB ── */}
      {tab === 'quality' && (
        <div style={{ background:G.white,borderRadius:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F9FAF7' }}>
                  {['Date','Supplier','Product','Bags','Broken %','Moisture %','Score','Issues','Checked By'].map(h=>(
                    <th key={h} style={{ padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quality.map((q,i)=>(
                  <tr key={q.id} style={{ borderTop:`1px solid ${G.border}`,background:i%2?'#FAFAFA':G.white }}>
                    <td style={{ padding:'10px 12px',color:G.muted,fontSize:12,whiteSpace:'nowrap' }}>{fmtDate(q.checked_at)}</td>
                    <td style={{ padding:'10px 12px',fontWeight:600 }}>{q.supplier_name}</td>
                    <td style={{ padding:'10px 12px',color:G.text }}>{q.product_name||'—'}</td>
                    <td style={{ padding:'10px 12px',fontWeight:700,color:G.blue,textAlign:'center' }}>{q.bags_received}</td>
                    <td style={{ padding:'10px 12px',textAlign:'center' }}>
                      <span style={{ fontWeight:700,color:q.broken_pct>5?G.red:G.green }}>{q.broken_pct!=null?`${q.broken_pct}%`:'—'}</span>
                    </td>
                    <td style={{ padding:'10px 12px',textAlign:'center' }}>
                      <span style={{ fontWeight:700,color:q.moisture_pct>14?G.red:G.green }}>{q.moisture_pct!=null?`${q.moisture_pct}%`:'—'}</span>
                    </td>
                    <td style={{ padding:'10px 12px' }}><StarRating value={q.quality_score} size={14} /></td>
                    <td style={{ padding:'10px 12px',color:G.muted,fontSize:12,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{q.issues||'—'}</td>
                    <td style={{ padding:'10px 12px',color:G.muted,fontSize:12 }}>{q.checked_by||'—'}</td>
                  </tr>
                ))}
                {quality.length === 0 && <tr><td colSpan={9} style={{ padding:40,textAlign:'center',color:G.muted }}>No quality logs yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VISITS TAB ── */}
      {tab === 'visits' && (
        <div style={{ background:G.white,borderRadius:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F9FAF7' }}>
                  {['Date','Supplier','Type','Outcome','Next Follow-up','Done By'].map(h=>(
                    <th key={h} style={{ padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visits.map((v,i)=>(
                  <tr key={v.id} style={{ borderTop:`1px solid ${G.border}`,background:i%2?'#FAFAFA':G.white }}>
                    <td style={{ padding:'10px 12px',color:G.muted,fontSize:12,whiteSpace:'nowrap' }}>{fmtDate(v.visit_date)}</td>
                    <td style={{ padding:'10px 12px',fontWeight:600 }}>{v.supplier_name}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:20,background:G.blueLight,color:G.blue,textTransform:'capitalize' }}>{v.visit_type}</span>
                    </td>
                    <td style={{ padding:'10px 12px',color:G.text,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{v.outcome||'—'}</td>
                    <td style={{ padding:'10px 12px' }}>
                      {v.next_followup ? (
                        <span style={{ fontWeight:600,color:v.next_followup<=today?G.red:G.text }}>
                          {v.next_followup<=today?'⚠ ':''}{fmtDate(v.next_followup)}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding:'10px 12px',color:G.muted,fontSize:12 }}>{v.done_by||'—'}</td>
                  </tr>
                ))}
                {visits.length === 0 && <tr><td colSpan={6} style={{ padding:40,textAlign:'center',color:G.muted }}>No visit logs yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

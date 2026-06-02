import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',purple:'#7C3AED',purpleLight:'#EDE9FE',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const inp = {
  width:'100%', padding:'10px 12px', borderRadius:10,
  border:`1.5px solid ${G.border}`, fontSize:13,
  color:G.text, outline:'none', background:'#FAFAFA',
  boxSizing:'border-box',
}

const BRANCHES = ['Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu']

// ── QR Label Generator ────────────────────────────────────
function QRLabel({ batch, onClose }) {
  const printRef = useRef()

  const qrData = JSON.stringify({
    batch: batch.batch_number,
    product: batch.product_name,
    weight: batch.weight_kg + 'kg',
    packed: batch.packing_date,
    bestBefore: batch.best_before,
    origin: batch.origin_district,
    mill: batch.mill_name,
    fssai: batch.fssai_no,
    verify: `https://gvr-lemon.vercel.app/verify/${batch.batch_number}`
  })

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=1E3A0F`

  function printLabel() {
    const w = window.open('', '_blank')
    w.document.write(`
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>GVR Label — ${batch.batch_number}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; }
        .page { display: flex; flex-wrap: wrap; padding: 10mm; gap: 5mm; }
        .label {
          width: 90mm; border: 1.5px solid #27500A; border-radius: 4mm;
          padding: 4mm; display: flex; gap: 3mm; align-items: flex-start;
          page-break-inside: avoid; background: #fff;
        }
        .qr { width: 28mm; height: 28mm; flex-shrink: 0; }
        .info { flex: 1; }
        .brand { font-size: 11pt; font-weight: 800; color: #27500A; margin-bottom: 1mm; }
        .product { font-size: 9pt; font-weight: 700; color: #111; margin-bottom: 1mm; }
        .telugu { font-size: 7pt; color: #666; margin-bottom: 2mm; }
        .row { font-size: 7pt; color: #333; margin-bottom: 0.5mm; }
        .row span { font-weight: 600; color: #111; }
        .batch { font-size: 6.5pt; color: #666; margin-top: 1.5mm; padding-top: 1.5mm; border-top: 0.5px solid #ccc; }
        .fssai { font-size: 6pt; color: #888; margin-top: 1mm; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="page">
        ${Array(12).fill(0).map(() => `
        <div class="label">
          <img class="qr" src="${qrUrl}" alt="QR" />
          <div class="info">
            <div class="brand">🌾 Green Village Rice</div>
            <div class="product">${batch.product_name}</div>
            <div class="telugu">గ్రీన్ విలేజ్ రైస్</div>
            <div class="row">Packed: <span>${new Date(batch.packing_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span></div>
            <div class="row">Best Before: <span>${new Date(batch.best_before).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span></div>
            <div class="row">Weight: <span>${batch.weight_kg}kg</span></div>
            <div class="row">Origin: <span>${batch.origin_district || 'Telangana'}</span></div>
            <div class="batch">Batch: ${batch.batch_number} · ${batch.mill_name || 'GVR Mill'}</div>
            <div class="fssai">FSSAI: ${batch.fssai_no}</div>
          </div>
        </div>`).join('')}
      </div>
      </body></html>
    `)
    w.document.close()
    setTimeout(() => w.print(), 800)
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:500,padding:28,maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:700 }}>QR Label — {batch.batch_number}</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>

        {/* Label preview */}
        <div ref={printRef} style={{ border:`2px solid ${G.green}`,borderRadius:12,padding:16,marginBottom:20,display:'flex',gap:14,alignItems:'flex-start',background:'#FAFFF7' }}>
          <img src={qrUrl} alt="QR Code" width={100} height={100} style={{ borderRadius:8,border:`1px solid ${G.border}`,flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 3px',fontWeight:800,fontSize:15,color:G.greenDark }}>🌾 Green Village Rice</p>
            <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:14,color:G.text }}>{batch.product_name}</p>
            <p style={{ margin:'0 0 8px',fontSize:11,color:G.muted }}>గ్రీన్ విలేజ్ రైస్</p>
            {[
              ['Batch', batch.batch_number],
              ['Packed', new Date(batch.packing_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})],
              ['Best Before', new Date(batch.best_before).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})],
              ['Weight', `${batch.weight_kg}kg`],
              ['Origin', batch.origin_district || 'Telangana'],
              ['Mill', batch.mill_name || 'GVR Mill'],
              ['FSSAI', batch.fssai_no],
            ].map(([k,v])=>(
              <div key={k} style={{ display:'flex',gap:6,fontSize:11,marginBottom:2 }}>
                <span style={{ color:G.muted,minWidth:60 }}>{k}:</span>
                <span style={{ fontWeight:600,color:G.text }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:G.blueLight,borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:12,color:G.blue }}>
          ℹ️ Click Print to generate a sheet of <strong>12 labels</strong> ready to stick on bags
        </div>

        <div style={{ display:'flex',gap:10 }}>
          <button onClick={printLabel} style={{ flex:1,padding:13,background:G.green,color:G.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer' }}>
            🖨 Print 12 Labels
          </button>
          <a href={qrUrl} download={`GVR-QR-${batch.batch_number}.png`}
            style={{ flex:1,padding:13,background:G.blueLight,color:G.blue,border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',textDecoration:'none',textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center' }}>
            ⬇ Download QR
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Create Batch Modal ────────────────────────────────────
function CreateBatchModal({ products, vendors, onClose, onSaved }) {
  const [productId, setProductId]   = useState('')
  const [vendorId, setVendorId]     = useState('')
  const [qty, setQty]               = useState('')
  const [packDate, setPackDate]     = useState(new Date().toISOString().split('T')[0])
  const [origin, setOrigin]         = useState('')
  const [millName, setMillName]     = useState('')
  const [fssai, setFssai]           = useState('10020042014916')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const product = products.find(p => p.id === productId)
  const bestBefore = packDate ? new Date(new Date(packDate).getTime() + 365*86400000).toISOString().split('T')[0] : ''

  async function save() {
    if (!productId || !qty) { setError('Select product and enter quantity'); return }
    setSaving(true); setError('')
    try {
      // Generate batch number: GVR-SM1KG-20260602-001
      const { count } = await supabase.from('batches').select('*',{count:'exact',head:true})
      const datePart = packDate.replace(/-/g,'')
      const batchNum = `GVR-${(product?.sku||'PROD').replace('GVR-','')}-${datePart}-${String((count||0)+1).padStart(3,'0')}`

      const { error: err } = await supabase.from('batches').insert({
        batch_number:   batchNum,
        product_id:     productId,
        product_name:   product?.name || '',
        vendor_id:      vendorId || null,
        vendor_name:    vendors.find(v=>v.id===vendorId)?.name || null,
        origin_district: origin,
        quantity_bags:  parseInt(qty),
        remaining_bags: parseInt(qty),
        weight_kg:      product?.weight_kg || 1,
        packing_date:   packDate,
        best_before:    bestBefore,
        fssai_no:       fssai,
        mill_name:      millName,
        status:         'active',
        created_at:     new Date().toISOString()
      })
      if (err) throw err

      // Update product stock
      if (product) {
        await supabase.from('products').update({ stock_bags: (product.stock_bags||0) + parseInt(qty), packing_date: packDate, best_before_date: bestBefore }).eq('id', productId)
      }

      onSaved(); onClose()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:500,padding:28,maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:700 }}>Create New Batch</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>
        {error && <div style={{ background:G.redLight,border:`1px solid #FECACA`,borderRadius:10,padding:'10px 14px',marginBottom:16,color:G.red,fontSize:13 }}>{error}</div>}
        <div style={{ display:'grid',gap:14 }}>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Product *</label>
            <select value={productId} onChange={e=>setProductId(e.target.value)} style={{ ...inp,cursor:'pointer' }}>
              <option value="">Select product...</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Source Vendor / Farmer</label>
            <select value={vendorId} onChange={e=>setVendorId(e.target.value)} style={{ ...inp,cursor:'pointer' }}>
              <option value="">Select vendor (optional)...</option>
              {vendors.map(v=><option key={v.id} value={v.id}>{v.name} — {v.type}</option>)}
            </select>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Quantity (Bags) *</label>
              <input type="number" min={1} value={qty} onChange={e=>setQty(e.target.value)} placeholder="No. of bags" style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Packing Date</label>
              <input type="date" value={packDate} onChange={e=>setPackDate(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Origin District</label>
              <input type="text" value={origin} onChange={e=>setOrigin(e.target.value)} placeholder="e.g. Nalgonda" style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Mill Name</label>
              <input type="text" value={millName} onChange={e=>setMillName(e.target.value)} placeholder="Rice mill name" style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>FSSAI License No.</label>
            <input type="text" value={fssai} onChange={e=>setFssai(e.target.value)} placeholder="FSSAI number" style={inp} onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
          {bestBefore && (
            <div style={{ background:G.greenLight,borderRadius:10,padding:'10px 14px',fontSize:13,color:G.greenDark,display:'flex',justifyContent:'space-between' }}>
              <span>Best Before (auto)</span>
              <strong>{new Date(bestBefore).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</strong>
            </div>
          )}
        </div>
        <button onClick={save} disabled={saving} style={{ width:'100%',marginTop:20,padding:13,background:saving?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer' }}>
          {saving ? 'Creating...' : '✓ Create Batch & Generate QR'}
        </button>
      </div>
    </div>
  )
}

// ── Main BatchPage ────────────────────────────────────────
export default function BatchPage() {
  const [batches, setBatches]   = useState([])
  const [products, setProducts] = useState([])
  const [vendors, setVendors]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showQR, setShowQR]     = useState(null)
  const [tab, setTab]           = useState('active')
  const [search, setSearch]     = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [bRes, pRes, vRes] = await Promise.all([
      supabase.from('batches').select('*').order('created_at',{ascending:false}),
      supabase.from('products').select('*').order('weight_kg'),
      supabase.from('vendors').select('*').order('name'),
    ])
    setBatches(bRes.data || [])
    setProducts(pRes.data || [])
    setVendors(vRes.data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('batches').update({ status }).eq('id', id)
    setBatches(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  const filtered = batches.filter(b => {
    const matchTab = tab === 'all' || b.status === tab
    const matchSearch = !search || b.batch_number.toLowerCase().includes(search.toLowerCase()) || b.product_name.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const totalActive   = batches.filter(b=>b.status==='active').length
  const totalBags     = batches.filter(b=>b.status==='active').reduce((s,b)=>s+b.remaining_bags,0)
  const totalExhausted = batches.filter(b=>b.status==='exhausted').length

  const fmtDate = d => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      {showCreate && <CreateBatchModal products={products} vendors={vendors} onClose={()=>setShowCreate(false)} onSaved={load} />}
      {showQR && <QRLabel batch={showQR} onClose={()=>setShowQR(null)} />}

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12 }}>
        <div>
          <h2 style={{ margin:'0 0 4px',fontSize:18,fontWeight:700,color:G.text }}>📦 Batch Tracking</h2>
          <p style={{ margin:0,fontSize:13,color:G.muted }}>Create batches, generate QR labels and track every bag</p>
        </div>
        <button onClick={()=>setShowCreate(true)} style={{ background:G.green,color:G.white,border:'none',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer' }}>
          + Create New Batch
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20 }}>
        {[
          { label:'Active Batches',   value:totalActive,    color:G.green,  bg:G.greenLight,  icon:'📦' },
          { label:'Bags Available',   value:totalBags,      color:G.blue,   bg:G.blueLight,   icon:'🌾' },
          { label:'Total Batches',    value:batches.length, color:G.purple, bg:G.purpleLight, icon:'📊' },
          { label:'Exhausted',        value:totalExhausted, color:G.muted,  bg:'#F3F4F6',     icon:'✓' },
        ].map((s,i)=>(
          <div key={i} style={{ background:G.white,borderRadius:14,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.color}` }}>
            <div style={{ display:'flex',justifyContent:'space-between' }}>
              <div>
                <p style={{ margin:'0 0 6px',fontSize:12,color:G.muted }}>{s.label}</p>
                <p style={{ margin:0,fontSize:24,fontWeight:800,color:s.color }}>{s.value}</p>
              </div>
              <span style={{ fontSize:24 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center' }}>
        <div style={{ display:'flex',gap:4 }}>
          {[['active','Active'],['exhausted','Exhausted'],['recalled','Recalled'],['all','All']].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{ padding:'6px 14px',borderRadius:20,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:tab===key?G.green:'#F3F4F6',color:tab===key?G.white:G.muted }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ position:'relative',flex:1,minWidth:200 }}>
          <span style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:13,color:G.muted }}>🔍</span>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search batch number or product..."
            style={{ ...inp,paddingLeft:30 }}
            onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
        </div>
        <span style={{ fontSize:12,color:G.muted }}>{filtered.length} batches</span>
      </div>

      {loading && <div style={{ textAlign:'center',padding:60,color:G.muted }}>Loading batches...</div>}

      {/* Batch cards */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign:'center',padding:'60px 20px',background:G.white,borderRadius:14,color:G.muted }}>
          <div style={{ fontSize:40,marginBottom:10 }}>📦</div>
          <p style={{ fontWeight:600,color:G.text,margin:'0 0 4px' }}>No batches yet</p>
          <p style={{ fontSize:13,margin:'0 0 16px' }}>Create your first batch to start tracking</p>
          <button onClick={()=>setShowCreate(true)} style={{ background:G.green,color:G.white,border:'none',borderRadius:10,padding:'10px 24px',fontWeight:700,cursor:'pointer' }}>+ Create First Batch</button>
        </div>
      )}

      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        {filtered.map(b => {
          const daysLeft = Math.ceil((new Date(b.best_before) - new Date()) / 86400000)
          const isExpiringSoon = daysLeft <= 30 && daysLeft > 0
          const isExpired = daysLeft <= 0
          const usedPct = Math.round((1 - b.remaining_bags/b.quantity_bags) * 100)

          return (
            <div key={b.id} style={{ background:G.white,borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${isExpired?G.red:isExpiringSoon?G.amber:G.border}` }}>
              <div style={{ display:'flex' }}>

                {/* Left — QR */}
                <div style={{ width:120,flexShrink:0,background:'#F9FAF7',borderRight:`1px solid ${G.border}`,padding:'14px 12px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8 }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://gvr-lemon.vercel.app/verify/${b.batch_number}`)}&color=1E3A0F`}
                    alt="QR"
                    width={80} height={80}
                    style={{ borderRadius:6,border:`1px solid ${G.border}` }}
                  />
                  <p style={{ margin:0,fontSize:9,color:G.muted,textAlign:'center',lineHeight:1.3 }}>{b.batch_number}</p>
                  <button onClick={()=>setShowQR(b)} style={{ background:G.green,color:G.white,border:'none',borderRadius:6,padding:'4px 8px',fontSize:10,fontWeight:700,cursor:'pointer',width:'100%' }}>
                    🖨 Print
                  </button>
                </div>

                {/* Right — details */}
                <div style={{ flex:1,padding:'14px 16px' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
                    <div>
                      <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:15,color:G.text }}>{b.product_name}</p>
                      <p style={{ margin:0,fontSize:11,color:G.muted }}>{b.batch_number} · {b.weight_kg}kg bags</p>
                    </div>
                    <div style={{ display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end' }}>
                      <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,
                        background:b.status==='active'?G.greenLight:b.status==='recalled'?G.redLight:'#F3F4F6',
                        color:b.status==='active'?G.green:b.status==='recalled'?G.red:G.muted }}>
                        {b.status}
                      </span>
                      {isExpired && <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:G.redLight,color:G.red }}>⚠ Expired</span>}
                      {isExpiringSoon && !isExpired && <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:G.amberLight,color:G.amber }}>⏳ {daysLeft}d left</span>}
                    </div>
                  </div>

                  <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:10 }}>
                    {[
                      ['Total Bags',    b.quantity_bags,  G.blue],
                      ['Remaining',     b.remaining_bags, b.remaining_bags<b.quantity_bags*0.2?G.red:G.green],
                      ['Packed',        fmtDate(b.packing_date), G.muted],
                      ['Best Before',   fmtDate(b.best_before),  isExpired?G.red:isExpiringSoon?G.amber:G.muted],
                    ].map(([label,val,color])=>(
                      <div key={label} style={{ background:'#F9FAF7',borderRadius:8,padding:'7px 9px' }}>
                        <p style={{ margin:'0 0 2px',fontSize:9,color:G.muted,textTransform:'uppercase',letterSpacing:'0.3px' }}>{label}</p>
                        <p style={{ margin:0,fontSize:12,fontWeight:700,color }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Usage bar */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,color:G.muted,marginBottom:3 }}>
                      <span>Used: {b.quantity_bags - b.remaining_bags} bags ({usedPct}%)</span>
                      <span>{b.remaining_bags} remaining</span>
                    </div>
                    <div style={{ height:5,background:'#F3F4F6',borderRadius:3,overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${usedPct}%`,background:usedPct>80?G.amber:G.green,borderRadius:3 }} />
                    </div>
                  </div>

                  <div style={{ display:'flex',gap:6,flexWrap:'wrap',fontSize:11,color:G.muted,marginBottom:8 }}>
                    {b.vendor_name && <span>👨‍🌾 {b.vendor_name}</span>}
                    {b.origin_district && <span>📍 {b.origin_district}</span>}
                    {b.mill_name && <span>⚙️ {b.mill_name}</span>}
                    {b.fssai_no && <span>✅ FSSAI: {b.fssai_no}</span>}
                  </div>

                  <div style={{ display:'flex',gap:6 }}>
                    {b.status==='active' && (
                      <>
                        <button onClick={()=>setShowQR(b)} style={{ background:G.blueLight,border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,color:G.blue,cursor:'pointer' }}>🖨 Print Labels</button>
                        <button onClick={()=>updateStatus(b.id,'exhausted')} style={{ background:'#F3F4F6',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,color:G.muted,cursor:'pointer' }}>Mark Exhausted</button>
                        <button onClick={()=>updateStatus(b.id,'recalled')} style={{ background:G.redLight,border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,color:G.red,cursor:'pointer' }}>⚠ Recall</button>
                      </>
                    )}
                    {b.status!=='active' && (
                      <button onClick={()=>updateStatus(b.id,'active')} style={{ background:G.greenLight,border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,color:G.green,cursor:'pointer' }}>Reactivate</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

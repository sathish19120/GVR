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

function QRLabel({ batch, onClose }) {
  const printRef = useRef()
  const barcodeVal = batch.batch_number
  const barcodeUrl = `https://barcodeapi.org/api/128/${encodeURIComponent(barcodeVal)}`

  function printLabel() {
    const w = window.open('', '_blank')
    w.document.write(`
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>GVR Label — ${batch.batch_number}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; }
        .page { display: flex; flex-wrap: wrap; padding: 8mm; gap: 4mm; justify-content: flex-start; }
        .label { width: 90mm; border: 1.5px solid #27500A; border-radius: 3mm; padding: 3mm 4mm; page-break-inside: avoid; background: #fff; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2mm; border-bottom: 0.5px solid #ccc; padding-bottom: 2mm; }
        .brand { font-size: 10pt; font-weight: 800; color: #27500A; }
        .telugu { font-size: 7pt; color: #555; }
        .product { font-size: 9.5pt; font-weight: 700; color: #111; margin-bottom: 2mm; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5mm 4mm; margin-bottom: 2.5mm; }
        .row { font-size: 6.5pt; color: #444; }
        .row span { font-weight: 700; color: #111; display: block; font-size: 7pt; }
        .barcode-wrap { text-align: center; margin: 2mm 0 1mm; }
        .barcode-wrap img { height: 14mm; width: auto; max-width: 100%; }
        .batch-num { text-align: center; font-size: 6.5pt; color: #333; font-family: Courier New, monospace; letter-spacing: 0.5px; margin-bottom: 1mm; }
        .fssai { font-size: 5.5pt; color: #888; text-align: center; border-top: 0.5px solid #eee; padding-top: 1mm; }
        @media print { body { margin: 0; } .page { padding: 5mm; gap: 3mm; } }
      </style></head><body>
      <div class="page">
        ${Array(12).fill(0).map(() => `
        <div class="label">
          <div class="header">
            <div><div class="brand">&#x1F33E; Green Village Rice</div><div class="telugu">&#x0C17;&#x0C4D;&#x0C30;&#x0C40;&#x0C28;&#x0C4D; &#x0C35;&#x0C3F;&#x0C32;&#x0C47;&#x0C1C;&#x0C4D; &#x0C30;&#x0C48;&#x0C38;&#x0C4D;</div></div>
            <div style="font-size:7pt;color:#27500A;font-weight:700;text-align:right;">${batch.weight_kg}kg<br/>Pack</div>
          </div>
          <div class="product">${batch.product_name}</div>
          <div class="grid">
            <div class="row">Packed On<span>${new Date(batch.packing_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span></div>
            <div class="row">Best Before<span>${new Date(batch.best_before).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span></div>
            <div class="row">Origin<span>${batch.origin_district || 'Telangana'}</span></div>
            <div class="row">Mill<span>${batch.mill_name || 'GVR Mill'}</span></div>
          </div>
          <div class="barcode-wrap"><img src="${barcodeUrl}" alt="${barcodeVal}" /></div>
          <div class="batch-num">${barcodeVal}</div>
          <div class="fssai">FSSAI Lic. No: ${batch.fssai_no} &nbsp;|&nbsp; Hyderabad, Telangana</div>
        </div>`).join('')}
      </div>
      </body></html>
    `)
    w.document.close()
    setTimeout(() => w.print(), 1200)
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:520,padding:28,maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:700 }}>Barcode Label — {batch.batch_number}</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>
        <div ref={printRef} style={{ border:`2px solid ${G.green}`,borderRadius:12,padding:16,marginBottom:16,background:'#FAFFF7' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${G.border}` }}>
            <div>
              <p style={{ margin:'0 0 2px',fontWeight:800,fontSize:15,color:G.greenDark }}>🌾 Green Village Rice</p>
              <p style={{ margin:0,fontSize:11,color:G.muted }}>గ్రీన్ విలేజ్ రైస్</p>
            </div>
            <span style={{ fontWeight:700,fontSize:15,color:G.green }}>{batch.weight_kg}kg</span>
          </div>
          <p style={{ margin:'0 0 10px',fontWeight:700,fontSize:14 }}>{batch.product_name}</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12,fontSize:12 }}>
            {[
              ['Packed On', new Date(batch.packing_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})],
              ['Best Before', new Date(batch.best_before).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})],
              ['Origin', batch.origin_district || 'Telangana'],
              ['Mill', batch.mill_name || 'GVR Mill'],
            ].map(([k,v])=>(
              <div key={k}><p style={{ margin:0,fontSize:10,color:G.muted }}>{k}</p><p style={{ margin:0,fontWeight:600,fontSize:12 }}>{v}</p></div>
            ))}
          </div>
          <div style={{ textAlign:'center',background:G.white,padding:'10px',borderRadius:8,border:`1px solid ${G.border}`,marginBottom:8 }}>
            <img src={barcodeUrl} alt={barcodeVal} style={{ height:56,maxWidth:'100%' }} />
            <p style={{ margin:'4px 0 0',fontSize:10,fontFamily:'monospace',letterSpacing:'0.5px',color:G.text }}>{barcodeVal}</p>
          </div>
          <p style={{ margin:0,fontSize:10,color:G.muted,textAlign:'center' }}>FSSAI: {batch.fssai_no}</p>
        </div>
        <div style={{ background:G.greenLight,borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:12,color:G.greenDark,display:'flex',gap:8,alignItems:'center' }}>
          <span>📋</span><span>Prints <strong>12 labels per sheet</strong> — A4 paper, 2 columns × 6 rows.</span>
        </div>
        <button onClick={printLabel} style={{ width:'100%',padding:13,background:G.green,color:G.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer' }}>🖨 Print 12 Barcode Labels</button>
      </div>
    </div>
  )
}

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
      const { count } = await supabase.from('batches').select('*',{count:'exact',head:true})
      const datePart = packDate.replace(/-/g,'')
      const batchNum = `GVR-${(product?.sku||'PROD').replace('GVR-','')}-${datePart}-${String((count||0)+1).padStart(3,'0')}`

      const { error: err } = await supabase.from('batches').insert({
        batch_number: batchNum, product_id: productId, product_name: product?.name || '',
        vendor_id: vendorId || null, vendor_name: vendors.find(v=>v.id===vendorId)?.name || null,
        origin_district: origin, quantity_bags: parseInt(qty), remaining_bags: parseInt(qty),
        weight_kg: product?.weight_kg || 1, packing_date: packDate, best_before: bestBefore,
        fssai_no: fssai, mill_name: millName, status: 'active', created_at: new Date().toISOString()
      })
      if (err) throw err

      // New batch stock still goes straight to products.stock_bags —
      // this is fresh incoming stock, not a sale, so it's a direct add
      // rather than going through deplete_product_stock().
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
          {saving ? 'Creating...' : '✓ Create Batch & Generate Barcode'}
        </button>
      </div>
    </div>
  )
}

export default function BatchPage() {
  const [batches, setBatches]   = useState([])
  const [products, setProducts] = useState([])
  const [vendors, setVendors]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showQR, setShowQR]     = useState(null)
  const [tab, setTab]           = useState('active')
  const [search, setSearch]     = useState('')
  const [statusUpdating, setStatusUpdating] = useState(null)

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

  // ✅ FIX: previously did `.update({ status })` directly on batches,
  // which never touched products.stock_bags. Recalling or exhausting a
  // batch with bags still remaining had zero effect on total product
  // stock — the app kept selling stock that had just been pulled from
  // circulation. Now calls set_batch_status(), an atomic Postgres
  // function that reverses (or restores, if reactivated) the correct
  // amount of stock in the same operation as the status change.
  async function updateStatus(id, status) {
    setStatusUpdating(id)
    try {
      const { error } = await supabase.rpc('set_batch_status', { p_batch_id: id, p_status: status })
      if (error) throw error
      await load()
    } catch(e) {
      alert('Failed to update batch status: ' + e.message)
    } finally {
      setStatusUpdating(null)
    }
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

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12 }}>
        <div>
          <h2 style={{ margin:'0 0 4px',fontSize:18,fontWeight:700,color:G.text }}>📦 Batch Tracking</h2>
          <p style={{ margin:0,fontSize:13,color:G.muted }}>Create batches, generate barcode labels and track every bag</p>
        </div>
        <button onClick={()=>setShowCreate(true)} style={{ background:G.green,color:G.white,border:'none',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer' }}>
          + Create New Batch
        </button>
      </div>

      <div style={{ background:G.blueLight, borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:10, alignItems:'center' }}>
        <span style={{ fontSize:16 }}>ℹ️</span>
        <p style={{ margin:0, fontSize:12, color:G.blue, lineHeight:1.6 }}>
          "Remaining" now updates automatically as orders are placed (oldest batch sold first). Marking a batch Exhausted or Recalled correctly removes its remaining bags from total stock.
        </p>
      </div>

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
          const isUpdating = statusUpdating === b.id

          return (
            <div key={b.id} style={{ background:G.white,borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${isExpired?G.red:isExpiringSoon?G.amber:G.border}`,opacity:isUpdating?0.6:1 }}>
              <div style={{ display:'flex' }}>
                <div style={{ width:130,flexShrink:0,background:'#F9FAF7',borderRight:`1px solid ${G.border}`,padding:'12px 10px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6 }}>
                  <img
                    src={`https://barcodeapi.org/api/128/${encodeURIComponent(b.batch_number)}`}
                    alt={b.batch_number}
                    style={{ width:'100%',height:40,objectFit:'contain',background:G.white,padding:'3px',borderRadius:4,border:`1px solid ${G.border}` }}
                  />
                  <p style={{ margin:0,fontSize:8,color:G.muted,textAlign:'center',fontFamily:'monospace',lineHeight:1.3,wordBreak:'break-all' }}>{b.batch_number}</p>
                  <button onClick={()=>setShowQR(b)} style={{ background:G.green,color:G.white,border:'none',borderRadius:6,padding:'4px 8px',fontSize:10,fontWeight:700,cursor:'pointer',width:'100%' }}>🖨 Print</button>
                </div>

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
                        <button onClick={()=>setShowQR(b)} style={{ background:G.blueLight,border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,color:G.blue,cursor:'pointer' }}>🖨 Print Barcode Labels</button>
                        <button onClick={()=>updateStatus(b.id,'exhausted')} disabled={isUpdating} style={{ background:'#F3F4F6',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,color:G.muted,cursor:isUpdating?'not-allowed':'pointer' }}>
                          {isUpdating?'...':'Mark Exhausted'}
                        </button>
                        <button onClick={()=>updateStatus(b.id,'recalled')} disabled={isUpdating} style={{ background:G.redLight,border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,color:G.red,cursor:isUpdating?'not-allowed':'pointer' }}>
                          {isUpdating?'...':'⚠ Recall'}
                        </button>
                      </>
                    )}
                    {b.status!=='active' && (
                      <button onClick={()=>updateStatus(b.id,'active')} disabled={isUpdating} style={{ background:G.greenLight,border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,color:G.green,cursor:isUpdating?'not-allowed':'pointer' }}>
                        {isUpdating?'...':'Reactivate'}
                      </button>
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

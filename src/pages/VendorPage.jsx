import React, { useState, useEffect } from 'react'
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
  boxSizing:'border-box', transition:'border-color 0.2s',
}

// ── Add Purchase Modal ────────────────────────────────────
function AddPurchaseModal({ vendors, products, onClose, onSaved }) {
  const [vendorId, setVendorId]   = useState('')
  const [productId, setProductId] = useState('')
  const [qty, setQty]             = useState('')
  const [pricePerBag, setPrice]   = useState('')
  const [totalPaid, setTotalPaid] = useState('')
  const [purchaseDate, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [invoiceNo, setInvoice]   = useState('')
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const calcTotal = () => {
    const q = parseInt(qty) || 0
    const p = parseFloat(pricePerBag) || 0
    if (q && p) setTotalPaid(String(q * p))
  }

  async function save() {
    if (!vendorId || !productId || !qty || !pricePerBag) {
      setError('Please fill vendor, product, quantity and price'); return
    }
    setSaving(true); setError('')
    try {
      const product = products.find(p => p.id === productId)
      const bags = parseInt(qty)
      const { error: err } = await supabase.from('vendor_purchases').insert({
        vendor_id: vendorId,
        product_id: productId,
        product_name: product?.name || '',
        quantity_bags: bags,
        price_per_bag: parseFloat(pricePerBag),
        total_amount: parseFloat(totalPaid) || bags * parseFloat(pricePerBag),
        purchase_date: purchaseDate,
        invoice_number: invoiceNo || null,
        notes: notes || null,
        created_at: new Date().toISOString()
      })
      if (err) throw err
      // Update stock
      await supabase.from('products')
        .update({ stock_bags: (product?.stock_bags || 0) + bags })
        .eq('id', productId)
      // Log stock movement
      await supabase.from('stock_movements').insert({
        product_id: productId,
        change_bags: bags,
        type: 'add',
        note: `Purchased from vendor · ${invoiceNo || 'No invoice'}`,
        created_at: new Date().toISOString()
      })
      onSaved(); onClose()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:500,padding:28,maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:700,color:G.text }}>Record Purchase</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>
        {error && <div style={{ background:G.redLight,border:`1px solid #FECACA`,borderRadius:10,padding:'10px 14px',marginBottom:16,color:G.red,fontSize:13 }}>{error}</div>}
        <div style={{ display:'grid',gap:14 }}>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Vendor / Farmer *</label>
            <select value={vendorId} onChange={e=>setVendorId(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              <option value="">Select vendor...</option>
              {vendors.map(v=><option key={v.id} value={v.id}>{v.name} — {v.type}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Product *</label>
            <select value={productId} onChange={e=>setProductId(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              <option value="">Select product...</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name} (stock: {p.stock_bags} bags)</option>)}
            </select>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Quantity (Bags) *</label>
              <input type="number" min={1} value={qty} onChange={e=>{ setQty(e.target.value); setTimeout(calcTotal, 100) }}
                placeholder="No. of bags" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>{ e.target.style.borderColor=G.border; calcTotal() }} />
            </div>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Price per Bag (₹) *</label>
              <input type="number" min={0} value={pricePerBag} onChange={e=>{ setPrice(e.target.value); setTimeout(calcTotal, 100) }}
                placeholder="₹ per bag" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>{ e.target.style.borderColor=G.border; calcTotal() }} />
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Total Paid (₹)</label>
              <input type="number" value={totalPaid} onChange={e=>setTotalPaid(e.target.value)}
                placeholder="Auto-calculated" style={{ ...inp, background:G.greenLight, borderColor:'#97C459' }}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor='#97C459'} />
            </div>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Purchase Date</label>
              <input type="date" value={purchaseDate} onChange={e=>setDate(e.target.value)} style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Invoice / Bill Number</label>
            <input type="text" value={invoiceNo} onChange={e=>setInvoice(e.target.value)}
              placeholder="Vendor invoice number" style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Notes</label>
            <input type="text" value={notes} onChange={e=>setNotes(e.target.value)}
              placeholder="Quality notes, transport, etc." style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
        </div>
        {qty && pricePerBag && (
          <div style={{ marginTop:14,padding:'10px 14px',background:G.greenLight,borderRadius:10,border:`1px solid #97C459`,display:'flex',justifyContent:'space-between' }}>
            <span style={{ fontSize:13,color:G.greenDark }}>Total Amount</span>
            <span style={{ fontSize:15,fontWeight:800,color:G.green }}>₹{(parseInt(qty)||0)*(parseFloat(pricePerBag)||0)}</span>
          </div>
        )}
        <button onClick={save} disabled={saving} style={{ width:'100%',marginTop:20,padding:13,background:saving?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer' }}>
          {saving ? 'Saving...' : '✓ Record Purchase'}
        </button>
      </div>
    </div>
  )
}

// ── Add Vendor Modal ──────────────────────────────────────
function AddVendorModal({ onClose, onSaved }) {
  const [name, setName]     = useState('')
  const [type, setType]     = useState('Farmer')
  const [phone, setPhone]   = useState('')
  const [location, setLoc]  = useState('')
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function save() {
    if (!name.trim()) { setError('Vendor name is required'); return }
    setSaving(true); setError('')
    try {
      const { error: err } = await supabase.from('vendors').insert({
        name: name.trim(), type, phone: phone||null,
        location: location||null, notes: notes||null,
        active: true, created_at: new Date().toISOString()
      })
      if (err) throw err
      onSaved(); onClose()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:440,padding:28 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:700,color:G.text }}>Add Vendor</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>
        {error && <div style={{ background:G.redLight,border:`1px solid #FECACA`,borderRadius:10,padding:'10px 14px',marginBottom:16,color:G.red,fontSize:13 }}>{error}</div>}
        <div style={{ display:'grid',gap:14 }}>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Name *</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Farmer / Mill name" style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Type</label>
            <div style={{ display:'flex',gap:8 }}>
              {['Farmer','Rice Mill','Wholesaler','Transport'].map(t=>(
                <button key={t} type="button" onClick={()=>setType(t)} style={{
                  flex:1,padding:'9px 4px',borderRadius:9,border:`2px solid ${type===t?G.green:G.border}`,
                  background:type===t?G.greenLight:G.white,cursor:'pointer',
                  fontSize:11,fontWeight:600,color:type===t?G.greenDark:G.muted
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Phone</label>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mobile number" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Location</label>
              <input type="text" value={location} onChange={e=>setLoc(e.target.value)} placeholder="District / Village" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Notes</label>
            <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes about this vendor" style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
        </div>
        <button onClick={save} disabled={saving} style={{ width:'100%',marginTop:20,padding:13,background:saving?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer' }}>
          {saving ? 'Saving...' : '+ Add Vendor'}
        </button>
      </div>
    </div>
  )
}

// ── Edit Vendor Modal ────────────────────────────────────
function EditVendorModal({ vendor, onClose, onSaved }) {
  const [name, setName]     = useState(vendor.name || '')
  const [type, setType]     = useState(vendor.type || 'Farmer')
  const [phone, setPhone]   = useState(vendor.phone || '')
  const [location, setLoc]  = useState(vendor.location || '')
  const [notes, setNotes]   = useState(vendor.notes || '')
  const [active, setActive] = useState(vendor.active !== false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function save() {
    if (!name.trim()) { setError('Vendor name is required'); return }
    setSaving(true); setError('')
    try {
      const { error: err } = await supabase.from('vendors').update({
        name: name.trim(), type, phone: phone||null,
        location: location||null, notes: notes||null, active
      }).eq('id', vendor.id)
      if (err) throw err
      onSaved(); onClose()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function deleteVendor() {
    if (!window.confirm(`Delete vendor "${vendor.name}"? This cannot be undone.`)) return
    setSaving(true)
    try {
      await supabase.from('vendors').delete().eq('id', vendor.id)
      onSaved(); onClose()
    } catch(e) { setError(e.message); setSaving(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:440,padding:28,maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
          <h3 style={{ margin:0,fontSize:18,fontWeight:700,color:G.text }}>Edit Vendor</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>
        {error && <div style={{ background:G.redLight,border:`1px solid #FECACA`,borderRadius:10,padding:'10px 14px',marginBottom:16,color:G.red,fontSize:13 }}>{error}</div>}
        <div style={{ display:'grid',gap:14 }}>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Name *</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Farmer / Mill name" style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Type</label>
            <div style={{ display:'flex',gap:8 }}>
              {['Farmer','Rice Mill','Wholesaler','Transport'].map(t=>(
                <button key={t} type="button" onClick={()=>setType(t)} style={{
                  flex:1,padding:'9px 4px',borderRadius:9,border:`2px solid ${type===t?G.green:G.border}`,
                  background:type===t?G.greenLight:G.white,cursor:'pointer',
                  fontSize:11,fontWeight:600,color:type===t?G.greenDark:G.muted
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Phone</label>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mobile number" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <div>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Location</label>
              <input type="text" value={location} onChange={e=>setLoc(e.target.value)} placeholder="District / Village" style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Notes</label>
            <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes about this vendor" style={inp}
              onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:8 }}>Status</label>
            <div style={{ display:'flex',gap:8 }}>
              {[true,false].map(val=>(
                <button key={String(val)} type="button" onClick={()=>setActive(val)} style={{
                  flex:1,padding:'9px',borderRadius:9,
                  border:`2px solid ${active===val?(val?G.green:G.red):G.border}`,
                  background:active===val?(val?G.greenLight:G.redLight):G.white,
                  cursor:'pointer',fontSize:12,fontWeight:600,
                  color:active===val?(val?G.green:G.red):G.muted
                }}>{val ? '✓ Active' : '✕ Inactive'}</button>
              ))}
            </div>
          </div>
        </div>
        <button type="button" onClick={save} disabled={saving} style={{ width:'100%',marginTop:20,padding:13,background:saving?'#9CA3AF':G.green,color:G.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer' }}>
          {saving ? 'Saving...' : '✓ Save Changes'}
        </button>
        <button type="button" onClick={deleteVendor} disabled={saving} style={{ width:'100%',marginTop:10,padding:11,background:'none',color:G.red,border:`1px solid ${G.red}`,borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer' }}>
          🗑 Delete Vendor
        </button>
      </div>
    </div>
  )
}

// ── Payment Modal ─────────────────────────────────────────
function PaymentModal({ purchase, onClose, onSaved }) {
  const alreadyPaid = Number(purchase.paid_amount || 0)
  const total       = Number(purchase.total_amount || 0)
  const remaining   = total - alreadyPaid

  const [amount, setAmount]   = useState('')
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function save() {
    const paid = parseFloat(amount)
    if (!paid || paid <= 0) { setError('Enter a valid payment amount'); return }
    if (paid > remaining + 0.01) { setError(`Amount exceeds remaining balance of ₹${remaining.toFixed(2)}`); return }
    setSaving(true); setError('')
    try {
      const newPaid   = alreadyPaid + paid
      const newStatus = newPaid >= total - 0.01 ? 'paid' : 'partial'
      const { error: err } = await supabase.from('vendor_purchases').update({
        paid_amount:    newPaid,
        payment_status: newStatus,
        payment_notes:  notes || null,
      }).eq('id', purchase.id)
      if (err) throw err
      onSaved(); onClose()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const payPct = total > 0 ? Math.round(alreadyPaid / total * 100) : 0

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:150,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:420,padding:26 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
          <h3 style={{ margin:0,fontSize:17,fontWeight:700 }}>Record Payment</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>

        {/* Purchase summary */}
        <div style={{ background:'#F9FAF7',borderRadius:12,padding:'12px 14px',marginBottom:16 }}>
          <p style={{ margin:'0 0 4px',fontSize:13,fontWeight:600,color:G.text }}>{purchase.product_name} — {purchase.quantity_bags} bags</p>
          <p style={{ margin:'0 0 10px',fontSize:12,color:G.muted }}>Invoice: {purchase.invoice_number || '—'} · {new Date(purchase.purchase_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10 }}>
            {[
              ['Total Amount',  `₹${total.toLocaleString('en-IN')}`,     G.text],
              ['Paid So Far',   `₹${alreadyPaid.toLocaleString('en-IN')}`, G.green],
              ['Remaining',     `₹${remaining.toLocaleString('en-IN')}`,  remaining>0?G.red:G.green],
            ].map(([label,val,color])=>(
              <div key={label} style={{ background:G.white,borderRadius:8,padding:'8px 10px',textAlign:'center' }}>
                <p style={{ margin:'0 0 3px',fontSize:9,color:G.muted,textTransform:'uppercase',letterSpacing:'0.3px' }}>{label}</p>
                <p style={{ margin:0,fontSize:13,fontWeight:700,color }}>{val}</p>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div style={{ height:6,background:'#E5E7EB',borderRadius:3,overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${payPct}%`,background:payPct===100?G.green:G.amber,borderRadius:3,transition:'width 0.3s' }} />
          </div>
          <p style={{ margin:'4px 0 0',fontSize:11,color:G.muted,textAlign:'right' }}>{payPct}% paid</p>
        </div>

        {remaining <= 0 ? (
          <div style={{ background:G.greenLight,borderRadius:10,padding:'12px 14px',textAlign:'center' }}>
            <p style={{ margin:0,fontSize:14,fontWeight:700,color:G.green }}>✅ Fully Paid</p>
            <p style={{ margin:'4px 0 0',fontSize:12,color:G.green2 }}>No outstanding balance</p>
          </div>
        ) : (
          <>
            {error && <div style={{ background:G.redLight,border:`1px solid #FECACA`,borderRadius:8,padding:'8px 12px',marginBottom:12,color:G.red,fontSize:13 }}>{error}</div>}

            {/* Quick fill buttons */}
            <div style={{ marginBottom:12 }}>
              <p style={{ margin:'0 0 8px',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px' }}>Quick Fill</p>
              <div style={{ display:'flex',gap:8 }}>
                {[
                  ['Full',    remaining.toFixed(0)],
                  ['Half',    (remaining/2).toFixed(0)],
                  ['25%',     (remaining*0.25).toFixed(0)],
                ].map(([label, val]) => (
                  <button key={label} type="button" onClick={()=>setAmount(val)} style={{
                    flex:1,padding:'8px',borderRadius:8,
                    border:`1.5px solid ${amount===val?G.green:G.border}`,
                    background:amount===val?G.greenLight:G.white,
                    cursor:'pointer',fontSize:12,fontWeight:600,
                    color:amount===val?G.green:G.muted
                  }}>
                    {label}<br/><span style={{ fontSize:11,fontWeight:500 }}>₹{Number(val).toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Payment Amount (₹) *</label>
              <input type="number" min={1} max={remaining} value={amount} onChange={e=>setAmount(e.target.value)}
                placeholder={`Max ₹${remaining.toLocaleString('en-IN')}`} style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
              {amount && parseFloat(amount) > 0 && (
                <p style={{ margin:'4px 0 0',fontSize:11,color:G.green }}>
                  Remaining after this payment: ₹{Math.max(0, remaining - parseFloat(amount)).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>Payment Notes</label>
              <input type="text" value={notes} onChange={e=>setNotes(e.target.value)}
                placeholder="e.g. Paid via UPI, cheque no., etc." style={inp}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>

            <button type="button" onClick={save} disabled={saving||!amount} style={{
              width:'100%',padding:13,
              background:saving||!amount?'#9CA3AF':G.green,
              color:G.white,border:'none',borderRadius:12,
              fontSize:15,fontWeight:700,cursor:'pointer'
            }}>
              {saving ? 'Saving...' : `✓ Record Payment — ₹${parseFloat(amount||0).toLocaleString('en-IN')}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main VendorPage ───────────────────────────────────────
export default function VendorPage() {
  const [tab, setTab]           = useState('overview')
  const [vendors, setVendors]   = useState([])
  const [products, setProducts] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAddVendor, setShowAddVendor] = useState(false)
  const [showAddPurchase, setShowAddPurchase] = useState(false)
  const [editVendor, setEditVendor] = useState(null)
  const [search, setSearch]     = useState('')
  const [paymentModal, setPaymentModal] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [vRes, pRes, purRes] = await Promise.all([
      supabase.from('vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('weight_kg'),
      supabase.from('vendor_purchases').select('*, vendors(name, type, location)').order('purchase_date', { ascending: false }),
    ])
    setVendors(vRes.data || [])
    setProducts(pRes.data || [])
    setPurchases(purRes.data || [])
    setLoading(false)
  }

  const totalPurchased  = purchases.reduce((s, p) => s + (p.quantity_bags || 0), 0)
  const totalSpent      = purchases.reduce((s, p) => s + (p.total_amount || 0), 0)
  const avgPrice        = totalPurchased > 0 ? (totalSpent / totalPurchased).toFixed(1) : 0
  const totalStock      = products.reduce((s, p) => s + (p.stock_bags || 0), 0)
  const stockValue      = products.reduce((s, p) => s + (p.stock_bags || 0) * (p.price_per_bag || 0), 0)

  const fmtRs = v => `₹${Number(v).toLocaleString('en-IN')}`

  const filteredPurchases = purchases.filter(p =>
    !search ||
    p.vendors?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.invoice_number?.toLowerCase().includes(search.toLowerCase())
  )

  const TABS = [
    { key:'overview',  label:'📊 Overview' },
    { key:'vendors',   label:'👨‍🌾 Vendors' },
    { key:'purchases', label:'🛒 Purchases' },
    { key:'godown',    label:'🏭 Godown Stock' },
  ]

  return (
    <div style={{ fontFamily:"'Inter', sans-serif" }}>
      {showAddVendor && <AddVendorModal onClose={() => setShowAddVendor(false)} onSaved={load} />}
      {editVendor && <EditVendorModal vendor={editVendor} onClose={() => setEditVendor(null)} onSaved={load} />}
      {paymentModal && <PaymentModal purchase={paymentModal} onClose={() => setPaymentModal(null)} onSaved={load} />}
      {showAddPurchase && <AddPurchaseModal vendors={vendors} products={products} onClose={() => setShowAddPurchase(false)} onSaved={load} />}

      {/* Tab bar */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:'8px 18px', borderRadius:10, border:'none', cursor:'pointer',
            fontSize:13, fontWeight:600, transition:'all 0.15s',
            background: tab === t.key ? G.green : G.white,
            color: tab === t.key ? G.white : G.muted,
            boxShadow: tab === t.key ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
          }}>{t.label}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={() => setShowAddVendor(true)} style={{ padding:'8px 16px', borderRadius:10, border:`1px solid ${G.border}`, background:G.white, cursor:'pointer', fontSize:12, fontWeight:600, color:G.blue }}>
            + Add Vendor
          </button>
          <button onClick={() => setShowAddPurchase(true)} style={{ padding:'8px 16px', borderRadius:10, border:'none', background:G.green, cursor:'pointer', fontSize:12, fontWeight:700, color:G.white }}>
            + Record Purchase
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:60, color:G.muted }}>Loading vendor data...</div>}

      {/* ── OVERVIEW TAB ── */}
      {!loading && tab === 'overview' && (
        <div>
          {/* Summary stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
            {[
              { label:'Total Vendors',      value:vendors.length,         icon:'👨‍🌾', color:G.green,  bg:G.greenLight },
              { label:'Total Bags Bought',  value:totalPurchased,          icon:'📦', color:G.blue,   bg:G.blueLight },
              { label:'Total Spent',        value:fmtRs(totalSpent),       icon:'💰', color:G.amber,  bg:G.amberLight },
              { label:'Avg Price/Bag',      value:`₹${avgPrice}`,          icon:'📊', color:G.purple, bg:G.purpleLight },
              { label:'Godown Stock (Bags)',value:totalStock,               icon:'🏭', color:G.green,  bg:G.greenLight },
              { label:'Stock Value',        value:fmtRs(stockValue),       icon:'💎', color:G.green2, bg:G.greenLight },
            ].map((s,i)=>(
              <div key={i} style={{ background:G.white,borderRadius:16,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.color}` }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                  <div>
                    <p style={{ margin:'0 0 8px',fontSize:12,color:G.muted,fontWeight:500 }}>{s.label}</p>
                    <p style={{ margin:0,fontSize:22,fontWeight:800,color:s.color }}>{s.value}</p>
                  </div>
                  <div style={{ width:38,height:38,borderRadius:9,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent purchases */}
          <div style={{ background:G.white,borderRadius:16,padding:'20px 22px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',marginBottom:20 }}>
            {/* Payment summary cards */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:16 }}>
              {[
                { label:'Fully Paid',    value:purchases.filter(p=>p.payment_status==='paid').length,    color:G.green,  bg:G.greenLight },
                { label:'Partial',       value:purchases.filter(p=>p.payment_status==='partial').length,  color:G.amber,  bg:G.amberLight },
                { label:'Unpaid',        value:purchases.filter(p=>!p.payment_status||p.payment_status==='unpaid').length, color:G.red, bg:G.redLight },
                { label:'Outstanding',   value:`₹${purchases.reduce((s,p)=>s+(Number(p.total_amount||0)-Number(p.paid_amount||0)),0).toLocaleString('en-IN')}`, color:G.red, bg:G.redLight },
              ].map((s,i)=>(
                <div key={i} style={{ background:G.white,borderRadius:12,padding:'12px 14px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`3px solid ${s.color}` }}>
                  <p style={{ margin:'0 0 4px',fontSize:11,color:G.muted }}>{s.label}</p>
                  <p style={{ margin:0,fontSize:18,fontWeight:800,color:s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <p style={{ margin:'0 0 14px',fontSize:13,fontWeight:700,color:G.text }}>Recent Purchases</p>
            {purchases.slice(0,5).map((p,i)=>(
              <div key={p.id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<4?`1px solid ${G.border}`:'none' }}>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:36,height:36,borderRadius:9,background:G.greenLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>🌾</div>
                  <div>
                    <p style={{ margin:'0 0 2px',fontWeight:600,fontSize:13,color:G.text }}>{p.vendors?.name || '—'}</p>
                    <p style={{ margin:0,fontSize:11,color:G.muted }}>{p.product_name} · {new Date(p.purchase_date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:14,color:G.text }}>{p.quantity_bags} bags</p>
                  <p style={{ margin:0,fontSize:12,color:G.green,fontWeight:600 }}>{fmtRs(p.total_amount)}</p>
                  {p.payment_status !== 'paid' && (
                    <p style={{ margin:'2px 0 0',fontSize:11,color:G.red,fontWeight:600 }}>
                      Due: {fmtRs(Number(p.total_amount||0)-Number(p.paid_amount||0))}
                    </p>
                  )}
                  {p.payment_status === 'paid' && <p style={{ margin:'2px 0 0',fontSize:11,color:G.green }}>✓ Paid</p>}
                </div>
              </div>
            ))}
            {purchases.length === 0 && <p style={{ textAlign:'center',color:G.muted,padding:20,fontSize:13 }}>No purchases recorded yet. Click "+ Record Purchase" to add one.</p>}
          </div>

          {/* Product-wise purchase summary */}
          <div style={{ background:G.white,borderRadius:16,padding:'20px 22px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ margin:'0 0 14px',fontSize:13,fontWeight:700,color:G.text }}>Purchase Summary by Product</p>
            {products.map(prod => {
              const prodPurchases = purchases.filter(p => p.product_id === prod.id)
              const totalBags = prodPurchases.reduce((s,p) => s + p.quantity_bags, 0)
              const totalAmt  = prodPurchases.reduce((s,p) => s + p.total_amount, 0)
              const avgPr     = totalBags > 0 ? (totalAmt / totalBags).toFixed(1) : 0
              return (
                <div key={prod.id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${G.border}` }}>
                  <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                    <span style={{ fontSize:22 }}>🌾</span>
                    <div>
                      <p style={{ margin:'0 0 2px',fontWeight:600,fontSize:13,color:G.text }}>{prod.name}</p>
                      <p style={{ margin:0,fontSize:11,color:G.muted }}>SKU: {prod.sku}</p>
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:20,alignItems:'center' }}>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ margin:'0 0 2px',fontSize:10,color:G.muted,textTransform:'uppercase',fontWeight:600 }}>Purchased</p>
                      <p style={{ margin:0,fontWeight:700,fontSize:14,color:G.blue }}>{totalBags} bags</p>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ margin:'0 0 2px',fontSize:10,color:G.muted,textTransform:'uppercase',fontWeight:600 }}>Avg Price</p>
                      <p style={{ margin:0,fontWeight:700,fontSize:14,color:G.amber }}>₹{avgPr}/bag</p>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ margin:'0 0 2px',fontSize:10,color:G.muted,textTransform:'uppercase',fontWeight:600 }}>Total Spent</p>
                      <p style={{ margin:0,fontWeight:700,fontSize:14,color:G.red }}>{fmtRs(totalAmt)}</p>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ margin:'0 0 2px',fontSize:10,color:G.muted,textTransform:'uppercase',fontWeight:600 }}>In Godown</p>
                      <p style={{ margin:0,fontWeight:700,fontSize:14,color:G.green }}>{prod.stock_bags} bags</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── VENDORS TAB ── */}
      {!loading && tab === 'vendors' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:14 }}>
            {vendors.map(v => {
              const vPurchases = purchases.filter(p => p.vendor_id === v.id)
              const totalBags  = vPurchases.reduce((s,p) => s + p.quantity_bags, 0)
              const totalAmt   = vPurchases.reduce((s,p) => s + p.total_amount, 0)
              const typeColor  = v.type==='Farmer'?G.green:v.type==='Rice Mill'?G.blue:v.type==='Wholesaler'?G.amber:G.purple
              const typeBg     = v.type==='Farmer'?G.greenLight:v.type==='Rice Mill'?G.blueLight:v.type==='Wholesaler'?G.amberLight:G.purpleLight
              return (
                <div key={v.id} style={{ background:G.white,borderRadius:16,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderTop:`4px solid ${typeColor}` }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <div style={{ width:40,height:40,borderRadius:10,background:typeBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>
                        {v.type==='Farmer'?'👨‍🌾':v.type==='Rice Mill'?'⚙️':v.type==='Wholesaler'?'🏢':'🚚'}
                      </div>
                      <div>
                        <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:14,color:G.text }}>{v.name}</p>
                        <p style={{ margin:0,fontSize:11,color:G.muted }}>{v.location || 'Location not set'}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,background:typeBg,color:typeColor }}>{v.type}</span>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12 }}>
                    <div style={{ background:'#F9FAF7',borderRadius:8,padding:'8px 10px',textAlign:'center' }}>
                      <p style={{ margin:'0 0 2px',fontSize:10,color:G.muted }}>BAGS PURCHASED</p>
                      <p style={{ margin:0,fontSize:16,fontWeight:800,color:G.blue }}>{totalBags}</p>
                    </div>
                    <div style={{ background:'#F9FAF7',borderRadius:8,padding:'8px 10px',textAlign:'center' }}>
                      <p style={{ margin:'0 0 2px',fontSize:10,color:G.muted }}>TOTAL PAID</p>
                      <p style={{ margin:0,fontSize:14,fontWeight:800,color:G.red }}>{fmtRs(totalAmt)}</p>
                    </div>
                  </div>
                  {v.phone && (
                    <a href={`tel:${v.phone}`} style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:G.green,fontWeight:600,textDecoration:'none',padding:'6px 0' }}>
                      📞 {v.phone}
                    </a>
                  )}
                  {v.notes && <p style={{ margin:'6px 0 0',fontSize:11,color:G.muted,fontStyle:'italic' }}>📝 {v.notes}</p>}
                  <div style={{ marginTop:12,display:'flex',gap:8 }}>
                    <button type="button" onClick={()=>setEditVendor(v)} style={{ flex:1,padding:'7px 10px',background:G.blueLight,border:'none',borderRadius:8,fontSize:12,fontWeight:600,color:G.blue,cursor:'pointer' }}>
                      ✏️ Edit
                    </button>
                    <button type="button" onClick={()=>setEditVendor(v)} style={{ flex:1,padding:'7px 10px',background:v.active?G.greenLight:G.redLight,border:'none',borderRadius:8,fontSize:12,fontWeight:600,color:v.active?G.green:G.red,cursor:'pointer' }}>
                      {v.active ? '✓ Active' : '✕ Inactive'}
                    </button>
                  </div>
                </div>
              )
            })}
            {vendors.length === 0 && (
              <div style={{ textAlign:'center',padding:'60px 20px',color:G.muted,gridColumn:'1/-1' }}>
                <div style={{ fontSize:40,marginBottom:10 }}>👨‍🌾</div>
                <p style={{ fontWeight:600,color:G.text,margin:'0 0 4px' }}>No vendors added yet</p>
                <p style={{ fontSize:13,margin:'0 0 16px' }}>Add your farmers and rice mills</p>
                <button onClick={() => setShowAddVendor(true)} style={{ background:G.green,color:G.white,border:'none',borderRadius:10,padding:'10px 24px',fontWeight:700,cursor:'pointer' }}>+ Add First Vendor</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PURCHASES TAB ── */}
      {!loading && tab === 'purchases' && (
        <div>
          <div style={{ background:G.white,borderRadius:14,padding:'12px 16px',marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',display:'flex',gap:10,alignItems:'center' }}>
            <div style={{ position:'relative',flex:1 }}>
              <span style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:14,color:G.muted }}>🔍</span>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search vendor, product or invoice..."
                style={{ ...inp,paddingLeft:32 }}
                onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
            </div>
            <span style={{ fontSize:12,color:G.muted,fontWeight:500,whiteSpace:'nowrap' }}>{filteredPurchases.length} records</span>
          </div>

          <div style={{ background:G.white,borderRadius:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#F9FAF7' }}>
                    {['Date','Vendor','Type','Product','Qty (Bags)','Price/Bag','Total','Invoice','Notes','Payment'].map(h=>(
                      <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((p,i)=>(
                    <tr key={p.id} style={{ borderTop:`1px solid ${G.border}`,background:i%2?'#FAFAFA':G.white }}>
                      <td style={{ padding:'11px 14px',color:G.muted,fontSize:12,whiteSpace:'nowrap' }}>{new Date(p.purchase_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                      <td style={{ padding:'11px 14px',fontWeight:600,color:G.text }}>{p.vendors?.name||'—'}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,
                          background:p.vendors?.type==='Farmer'?G.greenLight:p.vendors?.type==='Rice Mill'?G.blueLight:G.amberLight,
                          color:p.vendors?.type==='Farmer'?G.green:p.vendors?.type==='Rice Mill'?G.blue:G.amber
                        }}>{p.vendors?.type||'—'}</span>
                      </td>
                      <td style={{ padding:'11px 14px',color:G.text }}>{p.product_name||'—'}</td>
                      <td style={{ padding:'11px 14px',fontWeight:700,color:G.blue,textAlign:'center' }}>{p.quantity_bags}</td>
                      <td style={{ padding:'11px 14px',color:G.amber,fontWeight:600 }}>₹{p.price_per_bag}</td>
                      <td style={{ padding:'11px 14px',fontWeight:700,color:G.green }}>{fmtRs(p.total_amount)}</td>
                      <td style={{ padding:'11px 14px',color:G.muted,fontSize:12 }}>{p.invoice_number||'—'}</td>
                      <td style={{ padding:'11px 14px',color:G.muted,fontSize:12,maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.notes||'—'}</td>
                    </tr>
                  ))}
                  {filteredPurchases.length===0 && (
                    <tr><td colSpan={9} style={{ padding:40,textAlign:'center',color:G.muted }}>No purchase records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── GODOWN STOCK TAB ── */}
      {!loading && tab === 'godown' && (
        <div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:24 }}>
            {[
              { label:'Total Bags in Godown', value:totalStock,         color:G.green,  icon:'📦' },
              { label:'Total Weight (kg)',    value:`${products.reduce((s,p)=>s+p.stock_bags*p.weight_kg,0).toLocaleString('en-IN')} kg`, color:G.blue, icon:'⚖️' },
              { label:'Stock Value (Sell)',   value:fmtRs(stockValue),  color:G.green2, icon:'💰' },
              { label:'Low Stock Items',      value:products.filter(p=>p.stock_bags<=p.low_stock_threshold).length, color:G.red, icon:'⚠️' },
            ].map((s,i)=>(
              <div key={i} style={{ background:G.white,borderRadius:16,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.color}` }}>
                <div style={{ display:'flex',justifyContent:'space-between' }}>
                  <div>
                    <p style={{ margin:'0 0 8px',fontSize:12,color:G.muted }}>{s.label}</p>
                    <p style={{ margin:0,fontSize:22,fontWeight:800,color:s.color }}>{s.value}</p>
                  </div>
                  <span style={{ fontSize:24 }}>{s.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid',gap:14 }}>
            {products.map(p => {
              const pPurchases = purchases.filter(pur => pur.product_id === p.id)
              const totalBought = pPurchases.reduce((s,pur) => s+pur.quantity_bags, 0)
              const totalSold   = totalBought - p.stock_bags
              const pct         = totalBought > 0 ? Math.round(p.stock_bags/totalBought*100) : 0
              const isLow       = p.stock_bags <= p.low_stock_threshold
              const costValue   = pPurchases.length > 0
                ? (pPurchases.reduce((s,pur)=>s+pur.total_amount,0)/Math.max(totalBought,1)) * p.stock_bags
                : 0
              return (
                <div key={p.id} style={{ background:G.white,borderRadius:16,padding:'20px 24px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${isLow?G.red:G.green}` }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                      <span style={{ fontSize:28 }}>🌾</span>
                      <div>
                        <p style={{ margin:'0 0 3px',fontWeight:700,fontSize:15,color:G.text }}>{p.name}</p>
                        <p style={{ margin:0,fontSize:12,color:G.muted }}>{p.name_telugu} · SKU: {p.sku}</p>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      {isLow && <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:G.redLight,color:G.red,display:'block',marginBottom:4 }}>⚠ Low Stock</span>}
                      <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:p.active?G.greenLight:'#F3F4F6',color:p.active?G.green:G.muted }}>{p.active?'Active':'Inactive'}</span>
                    </div>
                  </div>
                  <div style={{ height:8,background:'#F3F4F6',borderRadius:4,overflow:'hidden',marginBottom:10 }}>
                    <div style={{ height:'100%',width:`${pct}%`,background:isLow?G.red:G.green,borderRadius:4,transition:'width 0.3s' }} />
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10 }}>
                    {[
                      { label:'In Godown',   value:`${p.stock_bags} bags`,        color:isLow?G.red:G.green },
                      { label:'Total Bought',value:`${totalBought} bags`,          color:G.blue },
                      { label:'Sold/Used',   value:`${Math.max(0,totalSold)} bags`,color:G.amber },
                      { label:'Sell Price',  value:`₹${p.price_per_bag}/bag`,      color:G.green2 },
                      { label:'Stock Value', value:fmtRs(costValue),              color:G.purple },
                    ].map((item,i)=>(
                      <div key={i} style={{ background:'#F9FAF7',borderRadius:8,padding:'8px 10px',textAlign:'center' }}>
                        <p style={{ margin:'0 0 3px',fontSize:9,color:G.muted,textTransform:'uppercase',letterSpacing:'0.4px' }}>{item.label}</p>
                        <p style={{ margin:0,fontSize:13,fontWeight:700,color:item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {p.packing_date && (
                    <div style={{ marginTop:10,fontSize:12,color:G.muted,display:'flex',gap:16 }}>
                      <span>📅 Packed: {new Date(p.packing_date).toLocaleDateString('en-IN')}</span>
                      {p.best_before_date && <span>⏳ Best before: {new Date(p.best_before_date).toLocaleDateString('en-IN')}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

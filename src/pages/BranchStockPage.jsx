import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',purple:'#7C3AED',purpleLight:'#EDE9FE',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const BRANCHES = ['Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu']

const BRANCH_ICONS = {
  Hyderabad:'🏙️', Vijayawada:'🌉', Kadapa:'🏛️',
  Anantapur:'🌾', Tadipatri:'🏘️', Jammalamadugu:'🌿'
}

const inp = {
  width:'100%', padding:'10px 12px', borderRadius:10,
  border:`1.5px solid ${G.border}`, fontSize:13,
  color:G.text, outline:'none', background:'#FAFAFA',
  boxSizing:'border-box',
}

// ── Update Branch Stock Modal ─────────────────────────────
function UpdateStockModal({ branch, product, onClose, onSaved }) {
  // ✅ FIX: previously defaulted to 'add' with no obvious opposite —
  // the only way to reduce stock was to notice "Sale / Dispatch" or
  // "Transfer Out" implied subtraction, which wasn't clear at a glance.
  // Now the modal has a simple, explicit Add / Remove toggle FIRST,
  // and the specific reason (sale, transfer, adjustment) is a
  // secondary detail selected underneath — so "how do I reduce stock"
  // has one obvious, unmissable answer.
  const [direction, setDirection] = useState('add') // 'add' | 'remove'
  const [reason, setReason] = useState('restock')   // sub-reason within each direction
  const [bags, setBags]   = useState('')
  const [note, setNote]   = useState('')
  const [saving, setSaving] = useState(false)

  const ADD_REASONS = {
    restock:     { label:'Restock / Godown',  desc:'Stock received from godown or supplier' },
    transfer_in: { label:'Transfer In',       desc:'Received from another branch' },
  }
  const REMOVE_REASONS = {
    sale:         { label:'Sale / Dispatch',  desc:'Stock sent out for delivery or sold' },
    transfer_out: { label:'Transfer Out',     desc:'Sent to another branch' },
    damaged:      { label:'Damaged / Loss',   desc:'Damaged, expired, or lost stock' },
    adjustment:   { label:'Correction',       desc:'Stock count correction (found less than recorded)' },
  }

  // Map the friendly direction+reason UI back to the underlying
  // movement "type" the database/movements log already understands.
  const REASON_TO_TYPE = {
    restock:'add', transfer_in:'transfer_in',
    sale:'sale', transfer_out:'transfer_out',
    damaged:'adjustment', adjustment:'adjustment',
  }

  function switchDirection(dir) {
    setDirection(dir)
    setReason(dir === 'add' ? 'restock' : 'sale')
  }

  async function save() {
    const n = parseInt(bags)
    if (!n || n <= 0) return
    setSaving(true)
    try {
      const delta = direction === 'add' ? n : -n
      const movementType = REASON_TO_TYPE[reason]

      // ✅ FIX: previously computed newStock client-side from
      // product.stock_bags (a value already loaded into this page's
      // state, possibly stale) and wrote it directly with upsert() —
      // if two people had a branch stock page open at the same time,
      // whichever save() ran last would overwrite the other's change
      // instead of adding to it. Now calls apply_branch_stock_delta(),
      // the Postgres function that increments the row's CURRENT
      // database value atomically, so concurrent updates always land
      // correctly.
      const { error } = await supabase.rpc('apply_branch_stock_delta', {
        p_branch_name: branch,
        p_product_id: product.product_id,
        p_product_name: product.product_name,
        p_delta: delta,
        p_type: movementType,
        p_note: note || null
      })
      if (error) throw error

      onSaved(); onClose()
    } catch(e) {
      console.error(e)
      alert('Failed to update stock: ' + e.message)
    }
    finally { setSaving(false) }
  }

  const reasons = direction === 'add' ? ADD_REASONS : REMOVE_REASONS

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:G.white,borderRadius:20,width:'100%',maxWidth:420,padding:28 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <div>
            <h3 style={{ margin:'0 0 2px',fontSize:17,fontWeight:700,color:G.text }}>Update Stock</h3>
            <p style={{ margin:0,fontSize:12,color:G.muted }}>{branch} · {product.product_name}</p>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:G.muted }}>✕</button>
        </div>

        <p style={{ margin:'0 0 16px',fontSize:13,color:G.muted }}>
          Current stock: <strong style={{ color:G.green }}>{product.stock_bags} bags</strong>
        </p>

        {/* ✅ The clear Add / Remove toggle — this is the direct fix
            for "there's no reduce option," even though subtraction
            technically existed before via less-obvious labels */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18 }}>
          <button onClick={()=>switchDirection('add')} style={{
            padding:'14px 10px', borderRadius:12, border:`2.5px solid ${direction==='add'?G.green:G.border}`,
            background: direction==='add' ? G.greenLight : G.white,
            cursor:'pointer', textAlign:'center'
          }}>
            <div style={{ fontSize:22, marginBottom:4 }}>➕</div>
            <div style={{ fontWeight:700, fontSize:14, color: direction==='add'?G.greenDark:G.muted }}>Add Stock</div>
          </button>
          <button onClick={()=>switchDirection('remove')} style={{
            padding:'14px 10px', borderRadius:12, border:`2.5px solid ${direction==='remove'?G.red:G.border}`,
            background: direction==='remove' ? G.redLight : G.white,
            cursor:'pointer', textAlign:'center'
          }}>
            <div style={{ fontSize:22, marginBottom:4 }}>➖</div>
            <div style={{ fontWeight:700, fontSize:14, color: direction==='remove'?G.red:G.muted }}>Remove Stock</div>
          </button>
        </div>

        {/* Sub-reason within the chosen direction */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:8 }}>Reason</label>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
            {Object.entries(reasons).map(([val, cfg]) => (
              <button key={val} onClick={() => setReason(val)} style={{
                padding:'9px 8px', borderRadius:9, border:`2px solid ${reason===val?(direction==='add'?G.green:G.red):G.border}`,
                background: reason===val ? (direction==='add'?G.greenLight:G.redLight) : G.white,
                cursor:'pointer', fontSize:11, fontWeight:600,
                color: reason===val ? (direction==='add'?G.greenDark:G.red) : G.muted, textAlign:'center'
              }}>
                {cfg.label}
              </button>
            ))}
          </div>
          <p style={{ margin:'8px 0 0',fontSize:12,color:G.muted,fontStyle:'italic' }}>{reasons[reason]?.desc}</p>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Number of Bags</label>
          <input type="number" min={1} value={bags} onChange={e=>setBags(e.target.value)}
            placeholder="Enter quantity" style={inp}
            onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Note (optional)</label>
          <input type="text" value={note} onChange={e=>setNote(e.target.value)}
            placeholder={direction==='add' ? 'e.g. Received from Hyderabad godown' : 'e.g. Delivered to 5 customers today'}
            style={inp}
            onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
        </div>

        {bags && parseInt(bags) > 0 && (
          <div style={{ background: direction==='add'?G.greenLight:G.redLight, borderRadius:10,padding:'10px 14px',marginBottom:16,display:'flex',justifyContent:'space-between',fontSize:13 }}>
            <span style={{ color: direction==='add'?G.greenDark:G.red }}>Stock will change by:</span>
            <strong style={{ color: direction==='add'?G.green:G.red }}>
              {direction==='add' ? '+' : '−'}{bags} bags
            </strong>
          </div>
        )}

        <button onClick={save} disabled={saving || !bags} style={{
          width:'100%', padding:13,
          background: saving||!bags ? '#9CA3AF' : (direction==='add'?G.green:G.red),
          color:G.white, border:'none', borderRadius:12,
          fontSize:15, fontWeight:700, cursor:saving||!bags?'not-allowed':'pointer'
        }}>
          {saving ? 'Updating...' : direction==='add' ? `➕ Add ${bags||0} Bags` : `➖ Remove ${bags||0} Bags`}
        </button>
      </div>
    </div>
  )
}

// ── Main BranchStockPage ──────────────────────────────────
export default function BranchStockPage() {
  const [branchStock, setBranchStock]   = useState([])
  const [movements, setMovements]       = useState([])
  const [products, setProducts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [selectedBranch, setSelected]   = useState('all')
  const [updateModal, setUpdateModal]   = useState(null) // {branch, product}
  const [tab, setTab]                   = useState('overview') // overview | movements

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [bRes, mRes, pRes] = await Promise.all([
      supabase.from('branch_stock').select('*').order('branch_name'),
      supabase.from('branch_stock_movements').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('products').select('*').eq('active', true).order('weight_kg'),
    ])
    setBranchStock(bRes.data || [])
    setMovements(mRes.data || [])
    setProducts(pRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const fmtRs = v => `₹${Number(v).toLocaleString('en-IN')}`

  const getStock = (branch, productId) =>
    branchStock.find(b => b.branch_name === branch && b.product_id === productId)

  const getBranchTotal = (branch) =>
    branchStock.filter(b => b.branch_name === branch).reduce((s,b) => s + (b.stock_bags||0), 0)

  const filteredBranches = selectedBranch === 'all' ? BRANCHES : [selectedBranch]

  return (
    <div style={{ fontFamily:"'Inter', sans-serif" }}>
      {updateModal && (
        <UpdateStockModal
          branch={updateModal.branch}
          product={updateModal.product}
          onClose={() => setUpdateModal(null)}
          onSaved={load}
        />
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:18, fontWeight:700, color:G.text }}>🏭 Branch-wise Stock</h2>
          <p style={{ margin:0, fontSize:13, color:G.muted }}>Track inventory levels across all locations in real time</p>
        </div>
        <button onClick={load} style={{ background:G.white,border:`1px solid ${G.border}`,borderRadius:10,padding:'8px 16px',fontSize:13,fontWeight:600,color:G.text,cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          ↻ Refresh
        </button>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {[['overview','📊 Stock Overview'],['movements','📋 Stock Movements']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{
            padding:'8px 18px', borderRadius:10, border:'none', cursor:'pointer',
            fontSize:13, fontWeight:600,
            background: tab===key ? G.green : G.white,
            color: tab===key ? G.white : G.muted,
            boxShadow: tab===key ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {['all', ...BRANCHES].map(b => (
          <button key={b} onClick={() => setSelected(b)} style={{
            padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer',
            fontSize:12, fontWeight:600,
            background: selectedBranch===b ? G.green : '#F3F4F6',
            color: selectedBranch===b ? G.white : G.muted,
          }}>
            {b === 'all' ? 'All Branches' : `${BRANCH_ICONS[b]} ${b}`}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', padding:60, color:G.muted }}>Loading branch stock...</div>}

      {!loading && tab === 'overview' && (
        <div>
          {selectedBranch === 'all' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
              {products.map(p => {
                const total = branchStock.filter(b => b.product_id === p.id).reduce((s,b) => s+(b.stock_bags||0), 0)
                const isLow = total <= p.low_stock_threshold * BRANCHES.length * 0.3
                return (
                  <div key={p.id} style={{ background:G.white, borderRadius:14, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${isLow?G.red:G.green}` }}>
                    <p style={{ margin:'0 0 6px', fontSize:11, color:G.muted, fontWeight:500 }}>{p.name}</p>
                    <p style={{ margin:'0 0 4px', fontSize:24, fontWeight:800, color:isLow?G.red:G.green }}>{total}</p>
                    <p style={{ margin:0, fontSize:11, color:G.muted }}>bags total · all branches</p>
                    {isLow && <p style={{ margin:'4px 0 0', fontSize:10, color:G.red, fontWeight:600 }}>⚠ Stock running low</p>}
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns: selectedBranch==='all' ? 'repeat(auto-fit,minmax(320px,1fr))' : '1fr', gap:16 }}>
            {filteredBranches.map(branch => {
              const branchTotal = getBranchTotal(branch)
              return (
                <div key={branch} style={{ background:G.white, borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:`1px solid ${G.border}` }}>
                  <div style={{ background:`linear-gradient(135deg, ${G.green}, ${G.greenDark})`, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:22 }}>{BRANCH_ICONS[branch]}</span>
                      <div>
                        <p style={{ margin:0, fontWeight:700, fontSize:15, color:G.white }}>{branch}</p>
                        <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.7)' }}>Branch Inventory</p>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.7)' }}>Total Stock</p>
                      <p style={{ margin:0, fontSize:20, fontWeight:800, color:G.white }}>{branchTotal} bags</p>
                    </div>
                  </div>

                  <div style={{ padding:'12px 16px' }}>
                    {products.map(p => {
                      const bs = getStock(branch, p.id)
                      const stock = bs?.stock_bags || 0
                      const isLow = stock <= p.low_stock_threshold
                      const maxStock = Math.max(stock, p.low_stock_threshold * 3, 1)
                      const pct = Math.round(stock / maxStock * 100)
                      return (
                        <div key={p.id} style={{ marginBottom:12, paddingBottom:12, borderBottom:`1px solid ${G.border}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:16 }}>🌾</span>
                              <div>
                                <p style={{ margin:0, fontSize:13, fontWeight:600, color:G.text }}>{p.name}</p>
                                <p style={{ margin:0, fontSize:11, color:G.muted }}>{p.weight_kg}kg · ₹{p.price_per_bag}/bag</p>
                              </div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ textAlign:'right' }}>
                                <p style={{ margin:0, fontSize:15, fontWeight:800, color:isLow?G.red:G.green }}>{stock} bags</p>
                                {isLow && <p style={{ margin:0, fontSize:10, color:G.red, fontWeight:600 }}>⚠ Low</p>}
                              </div>
                              {/* ✅ Two direct action buttons instead of one
                                  ambiguous "Update" — this is the other half
                                  of the fix: even before opening the modal,
                                  it's now obvious both directions exist */}
                              <button onClick={() => setUpdateModal({ branch, product: bs || { branch_name:branch, product_id:p.id, product_name:p.name, stock_bags:0 } })}
                                style={{ padding:'5px 9px', borderRadius:8, border:'none', background:G.greenLight, color:G.green, fontSize:13, fontWeight:700, cursor:'pointer' }}
                                title="Add stock">
                                ➕
                              </button>
                              <button onClick={() => setUpdateModal({ branch, product: bs || { branch_name:branch, product_id:p.id, product_name:p.name, stock_bags:0 } })}
                                style={{ padding:'5px 9px', borderRadius:8, border:'none', background:G.redLight, color:G.red, fontSize:13, fontWeight:700, cursor:'pointer' }}
                                title="Remove stock">
                                ➖
                              </button>
                            </div>
                          </div>
                          <div style={{ height:5, background:'#F3F4F6', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:isLow?G.red:stock>p.low_stock_threshold*2?G.green:G.amber, borderRadius:3, transition:'width 0.3s' }} />
                          </div>
                        </div>
                      )
                    })}
                    {products.length === 0 && (
                      <p style={{ textAlign:'center', color:G.muted, padding:16, fontSize:13 }}>No products found</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && tab === 'movements' && (
        <div style={{ background:G.white, borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F9FAF7' }}>
                  {['Date & Time','Branch','Product','Change','Type','Note'].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements
                  .filter(m => selectedBranch === 'all' || m.branch_name === selectedBranch)
                  .map((m,i) => {
                    const typeColors = {
                      add:['#3B6D11','#EAF3DE'], sale:['#BA7517','#FAEEDA'],
                      transfer_in:['#1E5FA5','#E6F1FB'], transfer_out:['#7C3AED','#EDE9FE'],
                      adjustment:['#6B7280','#F3F4F6']
                    }
                    const [tc, tbg] = typeColors[m.type] || ['#6B7280','#F3F4F6']
                    return (
                      <tr key={m.id} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
                        <td style={{ padding:'11px 14px', color:G.muted, fontSize:12, whiteSpace:'nowrap' }}>
                          {new Date(m.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · {new Date(m.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                        </td>
                        <td style={{ padding:'11px 14px', fontWeight:600, color:G.text }}>
                          {BRANCH_ICONS[m.branch_name]} {m.branch_name}
                        </td>
                        <td style={{ padding:'11px 14px', color:G.text }}>{m.product_name}</td>
                        <td style={{ padding:'11px 14px', fontWeight:700, fontSize:14, color:m.change_bags>0?G.green:G.red }}>
                          {m.change_bags>0?'+':''}{m.change_bags} bags
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, background:tbg, color:tc }}>
                            {m.type?.replace('_',' ')}
                          </span>
                        </td>
                        <td style={{ padding:'11px 14px', color:G.muted, fontSize:12 }}>{m.note || '—'}</td>
                      </tr>
                    )
                  })}
                {movements.filter(m => selectedBranch==='all' || m.branch_name===selectedBranch).length === 0 && (
                  <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:G.muted }}>No movements recorded yet. Update stock on a branch to see history here.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

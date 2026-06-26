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
  const [type, setType]   = useState('add')
  const [bags, setBags]   = useState('')
  const [note, setNote]   = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    const n = parseInt(bags)
    if (!n || n <= 0) return
    setSaving(true)
    try {
      const delta = type === 'add' || type === 'transfer_in' ? n : -n
      const newStock = Math.max(0, (product.stock_bags || 0) + delta)

      // Update branch stock
      await supabase.from('branch_stock')
        .upsert({
          branch_name: branch,
          product_id: product.product_id,
          product_name: product.product_name,
          stock_bags: newStock,
          updated_at: new Date().toISOString()
        }, { onConflict: 'branch_name,product_id' })

      // Log movement
      await supabase.from('branch_stock_movements').insert({
        branch_name: branch,
        product_id: product.product_id,
        product_name: product.product_name,
        change_bags: delta,
        type,
        note: note || null,
        created_at: new Date().toISOString()
      })

      onSaved(); onClose()
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const typeConfig = {
    add:          { label:'Add Stock',      color:G.green,  desc:'Stock received from godown' },
    sale:         { label:'Sale / Dispatch', color:G.amber,  desc:'Stock sent out for delivery' },
    transfer_in:  { label:'Transfer In',    color:G.blue,   desc:'Received from another branch' },
    transfer_out: { label:'Transfer Out',   color:G.purple, desc:'Sent to another branch' },
    adjustment:   { label:'Adjustment',     color:G.muted,  desc:'Stock count correction' },
  }

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

        <p style={{ margin:'0 0 14px',fontSize:13,color:G.muted }}>
          Current stock: <strong style={{ color:G.green }}>{product.stock_bags} bags</strong>
        </p>

        {/* Type selector */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16 }}>
          {Object.entries(typeConfig).map(([val, cfg]) => (
            <button key={val} onClick={() => setType(val)} style={{
              padding:'9px 8px', borderRadius:9, border:`2px solid ${type===val?cfg.color:G.border}`,
              background: type===val ? cfg.color+'18' : G.white,
              cursor:'pointer', fontSize:11, fontWeight:600,
              color: type===val ? cfg.color : G.muted, textAlign:'center'
            }}>
              {cfg.label}
            </button>
          ))}
        </div>
        <p style={{ margin:'0 0 14px',fontSize:12,color:G.muted,fontStyle:'italic' }}>{typeConfig[type].desc}</p>

        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Number of Bags</label>
          <input type="number" min={1} value={bags} onChange={e=>setBags(e.target.value)}
            placeholder="Enter quantity" style={inp}
            onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:G.muted,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6 }}>Note (optional)</label>
          <input type="text" value={note} onChange={e=>setNote(e.target.value)}
            placeholder="e.g. Received from Hyderabad godown" style={inp}
            onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border} />
        </div>

        {bags && parseInt(bags) > 0 && (
          <div style={{ background:G.greenLight,borderRadius:10,padding:'10px 14px',marginBottom:16,display:'flex',justifyContent:'space-between',fontSize:13 }}>
            <span style={{ color:G.greenDark }}>New stock will be:</span>
            <strong style={{ color:G.green }}>
              {Math.max(0, (product.stock_bags||0) + (
                type==='add'||type==='transfer_in' ? parseInt(bags) : -parseInt(bags)
              ))} bags
            </strong>
          </div>
        )}

        <button onClick={save} disabled={saving || !bags} style={{
          width:'100%', padding:13,
          background: saving||!bags ? '#9CA3AF' : typeConfig[type].color,
          color:G.white, border:'none', borderRadius:12,
          fontSize:15, fontWeight:700, cursor:saving||!bags?'not-allowed':'pointer'
        }}>
          {saving ? 'Updating...' : `${typeConfig[type].label} — ${bags||0} Bags`}
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

  const fmtRs = v => `₹${Number(v).toLocaleString('en-IN')}`

  // Get stock for a specific branch+product
  const getStock = (branch, productId) =>
    branchStock.find(b => b.branch_name === branch && b.product_id === productId)

  // Total stock across all branches per product
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

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:18, fontWeight:700, color:G.text }}>🏭 Branch-wise Stock</h2>
          <p style={{ margin:0, fontSize:13, color:G.muted }}>Track inventory levels across all locations in real time</p>
        </div>
        <button onClick={load} style={{ background:G.white,border:`1px solid ${G.border}`,borderRadius:10,padding:'8px 16px',fontSize:13,fontWeight:600,color:G.text,cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Tabs */}
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

      {/* Branch filter pills */}
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

      {/* ── OVERVIEW TAB ── */}
      {!loading && tab === 'overview' && (
        <div>
          {/* Summary across all branches */}
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

          {/* Branch cards */}
          <div style={{ display:'grid', gridTemplateColumns: selectedBranch==='all' ? 'repeat(auto-fit,minmax(320px,1fr))' : '1fr', gap:16 }}>
            {filteredBranches.map(branch => {
              const branchTotal = getBranchTotal(branch)
              return (
                <div key={branch} style={{ background:G.white, borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:`1px solid ${G.border}` }}>
                  {/* Branch header */}
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

                  {/* Products */}
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
                              <button onClick={() => setUpdateModal({ branch, product: bs || { branch_name:branch, product_id:p.id, product_name:p.name, stock_bags:0 } })}
                                style={{ padding:'5px 10px', borderRadius:8, border:'none', background:G.greenLight, color:G.green, fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                                Update
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

      {/* ── MOVEMENTS TAB ── */}
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

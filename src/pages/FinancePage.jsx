import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

const G = {
  green:'#3B6D11',greenDark:'#27500A',greenLight:'#EAF3DE',green2:'#639922',
  amber:'#BA7517',amberLight:'#FAEEDA',blue:'#1E5FA5',blueLight:'#E6F1FB',
  red:'#DC2626',redLight:'#FEE2E2',purple:'#7C3AED',purpleLight:'#EDE9FE',
  border:'#E5E7EB',text:'#111827',muted:'#6B7280',white:'#fff',surface:'#F4F6F3'
}

const BRANCHES = ['Hyderabad','Vijayawada','Kadapa','Anantapur','Tadipatri','Jammalamadugu']
const EXPENSE_CATEGORIES = ['Salary','Rent','Fuel','Vehicle Maintenance','Packing Material','Marketing','Electricity','Warehouse','Delivery','Other']

const fmtRs = v => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const fmtPct = v => `${Number(v || 0).toFixed(1)}%`
const isoDate = d => d.toISOString().slice(0, 10)

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function startOfQuarter(d) { return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1) }
function endOfQuarter(d) { const s = startOfQuarter(d); return new Date(s.getFullYear(), s.getMonth() + 3, 0) }
function startOfYear(d) { return new Date(d.getFullYear(), 0, 1) }
function endOfYear(d) { return new Date(d.getFullYear(), 11, 31) }
function getOrderBranch(order) { return order?.pickup_branch || order?.branch || 'Hyderabad' }
function inRange(dateValue, start, end) {
  if (!dateValue) return false
  const t = new Date(dateValue).getTime()
  return t >= new Date(start + 'T00:00:00').getTime() && t <= new Date(end + 'T23:59:59').getTime()
}

function getRangePreset(range) {
  const now = new Date()
  if (range === 'monthly') return [isoDate(startOfMonth(now)), isoDate(endOfMonth(now))]
  if (range === 'quarterly') return [isoDate(startOfQuarter(now)), isoDate(endOfQuarter(now))]
  if (range === 'yearly') return [isoDate(startOfYear(now)), isoDate(endOfYear(now))]
  return [isoDate(startOfMonth(now)), isoDate(endOfMonth(now))]
}

function periodKey(dateValue, range, start, end) {
  const d = new Date(dateValue)
  const days = Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000))
  if (range === 'monthly' || days <= 45) return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short' })
  if (range === 'quarterly' || range === 'yearly') return d.toLocaleDateString('en-IN', { month:'short', year:'2-digit' })
  return d.toLocaleDateString('en-IN', { month:'short', year:'2-digit' })
}

function metricForOrders(orderList, productMap, expenseList = []) {
  let revenue = 0
  let productCost = 0
  let packingCost = 0
  let deliveryCost = 0
  let discounts = 0
  let refunds = 0
  let bags = 0

  for (const order of orderList) {
    const paid = order.payment_status === 'paid'
    const cancelled = order.status === 'cancelled'

    if (paid && !cancelled) {
      revenue += Number(order.total_amount || 0)
      deliveryCost += Number(order.delivery_cost || 0)
      discounts += Number(order.discount_amount || 0)
      for (const item of order.order_items || []) {
        const p = productMap.get(item.product_id) || {}
        const qty = Number(item.quantity || 0)
        bags += qty
        productCost += qty * Number(p.cost_per_bag || 0)
        packingCost += qty * Number(p.packing_cost_per_bag || 0)
      }
    }

    if (cancelled) {
      refunds += Number(order.refund_amount || 0)
    }
  }

  const expenses = expenseList.reduce((s, e) => s + Number(e.amount || 0), 0)
  const grossProfit = revenue - productCost - packingCost
  const netProfit = grossProfit - deliveryCost - discounts - refunds - expenses
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0

  return { revenue, productCost, packingCost, deliveryCost, discounts, refunds, expenses, grossProfit, netProfit, margin, bags, orders: orderList.length }
}

function StatCard({ label, value, icon, color, bg, sub }) {
  return (
    <div style={{ background:G.white, borderRadius:16, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${color}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start' }}>
        <div>
          <p style={{ margin:'0 0 7px', fontSize:12, color:G.muted }}>{label}</p>
          <p style={{ margin:0, fontSize:24, fontWeight:800, color }}>{value}</p>
          {sub && <p style={{ margin:'6px 0 0', fontSize:11, color:G.muted }}>{sub}</p>}
        </div>
        <div style={{ width:40, height:40, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, flexShrink:0 }}>{icon}</div>
      </div>
    </div>
  )
}

function Table({ headers, children }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ background:'#F9FAF7' }}>
            {headers.map(h => <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function ExpenseModal({ onClose, onSaved }) {
  const [expenseDate, setExpenseDate] = useState(isoDate(new Date()))
  const [branchName, setBranchName] = useState('Hyderabad')
  const [category, setCategory] = useState('Fuel')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    const n = Number(amount || 0)
    if (!n || n <= 0) return alert('Enter a valid expense amount')
    setSaving(true)
    try {
      const { error } = await supabase.from('business_expenses').insert({
        expense_date: expenseDate,
        branch_name: branchName || null,
        category,
        amount: n,
        note: note || null,
        created_at: new Date().toISOString()
      })
      if (error) throw error
      onSaved(); onClose()
    } catch (e) {
      alert(e.message || 'Unable to save expense. Run the Finance SQL first.')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:120, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:G.white, borderRadius:20, width:'100%', maxWidth:460, padding:26 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:G.text }}>Add Business Expense</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:G.muted }}>✕</button>
        </div>
        <div style={{ display:'grid', gap:14 }}>
          <label style={{ fontSize:12, fontWeight:700, color:G.muted }}>Date
            <input type="date" value={expenseDate} onChange={e=>setExpenseDate(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ fontSize:12, fontWeight:700, color:G.muted }}>Branch
            <select value={branchName} onChange={e=>setBranchName(e.target.value)} style={inputStyle}>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label style={{ fontSize:12, fontWeight:700, color:G.muted }}>Category
            <select value={category} onChange={e=>setCategory(e.target.value)} style={inputStyle}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ fontSize:12, fontWeight:700, color:G.muted }}>Amount
            <input type="number" min="1" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Example: 500" style={inputStyle} />
          </label>
          <label style={{ fontSize:12, fontWeight:700, color:G.muted }}>Note
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note" style={inputStyle} />
          </label>
        </div>
        <button onClick={save} disabled={saving} style={{ width:'100%', marginTop:20, padding:13, background:saving?'#9CA3AF':G.green, color:G.white, border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer' }}>
          {saving ? 'Saving...' : 'Save Expense'}
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  display:'block', width:'100%', marginTop:7, padding:'10px 12px', borderRadius:10,
  border:`1.5px solid ${G.border}`, fontSize:14, color:G.text, outline:'none', background:'#FAFAFA', boxSizing:'border-box'
}

export default function FinancePage() {
  const [range, setRange] = useState('monthly')
  const [presetStart, presetEnd] = getRangePreset('monthly')
  const [startDate, setStartDate] = useState(presetStart)
  const [endDate, setEndDate] = useState(presetEnd)
  const [branch, setBranch] = useState('all')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showExpense, setShowExpense] = useState(false)
  const [savingCost, setSavingCost] = useState(null)
  const [costDraft, setCostDraft] = useState({})

  useEffect(() => {
    if (range === 'custom') return
    const [s, e] = getRangePreset(range)
    setStartDate(s)
    setEndDate(e)
  }, [range])

  useEffect(() => { load() }, [startDate, endDate])

  async function load() {
    setLoading(true); setError('')
    try {
      const [oRes, pRes, eRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id,order_number,customer_name,total_amount,status,payment_status,payment_method,order_type,branch,pickup_branch,delivery_cost,discount_amount,refund_amount,created_at,order_items(product_id,name,quantity,price_per_unit,weight_kg)')
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`)
          .order('created_at', { ascending:false }),
        supabase.from('products').select('id,name,sku,weight_kg,price_per_bag,cost_per_bag,packing_cost_per_bag,active').order('weight_kg'),
        supabase.from('business_expenses').select('*').gte('expense_date', startDate).lte('expense_date', endDate).order('expense_date', { ascending:false })
      ])

      if (oRes.error) throw oRes.error
      if (pRes.error) throw pRes.error
      if (eRes.error) {
        setExpenses([])
        setError('Finance expense table is missing or blocked. Run the Finance SQL file in Supabase SQL Editor.')
      } else {
        setExpenses(eRes.data || [])
      }

      setOrders(oRes.data || [])
      setProducts(pRes.data || [])
      const draft = {}
      for (const p of pRes.data || []) {
        draft[p.id] = {
          cost_per_bag: p.cost_per_bag ?? 0,
          packing_cost_per_bag: p.packing_cost_per_bag ?? 0
        }
      }
      setCostDraft(draft)
    } catch (e) {
      setError(e.message || 'Failed to load finance data')
    } finally { setLoading(false) }
  }

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => branch === 'all' || getOrderBranch(o) === branch)
  }, [orders, branch])

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => branch === 'all' || e.branch_name === branch)
  }, [expenses, branch])

  const paidOrders = useMemo(() => filteredOrders.filter(o => o.payment_status === 'paid' && o.status !== 'cancelled'), [filteredOrders])
  const metrics = useMemo(() => metricForOrders(filteredOrders, productMap, filteredExpenses), [filteredOrders, productMap, filteredExpenses])

  const chartRows = useMemo(() => {
    const map = new Map()
    for (const order of filteredOrders) {
      const key = periodKey(order.created_at, range, startDate, endDate)
      const row = map.get(key) || { period:key, revenue:0, cost:0, profit:0, orders:0 }
      const m = metricForOrders([order], productMap, [])
      row.revenue += m.revenue
      row.cost += (m.productCost + m.packingCost + m.deliveryCost + m.discounts + m.refunds)
      row.profit += m.netProfit
      row.orders += order.payment_status === 'paid' && order.status !== 'cancelled' ? 1 : 0
      map.set(key, row)
    }
    for (const expense of filteredExpenses) {
      const key = periodKey(expense.expense_date, range, startDate, endDate)
      const row = map.get(key) || { period:key, revenue:0, cost:0, profit:0, orders:0 }
      row.cost += Number(expense.amount || 0)
      row.profit -= Number(expense.amount || 0)
      map.set(key, row)
    }
    return Array.from(map.values()).reverse()
  }, [filteredOrders, filteredExpenses, productMap, range, startDate, endDate])

  const branchRows = useMemo(() => {
    const rows = BRANCHES.map(b => {
      const os = orders.filter(o => getOrderBranch(o) === b && inRange(o.created_at, startDate, endDate))
      const es = expenses.filter(e => e.branch_name === b && inRange(e.expense_date, startDate, endDate))
      const m = metricForOrders(os, productMap, es)
      return { branch:b, ...m }
    })
    return rows.sort((a,b) => b.netProfit - a.netProfit)
  }, [orders, expenses, productMap, startDate, endDate])

  const productRows = useMemo(() => {
    const map = new Map()
    for (const order of paidOrders) {
      for (const item of order.order_items || []) {
        const p = productMap.get(item.product_id) || {}
        const qty = Number(item.quantity || 0)
        const revenue = qty * Number(item.price_per_unit || 0)
        const cost = qty * Number(p.cost_per_bag || 0)
        const packing = qty * Number(p.packing_cost_per_bag || 0)
        const row = map.get(item.product_id) || { product:item.name, qty:0, revenue:0, cost:0, packing:0, profit:0 }
        row.qty += qty
        row.revenue += revenue
        row.cost += cost
        row.packing += packing
        row.profit += revenue - cost - packing
        map.set(item.product_id, row)
      }
    }
    return Array.from(map.values()).sort((a,b) => b.profit - a.profit)
  }, [paidOrders, productMap])

  const expenseRows = useMemo(() => {
    const map = new Map()
    for (const e of filteredExpenses) {
      const row = map.get(e.category) || { category:e.category, amount:0 }
      row.amount += Number(e.amount || 0)
      map.set(e.category, row)
    }
    return Array.from(map.values()).sort((a,b) => b.amount - a.amount)
  }, [filteredExpenses])

  async function saveProductCost(productId) {
    setSavingCost(productId)
    const values = costDraft[productId] || {}
    try {
      const { error } = await supabase
        .from('products')
        .update({
          cost_per_bag: Number(values.cost_per_bag || 0),
          packing_cost_per_bag: Number(values.packing_cost_per_bag || 0)
        })
        .eq('id', productId)
      if (error) throw error
      await load()
    } catch (e) {
      alert(e.message || 'Unable to update product cost')
    } finally { setSavingCost(null) }
  }

  function exportCsv() {
    const rows = [
      ['Period', startDate, endDate],
      ['Branch', branch],
      [],
      ['Revenue', metrics.revenue],
      ['Product Cost', metrics.productCost],
      ['Packing Cost', metrics.packingCost],
      ['Delivery Cost', metrics.deliveryCost],
      ['Discounts', metrics.discounts],
      ['Refunds', metrics.refunds],
      ['Business Expenses', metrics.expenses],
      ['Net Profit', metrics.netProfit],
      ['Margin %', metrics.margin.toFixed(2)],
      [],
      ['Branch','Revenue','Cost','Expenses','Net Profit','Margin %'],
      ...branchRows.map(r => [r.branch, r.revenue, r.productCost + r.packingCost + r.deliveryCost + r.discounts + r.refunds, r.expenses, r.netProfit, r.margin.toFixed(2)]),
      [],
      ['Product','Bags','Revenue','Product Cost','Packing Cost','Profit'],
      ...productRows.map(r => [r.product, r.qty, r.revenue, r.cost, r.packing, r.profit])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `GVR_Finance_${startDate}_to_${endDate}.csv`
    a.click()
  }

  if (loading) return <div style={{ textAlign:'center', padding:70, color:G.muted }}>Loading finance data...</div>

  return (
    <div style={{ fontFamily:"'Inter', sans-serif" }}>
      {showExpense && <ExpenseModal onClose={()=>setShowExpense(false)} onSaved={load} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:18 }}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:G.greenDark }}>💹 Finance / Profit & Loss</h2>
          <p style={{ margin:0, fontSize:13, color:G.muted }}>Monthly, quarterly, yearly revenue, costs, expenses, and net profit.</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={exportCsv} style={{ background:G.blueLight, color:G.blue, border:'none', borderRadius:10, padding:'9px 14px', fontSize:13, fontWeight:800, cursor:'pointer' }}>⬇ Export CSV</button>
          <button onClick={()=>setShowExpense(true)} style={{ background:G.green, color:G.white, border:'none', borderRadius:10, padding:'9px 14px', fontSize:13, fontWeight:800, cursor:'pointer' }}>+ Add Expense</button>
          <button onClick={load} style={{ background:G.white, color:G.text, border:`1px solid ${G.border}`, borderRadius:10, padding:'9px 14px', fontSize:13, fontWeight:700, cursor:'pointer' }}>↻ Refresh</button>
        </div>
      </div>

      {error && <div style={{ background:G.amberLight, border:`1px solid ${G.amber}`, borderRadius:12, padding:'10px 14px', color:G.amber, fontSize:13, fontWeight:700, marginBottom:16 }}>{error}</div>}

      <div style={{ background:G.white, borderRadius:14, padding:'14px 16px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        {['monthly','quarterly','yearly','custom'].map(r => (
          <button key={r} onClick={()=>setRange(r)} style={{ padding:'7px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:800, background:range===r?G.green:'#F3F4F6', color:range===r?G.white:G.muted }}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
        <select value={branch} onChange={e=>setBranch(e.target.value)} style={{ ...inputStyle, width:170, marginTop:0 }}>
          <option value="all">All Branches</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input type="date" value={startDate} onChange={e=>{ setRange('custom'); setStartDate(e.target.value) }} style={{ ...inputStyle, width:150, marginTop:0 }} />
        <input type="date" value={endDate} onChange={e=>{ setRange('custom'); setEndDate(e.target.value) }} style={{ ...inputStyle, width:150, marginTop:0 }} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:14, marginBottom:18 }}>
        <StatCard label="Revenue" value={fmtRs(metrics.revenue)} icon="💰" color={G.green} bg={G.greenLight} sub={`${paidOrders.length} paid orders`} />
        <StatCard label="Product Cost" value={fmtRs(metrics.productCost)} icon="🌾" color={G.amber} bg={G.amberLight} sub={`${metrics.bags} bags`} />
        <StatCard label="Packing Cost" value={fmtRs(metrics.packingCost)} icon="📦" color={G.blue} bg={G.blueLight} />
        <StatCard label="Business Expenses" value={fmtRs(metrics.expenses)} icon="🧾" color={G.purple} bg={G.purpleLight} />
        <StatCard label="Net Profit" value={fmtRs(metrics.netProfit)} icon={metrics.netProfit >= 0 ? '📈' : '📉'} color={metrics.netProfit >= 0 ? G.green : G.red} bg={metrics.netProfit >= 0 ? G.greenLight : G.redLight} sub={`Margin ${fmtPct(metrics.margin)}`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:18, marginBottom:18 }}>
        <div style={{ background:G.white, borderRadius:16, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:800 }}>Revenue vs Cost vs Profit</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="period" tick={{fontSize:11, fill:G.muted}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:11, fill:G.muted}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`₹${Math.round(v/1000)}k`:`₹${v}`} />
              <Tooltip formatter={v => fmtRs(v)} contentStyle={{borderRadius:10, fontSize:12}} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill={G.green} radius={[6,6,0,0]} />
              <Bar dataKey="cost" name="Cost" fill={G.amber} radius={[6,6,0,0]} />
              <Bar dataKey="profit" name="Net Profit" fill={metrics.netProfit >= 0 ? G.blue : G.red} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:G.white, borderRadius:16, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:800 }}>Profit Trend</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="period" tick={{fontSize:11, fill:G.muted}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:11, fill:G.muted}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`₹${Math.round(v/1000)}k`:`₹${v}`} />
              <Tooltip formatter={v => fmtRs(v)} contentStyle={{borderRadius:10, fontSize:12}} />
              <Line type="monotone" dataKey="profit" name="Net Profit" stroke={metrics.netProfit >= 0 ? G.green : G.red} strokeWidth={2.5} dot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
        <div style={{ background:G.white, borderRadius:16, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:800 }}>Branch-wise Profit</p>
          <Table headers={['Branch','Revenue','Cost','Expenses','Net Profit','Margin']}>
            {branchRows.map((r, i) => (
              <tr key={r.branch} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
                <td style={{ padding:'10px 14px', fontWeight:700 }}>{r.branch}</td>
                <td style={{ padding:'10px 14px', color:G.green, fontWeight:700 }}>{fmtRs(r.revenue)}</td>
                <td style={{ padding:'10px 14px', color:G.amber }}>{fmtRs(r.productCost + r.packingCost + r.deliveryCost + r.discounts + r.refunds)}</td>
                <td style={{ padding:'10px 14px', color:G.purple }}>{fmtRs(r.expenses)}</td>
                <td style={{ padding:'10px 14px', color:r.netProfit >= 0 ? G.green : G.red, fontWeight:800 }}>{fmtRs(r.netProfit)}</td>
                <td style={{ padding:'10px 14px', color:G.muted }}>{fmtPct(r.margin)}</td>
              </tr>
            ))}
          </Table>
        </div>

        <div style={{ background:G.white, borderRadius:16, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:800 }}>Expense Breakdown</p>
          <Table headers={['Category','Amount']}>
            {expenseRows.map((r, i) => (
              <tr key={r.category} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
                <td style={{ padding:'10px 14px', fontWeight:700 }}>{r.category}</td>
                <td style={{ padding:'10px 14px', color:G.red, fontWeight:800 }}>{fmtRs(r.amount)}</td>
              </tr>
            ))}
            {expenseRows.length === 0 && <tr><td colSpan={2} style={{ padding:30, textAlign:'center', color:G.muted }}>No expenses added for this period</td></tr>}
          </Table>
        </div>
      </div>

      <div style={{ background:G.white, borderRadius:16, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:18 }}>
        <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:800 }}>Product-wise Profit</p>
        <Table headers={['Product','Bags Sold','Revenue','Product Cost','Packing Cost','Profit']}>
          {productRows.map((r, i) => (
            <tr key={r.product} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
              <td style={{ padding:'10px 14px', fontWeight:700 }}>{r.product}</td>
              <td style={{ padding:'10px 14px' }}>{r.qty}</td>
              <td style={{ padding:'10px 14px', color:G.green, fontWeight:700 }}>{fmtRs(r.revenue)}</td>
              <td style={{ padding:'10px 14px', color:G.amber }}>{fmtRs(r.cost)}</td>
              <td style={{ padding:'10px 14px', color:G.blue }}>{fmtRs(r.packing)}</td>
              <td style={{ padding:'10px 14px', color:r.profit >= 0 ? G.green : G.red, fontWeight:800 }}>{fmtRs(r.profit)}</td>
            </tr>
          ))}
          {productRows.length === 0 && <tr><td colSpan={6} style={{ padding:30, textAlign:'center', color:G.muted }}>No paid product sales found in this period</td></tr>}
        </Table>
      </div>

      <div style={{ background:G.white, borderRadius:16, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ margin:'0 0 6px', fontSize:13, fontWeight:800 }}>Product Cost Setup</p>
        <p style={{ margin:'0 0 14px', fontSize:12, color:G.muted }}>Enter actual purchase/milling cost and packing cost per bag. Profit accuracy depends on these values.</p>
        <Table headers={['Product','Selling Price','Cost / Bag','Packing / Bag','Margin / Bag','Action']}>
          {products.map((p, i) => {
            const draft = costDraft[p.id] || {}
            const cost = Number(draft.cost_per_bag || 0)
            const pack = Number(draft.packing_cost_per_bag || 0)
            const margin = Number(p.price_per_bag || 0) - cost - pack
            return (
              <tr key={p.id} style={{ borderTop:`1px solid ${G.border}`, background:i%2?'#FAFAFA':G.white }}>
                <td style={{ padding:'10px 14px', fontWeight:700 }}>{p.name}</td>
                <td style={{ padding:'10px 14px', color:G.green, fontWeight:700 }}>{fmtRs(p.price_per_bag)}</td>
                <td style={{ padding:'10px 14px' }}><input type="number" value={draft.cost_per_bag ?? ''} onChange={e=>setCostDraft(prev=>({...prev, [p.id]:{...prev[p.id], cost_per_bag:e.target.value}}))} style={{ ...inputStyle, width:110, marginTop:0 }} /></td>
                <td style={{ padding:'10px 14px' }}><input type="number" value={draft.packing_cost_per_bag ?? ''} onChange={e=>setCostDraft(prev=>({...prev, [p.id]:{...prev[p.id], packing_cost_per_bag:e.target.value}}))} style={{ ...inputStyle, width:110, marginTop:0 }} /></td>
                <td style={{ padding:'10px 14px', color:margin >= 0 ? G.green : G.red, fontWeight:800 }}>{fmtRs(margin)}</td>
                <td style={{ padding:'10px 14px' }}><button onClick={()=>saveProductCost(p.id)} disabled={savingCost===p.id} style={{ background:savingCost===p.id?'#9CA3AF':G.greenLight, color:savingCost===p.id?G.white:G.green, border:'none', borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:800, cursor:'pointer' }}>{savingCost===p.id?'Saving...':'Save'}</button></td>
              </tr>
            )
          })}
        </Table>
      </div>
    </div>
  )
}

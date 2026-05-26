import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'
import { format, addMonths } from 'date-fns'

export default function InventoryPage() {
  const { language } = useAuthStore()
  const t = useT(language)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [stockAdd, setStockAdd] = useState<Record<string, number>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', name_telugu: '', weight_kg: 1, price_per_bag: 60, stock_bags: 0, low_stock_threshold: 50, sku: '' })

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('weight_kg')
    setProducts(data || [])
    setLoading(false)
  }

  async function addStock(id: string, bags: number) {
    const product = products.find(p => p.id === id)
    if (!product) return
    const newStock = product.stock_bags + bags
    await supabase.from('products').update({ stock_bags: newStock }).eq('id', id)
    await supabase.from('stock_movements').insert({ product_id: id, change_bags: bags, type: 'add', note: 'Manual addition' })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_bags: newStock } : p))
    setEditing(null)
    setStockAdd(prev => ({ ...prev, [id]: 0 }))
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('products').update({ active: !active }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !active } : p))
  }

  async function saveProduct() {
    const packingDate = new Date().toISOString().split('T')[0]
    const bestBefore = format(addMonths(new Date(), 12), 'yyyy-MM-dd')
    const { data } = await supabase.from('products').insert({ ...newProduct, packing_date: packingDate, best_before_date: bestBefore, active: true }).select().single()
    if (data) setProducts(prev => [...prev, data])
    setShowAddForm(false)
    setNewProduct({ name: '', name_telugu: '', weight_kg: 1, price_per_bag: 60, stock_bags: 0, low_stock_threshold: 50, sku: '' })
  }

  const stockPct = (p: any) => Math.min(100, Math.round((p.stock_bags / Math.max(p.stock_bags, p.low_stock_threshold * 3)) * 100))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>{t.inventory.title}</h1>
        <button className="btn-primary text-sm" onClick={() => setShowAddForm(true)}>+ Add Product</button>
      </div>

      {/* Add product form */}
      {showAddForm && (
        <div className="card border-2" style={{ borderColor: 'var(--gvr-green)' }}>
          <h3 className="font-medium text-gray-800 mb-4">New Product</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { key: 'name', label: 'Name (English)', type: 'text' },
              { key: 'name_telugu', label: 'Name (Telugu)', type: 'text' },
              { key: 'weight_kg', label: 'Weight (kg)', type: 'number' },
              { key: 'price_per_bag', label: 'Price per bag (₹)', type: 'number' },
              { key: 'stock_bags', label: 'Opening stock (bags)', type: 'number' },
              { key: 'sku', label: 'SKU', type: 'text' },
              { key: 'low_stock_threshold', label: 'Low stock alert at', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                <input type={f.type} className="input" value={(newProduct as any)[f.key]}
                       onChange={e => setNewProduct(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-primary text-sm" onClick={saveProduct}>Save Product</button>
            <button className="btn-ghost text-sm" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <p className="text-gray-400 text-sm">{t.common.loading}</p>}

      <div className="space-y-3">
        {products.map(product => {
          const isLow = product.stock_bags <= product.low_stock_threshold
          const pct = stockPct(product)
          return (
            <div key={product.id} className={`card ${!product.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌾</span>
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.name_telugu} · {product.sku}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold" style={{ color: isLow ? 'var(--gvr-amber)' : 'var(--gvr-green)' }}>
                    {product.stock_bags}
                  </p>
                  <p className="text-xs text-gray-400">{t.inventory.bagsLeft}</p>
                </div>
              </div>

              {/* Stock bar */}
              <div className="h-1.5 rounded-full bg-gray-100 mb-3 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                     style={{ width: `${pct}%`, background: isLow ? 'var(--gvr-amber)' : 'var(--gvr-green)' }} />
              </div>

              {/* Details row */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                <span>⚖️ {product.weight_kg} kg</span>
                <span>💰 ₹{product.price_per_bag}/bag</span>
                {product.packing_date && <span>📅 Packed: {format(new Date(product.packing_date), 'dd MMM yyyy')}</span>}
                {product.best_before_date && <span>⏳ Best before: {format(new Date(product.best_before_date), 'dd MMM yyyy')}</span>}
                {isLow && <span className="text-amber-600 font-medium">⚠ {t.inventory.lowStock}</span>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {editing === product.id ? (
                  <>
                    <input type="number" min={1} className="input w-24 text-sm"
                           value={stockAdd[product.id] || ''}
                           onChange={e => setStockAdd(prev => ({ ...prev, [product.id]: Number(e.target.value) }))}
                           placeholder="Bags" />
                    <button className="btn-primary text-xs px-3 py-1.5"
                            onClick={() => addStock(product.id, stockAdd[product.id] || 0)}>
                      + Add
                    </button>
                    <button className="btn-ghost text-xs" onClick={() => setEditing(null)}>Cancel</button>
                  </>
                ) : (
                  <button className="btn-outline text-xs px-3 py-1.5" onClick={() => setEditing(product.id)}>
                    + {t.inventory.addStock}
                  </button>
                )}
                <button
                  className="text-xs px-3 py-1.5 rounded-xl border transition-all"
                  style={{ borderColor: product.active ? '#FCA5A5' : '#D1D5DB', color: product.active ? '#EF4444' : '#6B7280' }}
                  onClick={() => toggleActive(product.id, product.active)}
                >
                  {product.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

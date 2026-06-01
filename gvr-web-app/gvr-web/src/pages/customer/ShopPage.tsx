import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/lib/i18n'
import { format } from 'date-fns'

interface CartItem { productId: string; name: string; weightKg: number; qty: number; price: number }

export default function ShopPage() {
  const { language, user } = useAuthStore()
  const t = useT(language)
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'shop' | 'checkout'>('shop')
  const [address, setAddress] = useState('')
  const [payMethod, setPayMethod] = useState<'upi' | 'cod'>('upi')
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').eq('active', true).order('weight_kg')
    setProducts(data || [])
    setLoading(false)
  }

  const total = cart.reduce((s, i) => s + i.qty * i.price, 0)
  const gst = Math.round(total * 0.05)
  const grand = total + gst

  const updateCart = (p: any, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === p.id)
      if (!existing && delta > 0) return [...prev, { productId: p.id, name: p.name, weightKg: p.weight_kg, qty: 1, price: p.price_per_bag }]
      if (existing) {
        const newQty = existing.qty + delta
        if (newQty <= 0) return prev.filter(i => i.productId !== p.id)
        return prev.map(i => i.productId === p.id ? { ...i, qty: newQty } : i)
      }
      return prev
    })
  }

  const getQty = (id: string) => cart.find(i => i.productId === id)?.qty || 0

  async function placeOrder() {
    if (!address.trim()) return
    setPlacing(true)
    try {
      // Generate order number
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true })
      const orderNumber = `GVR-${String((count || 0) + 1).padStart(4, '0')}`

      const { data: order, error } = await supabase.from('orders').insert({
        customer_id: user!.id,
        order_number: orderNumber,
        delivery_address: address,
        total_amount: total,
        status: 'pending',
        payment_status: payMethod === 'cod' ? 'pending' : 'pending',
        payment_method: payMethod,
      }).select().single()

      if (error || !order) throw error

      // Insert order items & deduct stock
      for (const item of cart) {
        await supabase.from('order_items').insert({
          order_id: order.id, product_id: item.productId,
          name: item.name, weight_kg: item.weightKg,
          quantity: item.qty, price_per_unit: item.price,
        })
        await supabase.from('products').update({ stock_bags: products.find(p => p.id === item.productId)!.stock_bags - item.qty }).eq('id', item.productId)
      }

      setSuccess(orderNumber)
      setCart([])
      setStep('shop')
      setAddress('')
    } catch (e) {
      console.error(e)
    } finally {
      setPlacing(false)
    }
  }

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-display font-semibold mb-2" style={{ color: 'var(--gvr-green-dark)' }}>
        {language === 'te' ? 'ఆర్డర్ నిర్ధారించబడింది!' : 'Order Placed!'}
      </h2>
      <p className="text-gray-500 mb-1">{success}</p>
      <p className="text-sm text-gray-400 mb-6">{language === 'te' ? 'మీ ఆర్డర్ త్వరలో డెలివరీ అవుతుంది' : 'Your order will be delivered soon'}</p>
      <button className="btn-primary" onClick={() => setSuccess('')}>
        {language === 'te' ? 'మళ్ళీ ఆర్డర్ చేయండి' : 'Order More'}
      </button>
    </div>
  )

  if (step === 'checkout') return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep('shop')} className="text-gray-400 hover:text-gray-600">←</button>
        <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>{t.shop.checkout}</h2>
      </div>

      {/* Cart summary */}
      <div className="card">
        {cart.map(item => (
          <div key={item.productId} className="flex justify-between items-center py-1.5 text-sm">
            <span>{item.name} ({item.weightKg}kg)</span>
            <span className="text-gray-500">× {item.qty} = ₹{item.qty * item.price}</span>
          </div>
        ))}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.shop.address}</label>
        <textarea className="input resize-none h-20" placeholder={language === 'te' ? 'పూర్తి చిరునామా నమోదు చేయండి…' : 'Enter full delivery address…'}
                  value={address} onChange={e => setAddress(e.target.value)} />
      </div>

      {/* Payment */}
      <div className="space-y-2">
        {(['upi', 'cod'] as const).map(m => (
          <button key={m} onClick={() => setPayMethod(m)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all"
                  style={{ borderColor: payMethod === m ? 'var(--gvr-green)' : '#E5E7EB', background: payMethod === m ? 'var(--gvr-green-light)' : 'white' }}>
            <span className="text-xl">{m === 'upi' ? '📱' : '💵'}</span>
            <div className="text-left">
              <p className="text-sm font-medium" style={{ color: payMethod === m ? 'var(--gvr-green-dark)' : 'var(--gvr-text)' }}>
                {m === 'upi' ? t.shop.payUPI : t.shop.payCOD}
              </p>
              <p className="text-xs text-gray-400">{m === 'upi' ? 'GPay · PhonePe · Paytm' : language === 'te' ? 'డెలివరీలో చెల్లించండి' : 'Pay when delivered'}</p>
            </div>
            {payMethod === m && <span className="ml-auto text-green-600">✓</span>}
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="card space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{total}</span></div>
        <div className="flex justify-between text-gray-500"><span>GST (5%)</span><span>₹{gst}</span></div>
        <div className="flex justify-between text-gray-500"><span>Delivery</span><span className="text-green-600">Free</span></div>
        <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-100">
          <span>{t.shop.total}</span>
          <span style={{ color: 'var(--gvr-green)' }}>₹{grand}</span>
        </div>
      </div>

      <button className="btn-primary w-full" onClick={placeOrder} disabled={placing || !address.trim()}>
        {placing ? (language === 'te' ? 'ఆర్డర్ పంపుతోంది…' : 'Placing order…') : `${payMethod === 'upi' ? '🔒 Pay' : '📦 Place Order'} ₹${grand}`}
      </button>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--gvr-green-dark)' }}>{t.shop.title}</h2>
        {cart.length > 0 && (
          <button className="btn-primary text-sm px-4 py-2" onClick={() => setStep('checkout')}>
            🛒 {cart.reduce((s, i) => s + i.qty, 0)} · ₹{total}
          </button>
        )}
      </div>

      {loading && <p className="text-gray-400 text-sm">{t.common.loading}</p>}

      <div className="space-y-3">
        {products.map(product => {
          const qty = getQty(product.id)
          return (
            <div key={product.id} className="card flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                   style={{ background: 'var(--gvr-green-light)' }}>🌾</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{product.name}</p>
                <p className="text-xs text-gray-400">{product.name_telugu}</p>
                {product.packing_date && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--gvr-green)' }}>
                    ✓ {t.shop.freshNote}: {format(new Date(product.packing_date), 'dd MMM yyyy')}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <p className="font-semibold text-gray-800">₹{product.price_per_bag}</p>
                {qty === 0 ? (
                  <button className="btn-primary text-xs px-4 py-1.5" onClick={() => updateCart(product, 1)}>
                    {t.shop.addToCart}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl px-2 py-1"
                       style={{ background: 'var(--gvr-green-light)' }}>
                    <button className="w-6 h-6 flex items-center justify-center text-lg leading-none"
                            style={{ color: 'var(--gvr-green)' }}
                            onClick={() => updateCart(product, -1)}>−</button>
                    <span className="text-sm font-semibold" style={{ color: 'var(--gvr-green-dark)', minWidth: 16, textAlign: 'center' }}>{qty}</span>
                    <button className="w-6 h-6 flex items-center justify-center text-lg leading-none"
                            style={{ color: 'var(--gvr-green)' }}
                            onClick={() => updateCart(product, 1)}>+</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {!loading && products.length === 0 && (
          <p className="text-center text-gray-400 py-12">{t.common.noData}</p>
        )}
      </div>
    </div>
  )
}

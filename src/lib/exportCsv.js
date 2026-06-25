// src/lib/exportCsv.js
// FIX #9: CSV/Excel export utility
// Usage:
//   import { exportOrdersCSV, exportStockCSV } from '../lib/exportCsv'
//   exportOrdersCSV(orders)
//   exportStockCSV(products)

function toCSV(headers, rows) {
  const escape = v => {
    const s = String(v === null || v === undefined ? '' : v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(','))
  ]
  return lines.join('\r\n')
}

function download(csv, filename) {
  const BOM = '\uFEFF' // UTF-8 BOM — makes Excel open it correctly
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportOrdersCSV(orders, filename) {
  const headers = [
    'Order Number', 'Date', 'Time', 'Customer Name', 'Phone',
    'Delivery Address', 'Items', 'Bags', 'Total Amount (₹)',
    'Status', 'Payment Method', 'Payment Status', 'Order Type', 'Branch', 'Notes'
  ]
  const rows = orders.map(o => {
    const items = (o.order_items || [])
      .map(i => `${i.name} x${i.quantity}`)
      .join(' | ')
    const bags = (o.order_items || []).reduce((s, i) => s + (i.quantity || 0), 0)
    const dt = o.created_at ? new Date(o.created_at) : null
    return [
      o.order_number || '',
      dt ? dt.toLocaleDateString('en-IN') : '',
      dt ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
      o.customer_name || '',
      o.phone || '',
      o.delivery_address || '',
      items,
      bags,
      Number(o.total_amount || 0).toFixed(2),
      o.status || '',
      o.payment_method || '',
      o.payment_status || '',
      o.order_type || 'delivery',
      o.branch || o.pickup_branch || '',
      o.notes || '',
    ]
  })
  const date = new Date().toISOString().split('T')[0]
  download(toCSV(headers, rows), filename || `GVR_Orders_${date}.csv`)
}

export function exportStockCSV(products, filename) {
  const headers = [
    'Product Name', 'Telugu Name', 'SKU', 'Weight (kg)',
    'Price per Bag (₹)', 'Price per kg (₹)', 'Stock (Bags)',
    'Low Stock Threshold', 'Status', 'Packing Date', 'Best Before'
  ]
  const rows = products.map(p => [
    p.name || '',
    p.name_telugu || '',
    p.sku || '',
    p.weight_kg || '',
    Number(p.price_per_bag || 0).toFixed(2),
    p.weight_kg ? Number(p.price_per_bag / p.weight_kg).toFixed(2) : '',
    p.stock_bags || 0,
    p.low_stock_threshold || '',
    p.active ? 'Active' : 'Inactive',
    p.packing_date ? new Date(p.packing_date).toLocaleDateString('en-IN') : '',
    p.best_before_date ? new Date(p.best_before_date).toLocaleDateString('en-IN') : '',
  ])
  const date = new Date().toISOString().split('T')[0]
  download(toCSV(headers, rows), filename || `GVR_Stock_${date}.csv`)
}

export function exportBranchStockCSV(branchStock, products, branch, filename) {
  const headers = ['Branch', 'Product', 'SKU', 'Weight (kg)', 'Stock (Bags)', 'Low Stock Threshold', 'Status', 'Last Updated']
  const rows = products.map(p => {
    const bs = branchStock.find(b => b.product_id === p.id)
    const stock = bs?.stock_bags || 0
    const isLow = stock <= p.low_stock_threshold
    return [
      branch,
      p.name,
      p.sku || '',
      p.weight_kg,
      stock,
      p.low_stock_threshold,
      isLow ? 'LOW STOCK' : 'OK',
      bs?.updated_at ? new Date(bs.updated_at).toLocaleDateString('en-IN') : '—',
    ]
  })
  const date = new Date().toISOString().split('T')[0]
  download(toCSV(headers, rows), filename || `GVR_BranchStock_${branch}_${date}.csv`)
}

export function exportWalletCSV(transactions, username, filename) {
  const headers = ['Date', 'Type', 'Amount (₹)', 'Reason', 'Order Number']
  const rows = transactions.map(t => [
    new Date(t.created_at).toLocaleDateString('en-IN'),
    t.type === 'credit' ? 'Credit' : 'Debit',
    Number(t.amount || 0).toFixed(2),
    t.reason || '',
    t.order_id || '',
  ])
  const date = new Date().toISOString().split('T')[0]
  download(toCSV(headers, rows), filename || `GVR_Wallet_${username}_${date}.csv`)
}

export function exportSubscriptionsCSV(subscriptions, filename) {
  const headers = [
    'Customer', 'Product', 'Quantity (Bags)', 'Frequency',
    'Discount %', 'Next Order Date', 'Status', 'Total Orders',
    'Address', 'Phone', 'Payment Method', 'Created'
  ]
  const rows = subscriptions.map(s => [
    s.customer_name || '',
    s.product_name || '',
    s.quantity_bags || 1,
    s.frequency || '',
    s.discount_pct || 0,
    s.next_order_date ? new Date(s.next_order_date).toLocaleDateString('en-IN') : '',
    s.status || '',
    s.total_orders || 0,
    s.address || '',
    s.phone || '',
    s.payment_method || '',
    s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : '',
  ])
  const date = new Date().toISOString().split('T')[0]
  download(toCSV(headers, rows), filename || `GVR_Subscriptions_${date}.csv`)
}

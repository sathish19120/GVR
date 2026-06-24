// ============================================================
// GVR Google Analytics 4 — Analytics Tracking
// FIX #5/#11: correct path is src/lib/analytics.js
//             Move this file from src/pages/ to src/lib/
//             Then in src/main.jsx add:
//               import { initGA } from './lib/analytics'
//               initGA()
// ============================================================

const GA_ID = import.meta.env.VITE_GA_ID || ''

// ── Initialize GA4 ────────────────────────────────────────
export function initGA() {
  if (!GA_ID) {
    if (import.meta.env.DEV) {
      console.warn('[GVR Analytics] VITE_GA_ID not set — analytics disabled')
    }
    return
  }

  // Avoid double-init
  if (window.__gvrAnalyticsInit) return
  window.__gvrAnalyticsInit = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(){ window.dataLayer.push(arguments) }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_ID, {
    page_title:    document.title,
    page_location: window.location.href,
    custom_map: {
      dimension1: 'user_role',
      dimension2: 'branch',
    }
  })
}

// ── Page View ─────────────────────────────────────────────
export function trackPage(pageName, userRole) {
  if (!window.gtag) return
  window.gtag('event', 'page_view', {
    page_title:    pageName,
    page_location: window.location.href,
    user_role:     userRole || 'guest',
  })
}

// ── E-commerce Events ─────────────────────────────────────

export function trackProductView(product) {
  if (!window.gtag) return
  window.gtag('event', 'view_item', {
    currency: 'INR',
    value:    product.price_per_bag,
    items: [{
      item_id:       product.id,
      item_name:     product.name,
      price:         product.price_per_bag,
      item_category: product.weight_kg + 'kg',
    }]
  })
}

export function trackAddToCart(product, quantity) {
  if (!window.gtag) return
  window.gtag('event', 'add_to_cart', {
    currency: 'INR',
    value:    product.price_per_bag * quantity,
    items: [{
      item_id:       product.id,
      item_name:     product.name,
      price:         product.price_per_bag,
      quantity,
      item_category: product.weight_kg + 'kg',
    }]
  })
}

export function trackBeginCheckout(cartItems, totalAmount) {
  if (!window.gtag) return
  window.gtag('event', 'begin_checkout', {
    currency: 'INR',
    value:    totalAmount,
    items:    cartItems.map(item => ({
      item_id:   item.id,
      item_name: item.name,
      price:     item.price_per_bag,
      quantity:  item.quantity,
    }))
  })
}

export function trackPurchase(orderNumber, items, totalAmount, paymentMethod) {
  if (!window.gtag) return
  window.gtag('event', 'purchase', {
    transaction_id: orderNumber,
    currency:       'INR',
    value:          totalAmount,
    payment_type:   paymentMethod,
    items:          items.map(item => ({
      item_id:   item.id || item.product_id,
      item_name: item.name,
      price:     item.price_per_bag || item.price_per_unit,
      quantity:  item.quantity,
    }))
  })
}

// ── Auth Events ───────────────────────────────────────────

export function trackSignup(method) {
  if (!window.gtag) return
  window.gtag('event', 'sign_up', { method: method || 'username' })
}

export function trackLogin(role) {
  if (!window.gtag) return
  window.gtag('event', 'login', { method: 'username', user_role: role })
}

// ── UX Events ─────────────────────────────────────────────

export function trackOrderType(orderType) {
  if (!window.gtag) return
  window.gtag('event', 'select_order_type', { order_type: orderType })
}

export function trackPaymentMethod(method) {
  if (!window.gtag) return
  window.gtag('event', 'select_payment_method', { payment_method: method })
}

export function trackReferralShare(method) {
  if (!window.gtag) return
  window.gtag('event', 'share', {
    method:       method || 'copy',
    content_type: 'referral_code',
  })
}

export function trackSubscription(product, frequency, amount) {
  if (!window.gtag) return
  window.gtag('event', 'subscribe', {
    currency:     'INR',
    value:        amount,
    product_name: product,
    frequency,
  })
}

export function trackSearch(searchTerm) {
  if (!window.gtag) return
  window.gtag('event', 'search', { search_term: searchTerm })
}

export function trackError(errorMessage, fatal = false) {
  if (!window.gtag) return
  window.gtag('event', 'exception', {
    description: errorMessage,
    fatal,
  })
}

export function trackTabSwitch(tabName) {
  if (!window.gtag) return
  window.gtag('event', 'tab_view', { tab_name: tabName })
}

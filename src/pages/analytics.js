// ============================================================
// GVR Google Analytics 4 — Analytics Tracking
// src/lib/analytics.js
// ============================================================

const GA_ID = import.meta.env.VITE_GA_ID || ''

// ── Initialize GA4 ────────────────────────────────────────
export function initGA() {
  if (!GA_ID) return

  // Load gtag script
  const script1 = document.createElement('script')
  script1.async = true
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script1)

  // Initialize
  window.dataLayer = window.dataLayer || []
  function gtag(){ window.dataLayer.push(arguments) }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_ID, {
    page_title:    document.title,
    page_location: window.location.href,
    // Custom dimensions
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

// ── Custom Events ─────────────────────────────────────────

// Product viewed
export function trackProductView(product) {
  if (!window.gtag) return
  window.gtag('event', 'view_item', {
    currency: 'INR',
    value:    product.price_per_bag,
    items: [{
      item_id:   product.id,
      item_name: product.name,
      price:     product.price_per_bag,
      item_category: product.weight_kg + 'kg',
    }]
  })
}

// Add to cart
export function trackAddToCart(product, quantity) {
  if (!window.gtag) return
  window.gtag('event', 'add_to_cart', {
    currency: 'INR',
    value:    product.price_per_bag * quantity,
    items: [{
      item_id:   product.id,
      item_name: product.name,
      price:     product.price_per_bag,
      quantity:  quantity,
      item_category: product.weight_kg + 'kg',
    }]
  })
}

// Begin checkout
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

// Purchase complete
export function trackPurchase(orderNumber, items, totalAmount, paymentMethod) {
  if (!window.gtag) return
  window.gtag('event', 'purchase', {
    transaction_id: orderNumber,
    currency:       'INR',
    value:          totalAmount,
    payment_type:   paymentMethod,
    items:          items.map(item => ({
      item_id:   item.id,
      item_name: item.name,
      price:     item.price_per_bag,
      quantity:  item.quantity,
    }))
  })
}

// Signup
export function trackSignup(method) {
  if (!window.gtag) return
  window.gtag('event', 'sign_up', { method: method || 'username' })
}

// Login
export function trackLogin(role) {
  if (!window.gtag) return
  window.gtag('event', 'login', { method: 'username', user_role: role })
}

// Order type selected (delivery vs pickup)
export function trackOrderType(orderType) {
  if (!window.gtag) return
  window.gtag('event', 'select_order_type', { order_type: orderType })
}

// Payment method selected
export function trackPaymentMethod(method) {
  if (!window.gtag) return
  window.gtag('event', 'select_payment_method', { payment_method: method })
}

// Referral shared
export function trackReferralShare(method) {
  if (!window.gtag) return
  window.gtag('event', 'share', {
    method:       method || 'copy',
    content_type: 'referral_code',
  })
}

// Subscription started
export function trackSubscription(product, frequency, amount) {
  if (!window.gtag) return
  window.gtag('event', 'subscribe', {
    currency:     'INR',
    value:        amount,
    product_name: product,
    frequency:    frequency,
  })
}

// Search
export function trackSearch(searchTerm) {
  if (!window.gtag) return
  window.gtag('event', 'search', { search_term: searchTerm })
}

// Error
export function trackError(errorMessage, fatal = false) {
  if (!window.gtag) return
  window.gtag('event', 'exception', {
    description: errorMessage,
    fatal:       fatal,
  })
}

// Tab switch (to understand navigation patterns)
export function trackTabSwitch(tabName) {
  if (!window.gtag) return
  window.gtag('event', 'tab_view', { tab_name: tabName })
}

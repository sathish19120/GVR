// src/lib/analytics.js
// FIX #13: moved from src/pages/analytics.js to src/lib/analytics.js
// Import in src/main.jsx: import { initGA } from './lib/analytics'

const GA_ID = import.meta.env.VITE_GA_ID || ''

export function initGA() {
  if (!GA_ID) { if (import.meta.env.DEV) console.warn('[GVR Analytics] VITE_GA_ID not set'); return }
  if (window.__gvrAnalyticsInit) return
  window.__gvrAnalyticsInit = true
  const s = document.createElement('script')
  s.async = true
  s.src   = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
  window.dataLayer = window.dataLayer || []
  window.gtag = function(){ window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID)
}

export const trackPage       = (n,r)  => window.gtag?.('event','page_view',{page_title:n,user_role:r})
export const trackPurchase   = (o,i,t,p)=> window.gtag?.('event','purchase',{transaction_id:o,currency:'INR',value:t,payment_type:p,items:i})
export const trackSignup     = (m)    => window.gtag?.('event','sign_up',{method:m||'username'})
export const trackLogin      = (r)    => window.gtag?.('event','login',{method:'username',user_role:r})
export const trackAddToCart  = (p,q)  => window.gtag?.('event','add_to_cart',{currency:'INR',value:p.price_per_bag*q,items:[{item_id:p.id,item_name:p.name,price:p.price_per_bag,quantity:q}]})
export const trackError      = (m,f)  => window.gtag?.('event','exception',{description:m,fatal:f})
export const trackReferral   = (m)    => window.gtag?.('event','share',{method:m||'copy',content_type:'referral_code'})
export const trackSubscribe  = (p,f,a)=> window.gtag?.('event','subscribe',{currency:'INR',value:a,product_name:p,frequency:f})

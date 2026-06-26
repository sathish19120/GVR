// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './mobile.css'

// ── Initialize Google Analytics ───────────────────────────
// Set VITE_GA_ID=G-XXXXXXXXXX in your Vercel environment variables
const GA_ID = import.meta.env.VITE_GA_ID || ''
if (GA_ID && !window.__gvrAnalyticsInit) {
  window.__gvrAnalyticsInit = true
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
  window.dataLayer = window.dataLayer || []
  window.gtag = function(){ window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID)
}

// ── Auth store hot-reload on profile save ─────────────────
window.addEventListener('gvr_user_updated', () => {
  try {
    const stored = localStorage.getItem('gvr_user')
    if (stored) {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'gvr_user', newValue: stored, oldValue: null,
      }))
    }
  } catch(e) { console.error('gvr_user_updated handler error:', e) }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

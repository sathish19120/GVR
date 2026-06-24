// src/main.jsx
// FIX #5: initGA() is now called here so GA4 actually initialises
// FIX #8: gvr_user_updated event listener added so auth store
//         re-reads localStorage when ProfilePage saves changes

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initGA } from './lib/analytics'

// ── Initialize Google Analytics ───────────────────────────
// Make sure VITE_GA_ID is set in your .env file:
//   VITE_GA_ID=G-XXXXXXXXXX
initGA()

// ── Auth store hot-reload on profile save ─────────────────
// ProfilePage dispatches 'gvr_user_updated' after saving to DB.
// This listener ensures the Zustand/context auth store re-reads
// the updated user from localStorage so the sidebar avatar/name
// refreshes without a page reload.
window.addEventListener('gvr_user_updated', (e) => {
  // The auth store's init() re-reads gvr_user from localStorage.
  // We dispatch a storage event as well as the custom event so
  // both patterns are covered regardless of how auth.js is written.
  try {
    const stored = localStorage.getItem('gvr_user')
    if (stored) {
      // Trigger any storage-based listeners
      window.dispatchEvent(new StorageEvent('storage', {
        key:      'gvr_user',
        newValue: stored,
        oldValue: null,
      }))
    }
  } catch(err) {
    console.error('gvr_user_updated handler error:', err)
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

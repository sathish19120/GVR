// src/components/Toast.jsx
// FIX #15: Global toast/snackbar system replacing alert() calls
// Usage:
//   import { useToast, ToastContainer } from '../components/Toast'
//   const toast = useToast()
//   toast.success('Order saved!')
//   toast.error('Something went wrong')
//   toast.info('Loading...')
//   toast.warning('Stock is low')
// In your root layout: <ToastContainer />

import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react'

const ToastContext = createContext(null)

let _addToast = null // module-level ref so non-React code can call toast()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const add = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
    return id
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Expose globally so non-hook code can call toast()
  useEffect(() => { _addToast = add; return () => { _addToast = null } }, [add])

  const api = {
    success: (msg, dur) => add(msg, 'success', dur),
    error:   (msg, dur) => add(msg, 'error',   dur || 5000),
    info:    (msg, dur) => add(msg, 'info',     dur),
    warning: (msg, dur) => add(msg, 'warning',  dur),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// Call from anywhere (even non-React) after provider mounts
export const toast = {
  success: (msg, dur) => _addToast?.(msg, 'success', dur),
  error:   (msg, dur) => _addToast?.(msg, 'error',   dur || 5000),
  info:    (msg, dur) => _addToast?.(msg, 'info',     dur),
  warning: (msg, dur) => _addToast?.(msg, 'warning',  dur),
}

const ICONS    = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' }
const COLORS   = {
  success: { bg:'#F0FDF4', border:'#86EFAC', text:'#166534', bar:'#22C55E' },
  error:   { bg:'#FEF2F2', border:'#FECACA', text:'#991B1B', bar:'#EF4444' },
  info:    { bg:'#EFF6FF', border:'#BFDBFE', text:'#1E40AF', bar:'#3B82F6' },
  warning: { bg:'#FFFBEB', border:'#FCD34D', text:'#92400E', bar:'#F59E0B' },
}

function ToastItem({ toast: t, onRemove }) {
  const c = COLORS[t.type] || COLORS.info
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 12, padding: '12px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
      animation: 'gvr-toast-in 0.25s ease',
      maxWidth: 360, width: '100%',
      position: 'relative', overflow: 'hidden',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>{ICONS[t.type]}</span>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: c.text, lineHeight: 1.5, flex: 1 }}>
        {t.message}
      </p>
      <button onClick={() => onRemove(t.id)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: c.text, fontSize: 16, padding: 0, flexShrink: 0, lineHeight: 1,
        opacity: 0.6,
      }}>✕</button>
      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 3, background: c.bar, borderRadius: '0 0 12px 12px',
        animation: 'gvr-toast-bar 3.5s linear forwards',
      }} />
    </div>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <>
      <style>{`
        @keyframes gvr-toast-in {
          from { opacity:0; transform:translateX(40px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes gvr-toast-bar {
          from { width:100%; }
          to   { width:0%; }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        alignItems: 'flex-end',
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={onRemove} />
        ))}
      </div>
    </>
  )
}

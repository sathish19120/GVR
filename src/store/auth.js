import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ── Constants ─────────────────────────────────────────────
const SESSION_KEY    = 'gvr_user'
const SESSION_EXPIRY = 8 * 60 * 60 * 1000  // 8 hours
const MAX_ATTEMPTS   = 5
const LOCKOUT_TIME   = 15 * 60 * 1000       // 15 minutes
const SALT           = 'gvr_salt_2026_v2'

// ── Password hashing (SHA-256 + salt) ─────────────────────
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data    = encoder.encode(password + SALT)
  const hash    = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Rate limiter (in-memory, per browser) ─────────────────
const attempts = {}
function isLockedOut(username) {
  const rec = attempts[username]
  if (!rec) return false
  if (rec.count >= MAX_ATTEMPTS) {
    const elapsed = Date.now() - rec.lastAttempt
    if (elapsed < LOCKOUT_TIME) return true
    delete attempts[username] // lockout expired
  }
  return false
}
function recordAttempt(username, success) {
  if (success) { delete attempts[username]; return }
  if (!attempts[username]) attempts[username] = { count: 0, lastAttempt: 0 }
  attempts[username].count++
  attempts[username].lastAttempt = Date.now()
}
function remainingLockout(username) {
  const rec = attempts[username]
  if (!rec) return 0
  return Math.ceil((LOCKOUT_TIME - (Date.now() - rec.lastAttempt)) / 60000)
}

// ── Input sanitizer ───────────────────────────────────────
function sanitize(str) {
  return String(str || '')
    .trim()
    .replace(/[<>'"`;]/g, '') // strip XSS chars
    .slice(0, 100)            // max length
}

// ── Session helpers ───────────────────────────────────────
function saveSession(user) {
  const session = { user, expiresAt: Date.now() + SESSION_EXPIRY }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    // Check expiry
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session.user || null
  } catch { return null }
}

// ── Auth store ────────────────────────────────────────────
export const useAuth = create((set, get) => ({
  user:    null,
  loading: true,
  error:   null,

  init: async () => {
    const user = loadSession()
    set({ user, loading: false })
    // Refresh session expiry on activity
    if (user) saveSession(user)
  },

  signUp: async (username, password, fullName, phone, role) => {
    set({ error: null })
    try {
      const clean = sanitize(username).toLowerCase()
      if (!clean || clean.length < 3) {
        set({ error: 'Username must be at least 3 characters' }); return false
      }
      if (!password || password.length < 6) {
        set({ error: 'Password must be at least 6 characters' }); return false
      }
      // Check if username exists
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', clean).single()
      if (existing) {
        set({ error: 'Username already taken. Choose another.' }); return false
      }
      const hashed = await hashPassword(password)
      const { count } = await supabase
        .from('profiles').select('*', { count:'exact', head:true })
      const assignedRole = count === 0 ? 'superadmin' : (role || 'customer')
      const { data, error } = await supabase.from('profiles').insert({
        username: clean, full_name: sanitize(fullName),
        password_hash: hashed, role: assignedRole,
        phone: sanitize(phone), created_at: new Date().toISOString()
      }).select().single()
      if (error) { set({ error: error.message }); return false }
      return true
    } catch(e) { set({ error: e.message }); return false }
  },

  signIn: async (username, password) => {
    set({ error: null })
    try {
      const clean = sanitize(username).toLowerCase()

      // Check lockout
      if (isLockedOut(clean)) {
        const mins = remainingLockout(clean)
        set({ error: `Too many failed attempts. Try again in ${mins} minute${mins>1?'s':''}` })
        return false
      }

      if (!clean || !password) {
        set({ error: 'Enter username and password' }); return false
      }

      const hashed = await hashPassword(password)
      const { data, error } = await supabase
        .from('profiles').select('*')
        .eq('username', clean)
        .eq('password_hash', hashed)
        .single()

      if (error || !data) {
        recordAttempt(clean, false)
        const rec = attempts[clean]
        const remaining = MAX_ATTEMPTS - (rec?.count || 0)
        if (remaining <= 2 && remaining > 0) {
          set({ error: `Invalid username or password. ${remaining} attempt${remaining>1?'s':''} remaining before lockout.` })
        } else if (remaining <= 0) {
          set({ error: `Account locked for 15 minutes due to too many failed attempts` })
        } else {
          set({ error: 'Invalid username or password' })
        }
        return false
      }

      if (data.active === false) {
        set({ error: 'Your account has been disabled. Contact admin.' })
        return false
      }

      recordAttempt(clean, true)
      saveSession(data)
      set({ user: data })
      return true
    } catch(e) {
      set({ error: 'Login failed. Please try again.' })
      return false
    }
  },

  signOut: () => {
    localStorage.removeItem(SESSION_KEY)
    set({ user: null })
  },

  clearError: () => set({ error: null }),

  refreshSession: () => {
    const user = get().user
    if (user) saveSession(user)
  }
}))

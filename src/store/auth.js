import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const SESSION_KEY    = 'gvr_user'
const SESSION_EXPIRY = 8 * 60 * 60 * 1000
const MAX_ATTEMPTS   = 5
const LOCKOUT_TIME   = 15 * 60 * 1000
const SALT           = 'gvr_salt_2026'

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data    = encoder.encode(password + SALT)
  const hash    = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

const attempts = {}
function isLockedOut(username) {
  const rec = attempts[username]
  if (!rec) return false
  if (rec.count >= MAX_ATTEMPTS) {
    if (Date.now() - rec.lastAttempt < LOCKOUT_TIME) return true
    delete attempts[username]
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
function sanitize(str) {
  return String(str || '').trim().replace(/[<>'"`;]/g, '').slice(0, 100)
}

// ✅ FIX #8: saveSession always writes { user, expiresAt } format
// ProfilePage.jsx was calling localStorage.setItem('gvr_user', JSON.stringify(user))
// which wrote a plain object — loadSession() fell into the old-format path and
// never refreshed expiresAt. Now both places use this one function.
function saveSession(user) {
  const session = { user, expiresAt: Date.now() + SESSION_EXPIRY }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.user) {
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }
      return parsed.user
    }
    // Old format — plain user object saved directly (migration path)
    if (parsed && parsed.username) return parsed
    return null
  } catch { return null }
}

export const useAuth = create((set, get) => {
  // ✅ FIX #8: Storage event listener — syncs Zustand when ProfilePage
  // calls updateLocalUser(). Without this the header/avatar stays stale
  // until the user manually refreshes the page.
  //
  // Two cases handled:
  //  - Native 'storage' event (cross-tab): has e.key === 'gvr_user'
  //  - Synthetic event from ProfilePage (same tab): has no e.key (null)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      const isOurKey = e.key === null || e.key === SESSION_KEY
      if (!isOurKey) return
      const updated = loadSession()
      set({ user: updated })
    })
  }

  return {
    user:    null,
    loading: true,
    error:   null,

    init: async () => {
      try {
        const user = loadSession()
        set({ user, loading: false })
        if (user) saveSession(user)   // refresh expiry on page load
      } catch(e) {
        localStorage.removeItem(SESSION_KEY)
        set({ user: null, loading: false })
      }
    },

    signUp: async (username, password, fullName, phone, role, referralCode) => {
      set({ error: null })
      try {
        const clean = sanitize(username).toLowerCase()
        if (!clean || clean.length < 3) {
          set({ error: 'Username must be at least 3 characters' }); return false
        }
        if (!password || password.length < 6) {
          set({ error: 'Password must be at least 6 characters' }); return false
        }
        const { data: existing } = await supabase
          .from('profiles').select('id').eq('username', clean).single()
        if (existing) {
          set({ error: 'Username already taken. Choose another.' }); return false
        }
        const hashed      = await hashPassword(password)
        const { count }   = await supabase
          .from('profiles').select('*', { count: 'exact', head: true })
        const assignedRole = count === 0 ? 'superadmin' : (role || 'customer')
        const newRefCode   = (clean.slice(0,4) + Math.random().toString(36).slice(2,6)).toUpperCase()

        const insertData = {
          username:      clean,
          full_name:     sanitize(fullName),
          password_hash: hashed,
          role:          assignedRole,
          phone:         sanitize(phone),
          created_at:    new Date().toISOString(),
          referral_code: newRefCode,
          referred_by:   referralCode ? referralCode.trim().toUpperCase() : null,
          wallet_balance: 0,
        }

        const { data, error } = await supabase
          .from('profiles').insert(insertData).select().single()
        if (error) { set({ error: error.message }); return false }

        // ✅ FIX #6: Record referral relationship in referrals table so
        // creditReferralReward() can find it when the first order is placed.
        // We do NOT credit ₹20 here — reward fires on first order, not signup.
        // (Previous code credited on signup which was premature — user might
        // sign up but never order.)
        try {
          if (referralCode && data) {
            const { data: referrer } = await supabase
              .from('profiles').select('id')
              .eq('referral_code', referralCode.trim().toUpperCase()).single()

            if (referrer) {
              await supabase.from('referrals').insert({
                referrer_id:   referrer.id,
                referred_id:   data.id,
                referral_code: referralCode.trim().toUpperCase(),
                reward_amount: 20,
                status:        'pending',   // credited when first order placed
                created_at:    new Date().toISOString(),
              })
            }
          }
        } catch(refErr) {
          console.warn('Referral record skipped:', refErr.message)
        }

        return true
      } catch(e) { set({ error: e.message }); return false }
    },

    signIn: async (username, password) => {
      set({ error: null })
      try {
        const clean = sanitize(username).toLowerCase()
        if (!clean || !password) {
          set({ error: 'Enter username and password' }); return false
        }

        let isAdminRole = false
        try {
          const { data: roleCheck } = await supabase
            .from('profiles').select('role').eq('username', clean).single()
          isAdminRole = roleCheck?.role === 'superadmin' || roleCheck?.role === 'admin'
        } catch(e) { /* ignore */ }

        if (!isAdminRole && isLockedOut(clean)) {
          const mins = remainingLockout(clean)
          set({ error: `Too many failed attempts. Try again in ${mins} minute${mins>1?'s':''}` })
          return false
        }

        const hashed = await hashPassword(password)
        const { data, error } = await supabase
          .from('profiles').select('*')
          .eq('username', clean)
          .eq('password_hash', hashed)
          .single()

        if (error || !data) {
          if (!isAdminRole) {
            recordAttempt(clean, false)
            const rec       = attempts[clean]
            const remaining = MAX_ATTEMPTS - (rec?.count || 0)
            if (remaining <= 2 && remaining > 0) {
              set({ error: `Invalid credentials. ${remaining} attempt${remaining>1?'s':''} left before lockout.` })
            } else if (remaining <= 0) {
              set({ error: 'Account locked for 15 minutes — too many failed attempts' })
            } else {
              set({ error: 'Invalid username or password' })
            }
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
    },

    // ✅ FIX #8: updateLocalUser exported from the store so ProfilePage
    // uses the correct { user, expiresAt } session format instead of
    // writing a plain object that bypasses expiry tracking.
    updateLocalUser: (updates) => {
      const current = get().user
      if (!current) return
      const updated = { ...current, ...updates }
      saveSession(updated)        // writes correct { user, expiresAt } format
      set({ user: updated })      // updates Zustand state immediately — no event needed
    },
  }
})

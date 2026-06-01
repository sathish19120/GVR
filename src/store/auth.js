import { create } from 'zustand'
import { supabase } from '../lib/supabase'

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'gvr_salt_2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export const useAuth = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    const saved = localStorage.getItem('gvr_user')
    if (saved) {
      set({ user: JSON.parse(saved), loading: false })
    } else {
      set({ loading: false })
    }
  },

  // role parameter: defaults to 'customer' for self-signup
  signUp: async (username, password, fullName, phone = '', role = null) => {
    set({ error: null })
    try {
      const clean = username.trim().toLowerCase()

      if (clean.length < 3) {
        set({ error: 'Username must be at least 3 characters' })
        return false
      }

      // Check if username already taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .single()

      if (existing) {
        set({ error: 'Username already taken. Please choose another.' })
        return false
      }

      const hashed = await hashPassword(password)

      // First user ever = superadmin, otherwise use passed role or customer
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const assignedRole = count === 0 ? 'superadmin' : (role || 'customer')

      const { error } = await supabase
        .from('profiles')
        .insert({
          username: clean,
          full_name: fullName,
          password_hash: hashed,
          role: assignedRole,
          phone: phone || null,
          active: true,
          created_at: new Date().toISOString()
        })

      if (error) { set({ error: error.message }); return false }
      return true
    } catch (e) {
      set({ error: e.message })
      return false
    }
  },

  signIn: async (username, password) => {
    set({ error: null })
    try {
      const clean = username.trim().toLowerCase()
      const hashed = await hashPassword(password)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', clean)
        .eq('password_hash', hashed)
        .single()

      if (error || !data) {
        set({ error: 'Invalid username or password' })
        return false
      }

      if (data.active === false) {
        set({ error: 'Your account has been disabled. Contact admin.' })
        return false
      }

      localStorage.setItem('gvr_user', JSON.stringify(data))
      set({ user: data })
      return true
    } catch (e) {
      set({ error: 'Invalid username or password' })
      return false
    }
  },

  signOut: () => {
    localStorage.removeItem('gvr_user')
    set({ user: null })
  },

  clearError: () => set({ error: null })
}))

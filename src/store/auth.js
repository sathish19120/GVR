import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// Simple hash for password (basic security)
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'gvr_salt_2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const useAuth = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    // Check localStorage for saved session
    const saved = localStorage.getItem('gvr_user')
    if (saved) {
      set({ user: JSON.parse(saved), loading: false })
    } else {
      set({ loading: false })
    }
  },

  signUp: async (username, password, fullName) => {
    set({ error: null })
    try {
      const clean = username.trim().toLowerCase()

      // Check if username already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .single()

      if (existing) {
        set({ error: 'Username already taken. Choose another.' })
        return false
      }

      const hashed = await hashPassword(password)

      // Check if this is first user — make them superadmin
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const role = count === 0 ? 'superadmin' : 'customer'

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          username: clean,
          full_name: fullName,
          password_hash: hashed,
          role,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

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

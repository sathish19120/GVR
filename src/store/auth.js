import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// username → email behind the scenes, user never sees this
const toEmail = (u) => u.includes('@') ? u : `${u.toLowerCase().trim()}@gvr.local`

export const useAuth = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  init: async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      const profile = await get().fetchProfile(data.session.user.id)
      set({ user: data.session.user, profile, loading: false })
    } else {
      set({ loading: false })
    }
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await get().fetchProfile(session.user.id)
        set({ user: session.user, profile })
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  fetchProfile: async (id) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    return data
  },

  signUp: async (username, password, fullName) => {
    set({ error: null })
    const email = toEmail(username)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { set({ error: error.message }); return false }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.toLowerCase().trim(),
        full_name: fullName,
        role: 'superadmin', // first signup = superadmin
        created_at: new Date().toISOString()
      })
    }
    return true
  },

  signIn: async (username, password) => {
    set({ error: null })
    const email = toEmail(username)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ error: 'Invalid username or password' }); return false }
    const profile = await get().fetchProfile(data.user.id)
    set({ user: data.user, profile })
    return true
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  clearError: () => set({ error: null })
}))

/// <reference types="vite/client" />
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

// Converts plain username to hidden email — user never sees this
function toEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/\s+/g, '')
  if (clean.includes('@')) return clean
  return `${clean}@gvr.app`
}

interface User {
  id: string
  email: string | null
  phone: string | null
  name: string | null
  role: 'owner' | 'delivery' | 'customer'
  language: 'en' | 'te'
}

interface AuthStore {
  user: User | null
  loading: boolean
  error: string | null
  language: 'en' | 'te'
  signIn: (username: string, password: string) => Promise<void>
  signUp: (username: string, password: string, name?: string) => Promise<void>
  resetPassword: (username: string) => Promise<void>
  logout: () => Promise<void>
  setLanguage: (lang: 'en' | 'te') => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,
      language: 'en',

      signIn: async (username: string, password: string) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: toEmail(username),
            password,
          })
          if (error) throw error
          const { data: profile } = await supabase
            .from('users')
            .upsert(
              { id: data.user.id, email: toEmail(username) },
              { onConflict: 'id' }
            )
            .select()
            .single()
          set({ user: profile as User, language: profile?.language || 'en' })
        } catch (e: any) {
          set({ error: 'Invalid username or password' })
          throw e
        } finally {
          set({ loading: false })
        }
      },

      signUp: async (username: string, password: string, name?: string) => {
        set({ loading: true, error: null })
        try {
          const email = toEmail(username)
          const { data, error } = await supabase.auth.signUp({ email, password })
          if (error) throw error
          if (data.user) {
            await supabase.from('users').upsert(
              { id: data.user.id, email, name: name || username, role: 'customer', language: 'en' },
              { onConflict: 'id' }
            )
          }
        } catch (e: any) {
          set({ error: e.message || 'Failed to create account' })
          throw e
        } finally {
          set({ loading: false })
        }
      },

      resetPassword: async (username: string) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(toEmail(username))
          if (error) throw error
        } catch (e: any) {
          set({ error: e.message || 'Failed to send reset' })
          throw e
        } finally {
          set({ loading: false })
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null })
      },

      setLanguage: (lang: 'en' | 'te') => {
        set({ language: lang })
        const user = get().user
        if (user) supabase.from('users').update({ language: lang }).eq('id', user.id)
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'gvr-auth', partialize: (s) => ({ user: s.user, language: s.language }) }
  )
)

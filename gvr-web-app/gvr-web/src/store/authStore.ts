/// <reference types="vite/client" />
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

// Convert plain username to email format for Supabase
function toEmail(username: string): string {
  if (username.includes('@')) return username
  return `${username.toLowerCase()}@greenvillagerice.in`
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
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  sendOTP: (email: string) => Promise<void>
  verifyOTP: (email: string, otp: string) => Promise<void>
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

      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email: toEmail(email), password })
          if (error) throw error

          // ✅ FIX: table is "profiles", not "users" — the old "users"
          // table does not exist in this Supabase project. The upsert
          // was failing silently every time, leaving `user` as
          // undefined/stale and breaking every RLS-protected insert
          // downstream (e.g. placing an order) because customer_id
          // sent by the app never matched auth.uid().
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .upsert({ id: data.user.id, email: data.user.email }, { onConflict: 'id' })
            .select()
            .single()

          // ✅ FIX: surface the error instead of silently proceeding
          // with an undefined profile.
          if (profileErr) throw profileErr

          set({ user: profile as User, language: profile?.language || 'en' })
        } catch (e: any) {
          set({ error: e.message || 'Invalid email or password' })
          throw e
        } finally {
          set({ loading: false })
        }
      },

      signUp: async (email: string, password: string, name?: string) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signUp({ email: toEmail(email), password })
          if (error) throw error

          if (data.user && name) {
            // ✅ FIX: "profiles" instead of "users"
            const { error: profileErr } = await supabase
              .from('profiles')
              .upsert({ id: data.user.id, email, name }, { onConflict: 'id' })
            if (profileErr) throw profileErr
          }
        } catch (e: any) {
          set({ error: e.message || 'Failed to create account' })
          throw e
        } finally {
          set({ loading: false })
        }
      },

      signInWithGoogle: async () => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
          })
          if (error) throw error
        } catch (e: any) {
          set({ error: e.message || 'Google login failed' })
          throw e
        } finally {
          set({ loading: false })
        }
      },

      resetPassword: async (email: string) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
          })
          if (error) throw error
        } catch (e: any) {
          set({ error: e.message || 'Failed to send reset email' })
          throw e
        } finally {
          set({ loading: false })
        }
      },

      sendOTP: async (email: string) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true }
          })
          if (error) throw error
        } catch (e: any) {
          set({ error: e.message || 'Failed to send OTP' })
          throw e
        } finally {
          set({ loading: false })
        }
      },

      verifyOTP: async (email: string, otp: string) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email, token: otp, type: 'email'
          })
          if (error) throw error

          // ✅ FIX: "profiles" instead of "users"
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .upsert({ id: data.user!.id, email: data.user!.email }, { onConflict: 'id' })
            .select()
            .single()

          if (profileErr) throw profileErr

          set({ user: profile as User, language: profile?.language || 'en' })
        } catch (e: any) {
          set({ error: e.message || 'Invalid OTP' })
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
        if (user) {
          // ✅ FIX: "profiles" instead of "users"
          supabase.from('profiles').update({ language: lang }).eq('id', user.id)
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'gvr-auth', partialize: (s) => ({ user: s.user, language: s.language }) }
  )
)

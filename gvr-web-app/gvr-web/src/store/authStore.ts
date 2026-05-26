/// <reference types="vite/client" />
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

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
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          const { data: profile } = await supabase
            .from('users')
            .upsert({ id: data.user.id, email: data.user.email }, { onConflict: 'id' })
            .select()
            .single()
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
          const { data, error } = await supabase.auth.signUp({ email, password })
          if (!error && data.user && name) {
            await supabase.from("users").upsert({ id: data.user.id, email, name }, { onConflict: "id" })
          }
          if (error) throw error
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
          const { data: profile } = await supabase
            .from('users')
            .upsert({ id: data.user!.id, email: data.user!.email }, { onConflict: 'id' })
            .select()
            .single()
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
          supabase.from('users').update({ language: lang }).eq('id', user.id)
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'gvr-auth', partialize: (s) => ({ user: s.user, language: s.language }) }
  )
)

/// <reference types="vite/client" />
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
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
            email,
            token: otp,
            type: 'email',
          })
          if (error) throw error

          const { data: profile, error: profileErr } = await supabase
            .from('users')
            .upsert(
              { id: data.user!.id, email: data.user!.email, phone: null },
              { onConflict: 'id' }
            )
            .select()
            .single()

          if (profileErr) throw profileErr
          set({ user: profile as User, language: profile.language || 'en' })
        } catch (e: any) {
          set({ error: e.message || 'Invalid OTP. Check your email.' })
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
    {
      name: 'gvr-auth',
      partialize: (s) => ({ user: s.user, language: s.language })
    }
  )
)

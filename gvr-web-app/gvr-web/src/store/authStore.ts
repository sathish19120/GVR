import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  phone: string
  name: string | null
  role: 'owner' | 'delivery' | 'customer'
  language: 'en' | 'te'
}

interface AuthStore {
  user: User | null
  loading: boolean
  error: string | null
  language: 'en' | 'te'
  sendOTP: (phone: string) => Promise<void>
  verifyOTP: (phone: string, otp: string) => Promise<void>
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

      sendOTP: async (phone: string) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.signInWithOtp({
            phone: phone.startsWith('+91') ? phone : `+91${phone}`,
          })
          if (error) throw error
        } catch (e: any) {
          set({ error: e.message || 'Failed to send OTP' })
          throw e
        } finally {
          set({ loading: false })
        }
      },

      verifyOTP: async (phone: string, otp: string) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            phone: phone.startsWith('+91') ? phone : `+91${phone}`,
            token: otp,
            type: 'sms',
          })
          if (error) throw error

          // Upsert user profile
          const { data: profile, error: profileErr } = await supabase
            .from('users')
            .upsert({ id: data.user!.id, phone: data.user!.phone! }, { onConflict: 'id' })
            .select()
            .single()

          if (profileErr) throw profileErr
          set({ user: profile as User, language: profile.language || 'en' })
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

      setLanguage: (lang) => {
        set({ language: lang })
        if (get().user) {
          supabase.from('users').update({ language: lang }).eq('id', get().user!.id)
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'gvr-auth', partialize: (s) => ({ user: s.user, language: s.language }) }
  )
)

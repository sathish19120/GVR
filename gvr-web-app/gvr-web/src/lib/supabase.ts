/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          name: string | null
          role: 'owner' | 'delivery' | 'customer'
          language: 'en' | 'te'
          address: string | null
          area: string | null
          active: boolean
          created_at: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          name_telugu: string
          weight_kg: number
          price_per_bag: number
          stock_bags: number
          low_stock_threshold: number
          sku: string
          active: boolean
          packing_date: string | null
          best_before_date: string | null
          created_at: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          delivery_person_id: string | null
          delivery_address: string
          total_amount: number
          status: 'pending' | 'confirmed' | 'packed' | 'dispatched' | 'delivered' | 'cancelled'
          payment_status: 'pending' | 'paid' | 'refunded'
          payment_method: 'upi' | 'cod' | 'bank'
          razorpay_order_id: string | null
          notes: string | null
          created_at: string
          delivered_at: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          name: string
          weight_kg: number
          quantity: number
          price_per_unit: number
        }
      }
    }
  }
}

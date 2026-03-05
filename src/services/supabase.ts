import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase configuration
// Replace these with your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '')
}

// Create Supabase clients only if configured
let supabaseInstance: SupabaseClient | null = null
let supabaseModule2Instance: SupabaseClient | null = null

if (isSupabaseConfigured()) {
  // Default client for public schema (RBAC tables)
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  
  // Client for module2 schema (animals, cages, weight_history)
  supabaseModule2Instance = createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'module2'
    }
  })
}

export const supabase = supabaseInstance
export const supabaseModule2 = supabaseModule2Instance

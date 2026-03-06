import { supabase, isSupabaseConfigured } from './supabase'

const module4 = () => supabase!.schema('module4')

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StockTransaction {
  id: string
  status: string
  created_at: string
  type: string              // 'request' | 'return'
  ration_id: string | null
  delivery_item_id: string
  unit_id: string
  quantity: number
  approved_quantity: number | null
  purpose: string | null
  reason: string | null
  requested_by: string
  reviewed_by: string | null
  reviewed_at: string | null
  notes: string | null
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export const fetchStockTransactions = async (
  type?: 'request' | 'return'
): Promise<StockTransaction[]> => {
  if (!isSupabaseConfigured() || !supabase) return []
  let query = module4()
    .from('stock_transaction')
    .select('*')
    .order('created_at', { ascending: false })
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) {
    console.error('fetchStockTransactions error:', error)
    return []
  }
  return data || []
}

// ─── Create ──────────────────────────────────────────────────────────────────

export const createStockTransaction = async (fields: {
  type: string
  delivery_item_id: string
  unit_id: string
  quantity: number
  ration_id?: string | null
  approved_quantity?: number | null
  purpose?: string | null
  reason?: string | null
  requested_by: string
  reviewed_by?: string | null
  reviewed_at?: string | null
  notes?: string | null
  status?: string
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured', data: null }
  const { data, error } = await module4()
    .from('stock_transaction')
    .insert(fields)
    .select('*')
    .single()
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data, error: null }
}

// ─── Update ──────────────────────────────────────────────────────────────────

export const updateStockTransaction = async (
  id: string,
  fields: Partial<Omit<StockTransaction, 'id' | 'created_at'>>
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured', data: null }
  const { data, error } = await module4()
    .from('stock_transaction')
    .update(fields)
    .eq('id', id)
    .select('*')
    .single()
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data, error: null }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export const deleteStockTransaction = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured' }
  const { error } = await module4()
    .from('stock_transaction')
    .delete()
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

import { supabase, isSupabaseConfigured } from './supabase'

// Helper to query tables in the module4 schema
const module4 = () => supabase!.schema('module4')

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RationType {
  id: string
  name: string
  created_at: string
}

export interface Ration {
  id: string
  created_at: string
  ration_type_id: string
  delivery_item_id: string
  unit_id: string
  meal_number: number | null
  administered_by: string
  quantity_used: number
  date_given: string
  status: string
  notes: string | null
  // joined
  ration_type?: RationType
}

export interface RationAnimal {
  id: string
  created_at: string
  ration_id: string
  animal_id: string
  quantity_given: number
  status: string
  next_due_date: string | null
  notes: string | null
  // joined
  ration?: Ration & { ration_type?: RationType }
}

// ─── Ration Type ─────────────────────────────────────────────────────────────

export const fetchRationTypes = async (): Promise<RationType[]> => {
  if (!isSupabaseConfigured() || !supabase) return []
  const { data, error } = await module4()
    .from('ration_type')
    .select('*')
    .order('name')
  if (error) {
    console.error('fetchRationTypes error:', error)
    return []
  }
  return data || []
}

// ─── Ration CRUD ─────────────────────────────────────────────────────────────

export const fetchRations = async (): Promise<Ration[]> => {
  if (!isSupabaseConfigured() || !supabase) return []
  const { data, error } = await module4()
    .from('ration')
    .select('*, ration_type(*)')
    .order('date_given', { ascending: false })
  if (error) {
    console.error('fetchRations error:', error)
    return []
  }
  return data || []
}

export const fetchRationsByType = async (typeName: string): Promise<Ration[]> => {
  if (!isSupabaseConfigured() || !supabase) return []
  // First get the ration_type id for the given name
  const { data: typeData, error: typeError } = await module4()
    .from('ration_type')
    .select('id')
    .eq('name', typeName)
    .single()
  if (typeError || !typeData) {
    console.error('fetchRationsByType type lookup error:', typeError)
    return []
  }
  const { data, error } = await module4()
    .from('ration')
    .select('*, ration_type(*)')
    .eq('ration_type_id', typeData.id)
    .order('date_given', { ascending: false })
  if (error) {
    console.error('fetchRationsByType error:', error)
    return []
  }
  return data || []
}

export const createRation = async (fields: {
  ration_type_id: string
  delivery_item_id: string
  unit_id: string
  quantity_used: number
  date_given: string
  meal_number?: number | null
  administered_by: string
  status: string
  notes?: string | null
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured', data: null }
  const { data, error } = await module4()
    .from('ration')
    .insert(fields)
    .select('*, ration_type(*)')
    .single()
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data, error: null }
}

export const updateRation = async (
  id: string,
  fields: {
    ration_type_id?: string
    delivery_item_id?: string
    unit_id?: string
    quantity_used?: number
    date_given?: string
    meal_number?: number | null
    administered_by?: string
    status?: string
    notes?: string | null
  }
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured', data: null }
  const { data, error } = await module4()
    .from('ration')
    .update(fields)
    .eq('id', id)
    .select('*, ration_type(*)')
    .single()
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data, error: null }
}

export const deleteRation = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured' }
  const { error } = await module4().from('ration').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Ration Animal CRUD ──────────────────────────────────────────────────────

export const fetchRationAnimals = async (): Promise<RationAnimal[]> => {
  if (!isSupabaseConfigured() || !supabase) return []
  const { data, error } = await module4()
    .from('ration_animal')
    .select('*, ration(*, ration_type(*))')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchRationAnimals error:', error)
    return []
  }
  return data || []
}

export const fetchRationAnimalsByRation = async (rationId: string): Promise<RationAnimal[]> => {
  if (!isSupabaseConfigured() || !supabase) return []
  const { data, error } = await module4()
    .from('ration_animal')
    .select('*, ration(*, ration_type(*))')
    .eq('ration_id', rationId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchRationAnimalsByRation error:', error)
    return []
  }
  return data || []
}

export const fetchRationAnimalsByType = async (typeName: string): Promise<RationAnimal[]> => {
  if (!isSupabaseConfigured() || !supabase) return []
  // Get all ration_animals whose parent ration has a given type
  const { data: typeData, error: typeError } = await module4()
    .from('ration_type')
    .select('id')
    .eq('name', typeName)
    .single()
  if (typeError || !typeData) {
    console.error('fetchRationAnimalsByType type lookup error:', typeError)
    return []
  }
  const { data, error } = await module4()
    .from('ration_animal')
    .select('*, ration!inner(*, ration_type(*))')
    .eq('ration.ration_type_id', typeData.id)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchRationAnimalsByType error:', error)
    return []
  }
  return data || []
}

export const createRationAnimal = async (fields: {
  ration_id: string
  animal_id: string
  quantity_given: number
  status: string
  next_due_date?: string | null
  notes?: string | null
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured', data: null }
  const { data, error } = await module4()
    .from('ration_animal')
    .insert(fields)
    .select('*, ration(*, ration_type(*))')
    .single()
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data, error: null }
}

export const updateRationAnimal = async (
  id: string,
  fields: {
    ration_id?: string
    animal_id?: string
    quantity_given?: number
    status?: string
    next_due_date?: string | null
    notes?: string | null
  }
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured', data: null }
  const { data, error } = await module4()
    .from('ration_animal')
    .update(fields)
    .eq('id', id)
    .select('*, ration(*, ration_type(*))')
    .single()
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data, error: null }
}

export const deleteRationAnimal = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured' }
  const { error } = await module4().from('ration_animal').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

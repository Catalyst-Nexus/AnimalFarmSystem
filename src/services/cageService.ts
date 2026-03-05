import { supabase, isSupabaseConfigured } from './supabase'

export interface Cage {
  id: string
  created_at?: string
  cage_label: string
  max_capacity: number
  is_active: boolean
}

export interface Animal {
  id: string
  current_cage_id: string | null
  mother_id?: string | null
  father_id?: string | null
  type: string
  sex: string
  weight: number
  status: string
  created_at?: string
}

/**
 * Fetch all cages from Supabase
 */
export async function getCages(): Promise<Cage[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase!
    .schema('module2')
    .from('cages')
    .select('*')
    .order('cage_label', { ascending: true })

  if (error) {
    console.error('Error fetching cages:', error)
    throw error
  }

  return data || []
}

/**
 * Fetch all animals from Supabase
 */
export async function getAnimals(): Promise<Animal[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase!
    .schema('module2')
    .from('animals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching animals:', error)
    throw error
  }

  return data || []
}

/**
 * Create a new cage
 */
export async function createCage(
  cage: Omit<Cage, 'id' | 'created_at'>
): Promise<Cage> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase!
    .schema('module2')
    .from('cages')
    .insert([cage])
    .select()
    .single()

  if (error) {
    console.error('Error creating cage:', error)
    throw error
  }

  return data
}

/**
 * Update an existing cage
 */
export async function updateCage(
  id: string,
  updates: Partial<Omit<Cage, 'id' | 'created_at'>>
): Promise<Cage> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase!
    .schema('module2')
    .from('cages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating cage:', error)
    throw error
  }

  return data
}

/**
 * Delete a cage
 */
export async function deleteCage(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const { error } = await supabase!
    .schema('module2')
    .from('cages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting cage:', error)
    throw error
  }
}

/**
 * Update animal's cage assignment
 */
export async function updateAnimalCage(
  animalId: string,
  cageId: string | null
): Promise<Animal> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase!
    .schema('module2')
    .from('animals')
    .update({ current_cage_id: cageId })
    .eq('id', animalId)
    .select()
    .single()

  if (error) {
    console.error('Error updating animal cage:', error)
    throw error
  }

  return data
}

/**
 * Get animals by cage ID
 */
export async function getAnimalsByCage(cageId: string): Promise<Animal[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase!
    .schema('module2')
    .from('animals')
    .select('*')
    .eq('current_cage_id', cageId)
    .order('weight', { ascending: true })

  if (error) {
    console.error('Error fetching animals by cage:', error)
    throw error
  }

  return data || []
}

/**
 * Check if a cage has available capacity
 * @param cageId - The cage ID to check
 * @param excludeAnimalId - Optional animal ID to exclude from count (useful when updating an existing animal)
 * @returns Object with capacity information
 */
export async function checkCageCapacity(
  cageId: string,
  excludeAnimalId?: string
): Promise<{
  isFull: boolean
  currentCount: number
  maxCapacity: number
  availableSpots: number
}> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  // Get cage details
  const { data: cage, error: cageError } = await supabase!
    .schema('module2')
    .from('cages')
    .select('max_capacity')
    .eq('id', cageId)
    .single()

  if (cageError || !cage) {
    throw new Error('Cage not found')
  }

  // Get current animals in cage
  const animals = await getAnimalsByCage(cageId)
  
  // Exclude the specified animal if provided (for update scenarios)
  const currentCount = excludeAnimalId
    ? animals.filter(animal => animal.id !== excludeAnimalId).length
    : animals.length

  const maxCapacity = cage.max_capacity
  const availableSpots = maxCapacity - currentCount
  const isFull = currentCount >= maxCapacity

  return {
    isFull,
    currentCount,
    maxCapacity,
    availableSpots,
  }
}

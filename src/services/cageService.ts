import { supabase, isSupabaseConfigured } from './supabase'
import { getUserFacilityIds, applyFacilityFilter } from './facilityFilterService'

export interface Cage {
  id: string
  created_at?: string
  cage_label: string
  max_capacity: number
  is_active: boolean
}

interface JoinedTagInfo {
  tag_animals_colors: {
    tag_code: number
    animal_types: { animal_name: string }
    tag_colors: { color: string; color_name: string }
    tag_types: { type: string }
  }
}

export interface Animal {
  id: string
  tag_animals_colors_id: string | null
  current_cage_id: string | null
  mother_id?: string | null
  father_id?: string | null
  type: string
  sex: string
  weight: number
  status: string
  is_active: boolean
  created_at?: string
}

/**
 * Fetch all cages filtered by user's facilities
 * @param userId - The user ID to filter cages by their assigned facilities
 */
export async function getCages(userId: string): Promise<Cage[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  // Get user's facility IDs
  const facilityIds = await getUserFacilityIds(userId)

  let query = supabase!
    .schema('module2')
    .from('cages')
    .select('*')

  // Apply facility filter
  query = applyFacilityFilter(query, facilityIds)

  const { data, error } = await query.order('cage_label', { ascending: true })

  if (error) {
    console.error('Error fetching cages:', error)
    throw new Error('Failed to fetch cages')
  }

  return (data as Cage[]) || []
}

/**
 * Get all animals filtered by user's facilities
 * @param userId - The user ID to filter animals by their assigned facilities
 */
export async function getAnimals(userId: string): Promise<Animal[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  // Get user's facility IDs
  const facilityIds = await getUserFacilityIds(userId)

  let query = supabase!
    .schema('module2')
    .from('animals')
    .select(`
      *,
      tag_animals_colors!tag_animals_colors_id(
        tag_code,
        animal_types!animal_type_id(animal_name),
        tag_colors!tag_color_id(color, color_name),
        tag_types!tag_type_id(type)
      )
    `)

  // Apply facility filter
  query = applyFacilityFilter(query, facilityIds)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching animals:', error)
    throw error
  }

  // Format the data to include type string
  const formattedData = (data || []).map((animal: Animal & Partial<JoinedTagInfo>) => {
    const tagInfo = animal.tag_animals_colors
    const type = tagInfo
      ? `${tagInfo.tag_types?.type || ''}-${tagInfo.tag_code || ''} | ${tagInfo.animal_types?.animal_name || ''}`
      : ''
    return { ...animal, type }
  })

  return formattedData
}

/**
 * Create a new cage with facility assignment
 * @param cage - Cage data including user_facility_id
 */
export async function createCage(
  cage: Omit<Cage, 'id' | 'created_at'> & { user_facility_id: string }
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

  return data as Cage
}

/**
 * Update a cage (respects facility filtering)
 * @param id - The cage ID
 * @param userId - The user ID to verify facility access
 * @param updates - The fields to update
 */
export async function updateCage(
  id: string,
  userId: string,
  updates: Partial<Omit<Cage, 'id' | 'created_at'>>
): Promise<Cage> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  let query = supabase!
    .schema('module2')
    .from('cages')
    .update(updates)
    .eq('id', id)

  // Apply facility filter to ensure user can only update their facility's cages
  query = applyFacilityFilter(query, facilityIds)

  const { data, error } = await query.select().single()

  if (error) {
    console.error('Error updating cage:', error)
    throw error
  }

  return data as Cage
}

/**
 * Delete a cage (respects facility filtering)
 * @param id - The cage ID
 * @param userId - The user ID to verify facility access
 */
export async function deleteCage(id: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  let query = supabase!
    .schema('module2')
    .from('cages')
    .delete()
    .eq('id', id)

  // Apply facility filter to ensure user can only delete their facility's cages
  query = applyFacilityFilter(query, facilityIds)

  const { error } = await query

  if (error) {
    console.error('Error deleting cage:', error)
    throw error
  }
}

/**
 * Update animal's cage assignment (respects facility filtering)
 * @param animalId - The animal ID
 * @param userId - The user ID to verify facility access
 * @param cageId - The new cage ID (or null to remove from cage)
 */
export async function updateAnimalCage(
  animalId: string,
  userId: string,
  cageId: string | null
): Promise<Animal> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  let query = supabase!
    .schema('module2')
    .from('animals')
    .update({ current_cage_id: cageId })
    .eq('id', animalId)

  // Apply facility filter to ensure user can only update their facility's animals
  query = applyFacilityFilter(query, facilityIds)

  const { data, error } = await query.select().single()

  if (error) {
    console.error('Error updating animal cage:', error)
    throw error
  }

  return data as Animal
}

/**
 * Get animals by cage ID filtered by user's facilities
 * @param cageId - The cage ID
 * @param userId - The user ID to filter by facilities
 */
export async function getAnimalsByCage(cageId: string, userId: string): Promise<Animal[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  // Get user's facility IDs
  const facilityIds = await getUserFacilityIds(userId)

  let query = supabase!
    .schema('module2')
    .from('animals')
    .select(`
      *,
      tag_animals_colors!tag_animals_colors_id(
        tag_code,
        animal_types!animal_type_id(animal_name),
        tag_colors!tag_color_id(color, color_name),
        tag_types!tag_type_id(type)
      )
    `)
    .eq('current_cage_id', cageId)

  // Apply facility filter
  query = applyFacilityFilter(query, facilityIds)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching animals by cage:', error)
    throw error
  }

  // Format the data to include type string
  const formattedData = (data || []).map((animal: Animal & Partial<JoinedTagInfo>) => {
    const tagInfo = animal.tag_animals_colors
    const type = tagInfo
      ? `${tagInfo.tag_types?.type || ''}-${tagInfo.tag_code || ''} | ${tagInfo.animal_types?.animal_name || ''}`
      : ''
    return { ...animal, type }
  })

  return formattedData
}

/**
 * Check if a cage has available capacity
 * @param cageId - The cage ID to check
 * @param userId - The user ID to verify facility access
 * @param excludeAnimalId - Optional animal ID to exclude from count (useful when updating an existing animal)
 * @returns Object with capacity information
 */
export async function checkCageCapacity(
  cageId: string,
  userId: string,
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

  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  // Get cage details with facility filter
  let cageQuery = supabase!
    .schema('module2')
    .from('cages')
    .select('max_capacity')
    .eq('id', cageId)

  cageQuery = applyFacilityFilter(cageQuery, facilityIds)

  const { data: cage, error: cageError } = await cageQuery.single()

  if (cageError || !cage) {
    throw new Error('Cage not found')
  }

  // Get current animals in cage
  const animals = await getAnimalsByCage(cageId, userId)

  // Exclude the specified animal if provided (for update scenarios)
  const currentCount = excludeAnimalId
    ? animals.filter((animal) => animal.id !== excludeAnimalId).length
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

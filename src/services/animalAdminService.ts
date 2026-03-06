import { supabase, isSupabaseConfigured } from './supabase'

// Helper to query tables in the module2 schema
const module2 = () => supabase!.schema('module2')

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnimalType {
  id: string
  animal_name: string
  created_at: string
}

export interface TagColor {
  id: string
  color: string
  created_at: string
}

export interface TagType {
  id: string
  type: string
  created_at: string
}

export interface TagAnimalColor {
  id: string
  animal_type_id: string
  tag_color_id: string
  tag_type_id: string
  tag_code: number
  created_at: string
  // Joined data
  animal_types?: { animal_name: string }
  tag_colors?: { color: string }
  tag_types?: { type: string }
}

// ─── Animal Types Operations ──────────────────────────────────────────────────

export const fetchAnimalTypes = async (): Promise<AnimalType[]> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured')
    return []
  }

  try {
    const { data, error } = await module2()
      .from('animal_types')
      .select('*')
      .order('animal_name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching animal types:', err)
    throw err
  }
}

export const createAnimalType = async (
  animalName: string
): Promise<AnimalType> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { data, error } = await module2()
      .from('animal_types')
      .insert([{ animal_name: animalName }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error creating animal type:', err)
    throw err
  }
}

export const updateAnimalType = async (
  id: string,
  animalName: string
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await module2()
      .from('animal_types')
      .update({ animal_name: animalName })
      .eq('id', id)

    if (error) throw error
  } catch (err) {
    console.error('Error updating animal type:', err)
    throw err
  }
}

export const deleteAnimalType = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await module2()
      .from('animal_types')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (err) {
    console.error('Error deleting animal type:', err)
    throw err
  }
}

// ─── Tag Colors Operations ────────────────────────────────────────────────────

export const fetchTagColors = async (): Promise<TagColor[]> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured')
    return []
  }

  try {
    const { data, error } = await module2()
      .from('tag_colors')
      .select('*')
      .order('color', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching tag colors:', err)
    throw err
  }
}

export const createTagColor = async (color: string): Promise<TagColor> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { data, error } = await module2()
      .from('tag_colors')
      .insert([{ color }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error creating tag color:', err)
    throw err
  }
}

export const updateTagColor = async (
  id: string,
  color: string
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await module2()
      .from('tag_colors')
      .update({ color })
      .eq('id', id)

    if (error) throw error
  } catch (err) {
    console.error('Error updating tag color:', err)
    throw err
  }
}

export const deleteTagColor = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await module2()
      .from('tag_colors')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (err) {
    console.error('Error deleting tag color:', err)
    throw err
  }
}

// ─── Tag Types Operations ─────────────────────────────────────────────────────

export const fetchTagTypes = async (): Promise<TagType[]> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured')
    return []
  }

  try {
    const { data, error } = await module2()
      .from('tag_types')
      .select('*')
      .order('type', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching tag types:', err)
    throw err
  }
}

export const createTagType = async (type: string): Promise<TagType> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { data, error } = await module2()
      .from('tag_types')
      .insert([{ type }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error creating tag type:', err)
    throw err
  }
}

export const updateTagType = async (id: string, type: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await module2()
      .from('tag_types')
      .update({ type })
      .eq('id', id)

    if (error) throw error
  } catch (err) {
    console.error('Error updating tag type:', err)
    throw err
  }
}

export const deleteTagType = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await module2()
      .from('tag_types')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (err) {
    console.error('Error deleting tag type:', err)
    throw err
  }
}

// ─── Tag Animal Colors Operations ─────────────────────────────────────────────

export const fetchTagAnimalColors = async (): Promise<TagAnimalColor[]> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured')
    return []
  }

  try {
    const { data, error } = await module2()
      .from('tag_animals_colors')
      .select(
        `
        *,
        animal_types!animal_type_id(animal_name),
        tag_colors!tag_color_id(color),
        tag_types!tag_type_id(type)
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching tag animal colors:', err)
    throw err
  }
}

export const createTagAnimalColor = async (payload: {
  animal_type_id: string
  tag_color_id: string
  tag_type_id: string
  tag_code: number
}): Promise<TagAnimalColor> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { data, error } = await module2()
      .from('tag_animals_colors')
      .insert([payload])
      .select(
        `
        *,
        animal_types!animal_type_id(animal_name),
        tag_colors!tag_color_id(color),
        tag_types!tag_type_id(type)
      `
      )
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error creating tag animal color:', err)
    throw err
  }
}

export const updateTagAnimalColor = async (
  id: string,
  payload: {
    animal_type_id: string
    tag_color_id: string
    tag_type_id: string
    tag_code: number
  }
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await module2()
      .from('tag_animals_colors')
      .update(payload)
      .eq('id', id)

    if (error) throw error
  } catch (err) {
    console.error('Error updating tag animal color:', err)
    throw err
  }
}

export const deleteTagAnimalColor = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await module2()
      .from('tag_animals_colors')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (err) {
    console.error('Error deleting tag animal color:', err)
    throw err
  }
}

/**
 * Generate multiple tag codes for an animal type
 */
export const bulkCreateTagCodes = async (payload: {
  animal_type_id: string
  tag_color_id: string
  tag_type_id: string
  start_number: number
  count: number
}): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { animal_type_id, tag_color_id, tag_type_id, start_number, count } =
      payload

    // Generate tag codes
    const tagCodes = []
    for (let i = 0; i < count; i++) {
      const codeNumber = start_number + i
      tagCodes.push({
        animal_type_id,
        tag_color_id,
        tag_type_id,
        tag_code: codeNumber,
      })
    }

    const { error } = await module2()
      .from('tag_animals_colors')
      .insert(tagCodes)

    if (error) throw error
  } catch (err) {
    console.error('Error bulk creating tag codes:', err)
    throw err
  }
}

// ─── Export All ───────────────────────────────────────────────────────────────

export const animalAdminService = {
  // Animal Types
  fetchAnimalTypes,
  createAnimalType,
  updateAnimalType,
  deleteAnimalType,

  // Tag Colors
  fetchTagColors,
  createTagColor,
  updateTagColor,
  deleteTagColor,

  // Tag Types
  fetchTagTypes,
  createTagType,
  updateTagType,
  deleteTagType,

  // Tag Animal Colors
  fetchTagAnimalColors,
  createTagAnimalColor,
  updateTagAnimalColor,
  deleteTagAnimalColor,
  bulkCreateTagCodes,
}

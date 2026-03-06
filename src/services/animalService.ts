import { supabase, isSupabaseConfigured } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface JoinedTagInfo {
  tag_animals_colors: {
    animal_types: { animal_name: string }
    tag_colors: { color: string; color_name: string }
    tag_types: { type: string }
  }
}

export interface Animal {
  id: string // Tag code ID (e.g., "EAR-1")
  tag_animals_colors_id: string | null
  current_cage_id: string | null
  mother_id: string | null
  father_id: string | null
  sex: string
  weight: number
  status: string
  is_active: boolean
  created_at: string
  // Joined data for display
  type?: string // Computed from tag_animals_colors join
}

export interface Cage {
  id: string
  cage_label: string
  is_active: boolean
  max_capacity: number
  created_at: string
}

// ─── Animal Operations ────────────────────────────────────────────────────────

export const animalService = {
  /**
   * Fetch all animals from the database
   */
  async getAnimals(): Promise<Animal[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured')
      return []
    }

    try {
      const { data, error } = await supabase!
        .schema('module2')
        .from('animals')
        .select(`
          *,
          tag_animals_colors!tag_animals_colors_id(
            animal_types!animal_type_id(animal_name),
            tag_colors!tag_color_id(color, color_name),
            tag_types!tag_type_id(type)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching animals:', error)
        return []
      }

      // Format the data to include type string
      const formattedData = (data || []).map((animal: Animal & Partial<JoinedTagInfo>) => {
        const tagInfo = animal.tag_animals_colors
        const type = tagInfo
          ? `${tagInfo.tag_types?.type || ''} | ${tagInfo.animal_types?.animal_name || ''}`
          : ''
        return { ...animal, type }
      })

      return formattedData
    } catch (err) {
      console.error('Error fetching animals:', err)
      return []
    }
  },

  /**
   * Get a single animal by ID
   */
  async getAnimalById(id: string): Promise<Animal | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase!.schema('module2').from('animals').select('*').eq('id', id).single()

      if (error) {
        console.error(`Error fetching animal ${id}:`, error)
        return null
      }

      return data
    } catch (err) {
      console.error(`Error fetching animal ${id}:`, err)
      return null
    }
  },

  /**
   * Create a new animal
   */
  async createAnimal(animal: {
    id: string // Tag animals colors ID (creates 1:1 relationship)
    tag_animals_colors_id: string
    sex: string
    weight: number
    status: string
    current_cage_id?: string | null
    mother_id?: string | null
    father_id?: string | null
  }): Promise<Animal> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured')
    }

    try {
      const insertData = {
        id: animal.id,
        tag_animals_colors_id: animal.tag_animals_colors_id,
        sex: animal.sex,
        weight: animal.weight,
        status: animal.status,
        current_cage_id: animal.current_cage_id || null,
        mother_id: animal.mother_id || null,
        father_id: animal.father_id || null,
      }

      const { data, error } = await supabase!
        .schema('module2')
        .from('animals')
        .insert([insertData])
        .select(`
          *,
          tag_animals_colors!tag_animals_colors_id(
            animal_types!animal_type_id(animal_name),
            tag_colors!tag_color_id(color, color_name),
            tag_types!tag_type_id(type)
          )
        `)
        .single()

      if (error) {
        console.error('Error creating animal:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Database error: ${error.message}${error.hint ? ` (${error.hint})` : ''}`)
      }

      // Format the data to include type string
      const tagInfo = (data as Animal & Partial<JoinedTagInfo>).tag_animals_colors
      const type = tagInfo
        ? `${tagInfo.tag_types?.type || ''} | ${tagInfo.animal_types?.animal_name || ''}`
        : ''
      return { ...data, type }
    } catch (err) {
      console.error('Error creating animal:', err)
      throw err
    }
  },

  /**
   * Update an existing animal
   */
  async updateAnimal(
    id: string,
    updates: Partial<{
      sex: string
      weight: number
      status: string
      current_cage_id: string | null
      mother_id: string | null
      father_id: string | null
    }>
  ): Promise<Animal | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase!
        .schema('module2')
        .from('animals')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          tag_animals_colors!tag_animals_colors_id(
            animal_types!animal_type_id(animal_name),
            tag_colors!tag_color_id(color, color_name),
            tag_types!tag_type_id(type)
          )
        `)
        .single()

      if (error) {
        console.error('Error updating animal:', error)
        return null
      }

      // Format the data to include type string
      const tagInfo = (data as Animal & Partial<JoinedTagInfo>).tag_animals_colors
      const type = tagInfo
        ? `${tagInfo.tag_types?.type || ''} | ${tagInfo.animal_types?.animal_name || ''}`
        : ''
      return { ...data, type }
    } catch (err) {
      console.error('Error updating animal:', err)
      return null
    }
  },

  /**
   * Delete an animal
   */
  async deleteAnimal(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase!.schema('module2').from('animals').delete().eq('id', id)

      if (error) {
        console.error('Error deleting animal:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Error deleting animal:', err)
      return false
    }
  },

  /**
   * Check if an animal ID already exists
   */
  async animalIdExists(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false
    }

    try {
      const { data, error } = await supabase!.schema('module2').from('animals').select('id').eq('id', id).single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking animal ID:', error)
      }

      return !!data
    } catch (err) {
      return false
    }
  },

  /**
   * Generate next animal ID based on the latest tag code
   * Format: TAG-YYYY-NNN (e.g., TAG-2026-001)
   */
  async generateNextAnimalId(): Promise<string> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured')
      return `TAG-${new Date().getFullYear()}-001`
    }

    try {
      const { data, error } = await supabase!
        .schema('module2')
        .from('animals')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error generating next animal ID:', error)
        return `TAG-${new Date().getFullYear()}-001`
      }

      const currentYear = new Date().getFullYear()
      const tagPattern = /^TAG-(\d{4})-(\d{3})$/

      if (!data || data.length === 0) {
        return `TAG-${currentYear}-001`
      }

      const lastId = data[0].id
      const match = lastId.match(tagPattern)

      if (!match) {
        return `TAG-${currentYear}-001`
      }

      const lastYear = parseInt(match[1])
      const lastNumber = parseInt(match[2])

      // If it's a new year, reset counter
      if (lastYear !== currentYear) {
        return `TAG-${currentYear}-001`
      }

      // Increment the number and pad to 3 digits
      const nextNumber = (lastNumber + 1).toString().padStart(3, '0')
      return `TAG-${currentYear}-${nextNumber}`
    } catch (err) {
      console.error('Error generating next animal ID:', err)
      return `TAG-${new Date().getFullYear()}-001`
    }
  },
}

// ─── Cage Operations ──────────────────────────────────────────────────────────

export const cageService = {
  /**
   * Fetch all active cages
   */
  async getCages(): Promise<Cage[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured')
      return []
    }

    try {
      const { data, error } = await supabase!
        .schema('module2')
        .from('cages')
        .select('*')
        .eq('is_active', true)
        .order('cage_label', { ascending: true })

      if (error) {
        console.error('Error fetching cages:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Error fetching cages:', err)
      return []
    }
  },
}

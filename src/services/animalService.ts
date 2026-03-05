import { supabase, isSupabaseConfigured } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Animal {
  id: string // Manual barcode ID
  current_cage_id: string | null
  mother_id: string | null
  father_id: string | null
  type: string
  sex: string
  weight: number
  status: string
  created_at: string
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
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching animals:', error)
        return []
      }

      return data || []
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
    id: string // Manual barcode ID
    type: string
    sex: string
    weight: number
    status: string
    current_cage_id?: string | null
    mother_id?: string | null
    father_id?: string | null
  }): Promise<Animal | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase!
        .schema('module2')
        .from('animals')
        .insert([
          {
            id: animal.id,
            type: animal.type,
            sex: animal.sex,
            weight: animal.weight,
            status: animal.status,
            current_cage_id: animal.current_cage_id || null,
            mother_id: animal.mother_id || null,
            father_id: animal.father_id || null,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating animal:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Error creating animal:', err)
      return null
    }
  },

  /**
   * Update an existing animal
   */
  async updateAnimal(
    id: string,
    updates: Partial<{
      type: string
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
        .select()
        .single()

      if (error) {
        console.error('Error updating animal:', error)
        return null
      }

      return data
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

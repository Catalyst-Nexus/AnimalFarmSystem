import type { Cage as DBCage, Animal as DBAnimal } from '@/services/cageService'

export type SortDir = 'asc' | 'desc'

export interface Pig {
  id: string
  tagId: string
  breed: string
  sex: 'Male' | 'Female'
  weight: number
  status: string
  cageId: string | null
}

export interface Cage {
  id: string
  label: string
  maxCapacity: number
  isActive: boolean
}

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning'
}

// Helper to convert DB animals to UI Pigs
export const convertAnimalToPig = (animal: DBAnimal): Pig => {
  // type format: "TAG_TYPE-CODE | ANIMAL_NAME" (e.g., "EAR-1 | Pig")
  const typeParts = animal.type?.split(' | ') || []
  const tagCode = typeParts[0] || animal.id
  const animalName = typeParts[1] || 'Unknown'
  
  return {
    id: animal.id,
    tagId: tagCode, // Display as "EAR-1" format
    breed: animalName, // Display animal type name
    sex: (animal.sex === 'Male' || animal.sex === 'Female') ? animal.sex : 'Male',
    weight: Number(animal.weight) || 0,
    status: animal.status || 'Unknown',
    cageId: animal.current_cage_id,
  }
}

// Helper to convert DB cages to UI Cages
export const convertDBCage = (cage: DBCage): Cage => ({
  id: cage.id,
  label: cage.cage_label,
  maxCapacity: cage.max_capacity,
  isActive: cage.is_active,
})

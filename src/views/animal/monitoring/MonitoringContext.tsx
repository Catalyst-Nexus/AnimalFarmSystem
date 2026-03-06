import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  getCages,
  getAnimals,
  createCage,
  updateCage,
  deleteCage,
  updateAnimalCage,
  type Cage as DBCage,
} from '@/services/cageService'
import { animalService } from '@/services/animalService'
import { useToast } from './ToastContext'
import type { Pig, Cage, SortDir } from './types'
import { convertAnimalToPig, convertDBCage } from './types'

interface MonitoringContextType {
  pigs: Pig[]
  cages: Cage[]
  sortDir: SortDir
  setSortDir: (d: SortDir) => void
  movePig: (tagId: string, cageId: string) => void
  scanTag: (tagId: string) => Pig | null
  pigsInCage: (cageId: string) => Pig[]
  refreshData: () => Promise<void>
  isLoading: boolean
  addCage: (cage: Omit<DBCage, 'id' | 'created_at'>) => Promise<void>
  editCage: (id: string, updates: Partial<Omit<DBCage, 'id' | 'created_at'>>) => Promise<void>
  removeCage: (id: string) => Promise<void>
  updatePigWeight: (pigId: string, newWeight: number) => Promise<void>
  bulkMovePigs: (pigIds: string[], cageId: string) => Promise<void>
}

export const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined)

export const MonitoringProvider = ({ children }: { children: ReactNode }) => {
  const [pigs, setPigs] = useState<Pig[]>([])
  const [cages, setCages] = useState<Cage[]>([])
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()

  // Fetch data from Supabase
  const refreshData = async () => {
    try {
      setIsLoading(true)
      const [animalsData, cagesData] = await Promise.all([
        getAnimals(),
        getCages(),
      ])
      
      setPigs(animalsData.map(convertAnimalToPig))
      setCages(cagesData.map(convertDBCage))
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('Failed to load data', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pigsInCage = (cageId: string): Pig[] => {
    const list = pigs.filter((p) => p.cageId === cageId)
    return [...list].sort((a, b) =>
      sortDir === 'asc' ? a.weight - b.weight : b.weight - a.weight
    )
  }

  /** Manually move a pig to a different cage */
  const movePig = async (pigId: string, cageId: string) => {
    try {
      const targetCage = cages.find(c => c.id === cageId)
      if (targetCage) {
        const currentOccupancy = pigs.filter(p => p.cageId === cageId).length
        if (currentOccupancy >= targetCage.maxCapacity) {
          showToast(`${targetCage.label} is at full capacity`, 'warning')
          return
        }
      }
      
      await updateAnimalCage(pigId, cageId)
      setPigs((prev) =>
        prev.map((p) => (p.id === pigId ? { ...p, cageId } : p))
      )
      showToast(`Animal moved to ${targetCage?.label}`, 'success')
    } catch (error) {
      console.error('Error moving pig:', error)
      showToast('Failed to move animal', 'error')
      throw error
    }
  }

  const scanTag = (tagId: string): Pig | null =>
    pigs.find((p) => p.tagId.toLowerCase() === tagId.trim().toLowerCase()) ?? null

  const addCage = async (cage: Omit<DBCage, 'id' | 'created_at'>) => {
    try {
      const newCage = await createCage(cage)
      setCages((prev) => [...prev, convertDBCage(newCage)])
      showToast('Cage added successfully', 'success')
    } catch (error) {
      console.error('Error adding cage:', error)
      showToast('Failed to add cage', 'error')
      throw error
    }
  }

  const editCage = async (id: string, updates: Partial<Omit<DBCage, 'id' | 'created_at'>>) => {
    try {
      const updatedCage = await updateCage(id, updates)
      setCages((prev) =>
        prev.map((c) => (c.id === id ? convertDBCage(updatedCage) : c))
      )
      showToast('Cage updated', 'success')
    } catch (error) {
      console.error('Error editing cage:', error)
      showToast('Failed to update cage', 'error')
      throw error
    }
  }

  const removeCage = async (id: string) => {
    try {
      await deleteCage(id)
      setCages((prev) => prev.filter((c) => c.id !== id))
      showToast('Cage deleted', 'success')
    } catch (error) {
      console.error('Error removing cage:', error)
      showToast('Failed to delete cage', 'error')
      throw error
    }
  }

  const updatePigWeight = async (pigId: string, newWeight: number) => {
    try {
      await animalService.updateAnimal(pigId, { weight: newWeight })
      setPigs((prev) =>
        prev.map((p) => (p.id === pigId ? { ...p, weight: newWeight } : p))
      )
      showToast('Weight updated', 'success')
    } catch (error) {
      console.error('Error updating pig weight:', error)
      showToast('Failed to update weight', 'error')
      throw error
    }
  }

  const bulkMovePigs = async (pigIds: string[], cageId: string) => {
    try {
      const targetCage = cages.find(c => c.id === cageId)
      if (targetCage) {
        const currentOccupancy = pigs.filter(p => p.cageId === cageId).length
        const availableSpace = targetCage.maxCapacity - currentOccupancy
        
        if (pigIds.length > availableSpace) {
          showToast(`Only ${availableSpace} space(s) available in ${targetCage.label}`, 'warning')
          return
        }
      }
      
      await Promise.all(pigIds.map(id => updateAnimalCage(id, cageId)))
      setPigs((prev) =>
        prev.map((p) => (pigIds.includes(p.id) ? { ...p, cageId } : p))
      )
      showToast(`${pigIds.length} animal(s) moved to ${targetCage?.label}`, 'success')
    } catch (error) {
      console.error('Error moving pigs:', error)
      showToast('Failed to move animals', 'error')
      throw error
    }
  }

  return (
    <MonitoringContext.Provider
      value={{
        pigs,
        cages,
        sortDir,
        setSortDir,
        movePig,
        scanTag,
        pigsInCage,
        refreshData,
        isLoading,
        addCage,
        editCage,
        removeCage,
        updatePigWeight,
        bulkMovePigs,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  )
}

export const useMonitoring = () => {
  const ctx = useContext(MonitoringContext)
  if (!ctx) throw new Error('useMonitoring must be used inside MonitoringProvider')
  return ctx
}

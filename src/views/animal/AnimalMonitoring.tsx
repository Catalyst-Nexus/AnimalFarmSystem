import { createContext, useContext, useState, useMemo, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
} from '@/components/ui'
import {
  Activity,
  ScanBarcode,
  ArrowUp,
  ArrowDown,
  Weight,
  PiggyBank,
  MoveRight,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Save,
  LayoutDashboard,
  SortAsc,
} from 'lucide-react'
import {
  getCages,
  getAnimals,
  createCage,
  updateCage,
  deleteCage,
  updateAnimalCage,
  type Cage as DBCage,
  type Animal as DBAnimal,
} from '@/services/cageService'
import CageDialog from './CageDialog'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'

interface Pig {
  id: string
  tagId: string
  breed: string
  sex: 'Male' | 'Female'
  weight: number
  status: string
  cageId: string | null
}

interface Cage {
  id: string
  label: string
  maxCapacity: number
  isActive: boolean
}

// Helper to convert DB animals to UI Pigs
const convertAnimalToPig = (animal: DBAnimal): Pig => ({
  id: animal.id,
  tagId: animal.id,
  breed: animal.type || 'Unknown',
  sex: (animal.sex === 'Male' || animal.sex === 'Female') ? animal.sex : 'Male',
  weight: Number(animal.weight) || 0,
  status: animal.status || 'Unknown',
  cageId: animal.current_cage_id,
})

// Helper to convert DB cages to UI Cages
const convertDBCage = (cage: DBCage): Cage => ({
  id: cage.id,
  label: cage.cage_label,
  maxCapacity: cage.max_capacity,
  isActive: cage.is_active,
})

// ─── Context ──────────────────────────────────────────────────────────────────

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
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined)

const MonitoringProvider = ({ children }: { children: ReactNode }) => {
  const [pigs, setPigs] = useState<Pig[]>([])
  const [cages, setCages] = useState<Cage[]>([])
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [isLoading, setIsLoading] = useState(true)

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
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    refreshData()
  }, [])

  const pigsInCage = (cageId: string): Pig[] => {
    const list = pigs.filter((p) => p.cageId === cageId)
    return [...list].sort((a, b) =>
      sortDir === 'asc' ? a.weight - b.weight : b.weight - a.weight
    )
  }

  /** Manually move a pig to a different cage */
  const movePig = async (tagId: string, cageId: string) => {
    try {
      // Check if target cage has capacity
      const targetCage = cages.find(c => c.id === cageId)
      if (targetCage) {
        const currentOccupancy = pigs.filter(p => p.cageId === cageId).length
        if (currentOccupancy >= targetCage.maxCapacity) {
          alert(`Cannot move animal: ${targetCage.label} is at full capacity (${targetCage.maxCapacity}/${targetCage.maxCapacity})`)
          return
        }
      }
      
      await updateAnimalCage(tagId, cageId)
      setPigs((prev) =>
        prev.map((p) => (p.tagId === tagId ? { ...p, cageId } : p))
      )
    } catch (error) {
      console.error('Error moving pig:', error)
      throw error
    }
  }

  /** Simulate tag scan — returns the pig matching the tag or null */
  const scanTag = (tagId: string): Pig | null =>
    pigs.find((p) => p.tagId.toLowerCase() === tagId.trim().toLowerCase()) ?? null

  /** Add a new cage */
  const addCage = async (cage: Omit<DBCage, 'id' | 'created_at'>) => {
    try {
      const newCage = await createCage(cage)
      setCages((prev) => [...prev, convertDBCage(newCage)])
    } catch (error) {
      console.error('Error adding cage:', error)
      throw error
    }
  }

  /** Edit an existing cage */
  const editCage = async (id: string, updates: Partial<Omit<DBCage, 'id' | 'created_at'>>) => {
    try {
      const updatedCage = await updateCage(id, updates)
      setCages((prev) =>
        prev.map((c) => (c.id === id ? convertDBCage(updatedCage) : c))
      )
    } catch (error) {
      console.error('Error editing cage:', error)
      throw error
    }
  }

  /** Remove a cage */
  const removeCage = async (id: string) => {
    try {
      await deleteCage(id)
      setCages((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Error removing cage:', error)
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
      }}
    >
      {children}
    </MonitoringContext.Provider>
  )
}

const useMonitoring = () => {
  const ctx = useContext(MonitoringContext)
  if (!ctx) throw new Error('useMonitoring must be used inside MonitoringProvider')
  return ctx
}

// ─── Constants ────────────────────────────────────────────────────────────────

const getStatusStyle = (status: string): string => {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('active')) return 'bg-green-100 text-green-700'
  if (statusLower.includes('sick')) return 'bg-orange-100 text-orange-700'
  if (statusLower.includes('deceased') || statusLower.includes('dead')) return 'bg-red-100 text-red-600'
  if (statusLower.includes('sold')) return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-700'
}

const SEX_STYLES = {
  Male:   'bg-blue-50 text-blue-600',
  Female: 'bg-pink-50 text-pink-600',
}

// ─── Tag Scanner Panel ────────────────────────────────────────────────────────

const TagScanner = () => {
  const { scanTag, cages } = useMonitoring()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Pig | 'not-found' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleScan = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    const pig = scanTag(trimmed)
    setResult(pig ?? 'not-found')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleScan()
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
    inputRef.current?.focus()
  }

  const cage = result && result !== 'not-found'
    ? cages.find((c) => c.id === result.cageId)
    : null

  return (
    <div className="bg-gradient-to-br from-surface to-background border-2 border-border rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-success/10 rounded-lg">
          <ScanBarcode className="w-5 h-5 text-success" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Quick Tag Scanner</h3>
          <p className="text-xs text-muted">Scan or enter tag ID to view animal details</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            className="w-full px-4 py-3 pl-10 border-2 border-border rounded-xl text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success focus:ring-4 focus:ring-success/10 font-mono transition-all"
            placeholder="Enter tag ID (e.g., TAG-2026-003)"
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null) }}
            onKeyDown={handleKeyDown}
          />
          <ScanBarcode className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <button
          className="px-6 py-3 bg-success text-white rounded-xl text-sm font-semibold hover:bg-success/90 hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 shadow-sm"
          onClick={handleScan}
        >
          <CheckCircle2 className="w-4 h-4" /> Scan
        </button>
        {result !== null && (
          <button
            className="px-4 py-3 border-2 border-border rounded-xl text-sm font-medium text-muted hover:bg-background hover:border-foreground transition-all"
            onClick={handleClear}
          >
            Clear
          </button>
        )}
      </div>

      {/* Result */}
      {result === 'not-found' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Tag not found</p>
            <p className="text-xs text-red-600 mt-1">No animal registered with tag <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded">{input}</span>. Please verify and try again.</p>
          </div>
        </div>
      )}

      {result && result !== 'not-found' && (
        <div className="flex flex-wrap items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-green-300 shrink-0">
            <Weight className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-800">Tag found</span>
              <span className="font-mono text-xs bg-white border border-green-200 px-2 py-0.5 rounded text-green-700">{result.tagId}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                <span className="text-muted text-xs uppercase tracking-wide">Weight </span>
                <strong className="text-2xl font-bold text-green-700">{result.weight}</strong>
                <span className="text-muted ml-1">kg</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-muted text-xs uppercase tracking-wide">Breed </span>
                <span className="font-medium text-foreground">{result.breed}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', SEX_STYLES[result.sex])}>{result.sex}</span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusStyle(result.status))}>{result.status}</span>
              </span>
            </div>
            {cage && (
              <p className="mt-1 text-xs text-muted">
                Currently in <strong className="text-green-700">{cage.label}</strong>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Move Pig Dropdown ────────────────────────────────────────────────────────

const MovePigButton = ({ pig }: { pig: Pig }) => {
  const { movePig, cages, pigs } = useMonitoring()
  const [open, setOpen] = useState(false)

  // Filter available cages (not current, active, and has capacity)
  const availableCages = cages.filter((c) => {
    if (c.id === pig.cageId || !c.isActive) return false
    const currentOccupancy = pigs.filter(p => p.cageId === c.id).length
    return currentOccupancy < c.maxCapacity
  })

  return (
    <div className="relative">
      <button
        title="Move to cage"
        className="p-1 rounded hover:bg-background text-muted hover:text-foreground transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <MoveRight className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-xl p-1 min-w-[140px]">
            {availableCages.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted text-center">
                No available cages
              </div>
            ) : (
              availableCages.map((c) => {
                const occupancy = pigs.filter(p => p.cageId === c.id).length
                return (
                  <button
                    key={c.id}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-background text-foreground"
                    onClick={() => { movePig(pig.tagId, c.id); setOpen(false) }}
                  >
                    <span className="flex items-center gap-2">
                      <MoveRight className="w-3 h-3" /> {c.label}
                    </span>
                    <span className="text-muted text-[10px]">{occupancy}/{c.maxCapacity}</span>
                  </button>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Pig Row (inside cage card) ───────────────────────────────────────────────

const PigRow = ({ pig, rank }: { pig: Pig; rank: number }) => (
  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-background/80 transition-all group bg-surface/50 border border-transparent hover:border-border hover:shadow-sm">
    {/* rank */}
    <span className="w-6 text-center text-xs font-bold text-success bg-success/10 rounded-lg py-1 shrink-0">{rank}</span>

    {/* tag */}
    <span className="font-mono text-xs font-bold text-foreground shrink-0 w-28 truncate bg-background px-2 py-1 rounded-md border border-border">
      {pig.tagId}
    </span>

    {/* weight highlight */}
    <div className="w-16 shrink-0">
      <span className="text-base font-bold text-foreground">{pig.weight}</span>
      <span className="text-xs font-normal text-muted ml-0.5">kg</span>
    </div>

    {/* breed */}
    <span className="text-xs text-muted flex-1 truncate hidden sm:block font-medium">{pig.breed}</span>

    {/* badges */}
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={cn('px-2 py-1 rounded-lg text-xs font-bold border-2', SEX_STYLES[pig.sex], pig.sex === 'Male' ? 'border-blue-200' : 'border-pink-200')}>
        {pig.sex[0]}
      </span>
      <span className={cn('px-2 py-1 rounded-lg text-xs font-semibold border', getStatusStyle(pig.status))}>
        {pig.status}
      </span>
    </div>

    {/* move button */}
    <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      <MovePigButton pig={pig} />
    </div>
  </div>
)

// ─── Cage Card ────────────────────────────────────────────────────────────────

const CageCard = ({ cage, onEdit, onDelete }: { cage: Cage; onEdit: () => void; onDelete: () => void }) => {
  const { pigsInCage, sortDir } = useMonitoring()
  const pigs = pigsInCage(cage.id)
  const totalWeight = pigs.reduce((s, p) => s + p.weight, 0)
  const avgWeight = pigs.length ? (totalWeight / pigs.length).toFixed(1) : '—'
  const occupancyPercent = cage.maxCapacity > 0 ? (pigs.length / cage.maxCapacity) * 100 : 0
  const occupancyColor = occupancyPercent >= 100 ? 'text-red-600 bg-red-50' : occupancyPercent >= 80 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'
  const borderColor = occupancyPercent >= 100 ? 'border-red-200' : occupancyPercent >= 80 ? 'border-orange-200' : 'border-green-200'

  return (
    <div className={cn(
      "rounded-2xl border-2 bg-gradient-to-br from-surface to-background p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300",
      !cage.isActive && "opacity-60",
      borderColor
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <PiggyBank className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{cage.label}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-full border-2",
                  occupancyColor,
                  occupancyPercent >= 100 ? 'border-red-300' : occupancyPercent >= 80 ? 'border-orange-300' : 'border-green-300'
                )}>
                  {pigs.length}/{cage.maxCapacity} animals
                </span>
                {!cage.isActive && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-600">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                occupancyPercent >= 100 ? 'bg-red-500' : occupancyPercent >= 80 ? 'bg-orange-500' : 'bg-green-500'
              )}
              style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-1">
            <span className={cn('font-bold', occupancyPercent >= 100 ? 'text-red-600' : occupancyPercent >= 80 ? 'text-orange-600' : 'text-green-600')}>
              {occupancyPercent.toFixed(0)}%
            </span> capacity used
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-right bg-success/5 px-4 py-2 rounded-xl border border-success/20">
            <p className="text-xs text-muted font-medium">Avg Weight</p>
            <p className="text-2xl font-bold text-success">{avgWeight}<span className="text-sm font-normal text-muted ml-1">kg</span></p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-background text-muted hover:text-success transition-all hover:scale-110 active:scale-95"
              title="Edit cage"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-background text-muted hover:text-red-600 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              title={pigs.length > 0 ? "Cannot delete cage with animals" : "Delete cage"}
              disabled={pigs.length > 0}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Column headers */}
      {pigs.length > 0 && (
        <div className="flex items-center gap-3 px-3 pb-2 border-b-2 border-border">
          <span className="w-6 text-xs font-bold text-muted shrink-0">#</span>
          <span className="text-xs font-bold text-muted shrink-0 w-28">TAG ID</span>
          <span className="text-xs font-bold text-muted w-16 shrink-0 flex items-center gap-1">
            WEIGHT {sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          </span>
          <span className="text-xs font-bold text-muted flex-1 hidden sm:block">BREED</span>
          <span className="text-xs font-bold text-muted shrink-0">STATUS</span>
        </div>
      )}

      {/* Pig list */}
      <div className="flex flex-col gap-1">
        {pigs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-3">
              <PiggyBank className="w-8 h-8 text-muted/30" />
            </div>
            <p className="text-sm text-muted font-medium">No animals assigned yet</p>
            <p className="text-xs text-muted mt-1">Animals will appear here when assigned to this cage</p>
          </div>
        ) : (
          pigs.map((p, i) => <PigRow key={p.id} pig={p} rank={i + 1} />)
        )}
      </div>

      {/* Footer totals */}
      {pigs.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t-2 border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted">Total Animals</p>
              <p className="text-sm font-bold text-foreground">{pigs.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <Weight className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted">Total Weight</p>
              <p className="text-sm font-bold text-foreground">{totalWeight} kg</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

// Sorting Tab Component
const SortingTab = () => {
  const { pigs, cages } = useMonitoring()
  const [sortBy, setSortBy] = useState<'weight-asc' | 'weight-desc' | 'gender-male' | 'gender-female'>('weight-desc')
  const [selectedCages, setSelectedCages] = useState<string[]>([])
  const [preview, setPreview] = useState<{ cageId: string; animals: Pig[] }[]>([])
  const [excludedCount, setExcludedCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const activeCages = useMemo(() => cages.filter(c => c.isActive), [cages])

  const toggleCage = (cageId: string) => {
    setSelectedCages(prev =>
      prev.includes(cageId) ? prev.filter(id => id !== cageId) : [...prev, cageId]
    )
  }

  const generatePreview = () => {
    if (selectedCages.length === 0) {
      alert('Please select at least one cage')
      return
    }

    // Get selected cage objects
    const selectedCageObjects = cages.filter(c => selectedCages.includes(c.id))
    
    // Collect ALL animals from selected cages
    let allAnimals = pigs.filter(p => selectedCages.includes(p.cageId || ''))
    
    // Apply gender filtering if needed
    const originalCount = allAnimals.length
    if (sortBy === 'gender-male') {
      allAnimals = allAnimals.filter(p => p.sex === 'Male')
    } else if (sortBy === 'gender-female') {
      allAnimals = allAnimals.filter(p => p.sex === 'Female')
    }
    const totalExcluded = originalCount - allAnimals.length
    
    // Sort all animals as one group
    if (sortBy === 'weight-desc' || sortBy === 'gender-male' || sortBy === 'gender-female') {
      allAnimals.sort((a, b) => b.weight - a.weight) // Heaviest first
    } else if (sortBy === 'weight-asc') {
      allAnimals.sort((a, b) => a.weight - b.weight) // Lightest first
    }
    
    // Redistribute sorted animals across selected cages
    const distribution: { cageId: string; animals: Pig[] }[] = []
    let animalIndex = 0
    
    for (const cage of selectedCageObjects) {
      const cageAnimals: Pig[] = []
      
      // Fill this cage up to its max capacity
      while (animalIndex < allAnimals.length && cageAnimals.length < cage.maxCapacity) {
        cageAnimals.push(allAnimals[animalIndex])
        animalIndex++
      }
      
      distribution.push({
        cageId: cage.id,
        animals: cageAnimals
      })
    }
    
    setExcludedCount(totalExcluded)
    setPreview(distribution)
  }

  const handleSave = async () => {
    if (preview.length === 0) {
      alert('Please generate a preview first')
      return
    }

    if (!confirm('This will redistribute all animals according to the preview. Continue?')) {
      return
    }

    setIsSaving(true)
    try {
      // Update each animal's cage assignment based on the preview
      const updates: Promise<void>[] = []
      
      for (const group of preview) {
        for (const animal of group.animals) {
          // Only update if the animal is being moved to a different cage
          if (animal.cageId !== group.cageId) {
            updates.push(
              updateAnimalCage(animal.id, group.cageId).then(() => {})
            )
          }
        }
      }
      
      await Promise.all(updates)
      
      alert('Animals redistributed successfully!')
      setPreview([])
      setSelectedCages([])
      setExcludedCount(0)
      
      // Refresh data
      window.location.reload()
    } catch (error) {
      console.error('Error saving redistribution:', error)
      alert('Failed to redistribute animals. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="bg-gradient-to-br from-surface to-background border-2 border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-500/10 rounded-xl">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Sort & View Configuration</h3>
            <p className="text-xs text-muted">Sort and view animals within each selected cage by criteria</p>
          </div>
        </div>

        {/* Sort Criteria */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-success" />
            Sort By Criteria:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setSortBy('weight-desc')}
              className={cn(
                'px-5 py-3.5 rounded-xl text-sm font-semibold transition-all border-2 group flex items-center gap-3',
                sortBy === 'weight-desc'
                  ? 'bg-success text-white border-success shadow-lg scale-105'
                  : 'bg-background text-foreground border-border hover:border-success hover:shadow-md'
              )}
            >
              <ArrowDown className={cn('w-5 h-5', sortBy === 'weight-desc' ? 'text-white' : 'text-success')} />
              <div className="text-left">
                <div>Weight (Heaviest First)</div>
                <div className={cn('text-xs font-normal', sortBy === 'weight-desc' ? 'text-white/80' : 'text-muted')}>
                  Largest animals first
                </div>
              </div>
            </button>
            <button
              onClick={() => setSortBy('weight-asc')}
              className={cn(
                'px-5 py-3.5 rounded-xl text-sm font-semibold transition-all border-2 group flex items-center gap-3',
                sortBy === 'weight-asc'
                  ? 'bg-success text-white border-success shadow-lg scale-105'
                  : 'bg-background text-foreground border-border hover:border-success hover:shadow-md'
              )}
            >
              <ArrowUp className={cn('w-5 h-5', sortBy === 'weight-asc' ? 'text-white' : 'text-success')} />
              <div className="text-left">
                <div>Weight (Lightest First)</div>
                <div className={cn('text-xs font-normal', sortBy === 'weight-asc' ? 'text-white/80' : 'text-muted')}>
                  Smallest animals first
                </div>
              </div>
            </button>
            <button
              onClick={() => setSortBy('gender-male')}
              className={cn(
                'px-5 py-3.5 rounded-xl text-sm font-semibold transition-all border-2 group flex items-center gap-3',
                sortBy === 'gender-male'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                  : 'bg-background text-foreground border-border hover:border-blue-500 hover:shadow-md'
              )}
            >
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center font-bold', sortBy === 'gender-male' ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600')}>
                M
              </div>
              <div className="text-left">
                <div>Male Only (by Weight)</div>
                <div className={cn('text-xs font-normal', sortBy === 'gender-male' ? 'text-white/80' : 'text-muted')}>
                  Filter male animals
                </div>
              </div>
            </button>
            <button
              onClick={() => setSortBy('gender-female')}
              className={cn(
                'px-5 py-3.5 rounded-xl text-sm font-semibold transition-all border-2 group flex items-center gap-3',
                sortBy === 'gender-female'
                  ? 'bg-pink-600 text-white border-pink-600 shadow-lg scale-105'
                  : 'bg-background text-foreground border-border hover:border-pink-500 hover:shadow-md'
              )}
            >
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center font-bold', sortBy === 'gender-female' ? 'bg-white text-pink-600' : 'bg-pink-100 text-pink-600')}>
                F
              </div>
              <div className="text-left">
                <div>Female Only (by Weight)</div>
                <div className={cn('text-xs font-normal', sortBy === 'gender-female' ? 'text-white/80' : 'text-muted')}>
                  Filter female animals
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Cage Selection */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-success" />
            Select Target Cages 
            <span className="text-xs font-normal text-muted">({selectedCages.length} selected)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {activeCages.map(cage => (
              <button
                key={cage.id}
                onClick={() => toggleCage(cage.id)}
                className={cn(
                  'px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 hover:scale-105 active:scale-95',
                  selectedCages.includes(cage.id)
                    ? 'bg-success text-white border-success shadow-lg'
                    : 'bg-background text-foreground border-border hover:border-success hover:shadow-md'
                )}
              >
                {cage.label}
              </button>
            ))}
          </div>
          {activeCages.length === 0 && (
            <p className="text-sm text-muted italic">No active cages available. Create cages in the Monitoring tab first.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-border">
          <button
            onClick={generatePreview}
            disabled={selectedCages.length === 0}
            className="px-6 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
          >
            <SortAsc className="w-5 h-5" />
            Generate Preview
          </button>
          <button
            onClick={handleSave}
            disabled={preview.length === 0 || isSaving}
            className="px-6 py-3.5 bg-success text-white rounded-xl text-sm font-bold hover:bg-success/90 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Redistributing...' : 'Save Redistribution'}
          </button>
          {preview.length > 0 && (
            <button
              onClick={() => { setPreview([]); setExcludedCount(0); }}
              className="px-6 py-3.5 border-2 border-border text-foreground rounded-xl text-sm font-bold hover:bg-background hover:shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Clear Preview
            </button>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {preview.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-green-600/10 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-green-900">Redistribution Preview</h3>
              <p className="text-xs text-green-700">Animals sorted and redistributed across selected cages - review and save to apply</p>
            </div>
          </div>
          {excludedCount > 0 && (
            <div className="mb-4 p-3 bg-orange-50 border-2 border-orange-200 rounded-lg flex items-start gap-2">
              <XCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                <strong className="font-bold">{excludedCount}</strong> animal(s) hidden due to gender filter criteria.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {preview.map(group => {
              const cage = cages.find(c => c.id === group.cageId)
              const filledPercent = cage ? (group.animals.length / cage.maxCapacity) * 100 : 0
              return (
                <div key={group.cageId} className="border-2 border-green-300 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <PiggyBank className="w-5 h-5 text-success" />
                      {cage?.label}
                    </h4>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 border-2 border-green-300 text-green-700">
                      {group.animals.length}/{cage?.maxCapacity}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(filledPercent, 100)}%` }}
                    />
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {group.animals.map(pig => (
                      <div key={pig.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-green-50 bg-gray-50 border border-gray-200">
                        <span className="font-mono text-xs font-bold bg-white px-2 py-1 rounded border border-gray-300">{pig.tagId}</span>
                        <span className="font-bold text-foreground">{pig.weight} kg</span>
                        <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold border-2', pig.sex === 'Male' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200')}>
                          {pig.sex}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Animals Info */}
      <div className="bg-gradient-to-br from-surface to-background border-2 border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-foreground">Animals Summary</h3>
        </div>
        {selectedCages.length === 0 ? (
          <p className="text-sm text-muted">
            Select cages above to see how many animals will be sorted.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted">
              <strong className="text-foreground font-bold text-lg">
                {pigs.filter(p => selectedCages.includes(p.cageId || '')).length}
              </strong> animal(s) from <strong className="text-foreground font-bold">{selectedCages.length}</strong> selected cage(s) will be sorted.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const MonitoringApp = () => {
  const { pigs, cages, addCage, editCage, removeCage, isLoading } = useMonitoring()
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'monitoring' | 'sorting'>('monitoring')
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCageId, setEditingCageId] = useState<string | null>(null)
  const [cageLabel, setCageLabel] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stats = useMemo(() => {
    const activePigs = pigs.filter((p) => p.status.toLowerCase().includes('active'))
    const weights = pigs.map((p) => p.weight)
    return {
      total: pigs.length,
      active: activePigs.length,
      cages: cages.length,
      heaviest: weights.length ? Math.max(...weights) : 0,
      lightest: weights.length ? Math.min(...weights) : 0,
    }
  }, [pigs, cages])

  const handleAddCage = () => {
    setCageLabel('')
    setMaxCapacity('')
    setIsActive(true)
    setEditingCageId(null)
    setDialogOpen(true)
  }

  const handleEditCage = (cage: Cage) => {
    setCageLabel(cage.label)
    setMaxCapacity(cage.maxCapacity.toString())
    setIsActive(cage.isActive)
    setEditingCageId(cage.id)
    setDialogOpen(true)
  }

  const handleDeleteCage = async (cageId: string) => {
    if (!confirm('Are you sure you want to delete this cage? This action cannot be undone.')) return
    
    try {
      await removeCage(cageId)
    } catch (error) {
      alert('Failed to delete cage. Make sure no animals are assigned to it.')
    }
  }

  const handleSubmit = async () => {
    if (!cageLabel.trim() || !maxCapacity) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const cageData = {
        cage_label: cageLabel.trim(),
        max_capacity: parseInt(maxCapacity),
        is_active: isActive,
      }

      if (editingCageId) {
        await editCage(editingCageId, cageData)
      } else {
        await addCage(cageData)
      }

      setDialogOpen(false)
    } catch (error) {
      console.error('Error saving cage:', error)
      alert('Failed to save cage. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-success mx-auto mb-4"></div>
          <p className="text-muted">Loading animal monitoring data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Animal Monitoring"
        subtitle="Track animals per cage, scan tags, and manage cage assignments."
        icon={<Activity className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Animals" value={stats.total} color="default" />
        <StatCard label="Active" value={stats.active} color="success" />
        <StatCard label="Total Cages" value={stats.cages} color="default" />
        <StatCard label="Heaviest" value={`${stats.heaviest} kg`} color="default" />
        <StatCard label="Lightest" value={`${stats.lightest} kg`} color="default" />
      </StatsRow>

      {/* Tabs Navigation */}
      <div className="bg-gradient-to-r from-surface via-background to-surface border border-border rounded-xl p-1.5 mb-6 shadow-sm">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all duration-300 group',
              activeTab === 'monitoring'
                ? 'bg-success text-white shadow-md scale-[1.02] border border-success'
                : 'bg-transparent text-muted hover:text-foreground hover:bg-surface/50 border border-transparent hover:border-border'
            )}
          >
            <LayoutDashboard className={cn('w-4 h-4 transition-transform', activeTab === 'monitoring' ? 'animate-in zoom-in-50' : 'group-hover:scale-110')} />
            <span>Monitoring</span>
          </button>
          <button
            onClick={() => setActiveTab('sorting')}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all duration-300 group',
              activeTab === 'sorting'
                ? 'bg-success text-white shadow-md scale-[1.02] border border-success'
                : 'bg-transparent text-muted hover:text-foreground hover:bg-surface/50 border border-transparent hover:border-border'
            )}
          >
            <SortAsc className={cn('w-4 h-4 transition-transform', activeTab === 'sorting' ? 'animate-in zoom-in-50' : 'group-hover:scale-110')} />
            <span>Sorting & Grouping</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'monitoring' ? (
        <>
          {/* Tag Scanner */}
          <TagScanner />

          {/* Controls bar */}
          <ActionsBar>
            {/* Add cage button */}
            <PrimaryButton onClick={handleAddCage}>
              <Plus className="w-4 h-4" />
              Add Cage
            </PrimaryButton>
          </ActionsBar>

          {/* Cage grid */}
          {cages.length === 0 ? (
            <div className="text-center py-12 bg-surface border border-border rounded-2xl">
              <PiggyBank className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted mb-4">No cages created yet</p>
              <button
                onClick={handleAddCage}
                className="px-4 py-2 bg-success text-white rounded-lg text-sm font-semibold hover:bg-success/90 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create First Cage
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {cages.map((cage) => (
                <CageCard
                  key={cage.id}
                  cage={cage}
                  onEdit={() => handleEditCage(cage)}
                  onDelete={() => handleDeleteCage(cage.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <SortingTab />
      )}

      {/* Cage Dialog */}
      <CageDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        cageLabel={cageLabel}
        onCageLabelChange={setCageLabel}
        maxCapacity={maxCapacity}
        onMaxCapacityChange={setMaxCapacity}
        isActive={isActive}
        onIsActiveChange={setIsActive}
        editMode={!!editingCageId}
        isLoading={isSubmitting}
      />
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function AnimalMonitoring() {
  return (
    <MonitoringProvider>
      <MonitoringApp />
    </MonitoringProvider>
  )
}

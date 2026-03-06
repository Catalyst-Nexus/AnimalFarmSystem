import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  PageHeader,
  PrimaryButton,
} from '@/components/ui'
import {
  Activity,
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
  ClipboardList,
  Search,
  RefreshCw,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Hash,
  Eye,
  Percent,
  AlertTriangle,
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
import { animalService } from '@/services/animalService'
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
const convertAnimalToPig = (animal: DBAnimal): Pig => {
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
const convertDBCage = (cage: DBCage): Cage => ({
  id: cage.id,
  label: cage.cage_label,
  maxCapacity: cage.max_capacity,
  isActive: cage.is_active,
})

// ─── Toast Notification ───────────────────────────────────────────────────────

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning'
}

let toastId = 0
const ToastContext = createContext<{ showToast: (message: string, type: Toast['type']) => void }>({
  showToast: () => {},
})

const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type']) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto px-5 py-3 rounded-xl shadow-xl border-2 text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-right-5 fade-in duration-300',
              t.type === 'success' && 'bg-green-50 border-green-300 text-green-800',
              t.type === 'error' && 'bg-red-50 border-red-300 text-red-800',
              t.type === 'warning' && 'bg-orange-50 border-orange-300 text-orange-800',
            )}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {t.type === 'error' && <XCircle className="w-4 h-4" />}
            {t.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const useToast = () => useContext(ToastContext)

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
  updatePigWeight: (pigId: string, newWeight: number) => Promise<void>
  bulkMovePigs: (pigIds: string[], cageId: string) => Promise<void>
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined)

const MonitoringProvider = ({ children }: { children: ReactNode }) => {
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

const useMonitoring = () => {
  const ctx = useContext(MonitoringContext)
  if (!ctx) throw new Error('useMonitoring must be used inside MonitoringProvider')
  return ctx
}

// ─── Constants ────────────────────────────────────────────────────────────────

const getStatusDot = (status: string): string => {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('active')) return 'bg-emerald-500'
  if (statusLower.includes('sick')) return 'bg-amber-500'
  if (statusLower.includes('deceased') || statusLower.includes('dead')) return 'bg-red-500'
  if (statusLower.includes('sold')) return 'bg-sky-500'
  return 'bg-gray-400'
}

const SEX_STYLES = {
  Male:   'bg-blue-50 text-blue-600 border-blue-200',
  Female: 'bg-pink-50 text-pink-600 border-pink-200',
}

// ─── Occupancy Ring ───────────────────────────────────────────────────────────

const OccupancyRing = ({ percent, size = 56, strokeWidth = 5 }: { percent: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference
  const color = percent >= 100 ? '#ef4444' : percent >= 80 ? '#f97316' : '#22c55e'
  const trackColor = percent >= 100 ? '#fecaca' : percent >= 80 ? '#fed7aa' : '#bbf7d0'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
        {Math.round(percent)}%
      </span>
    </div>
  )
}

// ─── Move Pig Dropdown ────────────────────────────────────────────────────────

const MovePigButton = ({ pig }: { pig: Pig }) => {
  const { movePig, cages, pigs } = useMonitoring()
  const [open, setOpen] = useState(false)

  const availableCages = cages.filter((c) => {
    if (c.id === pig.cageId || !c.isActive) return false
    const currentOccupancy = pigs.filter(p => p.cageId === c.id).length
    return currentOccupancy < c.maxCapacity
  })

  return (
    <div className="relative">
      <button
        title="Move to cage"
        className="p-1.5 rounded-lg hover:bg-background text-muted hover:text-success transition-all hover:scale-110 active:scale-95"
        onClick={() => setOpen((v) => !v)}
      >
        <MoveRight className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-surface border border-border rounded-xl shadow-xl p-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-2.5 py-1.5 mb-1">Move to</p>
            {availableCages.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted text-center bg-background rounded-lg">
                No cages available
              </div>
            ) : (
              availableCages.map((c) => {
                const occupancy = pigs.filter(p => p.cageId === c.id).length
                const pct = (occupancy / c.maxCapacity) * 100
                return (
                  <button
                    key={c.id}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all hover:bg-success/10 hover:text-success text-foreground group"
                    onClick={() => { movePig(pig.id, c.id); setOpen(false) }}
                  >
                    <span className="flex items-center gap-2">
                      <MoveRight className="w-3 h-3 text-muted group-hover:text-success transition-colors" />
                      {c.label}
                    </span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                      pct >= 80 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    )}>
                      {occupancy}/{c.maxCapacity}
                    </span>
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

const PigRow = ({ pig, rank, bulkMode, selected, onToggleSelect }: { 
  pig: Pig; 
  rank: number;
  bulkMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('pigId', pig.id)
    e.dataTransfer.setData('pigTag', pig.tagId)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
  <div 
    draggable={!bulkMode}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    className={cn(
      'flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all group bg-surface/30 border hover:shadow-sm',
      bulkMode ? 'cursor-pointer' : 'cursor-move hover:bg-background/80',
      isDragging && 'opacity-50',
      selected && 'bg-success/10 border-success/50 border-2',
      !selected && 'border-transparent hover:border-border/60'
    )}
    onClick={() => bulkMode && onToggleSelect?.()}
  >
    {/* rank or checkbox */}
    {bulkMode ? (
      <div className="w-6 h-6 flex items-center justify-center shrink-0">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-2 border-border text-success focus:ring-2 focus:ring-success/20 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Select animal for bulk transfer"
        />
      </div>
    ) : (
      <span className={cn(
        'w-6 h-6 text-center text-[10px] font-black rounded-full flex items-center justify-center shrink-0',
        rank <= 3 ? 'bg-success/15 text-success' : 'bg-muted/10 text-muted'
      )}>
        {rank}
      </span>
    )}

    {/* tag */}
    <span className="font-mono text-[11px] font-bold text-foreground shrink-0 w-28 truncate bg-background px-2.5 py-1 rounded-lg border border-border/60">
      {pig.tagId}
    </span>

    {/* weight highlight */}
    <div className="w-16 shrink-0 flex items-baseline gap-0.5">
      <span className="text-sm font-black text-foreground">{pig.weight}</span>
      <span className="text-[10px] text-muted">kg</span>
    </div>

    {/* breed */}
    <span className="text-xs text-muted flex-1 truncate hidden sm:block">{pig.breed}</span>

    {/* badges */}
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={cn('w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center border', SEX_STYLES[pig.sex])}>
        {pig.sex[0]}
      </span>
      <span className="flex items-center gap-1">
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', getStatusDot(pig.status))} />
        <span className="text-[11px] font-medium text-muted hidden md:inline">{pig.status}</span>
      </span>
    </div>

    {/* move button - always visible now */}
    {!bulkMode && (
      <div className="shrink-0">
        <MovePigButton pig={pig} />
      </div>
    )}
  </div>
  )
}

// ─── Cage Card ────────────────────────────────────────────────────────────────

const CageCard = ({ cage, onEdit, onDelete, bulkMode, selectedPigs, onToggleSelect }: { 
  cage: Cage; 
  onEdit: () => void; 
  onDelete: () => void;
  bulkMode?: boolean;
  selectedPigs?: Set<string>;
  onToggleSelect?: (pigId: string) => void;
}) => {
  const { pigsInCage, sortDir, movePig } = useMonitoring()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const pigId = e.dataTransfer.getData('pigId')
    
    if (pigId) {
      try {
        await movePig(pigId, cage.id)
      } catch (error) {
        // Error handled by movePig
      }
    }
  }
  const pigs = pigsInCage(cage.id)
  const totalWeight = pigs.reduce((s, p) => s + p.weight, 0)
  const occupancyPercent = cage.maxCapacity > 0 ? (pigs.length / cage.maxCapacity) * 100 : 0
  const maleCount = pigs.filter(p => p.sex === 'Male').length
  const femaleCount = pigs.filter(p => p.sex === 'Female').length

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface shadow-sm hover:shadow-lg transition-all duration-300 group/card",
        !cage.isActive && "opacity-60",
        isDragOver && "ring-4 ring-success/30 border-success scale-[1.02]",
        occupancyPercent >= 100 ? 'border-red-200' : occupancyPercent >= 80 ? 'border-orange-200' : 'border-border'
      )}
    >
      {/* Top accent bar */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-1',
        occupancyPercent >= 100 ? 'bg-gradient-to-r from-red-400 to-red-500'
          : occupancyPercent >= 80 ? 'bg-gradient-to-r from-orange-400 to-amber-500'
          : 'bg-gradient-to-r from-success to-emerald-400'
      )} />

      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              {cage.label}
              {!cage.isActive && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-gray-500 uppercase tracking-wider">
                  Inactive
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted">
                <strong className={cn(
                  'font-black',
                  occupancyPercent >= 100 ? 'text-red-600' : occupancyPercent >= 80 ? 'text-orange-600' : 'text-success'
                )}>
                  {pigs.length}
                </strong>/{cage.maxCapacity} animals
                </span>
                {pigs.length > 0 && (
                  <span className="text-[11px] text-muted flex items-center gap-1.5">
                    <span className="text-blue-500">{maleCount}M</span>
                    <span className="text-muted/40">/</span>
                    <span className="text-pink-500">{femaleCount}F</span>
                  </span>
                )}
              </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-muted hover:text-success hover:bg-success/10 transition-all"
              title="Edit cage"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={pigs.length > 0 ? "Cannot delete cage with animals" : "Delete cage"}
              disabled={pigs.length > 0}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-all"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-4 mt-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-purple-50 rounded">
              <TrendingUp className="w-3 h-3 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted leading-tight">Total</p>
              <p className="text-sm font-black text-foreground leading-tight">{totalWeight}<span className="text-[10px] text-muted ml-0.5">kg</span></p>
            </div>
          </div>
          {pigs.length > 0 && (
            <>
              <div className="w-px h-8 bg-border/60" />
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-blue-50 rounded">
                  <ArrowUp className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted leading-tight">Max</p>
                  <p className="text-sm font-black text-foreground leading-tight">
                    {Math.max(...pigs.map(p => p.weight))}<span className="text-[10px] text-muted ml-0.5">kg</span>
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-orange-50 rounded">
                  <ArrowDown className="w-3 h-3 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted leading-tight">Min</p>
                  <p className="text-sm font-black text-foreground leading-tight">
                    {Math.min(...pigs.map(p => p.weight))}<span className="text-[10px] text-muted ml-0.5">kg</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expandable body */}
      <div className={cn(
        'overflow-hidden transition-all duration-300',
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="p-5 pt-3">
          {/* Column headers */}
          {pigs.length > 0 && (
            <div className="flex items-center gap-3 px-3 pb-2 mb-2 text-[10px] font-bold text-muted uppercase tracking-wider">
              <span className="w-6 shrink-0">#</span>
              <span className="shrink-0 w-28">Tag ID</span>
              <span className="w-16 shrink-0 flex items-center gap-1">
                Weight {sortDir === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
              </span>
              <span className="flex-1 hidden sm:block">Breed</span>
              <span className="shrink-0">Info</span>
            </div>
          )}

          {/* Pig list */}
          <div className="flex flex-col gap-1">
            {pigs.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-muted/5 flex items-center justify-center mx-auto mb-3 border border-dashed border-muted/20">
                  <PiggyBank className="w-7 h-7 text-muted/20" />
                </div>
                <p className="text-sm text-muted/60 font-medium">{isDragOver ? 'Drop animal here' : 'Empty cage'}</p>
                <p className="text-xs text-muted/40 mt-0.5">{isDragOver ? 'Release to assign to this cage' : 'Assign animals to see them here'}</p>
              </div>
            ) : (
              pigs.map((p, i) => (
                <PigRow 
                  key={p.id} 
                  pig={p} 
                  rank={i + 1}
                  bulkMode={bulkMode}
                  selected={selectedPigs?.has(p.id)}
                  onToggleSelect={() => onToggleSelect?.(p.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Collapsed summary when collapsed */}
      {!isExpanded && pigs.length > 0 && (
        <div className="px-5 pb-4 pt-2 flex items-center gap-2 text-xs text-muted">
          <Eye className="w-3 h-3" />
          <span>{pigs.length} animal{pigs.length > 1 ? 's' : ''} hidden — click expand to view</span>
        </div>
      )}
    </div>
  )
}

// ─── Monitoring Sheet Tab ─────────────────────────────────────────────────────

const MonitoringSheetTab = () => {
  const { pigs, cages, updatePigWeight } = useMonitoring()
  const [selectedCages, setSelectedCages] = useState<string[]>([])
  const [editingWeights, setEditingWeights] = useState<Record<string, string>>({})
  const [updatingPigs, setUpdatingPigs] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState('')

  const activeCages = useMemo(() => cages.filter(c => c.isActive), [cages])
  
  const toggleCage = (cageId: string) => {
    setSelectedCages(prev =>
      prev.includes(cageId) ? prev.filter(id => id !== cageId) : [...prev, cageId]
    )
  }

  const selectAllCages = () => {
    setSelectedCages(activeCages.map(c => c.id))
  }

  const clearAllCages = () => {
    setSelectedCages([])
  }

  const animalsToMonitor = useMemo(() => {
    let filtered = pigs.filter(p => selectedCages.includes(p.cageId || ''))
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase()
      filtered = filtered.filter(p =>
        p.tagId.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      )
    }
    return filtered.sort((a, b) => {
      const cageA = cages.find(c => c.id === a.cageId)?.label || ''
      const cageB = cages.find(c => c.id === b.cageId)?.label || ''
      if (cageA !== cageB) return cageA.localeCompare(cageB)
      return b.weight - a.weight
    })
  }, [pigs, selectedCages, cages, searchFilter])

  const handleWeightChange = (tagId: string, value: string) => {
    setEditingWeights(prev => ({ ...prev, [tagId]: value }))
  }

  const handleUpdateWeight = async (pig: Pig) => {
    const newWeightStr = editingWeights[pig.tagId]
    if (!newWeightStr) return
    
    const newWeight = parseFloat(newWeightStr)
    if (isNaN(newWeight) || newWeight <= 0) return

    if (newWeight === pig.weight) return

    setUpdatingPigs(prev => new Set(prev).add(pig.tagId))
    try {
      await updatePigWeight(pig.id, newWeight)
    } finally {
      setUpdatingPigs(prev => {
        const next = new Set(prev)
        next.delete(pig.tagId)
        return next
      })
    }
  }

  return (
    <div className="space-y-5">
      {/* Cage Selection */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <PiggyBank className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Cages to Monitor</h3>
              <p className="text-xs text-muted">
                <strong className="text-foreground">{selectedCages.length}</strong> cage{selectedCages.length !== 1 ? 's' : ''} · <strong className="text-foreground">{animalsToMonitor.length}</strong> animal{animalsToMonitor.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAllCages}
              className="px-3 py-1.5 text-xs font-semibold text-success border border-success/30 rounded-lg hover:bg-success hover:text-white transition-all"
            >
              All
            </button>
            <button
              onClick={clearAllCages}
              className="px-3 py-1.5 text-xs font-semibold text-muted border border-border rounded-lg hover:bg-background transition-all"
            >
              None
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {activeCages.map(cg => {
            const animalCount = pigs.filter(p => p.cageId === cg.id).length
            const selected = selectedCages.includes(cg.id)
            return (
              <button
                key={cg.id}
                onClick={() => toggleCage(cg.id)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border',
                  selected
                    ? 'bg-success text-white border-success shadow-md'
                    : 'bg-background text-foreground border-border hover:border-success/50'
                )}
              >
                {cg.label}
                <span className={cn('ml-1.5 text-[10px]', selected ? 'text-white/70' : 'text-muted')}>
                  {animalCount}
                </span>
              </button>
            )
          })}
        </div>
        
        {activeCages.length === 0 && (
          <p className="text-sm text-muted italic">No active cages.</p>
        )}
      </div>

      {/* Monitoring List */}
      {selectedCages.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-muted/20">
            <ClipboardList className="w-8 h-8 text-muted/20" />
          </div>
          <p className="text-sm font-medium text-muted/60">Select cages above to start monitoring</p>
        </div>
      ) : animalsToMonitor.length === 0 && !searchFilter ? (
        <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-muted/20">
            <PiggyBank className="w-8 h-8 text-muted/20" />
          </div>
          <p className="text-sm font-medium text-muted/60">No animals in selected cages</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Table header bar */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Weight Update Sheet</h3>
                  <p className="text-xs text-muted">{animalsToMonitor.length} animal{animalsToMonitor.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {/* Search filter */}
              <div className="relative">
                <input
                  className="w-56 px-3 py-2 pl-9 border border-border rounded-lg text-xs bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all"
                  placeholder="Filter by tag, breed..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                <Search className="w-3.5 h-3.5 text-muted/50 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Sticky table header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-background/80 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wider sticky top-0 z-10">
            <div className="col-span-3">Tag ID</div>
            <div className="col-span-2">Cage</div>
            <div className="col-span-2">Breed</div>
            <div className="col-span-1">Sex</div>
            <div className="col-span-2">Weight</div>
            <div className="col-span-2">Update</div>
          </div>

          {/* Rows */}
          <div className="max-h-[520px] overflow-y-auto divide-y divide-border/50">
            {animalsToMonitor.map((pig) => {
              const currentCage = cages.find(c => c.id === pig.cageId)
              const isUpdating = updatingPigs.has(pig.tagId)
              const editWeight = editingWeights[pig.tagId] ?? pig.weight.toString()
              const weightChanged = editWeight !== pig.weight.toString()
              
              return (
                <div
                  key={pig.id}
                  id={`pig-row-${pig.tagId}`}
                  className="grid grid-cols-12 gap-3 px-5 py-3.5 hover:bg-background/50 transition-all"
                >
                  <div className="col-span-3 flex items-center">
                    <span className="font-mono text-[11px] font-bold bg-background px-2.5 py-1 rounded-lg border border-border/60 truncate">
                      {pig.tagId}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-muted truncate">{currentCage?.label || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-muted truncate">{pig.breed}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className={cn('w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center border', SEX_STYLES[pig.sex])}>
                      {pig.sex[0]}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-black text-foreground">{pig.weight}<span className="text-[10px] text-muted font-normal ml-0.5">kg</span></span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={cn(
                        'w-20 px-2.5 py-1.5 border rounded-lg text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-2 transition-all',
                        weightChanged ? 'border-success focus:border-success focus:ring-success/20' : 'border-border focus:border-border focus:ring-border/10'
                      )}
                      value={editWeight}
                      onChange={(e) => handleWeightChange(pig.tagId, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateWeight(pig) }}
                      disabled={isUpdating}
                      aria-label="New weight in kg"
                    />
                    <button
                      onClick={() => handleUpdateWeight(pig)}
                      disabled={isUpdating || !weightChanged}
                      className={cn(
                        'p-1.5 rounded-lg transition-all',
                        weightChanged
                          ? 'bg-success text-white hover:bg-success/90 active:scale-95 shadow-sm'
                          : 'bg-border/30 text-muted/40 cursor-not-allowed'
                      )}
                      title="Save weight"
                    >
                      {isUpdating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
            {animalsToMonitor.length === 0 && searchFilter && (
              <div className="text-center py-10 text-sm text-muted">
                No animals match "{searchFilter}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sorting Tab ──────────────────────────────────────────────────────────────

const SortingTab = () => {
  const { pigs, cages } = useMonitoring()
  const { showToast } = useToast()
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
      showToast('Select at least one cage', 'warning')
      return
    }

    const selectedCageObjects = cages.filter(c => selectedCages.includes(c.id))
    
    let allAnimals = pigs.filter(p => selectedCages.includes(p.cageId || ''))
    
    const originalCount = allAnimals.length
    if (sortBy === 'gender-male') {
      allAnimals = allAnimals.filter(p => p.sex === 'Male')
    } else if (sortBy === 'gender-female') {
      allAnimals = allAnimals.filter(p => p.sex === 'Female')
    }
    const totalExcluded = originalCount - allAnimals.length
    
    if (sortBy === 'weight-desc' || sortBy === 'gender-male' || sortBy === 'gender-female') {
      allAnimals.sort((a, b) => b.weight - a.weight)
    } else if (sortBy === 'weight-asc') {
      allAnimals.sort((a, b) => a.weight - b.weight)
    }
    
    const distribution: { cageId: string; animals: Pig[] }[] = []
    let animalIndex = 0
    
    for (const cage of selectedCageObjects) {
      const cageAnimals: Pig[] = []
      while (animalIndex < allAnimals.length && cageAnimals.length < cage.maxCapacity) {
        cageAnimals.push(allAnimals[animalIndex])
        animalIndex++
      }
      distribution.push({ cageId: cage.id, animals: cageAnimals })
    }
    
    setExcludedCount(totalExcluded)
    setPreview(distribution)
    showToast('Preview generated', 'success')
  }

  const handleSave = async () => {
    if (preview.length === 0) {
      showToast('Generate a preview first', 'warning')
      return
    }

    if (!confirm('This will redistribute all animals according to the preview. Continue?')) return

    setIsSaving(true)
    try {
      const updates: Promise<void>[] = []
      
      for (const group of preview) {
        for (const animal of group.animals) {
          if (animal.cageId !== group.cageId) {
            updates.push(updateAnimalCage(animal.id, group.cageId).then(() => {}))
          }
        }
      }
      
      await Promise.all(updates)
      
      showToast('Animals redistributed!', 'success')
      setPreview([])
      setSelectedCages([])
      setExcludedCount(0)
      window.location.reload()
    } catch (error) {
      console.error('Error saving redistribution:', error)
      showToast('Redistribution failed', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const sortOptions = [
    { key: 'weight-desc' as const, icon: <TrendingDown className="w-5 h-5" />, label: 'Heaviest First', desc: 'Largest animals ranked first', color: 'success' },
    { key: 'weight-asc' as const, icon: <TrendingUp className="w-5 h-5" />, label: 'Lightest First', desc: 'Smallest animals ranked first', color: 'success' },
    { key: 'gender-male' as const, icon: <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">M</span>, label: 'Male Only', desc: 'Filter & sort male animals', color: 'blue' },
    { key: 'gender-female' as const, icon: <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-black">F</span>, label: 'Female Only', desc: 'Filter & sort female animals', color: 'pink' },
  ]

  return (
    <div className="space-y-5">
      {/* Config Panel */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-blue-500/15 to-purple-500/10 rounded-xl">
              <SortAsc className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Sorting & Redistribution</h3>
              <p className="text-xs text-muted">Sort animals across cages by weight or gender</p>
            </div>
          </div>

          {/* Sort Criteria */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
              <Filter className="w-4 h-4 text-muted" />
              Sort Criteria
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className={cn(
                    'px-4 py-3.5 rounded-xl text-sm font-semibold transition-all border flex items-center gap-3 text-left',
                    sortBy === opt.key
                      ? opt.color === 'blue' ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : opt.color === 'pink' ? 'bg-pink-600 text-white border-pink-600 shadow-lg'
                        : 'bg-success text-white border-success shadow-lg'
                      : 'bg-background text-foreground border-border hover:border-muted hover:shadow-sm'
                  )}
                >
                  {opt.icon}
                  <div>
                    <div>{opt.label}</div>
                    <div className={cn('text-[11px] font-normal', sortBy === opt.key ? 'text-white/70' : 'text-muted')}>
                      {opt.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cage Selection */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
              <PiggyBank className="w-4 h-4 text-muted" />
              Target Cages
              <span className="text-xs font-normal text-muted">({selectedCages.length} selected)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {activeCages.map(cage => {
                const selected = selectedCages.includes(cage.id)
                const count = pigs.filter(p => p.cageId === cage.id).length
                return (
                  <button
                    key={cage.id}
                    onClick={() => toggleCage(cage.id)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border',
                      selected
                        ? 'bg-success text-white border-success shadow-md'
                        : 'bg-background text-foreground border-border hover:border-success/50'
                    )}
                  >
                    {cage.label}
                    <span className={cn('ml-1.5 text-[10px]', selected ? 'text-white/70' : 'text-muted')}>
                      {count}/{cage.maxCapacity}
                    </span>
                  </button>
                )
              })}
            </div>
            {activeCages.length === 0 && (
              <p className="text-sm text-muted italic mt-2">No active cages available.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-5 border-t border-border">
            <button
              onClick={generatePreview}
              disabled={selectedCages.length === 0}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={preview.length === 0 || isSaving}
              className="px-5 py-3 bg-success text-white rounded-xl text-sm font-bold hover:bg-success/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Apply'}
            </button>
            {preview.length > 0 && (
              <button
                onClick={() => { setPreview([]); setExcludedCount(0); }}
                className="px-5 py-3 border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-background active:scale-95 transition-all flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-surface border border-emerald-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-5 border-b border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900">Redistribution Preview</h3>
                <p className="text-xs text-emerald-700/80">Review before applying</p>
              </div>
            </div>
            {excludedCount > 0 && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <strong>{excludedCount}</strong> animal{excludedCount > 1 ? 's' : ''} excluded by gender filter
              </div>
            )}
          </div>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {preview.map(group => {
              const cage = cages.find(c => c.id === group.cageId)
              const filledPct = cage ? (group.animals.length / cage.maxCapacity) * 100 : 0
              const totalW = group.animals.reduce((s, a) => s + a.weight, 0)
              return (
                <div key={group.cageId} className="border border-border rounded-xl overflow-hidden bg-background">
                  <div className="px-4 py-3 bg-surface border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <OccupancyRing percent={filledPct} size={36} strokeWidth={4} />
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{cage?.label}</h4>
                        <p className="text-[10px] text-muted">{group.animals.length}/{cage?.maxCapacity} · {totalW} kg total</p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-border/50 max-h-56 overflow-y-auto">
                    {group.animals.map((pig, i) => (
                      <div key={pig.id} className="flex items-center justify-between px-4 py-2 text-xs hover:bg-surface/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center',
                            i < 3 ? 'bg-success/15 text-success' : 'bg-muted/10 text-muted'
                          )}>{i + 1}</span>
                          <span className="font-mono font-bold text-foreground">{pig.tagId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-foreground">{pig.weight} kg</span>
                          <span className={cn('w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border', SEX_STYLES[pig.sex])}>
                            {pig.sex[0]}
                          </span>
                        </div>
                      </div>
                    ))}
                    {group.animals.length === 0 && (
                      <div className="px-4 py-6 text-center text-xs text-muted italic">No animals assigned</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Percent className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Summary</h3>
        </div>
        {selectedCages.length === 0 ? (
          <p className="text-xs text-muted">Select cages to see the scope of redistribution.</p>
        ) : (
          <p className="text-xs text-muted">
            <strong className="text-foreground text-base font-black">
              {pigs.filter(p => selectedCages.includes(p.cageId || '')).length}
            </strong> animal{pigs.filter(p => selectedCages.includes(p.cageId || '')).length !== 1 ? 's' : ''} across <strong className="text-foreground font-bold">{selectedCages.length}</strong> cage{selectedCages.length !== 1 ? 's' : ''} will be sorted.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const MonitoringApp = () => {
  const { pigs, cages, addCage, editCage, removeCage, isLoading, refreshData, bulkMovePigs } = useMonitoring()
  const { showToast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'monitoring' | 'sheet' | 'sorting'>('monitoring')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Bulk transfer mode
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedPigs, setSelectedPigs] = useState<Set<string>>(new Set())
  const [bulkMoveDropdownOpen, setBulkMoveDropdownOpen] = useState(false)
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCageId, setEditingCageId] = useState<string | null>(null)
  const [cageLabel, setCageLabel] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stats = useMemo(() => {
    const activePigs = pigs.filter((p) => p.status.toLowerCase().includes('active'))
    const sickPigs = pigs.filter((p) => p.status.toLowerCase().includes('sick'))
    const weights = pigs.map((p) => p.weight)
    const totalWeight = weights.reduce((s, w) => s + w, 0)
    const avgWeight = weights.length ? (totalWeight / weights.length).toFixed(1) : '0'
    return {
      total: pigs.length,
      active: activePigs.length,
      sick: sickPigs.length,
      cages: cages.filter(c => c.isActive).length,
      heaviest: weights.length ? Math.max(...weights) : 0,
      lightest: weights.length ? Math.min(...weights) : 0,
      avgWeight,
    }
  }, [pigs, cages])

  const filteredCages = useMemo(() => {
    if (!searchQuery.trim()) return cages
    const q = searchQuery.toLowerCase()
    return cages.filter(c => {
      if (c.label.toLowerCase().includes(q)) return true
      const cagePigs = pigs.filter(p => p.cageId === c.id)
      return cagePigs.some(p => p.tagId.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q))
    })
  }, [cages, pigs, searchQuery])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
      showToast('Data refreshed', 'success')
    } finally {
      setIsRefreshing(false)
    }
  }

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
    if (!confirm('Delete this cage? This cannot be undone.')) return
    
    try {
      await removeCage(cageId)
    } catch {
      // toast handled in context
    }
  }

  const handleSubmit = async () => {
    if (!cageLabel.trim() || !maxCapacity) {
      showToast('Please fill all fields', 'warning')
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
    } catch {
      // toast handled in context
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    setSelectedPigs(new Set())
    setBulkMoveDropdownOpen(false)
  }

  const togglePigSelection = (pigId: string) => {
    setSelectedPigs(prev => {
      const next = new Set(prev)
      if (next.has(pigId)) {
        next.delete(pigId)
      } else {
        next.add(pigId)
      }
      return next
    })
  }

  const deselectAll = () => {
    setSelectedPigs(new Set())
  }

  const handleBulkMove = async (targetCageId: string) => {
    if (selectedPigs.size === 0) {
      showToast('No animals selected', 'warning')
      return
    }

    try {
      await bulkMovePigs(Array.from(selectedPigs), targetCageId)
      setSelectedPigs(new Set())
      setBulkMode(false)
      setBulkMoveDropdownOpen(false)
    } catch {
      // Error handled in context
    }
  }

  const tabs = [
    { key: 'monitoring' as const, label: 'Monitoring', icon: LayoutDashboard, count: cages.length },
    { key: 'sheet' as const, label: 'Weight Sheet', icon: ClipboardList },
    { key: 'sorting' as const, label: 'Sorting', icon: SortAsc },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-border" />
            <div className="absolute inset-0 rounded-full border-4 border-t-success animate-spin" />
          </div>
          <p className="text-sm text-muted font-medium">Loading monitoring data...</p>
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

      {/* Enhanced Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total Animals', value: stats.total, icon: <PiggyBank className="w-4 h-4" />, color: 'text-foreground', bg: 'bg-muted/10' },
          { label: 'Active', value: stats.active, icon: <Activity className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Sick', value: stats.sick, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Cages', value: stats.cages, icon: <Hash className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Heaviest', value: `${stats.heaviest} kg`, icon: <ArrowUp className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Weight', value: `${stats.avgWeight} kg`, icon: <Weight className="w-4 h-4" />, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('p-1.5 rounded-lg', s.bg)}><span className={s.color}>{s.icon}</span></div>
            </div>
            <p className="text-[10px] font-medium text-muted uppercase tracking-wider">{s.label}</p>
            <p className={cn('text-xl font-black mt-0.5', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="bg-surface border border-border rounded-xl p-1 mb-6 shadow-sm">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-success text-white shadow-md'
                  : 'text-muted hover:text-foreground hover:bg-background'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  'text-[10px] font-black px-1.5 py-0.5 rounded-full',
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-muted/10 text-muted'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'monitoring' ? (
        <>
          {/* Controls bar */}
          <div className="flex items-center justify-between gap-3 mb-5">
            {/* Search */}
            <div className="relative">
              <input
                className="w-56 px-3 py-2 pl-9 border border-border rounded-lg text-xs bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:border-success focus:ring-2 focus:ring-success/10 transition-all"
                placeholder="Search cages or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="w-3.5 h-3.5 text-muted/50 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleBulkMode}
                className={cn(
                  'px-3 py-2 border rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  bulkMode
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                    : 'border-border text-muted hover:text-foreground hover:bg-background'
                )}
                title="Bulk transfer mode"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {bulkMode ? 'Bulk Mode' : 'Bulk Transfer'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 border border-border rounded-lg text-muted hover:text-foreground hover:bg-background transition-all disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              </button>
              <PrimaryButton onClick={handleAddCage}>
                <Plus className="w-4 h-4" />
                Add Cage
              </PrimaryButton>
            </div>
          </div>

          {/* Bulk transfer action bar */}
          {bulkMode && (
            <div className="mb-5 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 text-white rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-900">
                      {selectedPigs.size} animal{selectedPigs.size !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-purple-600">Click animals to select, then choose target cage</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPigs.size > 0 && (
                    <>
                      <button
                        onClick={deselectAll}
                        className="px-3 py-1.5 text-xs font-semibold text-purple-600 border border-purple-300 rounded-lg hover:bg-white transition-all"
                      >
                        Clear
                      </button>
                      <div className="relative">
                        <button 
                          onClick={() => setBulkMoveDropdownOpen(!bulkMoveDropdownOpen)}
                          className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-1.5"
                        >
                          <MoveRight className="w-3.5 h-3.5" />
                          Move To...
                        </button>
                        {bulkMoveDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setBulkMoveDropdownOpen(false)} />
                            <div className="absolute right-0 top-full mt-1.5 z-30 bg-white border-2 border-purple-200 rounded-xl shadow-xl p-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
                              <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-2.5 py-1.5 mb-1">Select Cage</p>
                              {cages.filter(c => c.isActive).map(cage => {
                                const occupancy = pigs.filter(p => p.cageId === cage.id).length
                                const available = cage.maxCapacity - occupancy
                                const canFit = available >= selectedPigs.size
                                return (
                                  <button
                                    key={cage.id}
                                    onClick={() => canFit && handleBulkMove(cage.id)}
                                    disabled={!canFit}
                                    className={cn(
                                      'flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all',
                                      canFit
                                        ? 'hover:bg-purple-500 hover:text-white text-foreground'
                                        : 'opacity-50 cursor-not-allowed text-muted'
                                    )}
                                  >
                                    <span className="flex items-center gap-2">
                                      <MoveRight className="w-3 h-3" />
                                      {cage.label}
                                    </span>
                                    <span className={cn(
                                      'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                      canFit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    )}>
                                      {available} left
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cage grid */}
          {filteredCages.length === 0 && !searchQuery ? (
            <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-muted/20">
                <PiggyBank className="w-8 h-8 text-muted/20" />
              </div>
              <p className="text-sm font-medium text-muted/60 mb-4">No cages yet</p>
              <button
                onClick={handleAddCage}
                className="px-4 py-2 bg-success text-white rounded-lg text-sm font-semibold hover:bg-success/90 transition-all inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create First Cage
              </button>
            </div>
          ) : filteredCages.length === 0 && searchQuery ? (
            <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
              <Search className="w-8 h-8 text-muted/20 mx-auto mb-3" />
              <p className="text-sm text-muted/60">No cages match "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCages.map((cage) => (
                <CageCard
                  key={cage.id}
                  cage={cage}
                  onEdit={() => handleEditCage(cage)}
                  onDelete={() => handleDeleteCage(cage.id)}
                  bulkMode={bulkMode}
                  selectedPigs={selectedPigs}
                  onToggleSelect={togglePigSelection}
                />
              ))}
            </div>
          )}
        </>
      ) : activeTab === 'sheet' ? (
        <MonitoringSheetTab />
      ) : (
        <SortingTab />
      )}

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
    <ToastProvider>
      <MonitoringProvider>
        <MonitoringApp />
      </MonitoringProvider>
    </ToastProvider>
  )
}

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
  ArrowUpDown,
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
      await updateAnimalCage(tagId, cageId)
      setPigs((prev) =>
        prev.map((p) => (p.tagId === tagId ? { ...p, cageId } : p))
      )
    } catch (error) {
      console.error('Error moving pig:', error)
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
    <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ScanBarcode className="w-5 h-5 text-success" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Tag Scanner</h3>
        <span className="text-xs text-muted ml-1">— scan or type a tag ID to retrieve pig weight</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          ref={inputRef}
          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success font-mono"
          placeholder="e.g. TAG-2026-003"
          value={input}
          onChange={(e) => { setInput(e.target.value); setResult(null) }}
          onKeyDown={handleKeyDown}
        />
        <button
          className="px-5 py-2.5 bg-success text-white rounded-lg text-sm font-semibold hover:bg-success/90 transition-colors flex items-center gap-2"
          onClick={handleScan}
        >
          <ScanBarcode className="w-4 h-4" /> Scan
        </button>
        {result !== null && (
          <button
            className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors"
            onClick={handleClear}
          >
            Clear
          </button>
        )}
      </div>

      {/* Result */}
      {result === 'not-found' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Tag not found</p>
            <p className="text-xs text-red-500">No pig registered under <span className="font-mono">{input}</span>. Check the tag ID and try again.</p>
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
  const { movePig, cages } = useMonitoring()
  const [open, setOpen] = useState(false)

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
            {cages.filter((c) => c.id !== pig.cageId && c.isActive).map((c) => (
              <button
                key={c.id}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-background text-foreground"
                onClick={() => { movePig(pig.tagId, c.id); setOpen(false) }}
              >
                <MoveRight className="w-3 h-3" /> {c.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Pig Row (inside cage card) ───────────────────────────────────────────────

const PigRow = ({ pig, rank }: { pig: Pig; rank: number }) => (
  <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-background/60 transition-colors group">
    {/* rank */}
    <span className="w-5 text-center text-xs font-bold text-muted shrink-0">{rank}</span>

    {/* tag */}
    <span className="font-mono text-xs font-semibold text-foreground shrink-0 w-28 truncate">
      {pig.tagId}
    </span>

    {/* weight highlight */}
    <span className="text-sm font-bold text-foreground w-16 shrink-0">
      {pig.weight} <span className="text-xs font-normal text-muted">kg</span>
    </span>

    {/* breed */}
    <span className="text-xs text-muted flex-1 truncate hidden sm:block">{pig.breed}</span>

    {/* badges */}
    <div className="flex items-center gap-1 shrink-0">
      <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', SEX_STYLES[pig.sex])}>
        {pig.sex[0]}
      </span>
      <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', getStatusStyle(pig.status))}>
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
  const occupancyColor = occupancyPercent >= 100 ? 'text-red-600' : occupancyPercent >= 80 ? 'text-orange-600' : 'text-green-600'

  return (
    <div className="rounded-2xl border-2 border-border bg-surface p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <PiggyBank className="w-4 h-4 text-success" />
            <h3 className="text-base font-bold text-foreground">{cage.label}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700">
              {pigs.length}/{cage.maxCapacity}
            </span>
            {!cage.isActive && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                Inactive
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">
            Capacity: <span className={cn('font-semibold', occupancyColor)}>{occupancyPercent.toFixed(0)}%</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className="text-right shrink-0 mr-2">
            <p className="text-xs text-muted">Avg weight</p>
            <p className="text-lg font-bold text-success">{avgWeight}<span className="text-xs font-normal text-muted"> kg</span></p>
          </div>
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-background text-muted hover:text-foreground transition-colors"
            title="Edit cage"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-background text-muted hover:text-red-600 transition-colors"
            title="Delete cage"
            disabled={pigs.length > 0}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Column headers */}
      {pigs.length > 0 && (
        <div className="flex items-center gap-3 px-3 pb-1 border-b border-border">
          <span className="w-5 text-xs text-muted shrink-0">#</span>
          <span className="text-xs text-muted shrink-0 w-28">Tag ID</span>
          <span className="text-xs text-muted w-16 shrink-0">
            Weight {sortDir === 'asc' ? '↑' : '↓'}
          </span>
          <span className="text-xs text-muted flex-1 hidden sm:block">Breed</span>
          <span className="text-xs text-muted shrink-0 w-16">Info</span>
        </div>
      )}

      {/* Pig list */}
      <div className="flex flex-col gap-0.5">
        {pigs.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">No pigs assigned to this cage.</p>
        ) : (
          pigs.map((p, i) => <PigRow key={p.id} pig={p} rank={i + 1} />)
        )}
      </div>

      {/* Footer totals */}
      {pigs.length > 0 && (
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-border text-xs text-muted">
          <span>Total pigs: <strong className="font-bold text-foreground">{pigs.length}</strong></span>
          <span>Total weight: <strong className="font-bold text-foreground">{totalWeight} kg</strong></span>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const MonitoringApp = () => {
  const { pigs, cages, sortDir, setSortDir, addCage, editCage, removeCage, isLoading } = useMonitoring()
  
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

      {/* Tag Scanner */}
      <TagScanner />

      {/* Controls bar */}
      <ActionsBar>
        {/* Sort direction toggle */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
          <span className="pl-2 pr-1 text-xs font-semibold text-muted flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort by weight
          </span>
          <button
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
              sortDir === 'asc'
                ? 'bg-success text-white shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-background'
            )}
            onClick={() => setSortDir('asc')}
          >
            <ArrowUp className="w-3.5 h-3.5" /> Ascending
          </button>
          <button
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
              sortDir === 'desc'
                ? 'bg-success text-white shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-background'
            )}
            onClick={() => setSortDir('desc')}
          >
            <ArrowDown className="w-3.5 h-3.5" /> Descending
          </button>
        </div>

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

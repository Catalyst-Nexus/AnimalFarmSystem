import { createContext, useContext, useState, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  IconButton,
} from '@/components/ui'
import {
  Activity,
  ScanBarcode,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Shuffle,
  Weight,
  PiggyBank,
  Layers,
  MoveRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type PigStatus = 'Active' | 'Sick' | 'Deceased' | 'Sold'
type PigRole  = 'Parent' | 'Child'
type SortDir  = 'asc' | 'desc'

interface Pig {
  id: string
  tagId: string
  breed: string
  sex: 'Male' | 'Female'
  weight: number        // kg
  status: PigStatus
  pigRole?: PigRole
  parentTagId?: string
  dateOfBirth: string
  cageId: string        // current cage assignment
}

interface Cage {
  id: string
  label: string
  description: string
  /** inclusive minimum weight in kg (0 = no lower bound) */
  minKg: number
  /** inclusive maximum weight in kg (Infinity = no upper bound) */
  maxKg: number
  color: string        // tailwind accent classes
  bgColor: string
  borderColor: string
}

// ─── Cage Definitions (weight-based tiers) ───────────────────────────────────

const CAGES: Cage[] = [
  {
    id: 'PEN-A',
    label: 'Pen A',
    description: 'Breeders / Heavy (≥ 150 kg)',
    minKg: 150,
    maxKg: Infinity,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'PEN-B',
    label: 'Pen B',
    description: 'Growers / Medium (80 – 149 kg)',
    minKg: 80,
    maxKg: 149,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'PEN-C',
    label: 'Pen C',
    description: 'Finishers / Light (50 – 79 kg)',
    minKg: 50,
    maxKg: 79,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    id: 'PEN-D',
    label: 'Pen D',
    description: 'Nursery / Starter (< 50 kg)',
    minKg: 0,
    maxKg: 49,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
]

/** Resolve the correct cage for a pig based on its weight */
const cageForWeight = (weight: number): string => {
  const cage = CAGES.find((c) => weight >= c.minKg && weight <= c.maxKg)
  return cage?.id ?? 'PEN-D'
}

// ─── Static Pig Data (mirrors AnimalTagging registry) ────────────────────────

const PIGS_DATA: Pig[] = [
  {
    id: '1',
    tagId: 'TAG-2026-001',
    breed: 'Large White',
    sex: 'Male',
    weight: 230,
    status: 'Active',
    pigRole: 'Parent',
    dateOfBirth: '2021-04-15',
    cageId: 'PEN-A',
  },
  {
    id: '2',
    tagId: 'TAG-2026-002',
    breed: 'Landrace',
    sex: 'Female',
    weight: 185,
    status: 'Active',
    pigRole: 'Parent',
    dateOfBirth: '2022-06-20',
    cageId: 'PEN-A',
  },
  {
    id: '3',
    tagId: 'TAG-2026-003',
    breed: 'Large White x Landrace',
    sex: 'Male',
    weight: 72,
    status: 'Active',
    pigRole: 'Child',
    parentTagId: 'TAG-2026-001',
    dateOfBirth: '2025-02-10',
    cageId: 'PEN-C',
  },
  {
    id: '4',
    tagId: 'TAG-2026-004',
    breed: 'Large White x Landrace',
    sex: 'Female',
    weight: 68,
    status: 'Active',
    pigRole: 'Child',
    parentTagId: 'TAG-2026-001',
    dateOfBirth: '2025-02-10',
    cageId: 'PEN-C',
  },
  {
    id: '5',
    tagId: 'TAG-2026-005',
    breed: 'Duroc',
    sex: 'Male',
    weight: 198,
    status: 'Sick',
    pigRole: 'Parent',
    dateOfBirth: '2023-08-05',
    cageId: 'PEN-A',
  },
  {
    id: '6',
    tagId: 'TAG-2026-006',
    breed: 'Duroc x Landrace',
    sex: 'Female',
    weight: 55,
    status: 'Active',
    pigRole: 'Child',
    parentTagId: 'TAG-2026-005',
    dateOfBirth: '2025-05-18',
    cageId: 'PEN-C',
  },
  {
    id: '7',
    tagId: 'TAG-2026-007',
    breed: 'Berkshire',
    sex: 'Male',
    weight: 110,
    status: 'Sold',
    pigRole: 'Child',
    parentTagId: 'TAG-2026-002',
    dateOfBirth: '2024-11-30',
    cageId: 'PEN-B',
  },
  {
    id: '8',
    tagId: 'TAG-2026-008',
    breed: 'Hampshire',
    sex: 'Female',
    weight: 60,
    status: 'Active',
    pigRole: 'Child',
    parentTagId: 'TAG-2026-002',
    dateOfBirth: '2025-01-22',
    cageId: 'PEN-C',
  },
  {
    id: '9',
    tagId: 'TAG-2026-009',
    breed: 'Yorkshire',
    sex: 'Female',
    weight: 175,
    status: 'Active',
    pigRole: 'Parent',
    dateOfBirth: '2022-03-14',
    cageId: 'PEN-A',
  },
]

// ─── Context ──────────────────────────────────────────────────────────────────

interface MonitoringContextType {
  pigs: Pig[]
  sortDir: SortDir
  setSortDir: (d: SortDir) => void
  autoSort: () => void
  movePig: (tagId: string, cageId: string) => void
  scanTag: (tagId: string) => Pig | null
  pigsInCage: (cageId: string) => Pig[]
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined)

const MonitoringProvider = ({ children }: { children: ReactNode }) => {
  const [pigs, setPigs] = useState<Pig[]>(PIGS_DATA)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const pigsInCage = (cageId: string): Pig[] => {
    const list = pigs.filter((p) => p.cageId === cageId)
    return [...list].sort((a, b) =>
      sortDir === 'asc' ? a.weight - b.weight : b.weight - a.weight
    )
  }

  /** Reassign every pig to the cage that matches its weight tier */
  const autoSort = () => {
    setPigs((prev) =>
      prev.map((p) => ({ ...p, cageId: cageForWeight(p.weight) }))
    )
  }

  /** Manually move a pig to a different cage */
  const movePig = (tagId: string, cageId: string) => {
    setPigs((prev) =>
      prev.map((p) => (p.tagId === tagId ? { ...p, cageId } : p))
    )
  }

  /** Simulate tag scan — returns the pig matching the tag or null */
  const scanTag = (tagId: string): Pig | null =>
    pigs.find((p) => p.tagId.toLowerCase() === tagId.trim().toLowerCase()) ?? null

  return (
    <MonitoringContext.Provider value={{ pigs, sortDir, setSortDir, autoSort, movePig, scanTag, pigsInCage }}>
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

const STATUS_STYLES: Record<PigStatus, string> = {
  Active:   'bg-green-100 text-green-700',
  Sick:     'bg-orange-100 text-orange-700',
  Deceased: 'bg-red-100 text-red-600',
  Sold:     'bg-blue-100 text-blue-700',
}

const SEX_STYLES = {
  Male:   'bg-blue-50 text-blue-600',
  Female: 'bg-pink-50 text-pink-600',
}

// ─── Tag Scanner Panel ────────────────────────────────────────────────────────

const TagScanner = () => {
  const { scanTag } = useMonitoring()
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
    ? CAGES.find((c) => c.id === result.cageId)
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
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[result.status])}>{result.status}</span>
              </span>
            </div>
            {cage && (
              <p className="mt-1 text-xs text-muted">
                Currently in <strong className={cage.color}>{cage.label}</strong> — {cage.description}
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
  const { movePig } = useMonitoring()
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
            {CAGES.filter((c) => c.id !== pig.cageId).map((c) => (
              <button
                key={c.id}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-background',
                  c.color
                )}
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
      <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[pig.status])}>
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

const CageCard = ({ cage }: { cage: Cage }) => {
  const { pigsInCage, sortDir } = useMonitoring()
  const pigs = pigsInCage(cage.id)
  const totalWeight = pigs.reduce((s, p) => s + p.weight, 0)
  const avgWeight = pigs.length ? (totalWeight / pigs.length).toFixed(1) : '—'

  return (
    <div className={cn('rounded-2xl border-2 p-5 flex flex-col gap-3', cage.bgColor, cage.borderColor)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <PiggyBank className={cn('w-4 h-4', cage.color)} />
            <h3 className={cn('text-base font-bold', cage.color)}>{cage.label}</h3>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 border', cage.borderColor, cage.color)}>
              {pigs.length} pigs
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">{cage.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted">Avg weight</p>
          <p className={cn('text-lg font-bold', cage.color)}>{avgWeight}<span className="text-xs font-normal text-muted"> kg</span></p>
        </div>
      </div>

      {/* Column headers */}
      {pigs.length > 0 && (
        <div className="flex items-center gap-3 px-3 pb-1 border-b border-white/50">
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
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/50 text-xs text-muted">
          <span>Total pigs: <strong className={cn('font-bold', cage.color)}>{pigs.length}</strong></span>
          <span>Total weight: <strong className={cn('font-bold', cage.color)}>{totalWeight} kg</strong></span>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const MonitoringApp = () => {
  const { pigs, sortDir, setSortDir, autoSort } = useMonitoring()
  const [autoSorted, setAutoSorted] = useState(false)

  const stats = useMemo(() => {
    const active = pigs.filter((p) => p.status === 'Active').length
    const sick   = pigs.filter((p) => p.status === 'Sick').length
    const weights = pigs.map((p) => p.weight)
    return {
      total:   pigs.length,
      active,
      sick,
      heaviest: weights.length ? Math.max(...weights) : 0,
      lightest: weights.length ? Math.min(...weights) : 0,
    }
  }, [pigs])

  const handleAutoSort = () => {
    autoSort()
    setAutoSorted(true)
    setTimeout(() => setAutoSorted(false), 2500)
  }

  return (
    <div>
      <PageHeader
        title="Animal Monitoring"
        subtitle="Track pigs per cage, scan tags, and auto-sort by weight."
        icon={<Activity className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Pigs" value={stats.total} color="default" />
        <StatCard label="Active" value={stats.active} color="success" />
        <StatCard label="Sick" value={stats.sick} color="warning" />
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

        {/* Auto-sort button */}
        <PrimaryButton onClick={handleAutoSort}>
          <Shuffle className="w-4 h-4" />
          {autoSorted ? 'Sorted!' : 'Auto-Sort by Weight'}
        </PrimaryButton>
      </ActionsBar>

      {/* Auto-sort notice */}
      {autoSorted && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          All pigs have been reassigned to their weight-appropriate cage.
        </div>
      )}

      {/* Weight tier legend */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CAGES.map((c) => (
          <div key={c.id} className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium', c.bgColor, c.borderColor, c.color)}>
            <Layers className="w-3 h-3" />
            {c.label}: {c.minKg === 0 ? `< ${c.maxKg + 1}` : c.maxKg === Infinity ? `≥ ${c.minKg}` : `${c.minKg}–${c.maxKg}`} kg
          </div>
        ))}
      </div>

      {/* Cage grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {CAGES.map((cage) => (
          <CageCard key={cage.id} cage={cage} />
        ))}
      </div>
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

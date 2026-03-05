import { createContext, useContext, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
  IconButton,
} from '@/components/ui'
import { UtensilsCrossed, Plus, Pencil, Trash2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedType = 'Pellets' | 'Grains' | 'Hay' | 'Silage' | 'Mash' | 'Concentrate' | 'Vegetables' | 'Mixed'
type MealTime = 'Morning' | 'Afternoon' | 'Evening'
type FeedStatus = 'Fed' | 'Pending' | 'Skipped'

interface FeedingRecord {
  id: string
  /** References the animal's tag ID from Animal Tagging */
  animalTagId: string
  feedType: FeedType
  /** Weight in kilograms */
  amountKg: number
  mealTime: MealTime
  feedingDate: string
  staffName: string
  status: FeedStatus
  notes?: string
}

interface FeedingFormValues {
  animalTagId: string
  feedType: FeedType
  amountKg: string
  mealTime: MealTime
  feedingDate: string
  staffName: string
  status: FeedStatus
  notes: string
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const FEEDING_DATA: FeedingRecord[] = [
  {
    id: '1',
    animalTagId: 'TAG-2026-001',
    feedType: 'Concentrate',
    amountKg: 4.0,
    mealTime: 'Morning',
    feedingDate: '2026-03-05',
    staffName: 'Juan dela Cruz',
    status: 'Fed',
    notes: 'Mixed with water. Boar ration.',
  },
  {
    id: '2',
    animalTagId: 'TAG-2026-002',
    feedType: 'Pellets',
    amountKg: 3.5,
    mealTime: 'Morning',
    feedingDate: '2026-03-05',
    staffName: 'Juan dela Cruz',
    status: 'Fed',
    notes: 'Sow lactation pellets.',
  },
  {
    id: '3',
    animalTagId: 'TAG-2026-003',
    feedType: 'Mash',
    amountKg: 1.2,
    mealTime: 'Morning',
    feedingDate: '2026-03-05',
    staffName: 'Maria Santos',
    status: 'Fed',
  },
  {
    id: '4',
    animalTagId: 'TAG-2026-004',
    feedType: 'Mash',
    amountKg: 1.0,
    mealTime: 'Morning',
    feedingDate: '2026-03-05',
    staffName: 'Maria Santos',
    status: 'Fed',
  },
  {
    id: '5',
    animalTagId: 'TAG-2026-005',
    feedType: 'Pellets',
    amountKg: 3.0,
    mealTime: 'Morning',
    feedingDate: '2026-03-05',
    staffName: 'Pedro Reyes',
    status: 'Skipped',
    notes: 'Pig refused feed — under medication for fever.',
  },
  {
    id: '6',
    animalTagId: 'TAG-2026-006',
    feedType: 'Mash',
    amountKg: 0.8,
    mealTime: 'Morning',
    feedingDate: '2026-03-05',
    staffName: 'Pedro Reyes',
    status: 'Fed',
    notes: 'Starter mash for young pig.',
  },
  {
    id: '7',
    animalTagId: 'TAG-2026-001',
    feedType: 'Concentrate',
    amountKg: 4.0,
    mealTime: 'Afternoon',
    feedingDate: '2026-03-05',
    staffName: 'Juan dela Cruz',
    status: 'Pending',
    notes: 'Scheduled for 1:00 PM.',
  },
  {
    id: '8',
    animalTagId: 'TAG-2026-002',
    feedType: 'Pellets',
    amountKg: 3.5,
    mealTime: 'Afternoon',
    feedingDate: '2026-03-05',
    staffName: 'Maria Santos',
    status: 'Pending',
  },
  {
    id: '9',
    animalTagId: 'TAG-2026-009',
    feedType: 'Concentrate',
    amountKg: 3.2,
    mealTime: 'Morning',
    feedingDate: '2026-03-05',
    staffName: 'Pedro Reyes',
    status: 'Fed',
    notes: 'Post-farrowing high-energy feed.',
  },
  {
    id: '10',
    animalTagId: 'TAG-2026-008',
    feedType: 'Mash',
    amountKg: 1.0,
    mealTime: 'Morning',
    feedingDate: '2026-03-05',
    staffName: 'Maria Santos',
    status: 'Fed',
  },
  {
    id: '11',
    animalTagId: 'TAG-2026-001',
    feedType: 'Concentrate',
    amountKg: 4.0,
    mealTime: 'Evening',
    feedingDate: '2026-03-04',
    staffName: 'Juan dela Cruz',
    status: 'Fed',
  },
  {
    id: '12',
    animalTagId: 'TAG-2026-002',
    feedType: 'Pellets',
    amountKg: 3.5,
    mealTime: 'Evening',
    feedingDate: '2026-03-04',
    staffName: 'Pedro Reyes',
    status: 'Fed',
    notes: 'Extra ration — nursing piglets.',
  },
  {
    id: '13',
    animalTagId: 'TAG-2026-005',
    feedType: 'Mash',
    amountKg: 2.0,
    mealTime: 'Evening',
    feedingDate: '2026-03-04',
    staffName: 'Juan dela Cruz',
    status: 'Fed',
    notes: 'Soft mash during illness.',
  },
  {
    id: '14',
    animalTagId: 'TAG-2026-003',
    feedType: 'Mash',
    amountKg: 1.2,
    mealTime: 'Afternoon',
    feedingDate: '2026-03-05',
    staffName: 'Pedro Reyes',
    status: 'Pending',
  },
]

// ─── Context ──────────────────────────────────────────────────────────────────

interface FeedingContextType {
  records: FeedingRecord[]
  addRecord: (values: FeedingFormValues) => void
  updateRecord: (id: string, values: FeedingFormValues) => void
  deleteRecord: (id: string) => void
  changeStatus: (id: string, status: FeedStatus) => void
}

const FeedingContext = createContext<FeedingContextType | undefined>(undefined)

const FeedingProvider = ({ children }: { children: ReactNode }) => {
  const [records, setRecords] = useState<FeedingRecord[]>(FEEDING_DATA)

  const addRecord = (values: FeedingFormValues) => {
    const newRecord: FeedingRecord = {
      id: crypto.randomUUID(),
      animalTagId: values.animalTagId,
      feedType: values.feedType,
      amountKg: parseFloat(values.amountKg) || 0,
      mealTime: values.mealTime,
      feedingDate: values.feedingDate,
      staffName: values.staffName,
      status: values.status,
      notes: values.notes || undefined,
    }
    setRecords((prev) => [newRecord, ...prev])
  }

  const updateRecord = (id: string, values: FeedingFormValues) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              animalTagId: values.animalTagId,
              feedType: values.feedType,
              amountKg: parseFloat(values.amountKg) || r.amountKg,
              mealTime: values.mealTime,
              feedingDate: values.feedingDate,
              staffName: values.staffName,
              status: values.status,
              notes: values.notes || undefined,
            }
          : r
      )
    )
  }

  const deleteRecord = (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id))

  const changeStatus = (id: string, status: FeedStatus) =>
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))

  return (
    <FeedingContext.Provider value={{ records, addRecord, updateRecord, deleteRecord, changeStatus }}>
      {children}
    </FeedingContext.Provider>
  )
}

const useFeeding = () => {
  const ctx = useContext(FeedingContext)
  if (!ctx) throw new Error('useFeeding must be used inside FeedingProvider')
  return ctx
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FEED_TYPE_OPTIONS: FeedType[] = ['Pellets', 'Grains', 'Hay', 'Silage', 'Mash', 'Concentrate', 'Vegetables', 'Mixed']
const MEAL_TIME_OPTIONS: MealTime[] = ['Morning', 'Afternoon', 'Evening']
const STATUS_OPTIONS: FeedStatus[] = ['Fed', 'Pending', 'Skipped']
const TAB_FILTERS = ['All', 'Fed', 'Pending', 'Skipped'] as const
type TabFilter = (typeof TAB_FILTERS)[number]

const EMPTY_FORM: FeedingFormValues = {
  animalTagId: '',
  feedType: 'Pellets',
  amountKg: '',
  mealTime: 'Morning',
  feedingDate: new Date().toISOString().slice(0, 10),
  staffName: '',
  status: 'Pending',
  notes: '',
}

const STATUS_STYLES: Record<FeedStatus, string> = {
  Fed: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Skipped: 'bg-red-100 text-red-600',
}

const MEAL_TIME_STYLES: Record<MealTime, string> = {
  Morning: 'bg-orange-50 text-orange-600',
  Afternoon: 'bg-blue-50 text-blue-600',
  Evening: 'bg-indigo-50 text-indigo-600',
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: FeedStatus }) => (
  <span className={cn('inline-block px-2.5 py-0.5 text-xs font-medium rounded-full', STATUS_STYLES[status])}>
    {status}
  </span>
)

const MealTimeBadge = ({ mealTime }: { mealTime: MealTime }) => (
  <span className={cn('inline-block px-2.5 py-0.5 text-xs font-medium rounded-full', MEAL_TIME_STYLES[mealTime])}>
    {mealTime}
  </span>
)

// ─── Form Modal ───────────────────────────────────────────────────────────────

const FIELD = 'w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success'
const LABEL = 'block text-xs font-semibold text-muted uppercase tracking-wide mb-1'

const RecordModal = ({
  editing,
  onClose,
}: {
  editing: FeedingRecord | null
  onClose: () => void
}) => {
  const { addRecord, updateRecord } = useFeeding()
  const [form, setForm] = useState<FeedingFormValues>(
    editing
      ? {
          animalTagId: editing.animalTagId,
          feedType: editing.feedType,
          amountKg: String(editing.amountKg),
          mealTime: editing.mealTime,
          feedingDate: editing.feedingDate,
          staffName: editing.staffName,
          status: editing.status,
          notes: editing.notes ?? '',
        }
      : EMPTY_FORM
  )

  const set = (key: keyof FeedingFormValues, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = () => {
    if (
      !form.animalTagId.trim() ||
      !form.amountKg ||
      !form.feedingDate ||
      !form.staffName.trim()
    ) {
      alert('Please fill in all required fields.')
      return
    }
    if (editing) {
      updateRecord(editing.id, form)
    } else {
      addRecord(form)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-success" />
            {editing ? 'Edit Feeding Record' : 'Log Feeding'}
          </h2>
          <button className="p-1.5 rounded hover:bg-background text-muted transition-colors" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Animal Tag ID */}
          <div>
            <label className={LABEL}>Animal Tag ID <span className="text-red-500">*</span></label>
            <input className={FIELD} placeholder="e.g. TAG-2026-002" value={form.animalTagId} onChange={(e) => set('animalTagId', e.target.value)} />
          </div>


          {/* Feed Type */}
          <div>
            <label className={LABEL}>Feed Type</label>
            <select className={FIELD} value={form.feedType} onChange={(e) => set('feedType', e.target.value as FeedType)}>
              {FEED_TYPE_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className={LABEL}>Amount (kg) <span className="text-red-500">*</span></label>
            <input type="number" min="0" step="0.1" className={FIELD} placeholder="e.g. 3.5" value={form.amountKg} onChange={(e) => set('amountKg', e.target.value)} />
          </div>

          {/* Meal Time */}
          <div>
            <label className={LABEL}>Meal Time</label>
            <select className={FIELD} value={form.mealTime} onChange={(e) => set('mealTime', e.target.value as MealTime)}>
              {MEAL_TIME_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Feeding Date */}
          <div>
            <label className={LABEL}>Feeding Date <span className="text-red-500">*</span></label>
            <input type="date" className={FIELD} value={form.feedingDate} onChange={(e) => set('feedingDate', e.target.value)} />
          </div>

          {/* Staff Name */}
          <div>
            <label className={LABEL}>Staff Name <span className="text-red-500">*</span></label>
            <input className={FIELD} placeholder="e.g. Juan dela Cruz" value={form.staffName} onChange={(e) => set('staffName', e.target.value)} />
          </div>

          {/* Status */}
          <div>
            <label className={LABEL}>Status</label>
            <select className={FIELD} value={form.status} onChange={(e) => set('status', e.target.value as FeedStatus)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label className={LABEL}>Notes</label>
            <textarea className={cn(FIELD, 'resize-none')} rows={3} placeholder="Optional remarks..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors" onClick={onClose}>
            Cancel
          </button>
          <button className="flex-1 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors" onClick={handleSubmit}>
            {editing ? 'Save Changes' : 'Log Feeding'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({
  record,
  onConfirm,
  onClose,
}: {
  record: FeedingRecord
  onConfirm: () => void
  onClose: () => void
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h2 className="text-lg font-bold text-primary mb-2">Delete Record?</h2>
      <p className="text-sm text-muted mb-5">
        Remove the <strong>{record.mealTime}</strong> feeding record for{' '}
        <strong>{record.animalTagId}</strong> on <strong>{record.feedingDate}</strong>? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors" onClick={onClose}>
          Cancel
        </button>
        <button className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors" onClick={onConfirm}>
          Delete
        </button>
      </div>
    </div>
  </div>
)

// ─── Quick Status Toggle ──────────────────────────────────────────────────────

const QuickStatusToggle = ({ record }: { record: FeedingRecord }) => {
  const { changeStatus } = useFeeding()
  const next: Record<FeedStatus, FeedStatus> = { Pending: 'Fed', Fed: 'Pending', Skipped: 'Fed' }
  return (
    <button
      title={`Mark as ${next[record.status]}`}
      onClick={() => changeStatus(record.id, next[record.status])}
      className={cn(
        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
        record.status === 'Fed'
          ? 'bg-green-500 border-green-500 text-white'
          : record.status === 'Skipped'
          ? 'bg-red-400 border-red-400 text-white'
          : 'border-border bg-background hover:border-green-400'
      )}
    >
      {record.status === 'Fed' && (
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const FeedingApp = () => {
  const { records, deleteRecord } = useFeeding()
  const [activeTab, setActiveTab] = useState<TabFilter>('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<FeedingRecord | null>(null)
  const [deleting, setDeleting] = useState<FeedingRecord | null>(null)

  const filtered = useMemo(() => {
    let list = records
    if (activeTab !== 'All') list = list.filter((r) => r.status === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.animalTagId.toLowerCase().includes(q) ||
          r.feedType.toLowerCase().includes(q) ||
          r.staffName.toLowerCase().includes(q)
      )
    }
    return list
  }, [records, activeTab, search])

  const counts = useMemo(
    () => ({
      total: records.length,
      fed: records.filter((r) => r.status === 'Fed').length,
      pending: records.filter((r) => r.status === 'Pending').length,
      skipped: records.filter((r) => r.status === 'Skipped').length,
    }),
    [records]
  )

  const totalKgToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return records
      .filter((r) => r.feedingDate === today && r.status === 'Fed')
      .reduce((sum, r) => sum + r.amountKg, 0)
      .toFixed(1)
  }, [records])

  const columns = [
    {
      key: 'status' as const,
      header: '',
      className: 'w-10',
      render: (r: FeedingRecord) => <QuickStatusToggle record={r} />,
    },
    {
      key: 'animalTagId' as const,
      header: 'Animal',
      render: (r: FeedingRecord) => (
        <span className="text-sm font-mono font-semibold text-foreground">{r.animalTagId}</span>
      ),
    },
    {
      key: 'feedType' as const,
      header: 'Feed Type',
      render: (r: FeedingRecord) => <span className="text-sm font-medium text-foreground">{r.feedType}</span>,
    },
    {
      key: 'amountKg' as const,
      header: 'Amount',
      render: (r: FeedingRecord) => (
        <span className="text-sm font-semibold text-foreground">{r.amountKg} <span className="font-normal text-muted">kg</span></span>
      ),
    },
    {
      key: 'mealTime' as const,
      header: 'Meal Time',
      render: (r: FeedingRecord) => <MealTimeBadge mealTime={r.mealTime} />,
    },
    {
      key: 'feedingDate' as const,
      header: 'Date',
      render: (r: FeedingRecord) => <span className="text-sm">{r.feedingDate}</span>,
    },
    {
      key: 'staffName' as const,
      header: 'Staff',
      render: (r: FeedingRecord) => <span className="text-sm text-muted">{r.staffName}</span>,
    },
    {
      key: 'notes' as const,
      header: 'Notes',
      render: (r: FeedingRecord) =>
        r.notes ? (
          <span className="text-xs text-muted max-w-[160px] truncate block" title={r.notes}>{r.notes}</span>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      key: 'actions' as const,
      header: 'Status / Actions',
      render: (r: FeedingRecord) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={r.status} />
          <IconButton onClick={() => { setEditing(r); setShowModal(true) }} title="Edit">
            <Pencil className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => setDeleting(r)} title="Delete" variant="danger">
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Feeding Management"
        subtitle="Track daily feed logs for all animals — what, how much, and who fed them."
        icon={<UtensilsCrossed className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Records" value={counts.total} color="default" />
        <StatCard label="Fed" value={counts.fed} color="success" />
        <StatCard label="Pending" value={counts.pending} color="warning" />
        <StatCard label="Skipped" value={counts.skipped} color="danger" />
      </StatsRow>

      {/* Today summary strip */}
      <div className="flex items-center gap-6 mb-5 px-5 py-3 bg-surface border border-border rounded-xl text-sm">
        <span className="text-muted font-medium">Today's Summary</span>
        <span className="text-foreground font-semibold">{totalKgToday} kg <span className="font-normal text-muted">total fed today</span></span>
        <span className="text-foreground font-semibold">{counts.pending} <span className="font-normal text-muted">pending feedings</span></span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-background rounded-lg mb-4 w-fit">
        {TAB_FILTERS.map((tab) => (
          <button
            key={tab}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === tab ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span className={cn('ml-1.5 px-1.5 py-0.5 text-xs rounded-full', activeTab === tab ? 'bg-success/10 text-success' : 'bg-background text-muted')}>
              {tab === 'All' ? records.length : records.filter((r) => r.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      <ActionsBar>
        <PrimaryButton onClick={() => { setEditing(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" /> Log Feeding
        </PrimaryButton>
      </ActionsBar>

      <DataTable
        data={filtered}
        columns={columns}
        emptyMessage="No feeding records found."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by tag, feed type, staff..."
        title="Feeding Records"
        titleIcon={<UtensilsCrossed className="w-5 h-5" />}
        keyField="id"
      />

      {showModal && (
        <RecordModal
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <DeleteModal
          record={deleting}
          onConfirm={() => { deleteRecord(deleting.id); setDeleting(null) }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function Feeding() {
  return (
    <FeedingProvider>
      <FeedingApp />
    </FeedingProvider>
  )
}

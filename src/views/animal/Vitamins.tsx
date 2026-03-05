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
import { Syringe, Plus, Pencil, Trash2, FlaskConical, CalendarCheck } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminType = 'Vitamin' | 'Injection' | 'Supplement'
type RecordStatus = 'Completed' | 'Upcoming' | 'Overdue'

interface VitaminRecord {
  id: string
  /** References the pig's tag ID from Animal Tagging */
  animalTagId: string
  adminType: AdminType
  /** e.g. "Vitamin A", "Iron Dextran", "Ivermectin" */
  product: string
  dosage: string
  dateGiven: string
  administeredBy: string
  /** Optional — date of next scheduled dose */
  nextDueDate?: string
  status: RecordStatus
  notes?: string
}

interface VitaminFormValues {
  animalTagId: string
  adminType: AdminType
  product: string
  dosage: string
  dateGiven: string
  administeredBy: string
  nextDueDate: string
  status: RecordStatus
  notes: string
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const VITAMINS_DATA: VitaminRecord[] = [
  {
    id: '1',
    animalTagId: 'TAG-2026-001',
    adminType: 'Injection',
    product: 'Iron Dextran',
    dosage: '2 ml',
    dateGiven: '2026-01-10',
    administeredBy: 'Dr. Santos',
    nextDueDate: '2026-04-10',
    status: 'Completed',
    notes: 'Routine iron injection for the breeding boar.',
  },
  {
    id: '2',
    animalTagId: 'TAG-2026-002',
    adminType: 'Vitamin',
    product: 'Vitamin E & Selenium',
    dosage: '2 ml',
    dateGiven: '2026-01-20',
    administeredBy: 'Dr. Santos',
    nextDueDate: '2026-04-20',
    status: 'Completed',
    notes: 'Pre-farrowing supplement for breeding sow.',
  },
  {
    id: '3',
    animalTagId: 'TAG-2026-003',
    adminType: 'Vitamin',
    product: 'Vitamin A & D',
    dosage: '1 ml',
    dateGiven: '2026-01-22',
    administeredBy: 'Farm Staff',
    nextDueDate: '2026-03-22',
    status: 'Overdue',
    notes: 'Piglet vitamin supplement. Next dose overdue.',
  },
  {
    id: '4',
    animalTagId: 'TAG-2026-004',
    adminType: 'Vitamin',
    product: 'Vitamin A & D',
    dosage: '1 ml',
    dateGiven: '2026-01-22',
    administeredBy: 'Farm Staff',
    nextDueDate: '2026-03-22',
    status: 'Overdue',
    notes: 'Same batch as Chico — littermate.',
  },
  {
    id: '5',
    animalTagId: 'TAG-2026-001',
    adminType: 'Injection',
    product: 'Ivermectin (Dewormer)',
    dosage: '2 ml',
    dateGiven: '2026-02-01',
    administeredBy: 'Dr. Santos',
    nextDueDate: '2026-05-01',
    status: 'Completed',
    notes: 'Quarterly anti-parasitic deworming.',
  },
  {
    id: '6',
    animalTagId: 'TAG-2026-002',
    adminType: 'Supplement',
    product: 'B-Complex Supplement',
    dosage: '5 ml (oral)',
    dateGiven: '2026-02-15',
    administeredBy: 'Farm Staff',
    nextDueDate: '2026-03-15',
    status: 'Upcoming',
    notes: 'Dissolved in drinking water.',
  },
  {
    id: '7',
    animalTagId: 'TAG-2026-005',
    adminType: 'Injection',
    product: 'Amoxicillin Antibiotic',
    dosage: '3 ml',
    dateGiven: '2026-03-03',
    administeredBy: 'Dr. Santos',
    nextDueDate: '2026-03-06',
    status: 'Upcoming',
    notes: 'Treatment for mild fever. 3-day course.',
  },
  {
    id: '8',
    animalTagId: 'TAG-2026-006',
    adminType: 'Vitamin',
    product: 'Vitamin C',
    dosage: '0.5 ml',
    dateGiven: '2026-02-20',
    administeredBy: 'Farm Staff',
    status: 'Completed',
    notes: 'Immunity booster for young pig.',
  },
  {
    id: '9',
    animalTagId: 'TAG-2026-009',
    adminType: 'Injection',
    product: 'Oxytocin',
    dosage: '1 ml',
    dateGiven: '2026-03-04',
    administeredBy: 'Dr. Santos',
    status: 'Completed',
    notes: 'Post-farrowing administration.',
  },
]

// ─── Context ──────────────────────────────────────────────────────────────────

interface VitaminsContextType {
  records: VitaminRecord[]
  addRecord: (values: VitaminFormValues) => void
  updateRecord: (id: string, values: VitaminFormValues) => void
  deleteRecord: (id: string) => void
  changeStatus: (id: string, status: RecordStatus) => void
}

const VitaminsContext = createContext<VitaminsContextType | undefined>(undefined)

const VitaminsProvider = ({ children }: { children: ReactNode }) => {
  const [records, setRecords] = useState<VitaminRecord[]>(VITAMINS_DATA)

  const addRecord = (values: VitaminFormValues) => {
    const newRecord: VitaminRecord = {
      id: crypto.randomUUID(),
      animalTagId: values.animalTagId,
      adminType: values.adminType,
      product: values.product,
      dosage: values.dosage,
      dateGiven: values.dateGiven,
      administeredBy: values.administeredBy,
      nextDueDate: values.nextDueDate || undefined,
      status: values.status,
      notes: values.notes || undefined,
    }
    setRecords((prev) => [newRecord, ...prev])
  }

  const updateRecord = (id: string, values: VitaminFormValues) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              animalTagId: values.animalTagId,
              adminType: values.adminType,
              product: values.product,
              dosage: values.dosage,
              dateGiven: values.dateGiven,
              administeredBy: values.administeredBy,
              nextDueDate: values.nextDueDate || undefined,
              status: values.status,
              notes: values.notes || undefined,
            }
          : r
      )
    )
  }

  const deleteRecord = (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id))

  const changeStatus = (id: string, status: RecordStatus) =>
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))

  return (
    <VitaminsContext.Provider value={{ records, addRecord, updateRecord, deleteRecord, changeStatus }}>
      {children}
    </VitaminsContext.Provider>
  )
}

const useVitamins = () => {
  const ctx = useContext(VitaminsContext)
  if (!ctx) throw new Error('useVitamins must be used inside VitaminsProvider')
  return ctx
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_TYPE_OPTIONS: AdminType[] = ['Vitamin', 'Injection', 'Supplement']
const STATUS_OPTIONS: RecordStatus[] = ['Completed', 'Upcoming', 'Overdue']
const TAB_FILTERS = ['All', 'Completed', 'Upcoming', 'Overdue'] as const
type TabFilter = (typeof TAB_FILTERS)[number]

const EMPTY_FORM: VitaminFormValues = {
  animalTagId: '',
  adminType: 'Injection',
  product: '',
  dosage: '',
  dateGiven: '',
  administeredBy: '',
  nextDueDate: '',
  status: 'Completed',
  notes: '',
}

const STATUS_STYLES: Record<RecordStatus, string> = {
  Completed: 'bg-green-100 text-green-700',
  Upcoming: 'bg-blue-100 text-blue-700',
  Overdue: 'bg-red-100 text-red-600',
}

const ADMIN_TYPE_STYLES: Record<AdminType, string> = {
  Vitamin: 'bg-yellow-100 text-yellow-700',
  Injection: 'bg-purple-100 text-purple-700',
  Supplement: 'bg-teal-100 text-teal-700',
}

const ADMIN_TYPE_ICONS: Record<AdminType, ReactNode> = {
  Injection: <Syringe className="w-3.5 h-3.5" />,
  Vitamin: <FlaskConical className="w-3.5 h-3.5" />,
  Supplement: <CalendarCheck className="w-3.5 h-3.5" />,
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: RecordStatus }) => (
  <span className={cn('inline-block px-2.5 py-0.5 text-xs font-medium rounded-full', STATUS_STYLES[status])}>
    {status}
  </span>
)

const AdminTypeBadge = ({ type }: { type: AdminType }) => (
  <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full', ADMIN_TYPE_STYLES[type])}>
    {ADMIN_TYPE_ICONS[type]}
    {type}
  </span>
)

// ─── Form Modal ───────────────────────────────────────────────────────────────

const FIELD = 'w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success'
const LABEL = 'block text-xs font-semibold text-muted uppercase tracking-wide mb-1'

const RecordModal = ({
  editing,
  onClose,
}: {
  editing: VitaminRecord | null
  onClose: () => void
}) => {
  const { addRecord, updateRecord } = useVitamins()
  const [form, setForm] = useState<VitaminFormValues>(
    editing
      ? {
          animalTagId: editing.animalTagId,
          adminType: editing.adminType,
          product: editing.product,
          dosage: editing.dosage,
          dateGiven: editing.dateGiven,
          administeredBy: editing.administeredBy,
          nextDueDate: editing.nextDueDate ?? '',
          status: editing.status,
          notes: editing.notes ?? '',
        }
      : EMPTY_FORM
  )

  const set = (key: keyof VitaminFormValues, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = () => {
    if (
      !form.animalTagId.trim() ||
      !form.product.trim() ||
      !form.dosage.trim() ||
      !form.dateGiven ||
      !form.administeredBy.trim()
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
            <Syringe className="w-5 h-5 text-success" />
            {editing ? 'Edit Record' : 'Add Vitamin / Injection'}
          </h2>
          <button className="p-1.5 rounded hover:bg-background text-muted transition-colors" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Animal Tag ID */}
          <div>
            <label className={LABEL}>Animal Tag ID <span className="text-red-500">*</span></label>
            <input
              className={FIELD}
              placeholder="e.g. TAG-2026-002"
              value={form.animalTagId}
              onChange={(e) => set('animalTagId', e.target.value)}
            />
          </div>


          {/* Type */}
          <div>
            <label className={LABEL}>Type</label>
            <select className={FIELD} value={form.adminType} onChange={(e) => set('adminType', e.target.value as AdminType)}>
              {ADMIN_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Product / Name */}
          <div>
            <label className={LABEL}>Product / Name <span className="text-red-500">*</span></label>
            <input
              className={FIELD}
              placeholder="e.g. Vitamin A, Iron Dextran"
              value={form.product}
              onChange={(e) => set('product', e.target.value)}
            />
          </div>

          {/* Dosage */}
          <div>
            <label className={LABEL}>Dosage <span className="text-red-500">*</span></label>
            <input
              className={FIELD}
              placeholder="e.g. 2 ml"
              value={form.dosage}
              onChange={(e) => set('dosage', e.target.value)}
            />
          </div>

          {/* Administered By */}
          <div>
            <label className={LABEL}>Administered By <span className="text-red-500">*</span></label>
            <input
              className={FIELD}
              placeholder="e.g. Dr. Santos"
              value={form.administeredBy}
              onChange={(e) => set('administeredBy', e.target.value)}
            />
          </div>

          {/* Date Given */}
          <div>
            <label className={LABEL}>Date Given <span className="text-red-500">*</span></label>
            <input type="date" className={FIELD} value={form.dateGiven} onChange={(e) => set('dateGiven', e.target.value)} />
          </div>

          {/* Next Due Date */}
          <div>
            <label className={LABEL}>Next Due Date</label>
            <input type="date" className={FIELD} value={form.nextDueDate} onChange={(e) => set('nextDueDate', e.target.value)} />
          </div>

          {/* Status */}
          <div className="col-span-2">
            <label className={LABEL}>Status</label>
            <select className={FIELD} value={form.status} onChange={(e) => set('status', e.target.value as RecordStatus)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label className={LABEL}>Notes</label>
            <textarea
              className={cn(FIELD, 'resize-none')}
              rows={3}
              placeholder="Optional remarks..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors" onClick={onClose}>
            Cancel
          </button>
          <button className="flex-1 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors" onClick={handleSubmit}>
            {editing ? 'Save Changes' : 'Add Record'}
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
  record: VitaminRecord
  onConfirm: () => void
  onClose: () => void
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h2 className="text-lg font-bold text-primary mb-2">Delete Record?</h2>
      <p className="text-sm text-muted mb-5">
        Remove <strong>{record.product}</strong> given to <strong>{record.animalTagId}</strong> on{' '}
        <strong>{record.dateGiven}</strong>? This cannot be undone.
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

// ─── Main App ─────────────────────────────────────────────────────────────────

const VitaminsApp = () => {
  const { records, deleteRecord } = useVitamins()
  const [activeTab, setActiveTab] = useState<TabFilter>('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<VitaminRecord | null>(null)
  const [deleting, setDeleting] = useState<VitaminRecord | null>(null)

  const filtered = useMemo(() => {
    let list = records
    if (activeTab !== 'All') list = list.filter((r) => r.status === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.animalTagId.toLowerCase().includes(q) ||
          r.product.toLowerCase().includes(q) ||
          r.adminType.toLowerCase().includes(q) ||
          r.administeredBy.toLowerCase().includes(q)
      )
    }
    return list
  }, [records, activeTab, search])

  const counts = useMemo(
    () => ({
      total: records.length,
      completed: records.filter((r) => r.status === 'Completed').length,
      upcoming: records.filter((r) => r.status === 'Upcoming').length,
      overdue: records.filter((r) => r.status === 'Overdue').length,
    }),
    [records]
  )

  const columns = [
    {
      key: 'animalTagId' as const,
      header: 'Animal',
      render: (r: VitaminRecord) => (
        <span className="text-sm font-mono font-semibold text-foreground">{r.animalTagId}</span>
      ),
    },
    {
      key: 'adminType' as const,
      header: 'Type',
      render: (r: VitaminRecord) => <AdminTypeBadge type={r.adminType} />,
    },
    {
      key: 'product' as const,
      header: 'Product / Vitamin',
      render: (r: VitaminRecord) => <span className="text-sm font-medium text-foreground">{r.product}</span>,
    },
    {
      key: 'dosage' as const,
      header: 'Dosage',
      render: (r: VitaminRecord) => <span className="text-sm text-muted">{r.dosage}</span>,
    },
    {
      key: 'dateGiven' as const,
      header: 'Date Given',
      render: (r: VitaminRecord) => <span className="text-sm">{r.dateGiven}</span>,
    },
    {
      key: 'nextDueDate' as const,
      header: 'Next Due',
      render: (r: VitaminRecord) =>
        r.nextDueDate ? (
          <span className="text-sm">{r.nextDueDate}</span>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      key: 'administeredBy' as const,
      header: 'Given By',
      render: (r: VitaminRecord) => <span className="text-sm text-muted">{r.administeredBy}</span>,
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (r: VitaminRecord) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions' as const,
      header: 'Actions',
      render: (r: VitaminRecord) => (
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => { setEditing(r); setShowModal(true) }}
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </IconButton>
          <IconButton
            onClick={() => setDeleting(r)}
            title="Delete"
            variant="danger"
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Vitamins & Injections"
        subtitle="Track all vitamins, injections, and supplements given to animals."
        icon={<Syringe className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Records" value={counts.total} color="default" />
        <StatCard label="Completed" value={counts.completed} color="success" />
        <StatCard label="Upcoming" value={counts.upcoming} color="warning" />
        <StatCard label="Overdue" value={counts.overdue} color="danger" />
      </StatsRow>

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
          <Plus className="w-4 h-4" /> Add Record
        </PrimaryButton>
      </ActionsBar>

      <DataTable
        data={filtered}
        columns={columns}
        emptyMessage="No records found."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by tag, product, type, given by..."
        title="Vitamin & Injection Records"
        titleIcon={<Syringe className="w-5 h-5" />}
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

export default function Vitamins() {
  return (
    <VitaminsProvider>
      <VitaminsApp />
    </VitaminsProvider>
  )
}

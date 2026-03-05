import { useEffect, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
} from '@/components/ui'
import { Tag, Plus, Pencil, Trash2, QrCode, MoreHorizontal, Loader2 } from 'lucide-react'
import { animalService, cageService } from '@/services/animalService'
import type { Animal as DBAnimal, Cage } from '@/services/animalService'

// ─── Types ────────────────────────────────────────────────────────────────────

type AnimalSex = 'Male' | 'Female'
type AnimalStatus = 'Active' | 'Sick' | 'Deceased' | 'Sold'

interface AnimalFormValues {
  id: string // Manual barcode ID created by user
  type: string // e.g., Pig, Cow, etc.
  sex: AnimalSex
  weight: string
  status: AnimalStatus
  current_cage_id: string
  mother_id: string // Optional parent animal ID
  father_id: string // Optional parent animal ID
}

// ─── Constants ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: AnimalStatus[] = ['Active', 'Sick', 'Deceased', 'Sold']
const TAB_FILTERS = ['All', 'Active', 'Sick', 'Sold', 'Deceased'] as const
type TabFilter = (typeof TAB_FILTERS)[number]

const EMPTY_FORM: AnimalFormValues = {
  id: '',
  type: '',
  sex: 'Male',
  weight: '',
  status: 'Active',
  current_cage_id: '',
  mother_id: '',
  father_id: '',
}

const STATUS_STYLES: Record<AnimalStatus, string> = {
  Active: 'bg-green-500 text-white',
  Sick: 'bg-orange-500 text-white',
  Deceased: 'bg-gray-700 text-white',
  Sold: 'bg-blue-500 text-white',
}

// ─── Old mock data removed ────────────────────────────────────────────────────
// Note: The old ANIMALS_DATA mock array and context-based implementation have been 
// replaced with direct Supabase integration via animalService

// ─── Sub-components

const AnimalStatusBadge = ({ status }: { status: AnimalStatus }) => {
  const icons: Record<AnimalStatus, string> = {
    Active: '✓',
    Sick: '⚠',
    Deceased: '✕',
    Sold: '→',
  }
  
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg shadow-sm', STATUS_STYLES[status])}>
      <span className="text-base">{icons[status]}</span>
      {status}
    </span>
  )
}

// Deterministic barcode visual generated from animal ID
const BarcodeVisual = ({ value }: { value: string }) => {
  const bars = useMemo(() => {
    let seed = value.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return Array.from({ length: 36 }, () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return { w: (seed % 3) + 1, isBlack: seed % 2 === 0 }
    })
  }, [value])

  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border-2 border-border">
      <div className="flex items-end gap-px" style={{ height: 64 }}>
        <div className="bg-black w-px" style={{ height: 64 }} />
        <div className="w-px" style={{ height: 64 }} />
        <div className="bg-black w-px" style={{ height: 64 }} />
        {bars.map((b, i) => (
          <div
            key={i}
            className={b.isBlack ? 'bg-black' : 'bg-transparent'}
            style={{ width: b.w, height: i % 5 === 0 ? 64 : 54 }}
          />
        ))}
        <div className="bg-black w-px" style={{ height: 64 }} />
        <div className="w-px" style={{ height: 64 }} />
        <div className="bg-black w-px" style={{ height: 64 }} />
      </div>
      <span className="font-mono text-sm font-bold tracking-widest text-gray-800">{value}</span>
    </div>
  )
}

// ─── Barcode Modal ────────────────────────────────────────────────────────────

const BarcodeModal = ({ animal, onClose }: { animal: DBAnimal; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <QrCode className="w-5 h-5 text-success" /> Animal Tag
        </h2>
        <button className="p-1.5 rounded hover:bg-background text-muted transition-colors" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="mb-5 p-4 bg-background rounded-xl space-y-1.5">
        <p className="text-xs text-muted">
          {animal.type} · Sex: {animal.sex}
        </p>
        <p className="text-xs text-muted">Weight: {animal.weight} kg</p>
        {animal.mother_id && <p className="text-xs text-muted">Mother: {animal.mother_id}</p>}
        {animal.father_id && <p className="text-xs text-muted">Father: {animal.father_id}</p>}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <AnimalStatusBadge status={animal.status as AnimalStatus} />
        </div>
      </div>
      <BarcodeVisual value={animal.id} />
      <p className="mt-4 text-center text-xs text-muted">Registered on {new Date(animal.created_at).toLocaleDateString()}</p>
      <button
        className="mt-5 w-full py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  </div>
)

// ─── Animal Form Modal ────────────────────────────────────────────────────────

const FIELD = 'w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success'
const LABEL = 'block text-xs font-semibold text-muted uppercase tracking-wide mb-1'

const AnimalModal = ({
  editingAnimal,
  allAnimals,
  cages,
  isSubmitting,
  onClose,
  onSubmit,
  onGenerateNextId,
}: {
  editingAnimal: DBAnimal | null
  allAnimals: DBAnimal[]
  cages: Cage[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: AnimalFormValues) => Promise<void>
  onGenerateNextId: () => Promise<string>
}) => {

  const [form, setForm] = useState<AnimalFormValues>(
    editingAnimal
      ? {
          id: editingAnimal.id,
          type: editingAnimal.type,
          sex: editingAnimal.sex as AnimalSex,
          weight: String(editingAnimal.weight),
          status: editingAnimal.status as AnimalStatus,
          current_cage_id: editingAnimal.current_cage_id || '',
          mother_id: editingAnimal.mother_id || '',
          father_id: editingAnimal.father_id || '',
        }
      : EMPTY_FORM
  )
  const [error, setError] = useState<string>('')
  const [registered, setRegistered] = useState<DBAnimal | null>(null)
  const [motherSearch, setMotherSearch] = useState<string>('')
  const [fatherSearch, setFatherSearch] = useState<string>('')
  const [cageSearch, setCageSearch] = useState<string>('')
  const [showMotherDropdown, setShowMotherDropdown] = useState(false)
  const [showFatherDropdown, setShowFatherDropdown] = useState(false)
  const [showCageDropdown, setShowCageDropdown] = useState(false)

  // Auto-generate animal ID on mount (when adding new animal)
  useEffect(() => {
    if (!editingAnimal) {
      onGenerateNextId().then((nextId) => {
        setForm((prev) => ({ ...prev, id: nextId }))
      })
    } else {
      // Populate search fields when editing
      const mother = allAnimals.find((a) => a.id === editingAnimal.mother_id)
      const father = allAnimals.find((a) => a.id === editingAnimal.father_id)
      const cage = cages.find((c) => c.id === editingAnimal.current_cage_id)
      if (mother) setMotherSearch(mother.id)
      if (father) setFatherSearch(father.id)
      if (cage) setCageSearch(cage.cage_label)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAnimal])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-parent-select]') && !target.closest('[data-cage-select]')) {
        setShowMotherDropdown(false)
        setShowFatherDropdown(false)
        setShowCageDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const set = (key: keyof AnimalFormValues, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  // Filter mothers (Female animals only)
  const filteredMothers = useMemo(() => {
    return allAnimals.filter((a) => 
      a.sex === 'Female' && 
      (a.id.toLowerCase().includes(motherSearch.toLowerCase()) || 
       a.type.toLowerCase().includes(motherSearch.toLowerCase()))
    )
  }, [allAnimals, motherSearch])

  // Filter fathers (Male animals only)
  const filteredFathers = useMemo(() => {
    return allAnimals.filter((a) => 
      a.sex === 'Male' && 
      (a.id.toLowerCase().includes(fatherSearch.toLowerCase()) || 
       a.type.toLowerCase().includes(fatherSearch.toLowerCase()))
    )
  }, [allAnimals, fatherSearch])

  // Filter cages by label
  const filteredCages = useMemo(() => {
    return cages.filter((c) => 
      c.cage_label.toLowerCase().includes(cageSearch.toLowerCase())
    )
  }, [cages, cageSearch])

  const handleSubmit = async () => {
    setError('')

    if (!form.id.trim()) {
      setError('Animal ID should be auto-generated. Please try again.')
      return
    }

    if (!form.type.trim()) {
      setError('Please enter an animal type.')
      return
    }

    if (!form.weight.trim()) {
      setError('Please enter a weight.')
      return
    }

    if (!form.current_cage_id) {
      setError('Please select a cage.')
      return
    }

    try {
      await onSubmit(form)
      if (!editingAnimal) {
        // Show success screen with the new animal data
        const successAnimal: DBAnimal = {
          ...form,
          weight: parseFloat(form.weight),
          created_at: new Date().toISOString(),
        } as DBAnimal
        setRegistered(successAnimal)
        setForm(EMPTY_FORM)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  // Success screen after registration
  if (registered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Tag className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-1">Animal Registered!</h2>
          <p className="text-sm text-muted mb-6">
            Animal ID <strong>{registered.id}</strong> has been created.
            {registered.mother_id && (
              <span className="block mt-1">
                Mother: <strong>{registered.mother_id}</strong>
              </span>
            )}
            {registered.father_id && (
              <span className="block mt-1">
                Father: <strong>{registered.father_id}</strong>
              </span>
            )}
          </p>
          <BarcodeVisual value={registered.id} />
          <p className="mt-4 text-xs text-muted">Print or scan this barcode to identify the animal.</p>
          <div className="flex gap-3 mt-6">
            <button
              className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors"
              onClick={() => {
                setRegistered(null)
                setForm(EMPTY_FORM)
              }}
            >
              Register Another
            </button>
            <button
              className="flex-1 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Tag className="w-5 h-5 text-success" />
            {editingAnimal ? 'Edit Animal' : 'Register Animal'}
          </h2>
          <button className="p-1.5 rounded hover:bg-background text-muted transition-colors" onClick={onClose}>
            ✕
          </button>
        </div>

      {!editingAnimal && (
          <p className="mb-5 text-xs text-muted bg-background border border-border rounded-lg px-4 py-3">
            The animal barcode ID is auto-generated based on the current year and latest sequential number.
          </p>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Animal ID (Barcode) */}
          <div className="col-span-2">
            <label className={LABEL}>Animal ID (Barcode) <span className="text-red-500">*</span></label>
            <input
              className={FIELD}
              placeholder="e.g., TAG-2026-001"
              value={form.id}
              onChange={(e) => set('id', e.target.value)}
              disabled={!!editingAnimal}
            />
          </div>

          {/* Animal Type */}
          <div>
            <label className={LABEL}>Animal Type <span className="text-red-500">*</span></label>
            <input
              className={FIELD}
              placeholder="e.g., Pig"
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
            />
          </div>

          {/* Sex */}
          <div>
            <label className={LABEL}>Sex</label>
            <select className={FIELD} value={form.sex} onChange={(e) => set('sex', e.target.value as AnimalSex)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className={LABEL}>Weight (kg) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="0.1"
              className={FIELD}
              placeholder="e.g., 100"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <label className={LABEL}>Status</label>
            <select className={FIELD} value={form.status} onChange={(e) => set('status', e.target.value as AnimalStatus)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Cage */}
          <div data-cage-select>
            <label className={LABEL}>Cage <span className="text-red-500">*</span></label>
            {cages.length === 0 ? (
              <p className="mt-1 text-xs text-orange-500">No cages available. Create a cage first.</p>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  className={FIELD}
                  placeholder="Search cages..."
                  value={cageSearch}
                  onChange={(e) => setCageSearch(e.target.value)}
                  onFocus={() => setShowCageDropdown(true)}
                />
                {showCageDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-surface text-xs text-muted"
                      onClick={() => {
                        set('current_cage_id', '')
                        setCageSearch('')
                        setShowCageDropdown(false)
                      }}
                    >
                      -- Select cage --
                    </button>
                    {filteredCages.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted">No cages found</div>
                    ) : (
                      filteredCages.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-surface text-xs border-b border-border last:border-b-0"
                          onClick={() => {
                            set('current_cage_id', c.id)
                            setCageSearch(c.cage_label)
                            setShowCageDropdown(false)
                          }}
                        >
                          {c.cage_label}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mother */}
          <div data-parent-select>
            <label className={LABEL}>Mother (Optional)</label>
            <div className="relative">
              <input
                type="text"
                className={FIELD}
                placeholder="Search by ID or type..."
                value={motherSearch}
                onChange={(e) => setMotherSearch(e.target.value)}
                onFocus={() => setShowMotherDropdown(true)}
              />
              {showMotherDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-surface text-xs text-muted"
                    onClick={() => {
                      set('mother_id', '')
                      setMotherSearch('')
                      setShowMotherDropdown(false)
                    }}
                  >
                    -- No mother --
                  </button>
                  {filteredMothers.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted">No female animals found</div>
                  ) : (
                    filteredMothers.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-surface text-xs border-b border-border last:border-b-0"
                        onClick={() => {
                          set('mother_id', a.id)
                          setMotherSearch(a.id)
                          setShowMotherDropdown(false)
                        }}
                      >
                        {a.id} (Type: {a.type})
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Father */}
          <div data-parent-select>
            <label className={LABEL}>Father (Optional)</label>
            <div className="relative">
              <input
                type="text"
                className={FIELD}
                placeholder="Search by ID or type..."
                value={fatherSearch}
                onChange={(e) => setFatherSearch(e.target.value)}
                onFocus={() => setShowFatherDropdown(true)}
              />
              {showFatherDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-surface text-xs text-muted"
                    onClick={() => {
                      set('father_id', '')
                      setFatherSearch('')
                      setShowFatherDropdown(false)
                    }}
                  >
                    -- No father --
                  </button>
                  {filteredFathers.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted">No male animals found</div>
                  ) : (
                    filteredFathers.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-surface text-xs border-b border-border last:border-b-0"
                        onClick={() => {
                          set('father_id', a.id)
                          setFatherSearch(a.id)
                          setShowFatherDropdown(false)
                        }}
                      >
                        {a.id} (Type: {a.type})
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingAnimal ? 'Save Changes' : 'Register Animal'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ animal, isDeleting, onConfirm, onClose }: { animal: DBAnimal; isDeleting: boolean; onConfirm: () => void; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h2 className="text-lg font-bold text-primary mb-2">Remove Animal?</h2>
      <p className="text-sm text-muted mb-5">
        Are you sure you want to remove <strong>{animal.id}</strong> from the registry? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors disabled:opacity-50"
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
          Remove
        </button>
      </div>
    </div>
  </div>
)

// ─── Change Status Modal ──────────────────────────────────────────────────────

const StatusModal = ({ animal, isUpdating, onClose, onStatusChange }: { animal: DBAnimal; isUpdating: boolean; onClose: () => void; onStatusChange: (status: AnimalStatus) => Promise<void> }) => {
  const [selected, setSelected] = useState<AnimalStatus>(animal.status as AnimalStatus)
  const DOT: Record<AnimalStatus, string> = {
    Active: 'bg-green-500',
    Sick: 'bg-orange-500',
    Deceased: 'bg-red-500',
    Sold: 'bg-blue-500',
  }

  const handleApply = async () => {
    await onStatusChange(selected)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-xs p-6">
        <h2 className="text-lg font-bold text-primary mb-1 flex items-center gap-2">
          <MoreHorizontal className="w-5 h-5 text-success" /> Change Status
        </h2>
        <p className="text-xs text-muted mb-4">
          Animal: <strong>{animal.id}</strong>
        </p>
        <div className="space-y-2 mb-6">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                selected === s ? 'border-success bg-success/10 text-success' : 'border-border bg-background text-foreground hover:border-success/50'
              )}
              onClick={() => setSelected(s)}
              disabled={isUpdating}
            >
              <span className={cn('w-2.5 h-2.5 rounded-full', DOT[s])} />
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={handleApply}
            disabled={isUpdating}
          >
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function AnimalTagging() {
  const [animals, setAnimals] = useState<DBAnimal[]>([])
  const [cages, setCages] = useState<Cage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabFilter>('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<DBAnimal | null>(null)
  const [barcodeAnimal, setBarcodeAnimal] = useState<DBAnimal | null>(null)
  const [deletingAnimal, setDeletingAnimal] = useState<DBAnimal | null>(null)
  const [statusAnimal, setStatusAnimal] = useState<DBAnimal | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteing, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Load animals and cages on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [animalsData, cagesData] = await Promise.all([animalService.getAnimals(), cageService.getCages()])
        setAnimals(animalsData)
        setCages(cagesData)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleAddAnimal = async (values: AnimalFormValues) => {
    setIsSubmitting(true)
    try {
      // Check if ID already exists
      const exists = await animalService.animalIdExists(values.id)
      if (exists) {
        throw new Error('An animal with this ID already exists')
      }

      const newAnimal = await animalService.createAnimal({
        id: values.id,
        type: values.type,
        sex: values.sex,
        weight: parseFloat(values.weight),
        status: values.status,
        current_cage_id: values.current_cage_id || undefined,
        mother_id: values.mother_id || undefined,
        father_id: values.father_id || undefined,
      })

      if (newAnimal) {
        setAnimals((prev) => [newAnimal, ...prev])
        setShowModal(false)
      }
    } catch (err) {
      console.error('Error adding animal:', err)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateAnimal = async (values: AnimalFormValues) => {
    if (!editingAnimal) return

    setIsSubmitting(true)
    try {
      const updated = await animalService.updateAnimal(editingAnimal.id, {
        type: values.type,
        sex: values.sex,
        weight: parseFloat(values.weight),
        status: values.status,
        current_cage_id: values.current_cage_id || undefined,
        mother_id: values.mother_id || undefined,
        father_id: values.father_id || undefined,
      })

      if (updated) {
        setAnimals((prev) => prev.map((a) => (a.id === editingAnimal.id ? updated : a)))
        setShowModal(false)
        setEditingAnimal(null)
      }
    } catch (err) {
      console.error('Error updating animal:', err)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAnimal = async () => {
    if (!deletingAnimal) return

    setIsDeleting(true)
    try {
      const success = await animalService.deleteAnimal(deletingAnimal.id)
      if (success) {
        setAnimals((prev) => prev.filter((a) => a.id !== deletingAnimal.id))
        setDeletingAnimal(null)
      }
    } catch (err) {
      console.error('Error deleting animal:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (status: AnimalStatus) => {
    if (!statusAnimal) return

    setIsUpdatingStatus(true)
    try {
      const updated = await animalService.updateAnimal(statusAnimal.id, { status })
      if (updated) {
        setAnimals((prev) => prev.map((a) => (a.id === statusAnimal.id ? updated : a)))
      }
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const filtered = useMemo(() => {
    let list = animals
    if (activeTab !== 'All') list = list.filter((a) => a.status === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          a.sex.toLowerCase().includes(q)
      )
    }
    return list
  }, [animals, activeTab, search])

  const counts = useMemo(
    () => ({
      total: animals.length,
      active: animals.filter((a) => a.status === 'Active').length,
      sick: animals.filter((a) => a.status === 'Sick').length,
      sold: animals.filter((a) => a.status === 'Sold').length,
    }),
    [animals]
  )

  const columns = [
    {
      key: 'id' as const,
      header: 'Animal ID',
      render: (a: DBAnimal) => (
        <button
          className="flex items-center gap-2 font-mono text-sm font-bold text-success hover:text-success/80 transition-colors"
          onClick={() => setBarcodeAnimal(a)}
          title="Click to view barcode"
        >
          <Tag className="w-5 h-5" /> {a.id}
        </button>
      ),
    },
    {
      key: 'type' as const,
      header: 'Type',
      render: (a: DBAnimal) => <span className="text-base font-semibold text-foreground">{a.type}</span>,
    },
    {
      key: 'sex' as const,
      header: 'Sex',
      render: (a: DBAnimal) => (
        <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', a.sex === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700')}>
          {a.sex}
        </span>
      ),
    },
    {
      key: 'weight' as const,
      header: 'Weight',
      render: (a: DBAnimal) => <span className="text-base font-medium text-foreground">{a.weight} kg</span>,
    },
    {
      key: 'cage' as const,
      header: 'Cage',
      render: (a: DBAnimal) => {
        const cage = cages.find((c) => c.id === a.current_cage_id)
        return (
          <span className="text-sm font-medium text-muted">
            {cage ? cage.cage_label : <span className="italic text-muted">No cage</span>}
          </span>
        )
      },
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (a: DBAnimal) => <AnimalStatusBadge status={a.status as AnimalStatus} />,
    },
    {
      key: 'parents' as const,
      header: 'Parents',
      render: (a: DBAnimal) => (
        <div className="space-y-1.5">
          {a.mother_id && (
            <div className="text-sm bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-lg border border-purple-200">
              <span className="font-semibold">Mother:</span> <span className="font-mono">{a.mother_id}</span>
            </div>
          )}
          {a.father_id && (
            <div className="text-sm bg-cyan-50 text-cyan-700 px-2.5 py-1.5 rounded-lg border border-cyan-200">
              <span className="font-semibold">Father:</span> <span className="font-mono">{a.father_id}</span>
            </div>
          )}
          {!a.mother_id && !a.father_id && <span className="text-muted text-sm">No parents</span>}
        </div>
      ),
    },
    {
      key: 'actions' as const,
      header: 'Actions',
      render: (a: DBAnimal) => (
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setBarcodeAnimal(a)}
            title="View Barcode"
            className="p-2.5 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <button
            onClick={() => setStatusAnimal(a)}
            title="Change Status"
            className="p-2.5 bg-warning/10 text-warning hover:bg-warning/20 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setEditingAnimal(a)
              setShowModal(true)
            }}
            title="Edit"
            className="p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDeletingAnimal(a)}
            title="Remove"
            className="p-2.5 bg-danger/10 text-danger hover:bg-danger/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-success mx-auto mb-2" />
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Animal Tagging"
        subtitle="Register animals with unique barcode IDs and track parental relationships."
        icon={<Tag className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Animals" value={counts.total} color="default" />
        <StatCard label="Active" value={counts.active} color="success" />
        <StatCard label="Sick" value={counts.sick} color="warning" />
        <StatCard label="Sold" value={counts.sold} color="danger" />
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
              {tab === 'All' ? animals.length : animals.filter((a) => a.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      <ActionsBar>
        <PrimaryButton
          onClick={() => {
            setEditingAnimal(null)
            setShowModal(true)
          }}
        >
          <Plus className="w-4 h-4" /> Register Animal
        </PrimaryButton>
      </ActionsBar>

      <DataTable<DBAnimal>
        data={filtered}
        // @ts-expect-error: "parents" is a computed column not in DBAnimal type
        columns={columns}
        emptyMessage="No animals found."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID, type, sex..."
        title="Animal Registry"
        titleIcon={<Tag className="w-5 h-5" />}
        keyField="id"
      />

      {showModal && (
        <AnimalModal
          editingAnimal={editingAnimal}
          allAnimals={animals}
          cages={cages}
          isSubmitting={isSubmitting}
          onClose={() => {
            setShowModal(false)
            setEditingAnimal(null)
          }}
          onSubmit={editingAnimal ? handleUpdateAnimal : handleAddAnimal}
          onGenerateNextId={() => animalService.generateNextAnimalId()}
        />
      )}
      {barcodeAnimal && <BarcodeModal animal={barcodeAnimal} onClose={() => setBarcodeAnimal(null)} />}
      {deletingAnimal && (
        <DeleteModal
          animal={deletingAnimal}
          isDeleting={isDeleteing}
          onConfirm={handleDeleteAnimal}
          onClose={() => setDeletingAnimal(null)}
        />
      )}
      {statusAnimal && (
        <StatusModal
          animal={statusAnimal}
          isUpdating={isUpdatingStatus}
          onClose={() => setStatusAnimal(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

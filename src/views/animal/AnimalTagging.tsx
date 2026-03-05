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
import { Tag, Plus, Pencil, Trash2, QrCode, MoreHorizontal } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type AnimalSpecies = 'Cow' | 'Pig' | 'Chicken' | 'Goat' | 'Sheep' | 'Horse'
type AnimalSex = 'Male' | 'Female'
type AnimalStatus = 'Active' | 'Sick' | 'Deceased' | 'Sold'
/** Only relevant when species === 'Pig' */
type PigRole = 'Parent' | 'Child'

interface Animal {
  id: string
  /** Auto-generated barcode tag linked on registration */
  tagId: string
  name: string
  species: AnimalSpecies
  breed: string
  sex: AnimalSex
  dateOfBirth: string
  /** Weight in kg */
  weight: number
  status: AnimalStatus
  facility: string
  registeredAt: string
  notes?: string
  /** Parent or Child — only applicable when species === 'Pig' */
  pigRole?: PigRole
  /** tagId of the parent pig — only when pigRole === 'Child' */
  parentTagId?: string
}

interface AnimalFormValues {
  name: string
  species: AnimalSpecies
  breed: string
  sex: AnimalSex
  dateOfBirth: string
  weight: string
  facility: string
  notes: string
  pigRole: PigRole | ''
  parentTagId: string
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const ANIMALS_DATA: Animal[] = [
  {
    id: '1',
    tagId: 'TAG-2026-001',
    name: 'Bessie',
    species: 'Cow',
    breed: 'Holstein Friesian',
    sex: 'Female',
    dateOfBirth: '2020-03-12',
    weight: 540,
    status: 'Active',
    facility: 'Barn A',
    registeredAt: '2026-01-05',
    notes: 'Primary dairy cow. High milk yield.',
  },
  {
    id: '2',
    tagId: 'TAG-2026-002',
    name: 'Big Boy',
    species: 'Pig',
    breed: 'Large White',
    sex: 'Male',
    dateOfBirth: '2022-05-10',
    weight: 210,
    status: 'Active',
    facility: 'Pen B',
    registeredAt: '2026-01-10',
    pigRole: 'Parent',
    notes: 'Breeding boar.',
  },
  {
    id: '3',
    tagId: 'TAG-2026-003',
    name: 'Pinky',
    species: 'Pig',
    breed: 'Large White',
    sex: 'Female',
    dateOfBirth: '2024-09-01',
    weight: 65,
    status: 'Active',
    facility: 'Pen B',
    registeredAt: '2026-01-15',
    pigRole: 'Child',
    parentTagId: 'TAG-2026-002',
    notes: 'Offspring of Big Boy.',
  },
  {
    id: '4',
    tagId: 'TAG-2026-004',
    name: 'Dolly',
    species: 'Sheep',
    breed: 'Merino',
    sex: 'Female',
    dateOfBirth: '2022-11-01',
    weight: 68,
    status: 'Sick',
    facility: 'Pasture C',
    registeredAt: '2026-01-20',
    notes: 'Under veterinary observation — respiratory issue.',
  },
  {
    id: '5',
    tagId: 'TAG-2026-005',
    name: 'Cluck',
    species: 'Chicken',
    breed: 'Rhode Island Red',
    sex: 'Female',
    dateOfBirth: '2024-01-10',
    weight: 2.8,
    status: 'Active',
    facility: 'Coop D',
    registeredAt: '2026-02-01',
    notes: 'Laying hen.',
  },
]

// ─── Context ──────────────────────────────────────────────────────────────────

interface AnimalTaggingContextType {
  animals: Animal[]
  addAnimal: (values: AnimalFormValues) => Animal
  updateAnimal: (id: string, values: AnimalFormValues) => void
  deleteAnimal: (id: string) => void
  changeStatus: (id: string, status: AnimalStatus) => void
}

const AnimalTaggingContext = createContext<AnimalTaggingContextType | undefined>(undefined)

const generateTagId = (existing: Animal[]): string => {
  const year = new Date().getFullYear()
  const highest = existing
    .filter((a) => a.tagId.startsWith(`TAG-${year}`))
    .map((a) => parseInt(a.tagId.split('-')[2] ?? '0', 10))
    .reduce((max, n) => Math.max(max, n), 0)
  return `TAG-${year}-${String(highest + 1).padStart(3, '0')}`
}

const AnimalTaggingProvider = ({ children }: { children: ReactNode }) => {
  const [animals, setAnimals] = useState<Animal[]>(ANIMALS_DATA)

  const addAnimal = (values: AnimalFormValues): Animal => {
    const newAnimal: Animal = {
      id: crypto.randomUUID(),
      tagId: generateTagId(animals),
      name: values.name,
      species: values.species,
      breed: values.breed,
      sex: values.sex,
      dateOfBirth: values.dateOfBirth,
      weight: parseFloat(values.weight) || 0,
      status: 'Active',
      facility: values.facility,
      registeredAt: new Date().toISOString().slice(0, 10),
      notes: values.notes,
      ...(values.species === 'Pig' && values.pigRole
        ? {
            pigRole: values.pigRole as PigRole,
            parentTagId: values.pigRole === 'Child' ? values.parentTagId : undefined,
          }
        : {}),
    }
    setAnimals((prev) => [newAnimal, ...prev])
    return newAnimal
  }

  const updateAnimal = (id: string, values: AnimalFormValues) => {
    setAnimals((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              name: values.name,
              species: values.species,
              breed: values.breed,
              sex: values.sex,
              dateOfBirth: values.dateOfBirth,
              weight: parseFloat(values.weight) || a.weight,
              facility: values.facility,
              notes: values.notes,
              pigRole:
                values.species === 'Pig' && values.pigRole
                  ? (values.pigRole as PigRole)
                  : undefined,
              parentTagId:
                values.species === 'Pig' && values.pigRole === 'Child'
                  ? values.parentTagId
                  : undefined,
            }
          : a
      )
    )
  }

  const deleteAnimal = (id: string) => setAnimals((prev) => prev.filter((a) => a.id !== id))

  const changeStatus = (id: string, status: AnimalStatus) =>
    setAnimals((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))

  return (
    <AnimalTaggingContext.Provider value={{ animals, addAnimal, updateAnimal, deleteAnimal, changeStatus }}>
      {children}
    </AnimalTaggingContext.Provider>
  )
}

const useAnimalTagging = () => {
  const ctx = useContext(AnimalTaggingContext)
  if (!ctx) throw new Error('useAnimalTagging must be used inside AnimalTaggingProvider')
  return ctx
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIES_OPTIONS: AnimalSpecies[] = ['Cow', 'Pig', 'Chicken', 'Goat', 'Sheep', 'Horse']
const STATUS_OPTIONS: AnimalStatus[] = ['Active', 'Sick', 'Deceased', 'Sold']
const TAB_FILTERS = ['All', 'Active', 'Sick', 'Sold', 'Deceased'] as const
type TabFilter = (typeof TAB_FILTERS)[number]

const EMPTY_FORM: AnimalFormValues = {
  name: '',
  species: 'Cow',
  breed: '',
  sex: 'Male',
  dateOfBirth: '',
  weight: '',
  facility: '',
  notes: '',
  pigRole: '',
  parentTagId: '',
}

const STATUS_STYLES: Record<AnimalStatus, string> = {
  Active: 'bg-green-100 text-green-700',
  Sick: 'bg-orange-100 text-orange-700',
  Deceased: 'bg-red-100 text-red-600',
  Sold: 'bg-blue-100 text-blue-700',
}

const PIG_ROLE_STYLES: Record<PigRole, string> = {
  Parent: 'bg-purple-100 text-purple-700',
  Child: 'bg-yellow-100 text-yellow-700',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const AnimalStatusBadge = ({ status }: { status: AnimalStatus }) => (
  <span className={cn('inline-block px-2.5 py-0.5 text-xs font-medium rounded-full', STATUS_STYLES[status])}>
    {status}
  </span>
)

const PigRoleBadge = ({ role }: { role: PigRole }) => (
  <span className={cn('inline-block px-2.5 py-0.5 text-xs font-medium rounded-full', PIG_ROLE_STYLES[role])}>
    {role}
  </span>
)

// Deterministic barcode bars generated from a tag string
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

const BarcodeModal = ({ animal, onClose }: { animal: Animal; onClose: () => void }) => (
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
        <p className="text-sm font-semibold text-foreground">{animal.name}</p>
        <p className="text-xs text-muted">
          {animal.species} · {animal.breed} · {animal.sex}
        </p>
        <p className="text-xs text-muted">Facility: {animal.facility}</p>
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <AnimalStatusBadge status={animal.status} />
          {animal.pigRole && <PigRoleBadge role={animal.pigRole} />}
          {animal.parentTagId && (
            <span className="text-xs text-muted">Parent tag: {animal.parentTagId}</span>
          )}
        </div>
      </div>
      <BarcodeVisual value={animal.tagId} />
      <p className="mt-4 text-center text-xs text-muted">Registered on {animal.registeredAt}</p>
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
  onClose,
}: {
  editingAnimal: Animal | null
  onClose: () => void
}) => {
  const { animals, addAnimal, updateAnimal } = useAnimalTagging()
  const parentPigs = animals.filter((a) => a.species === 'Pig' && a.pigRole === 'Parent')

  const [form, setForm] = useState<AnimalFormValues>(
    editingAnimal
      ? {
          name: editingAnimal.name,
          species: editingAnimal.species,
          breed: editingAnimal.breed,
          sex: editingAnimal.sex,
          dateOfBirth: editingAnimal.dateOfBirth,
          weight: String(editingAnimal.weight),
          facility: editingAnimal.facility,
          notes: editingAnimal.notes ?? '',
          pigRole: editingAnimal.pigRole ?? '',
          parentTagId: editingAnimal.parentTagId ?? '',
        }
      : EMPTY_FORM
  )
  const [registered, setRegistered] = useState<Animal | null>(null)

  const set = (key: keyof AnimalFormValues, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = () => {
    if (!form.name.trim() || !form.breed.trim() || !form.dateOfBirth || !form.facility.trim()) {
      alert('Please fill in all required fields.')
      return
    }
    if (form.species === 'Pig' && !form.pigRole) {
      alert('Please select a pig role (Parent or Child).')
      return
    }
    if (form.species === 'Pig' && form.pigRole === 'Child' && !form.parentTagId) {
      alert('Please select the parent pig tag.')
      return
    }
    if (editingAnimal) {
      updateAnimal(editingAnimal.id, form)
      onClose()
    } else {
      setRegistered(addAnimal(form))
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
            Barcode tag <strong>{registered.tagId}</strong> has been linked to{' '}
            <strong>{registered.name}</strong>.
            {registered.pigRole && (
              <span className="block mt-1">
                Pig role: <strong>{registered.pigRole}</strong>
                {registered.parentTagId && ` (parent: ${registered.parentTagId})`}
              </span>
            )}
          </p>
          <BarcodeVisual value={registered.tagId} />
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
            A unique barcode tag will be automatically generated and linked to this animal upon registration.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <label className={LABEL}>Name <span className="text-red-500">*</span></label>
            <input className={FIELD} placeholder="e.g. Bessie" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>

          {/* Species */}
          <div>
            <label className={LABEL}>Species</label>
            <select
              className={FIELD}
              value={form.species}
              onChange={(e) => {
                set('species', e.target.value)
                if (e.target.value !== 'Pig') {
                  setForm((prev) => ({ ...prev, species: e.target.value as AnimalSpecies, pigRole: '', parentTagId: '' }))
                }
              }}
            >
              {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className={LABEL}>Breed <span className="text-red-500">*</span></label>
            <input className={FIELD} placeholder="e.g. Holstein" value={form.breed} onChange={(e) => set('breed', e.target.value)} />
          </div>

          {/* Sex */}
          <div>
            <label className={LABEL}>Sex</label>
            <select className={FIELD} value={form.sex} onChange={(e) => set('sex', e.target.value as AnimalSex)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className={LABEL}>Date of Birth <span className="text-red-500">*</span></label>
            <input type="date" className={FIELD} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
          </div>

          {/* Weight */}
          <div>
            <label className={LABEL}>Weight (kg)</label>
            <input type="number" min="0" step="0.1" className={FIELD} placeholder="e.g. 540" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
          </div>

          {/* Facility */}
          <div>
            <label className={LABEL}>Facility <span className="text-red-500">*</span></label>
            <input className={FIELD} placeholder="e.g. Barn A" value={form.facility} onChange={(e) => set('facility', e.target.value)} />
          </div>

          {/* Pig Role — only shown for pigs */}
          {form.species === 'Pig' && (
            <>
              <div>
                <label className={LABEL}>Pig Role <span className="text-red-500">*</span></label>
                <select className={FIELD} value={form.pigRole} onChange={(e) => set('pigRole', e.target.value)}>
                  <option value="">-- Select role --</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                </select>
              </div>

              {form.pigRole === 'Child' && (
                <div>
                  <label className={LABEL}>Parent Pig Tag <span className="text-red-500">*</span></label>
                  <select className={FIELD} value={form.parentTagId} onChange={(e) => set('parentTagId', e.target.value)}>
                    <option value="">-- Select parent --</option>
                    {parentPigs.map((p) => (
                      <option key={p.id} value={p.tagId}>{p.tagId} — {p.name}</option>
                    ))}
                  </select>
                  {parentPigs.length === 0 && (
                    <p className="mt-1 text-xs text-orange-500">No parent pigs registered yet. Register a parent pig first.</p>
                  )}
                </div>
              )}
            </>
          )}

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
            {editingAnimal ? 'Save Changes' : 'Register & Generate Tag'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ animal, onConfirm, onClose }: { animal: Animal; onConfirm: () => void; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h2 className="text-lg font-bold text-primary mb-2">Remove Animal?</h2>
      <p className="text-sm text-muted mb-5">
        Are you sure you want to remove <strong>{animal.name}</strong> ({animal.tagId}) from the registry? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors" onClick={onClose}>
          Cancel
        </button>
        <button className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors" onClick={onConfirm}>
          Remove
        </button>
      </div>
    </div>
  </div>
)

// ─── Change Status Modal ──────────────────────────────────────────────────────

const StatusModal = ({ animal, onClose }: { animal: Animal; onClose: () => void }) => {
  const { changeStatus } = useAnimalTagging()
  const [selected, setSelected] = useState<AnimalStatus>(animal.status)
  const DOT: Record<AnimalStatus, string> = {
    Active: 'bg-green-500',
    Sick: 'bg-orange-500',
    Deceased: 'bg-red-500',
    Sold: 'bg-blue-500',
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-xs p-6">
        <h2 className="text-lg font-bold text-primary mb-1 flex items-center gap-2">
          <MoreHorizontal className="w-5 h-5 text-success" /> Change Status
        </h2>
        <p className="text-xs text-muted mb-4">
          Animal: <strong>{animal.name}</strong> — {animal.tagId}
        </p>
        <div className="space-y-2 mb-6">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                selected === s
                  ? 'border-success bg-success/10 text-success'
                  : 'border-border bg-background text-foreground hover:border-success/50'
              )}
              onClick={() => setSelected(s)}
            >
              <span className={cn('w-2.5 h-2.5 rounded-full', DOT[s])} />
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors" onClick={onClose}>
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
            onClick={() => { changeStatus(animal.id, selected); onClose() }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main App (consumes context) ──────────────────────────────────────────────

const AnimalTaggingApp = () => {
  const { animals, deleteAnimal } = useAnimalTagging()
  const [activeTab, setActiveTab] = useState<TabFilter>('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null)
  const [barcodeAnimal, setBarcodeAnimal] = useState<Animal | null>(null)
  const [deletingAnimal, setDeletingAnimal] = useState<Animal | null>(null)
  const [statusAnimal, setStatusAnimal] = useState<Animal | null>(null)

  const filtered = useMemo(() => {
    let list = animals
    if (activeTab !== 'All') list = list.filter((a) => a.status === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.tagId.toLowerCase().includes(q) ||
          a.species.toLowerCase().includes(q) ||
          a.breed.toLowerCase().includes(q) ||
          a.facility.toLowerCase().includes(q)
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
      key: 'tagId' as const,
      header: 'Tag ID',
      render: (a: Animal) => (
        <button
          className="flex items-center gap-2 font-mono text-xs font-semibold text-success hover:underline"
          onClick={() => setBarcodeAnimal(a)}
        >
          <Tag className="w-3.5 h-3.5" /> {a.tagId}
        </button>
      ),
    },
    {
      key: 'name' as const,
      header: 'Name',
      render: (a: Animal) => <span className="font-medium text-foreground">{a.name}</span>,
    },
    {
      key: 'species' as const,
      header: 'Species / Breed',
      render: (a: Animal) => (
        <span className="text-sm">
          {a.species}
          <span className="text-muted"> / {a.breed}</span>
        </span>
      ),
    },
    {
      key: 'sex' as const,
      header: 'Sex',
      render: (a: Animal) => (
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', a.sex === 'Male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600')}>
          {a.sex}
        </span>
      ),
    },
    {
      key: 'weight' as const,
      header: 'Weight',
      render: (a: Animal) => <span className="text-sm">{a.weight} kg</span>,
    },
    {
      key: 'facility' as const,
      header: 'Facility',
      render: (a: Animal) => <span className="text-sm text-muted">{a.facility}</span>,
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (a: Animal) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <AnimalStatusBadge status={a.status} />
          {a.pigRole && <PigRoleBadge role={a.pigRole} />}
        </div>
      ),
    },
    {
      key: 'actions' as const,
      header: 'Actions',
      render: (a: Animal) => (
        <div className="flex items-center gap-1">
          <IconButton onClick={() => setBarcodeAnimal(a)} title="View Barcode" variant="success">
            <QrCode className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => setStatusAnimal(a)} title="Change Status">
            <MoreHorizontal className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => { setEditingAnimal(a); setShowModal(true) }} title="Edit">
            <Pencil className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => setDeletingAnimal(a)} title="Remove" variant="danger">
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Animal Tagging"
        subtitle="Register animals and link each one to a unique barcode tag."
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
        <PrimaryButton onClick={() => { setEditingAnimal(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" /> Register Animal
        </PrimaryButton>
      </ActionsBar>

      <DataTable
        data={filtered}
        columns={columns}
        emptyMessage="No animals found."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, tag, species, facility..."
        title="Animal Registry"
        titleIcon={<Tag className="w-5 h-5" />}
        keyField="id"
      />

      {showModal && (
        <AnimalModal
          editingAnimal={editingAnimal}
          onClose={() => { setShowModal(false); setEditingAnimal(null) }}
        />
      )}
      {barcodeAnimal && <BarcodeModal animal={barcodeAnimal} onClose={() => setBarcodeAnimal(null)} />}
      {deletingAnimal && (
        <DeleteModal
          animal={deletingAnimal}
          onConfirm={() => { deleteAnimal(deletingAnimal.id); setDeletingAnimal(null) }}
          onClose={() => setDeletingAnimal(null)}
        />
      )}
      {statusAnimal && <StatusModal animal={statusAnimal} onClose={() => setStatusAnimal(null)} />}
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function AnimalTagging() {
  return (
    <AnimalTaggingProvider>
      <AnimalTaggingApp />
    </AnimalTaggingProvider>
  )
}

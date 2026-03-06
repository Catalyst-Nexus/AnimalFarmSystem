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
import { checkCageCapacity } from '@/services/cageService'
import { fetchTagAnimalColors, fetchAnimalTypes, fetchTagColors, fetchTagTypes } from '@/services/animalAdminService'
import type { TagAnimalColor, AnimalType, TagColor, TagType } from '@/services/animalAdminService'

// ─── Types ────────────────────────────────────────────────────────────────────

type AnimalSex = 'Male' | 'Female'
type AnimalStatus = 'Active' | 'Sick' | 'Deceased' | 'Sold'

interface AnimalFormValues {
  tag_animals_colors_id: string // Reference to tag_animals_colors record
  animal_type_id: string // Selected animal type
  tag_color_id: string // Selected tag color
  tag_type_id: string // Selected tag type
  tag_code_id: string // Selected tag code record ID
  formattedTagCode: string // Formatted like "EAR-1" (read-only)
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
  tag_animals_colors_id: '',
  animal_type_id: '',
  tag_color_id: '',
  tag_type_id: '',
  tag_code_id: '',
  formattedTagCode: '',
  sex: 'Male',
  weight: '',
  status: 'Active',
  current_cage_id: '',
  mother_id: '',
  father_id: '',
}

// Helper to format tag code as "TYPE-CODE"
const formatTagCode = (tagCode: TagAnimalColor): string => {
  return `${tagCode.tag_types?.type || ''}-${tagCode.tag_code}`
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

const BarcodeModal = ({ animal, onClose }: { animal: DBAnimal; onClose: () => void }) => {
  const tagType = animal.type?.split('-')[0] || 'TAG'
  const animalType = animal.type ? animal.type.split('|')[1]?.trim() : 'Unknown'
  
  return (
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
            {animalType} · {tagType} · Sex: {animal.sex}
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
}

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
}: {
  editingAnimal: DBAnimal | null
  allAnimals: DBAnimal[]
  cages: Cage[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: AnimalFormValues) => Promise<void>
}) => {
  const [allTagCodes, setAllTagCodes] = useState<TagAnimalColor[]>([])
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([])
  const [tagColors, setTagColors] = useState<TagColor[]>([])
  const [tagTypes, setTagTypes] = useState<TagType[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  const [form, setForm] = useState<AnimalFormValues>(EMPTY_FORM)
  const [error, setError] = useState<string>('')
  const [registered, setRegistered] = useState<DBAnimal | null>(null)
  const [motherSearch, setMotherSearch] = useState<string>('')
  const [fatherSearch, setFatherSearch] = useState<string>('')
  const [cageSearch, setCageSearch] = useState<string>('')
  const [showMotherDropdown, setShowMotherDropdown] = useState(false)
  const [showFatherDropdown, setShowFatherDropdown] = useState(false)
  const [showCageDropdown, setShowCageDropdown] = useState(false)
  const [batch, setBatch] = useState<AnimalFormValues[]>([])
  const [isRegisteringBatch, setIsRegisteringBatch] = useState(false)

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true)
      try {
        const [types, colors, tagTypesData, codes] = await Promise.all([
          fetchAnimalTypes(),
          fetchTagColors(),
          fetchTagTypes(),
          fetchTagAnimalColors(),
        ])
        setAnimalTypes(types)
        setTagColors(colors)
        setTagTypes(tagTypesData)
        setAllTagCodes(codes)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoadingData(false)
      }
    }
    loadData()
  }, [])

  // Populate form when editing
  useEffect(() => {
    if (editingAnimal && allTagCodes.length > 0) {
      // Find the tag code record
      const tagCodeRecord = allTagCodes.find(
        (tc) => editingAnimal.tag_animals_colors_id === tc.id
      )

      if (tagCodeRecord) {
        setForm({
          tag_animals_colors_id: tagCodeRecord.id,
          animal_type_id: tagCodeRecord.animal_type_id,
          tag_color_id: tagCodeRecord.tag_color_id,
          tag_type_id: tagCodeRecord.tag_type_id,
          tag_code_id: tagCodeRecord.id,
          formattedTagCode: formatTagCode(tagCodeRecord),
          sex: editingAnimal.sex as AnimalSex,
          weight: String(editingAnimal.weight),
          status: editingAnimal.status as AnimalStatus,
          current_cage_id: editingAnimal.current_cage_id || '',
          mother_id: editingAnimal.mother_id || '',
          father_id: editingAnimal.father_id || '',
        })
      }

      const mother = allAnimals.find((a) => a.id === editingAnimal.mother_id)
      const father = allAnimals.find((a) => a.id === editingAnimal.father_id)
      const cage = cages.find((c) => c.id === editingAnimal.current_cage_id)
      if (mother) setMotherSearch(mother.id)
      if (father) setFatherSearch(father.id)
      if (cage) setCageSearch(cage.cage_label)
    }
  }, [editingAnimal, allAnimals, cages, allTagCodes])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        !target.closest('[data-parent-select]') &&
        !target.closest('[data-cage-select]')
      ) {
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

  // Filter tag codes based on selections and availability
  const availableTagCodes = useMemo(() => {
    return allTagCodes.filter((tc) => {
      // Filter by selected criteria
      if (form.animal_type_id && tc.animal_type_id !== form.animal_type_id) return false
      if (form.tag_color_id && tc.tag_color_id !== form.tag_color_id) return false
      if (form.tag_type_id && tc.tag_type_id !== form.tag_type_id) return false
      
      // Check if tag code is already used by an existing animal WITH THE SAME ANIMAL TYPE
      const isUsedByExisting = allAnimals.some((animal) => 
        animal.tag_animals_colors_id === tc.id && 
        animal.tag_animals_colors_id !== editingAnimal?.tag_animals_colors_id // Allow current animal when editing
      )
      if (isUsedByExisting) return false
      
      // Check if tag code is already in the current batch
      const isInBatch = batch.some((item) => item.tag_animals_colors_id === tc.id)
      if (isInBatch) return false
      
      return true
    })
  }, [allTagCodes, form.animal_type_id, form.tag_color_id, form.tag_type_id, allAnimals, batch, editingAnimal])

  // Filter mothers (Female animals only)
  const filteredMothers = useMemo(() => {
    return allAnimals.filter((a) =>
      a.sex === 'Female' &&
      (a.id.toLowerCase().includes(motherSearch.toLowerCase()) ||
        (a.type && a.type.toLowerCase().includes(motherSearch.toLowerCase())))
    )
  }, [allAnimals, motherSearch])

  // Filter fathers (Male animals only)
  const filteredFathers = useMemo(() => {
    return allAnimals.filter((a) =>
      a.sex === 'Male' &&
      (a.id.toLowerCase().includes(fatherSearch.toLowerCase()) ||
        (a.type && a.type.toLowerCase().includes(fatherSearch.toLowerCase())))
    )
  }, [allAnimals, fatherSearch])

  // Filter cages by label
  const filteredCages = useMemo(() => {
    return cages.filter((c) =>
      c.cage_label.toLowerCase().includes(cageSearch.toLowerCase())
    )
  }, [cages, cageSearch])

  const handleSelectTagCode = (tagCode: TagAnimalColor) => {
    const formatted = formatTagCode(tagCode)
    setForm({
      ...form,
      tag_animals_colors_id: tagCode.id,
      tag_code_id: tagCode.id,
      formattedTagCode: formatted,
      animal_type_id: tagCode.animal_type_id,
      tag_color_id: tagCode.tag_color_id,
      tag_type_id: tagCode.tag_type_id,
    })
  }

  const handleSubmit = async () => {
    setError('')

    if (!form.tag_animals_colors_id) {
      setError('Please select animal type, color, type, and tag code.')
      return
    }

    if (!form.formattedTagCode) {
      setError('Tag code is not properly set. Please reselect the tag code.')
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

    // Check if tag code is already used (unless editing the same animal)
    if (!editingAnimal) {
      const isAlreadyUsed = allAnimals.some((a) => a.tag_animals_colors_id === form.tag_animals_colors_id)
      if (isAlreadyUsed) {
        setError('This tag code is already assigned to another animal. Please select a different tag code.')
        return
      }
      
      const isInBatch = batch.some((item) => item.tag_animals_colors_id === form.tag_animals_colors_id)
      if (isInBatch) {
        setError('This tag code is already in the batch. Please select a different tag code.')
        return
      }
    }

    // If editing, submit directly. Otherwise add to batch
    if (editingAnimal) {
      try {
        await onSubmit(form)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    } else {
      // Add to batch for new animals
      setBatch((prev) => [...prev, form])
      setForm(EMPTY_FORM)
      setError('')
    }
  }

  const handleRemoveFromBatch = (index: number) => {
    setBatch((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRegisterBatch = async () => {
    if (batch.length === 0) {
      setError('No animals in batch to register.')
      return
    }

    setIsRegisteringBatch(true)
    try {
      for (const formValues of batch) {
        await onSubmit(formValues)
      }
      // Show success and close
      setRegistered({
        id: '',
        tag_animals_colors_id: '',
        type: `Batch of ${batch.length} animals registered successfully!`,
        sex: 'Male',
        weight: 0,
        status: 'Active',
        current_cage_id: '',
        mother_id: '',
        father_id: '',
        is_active: true,
        created_at: new Date().toISOString(),
      } as DBAnimal)
      setBatch([])
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while registering batch')
    } finally {
      setIsRegisteringBatch(false)
    }
  }

  // Success screen after registration
  if (registered) {
    const isBatch = registered.type?.includes('Batch of')
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Tag className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-1">
            {isBatch ? 'Batch Registered!' : 'Animal Registered!'}
          </h2>
          <p className="text-sm text-muted mb-6">
            {isBatch ? (
              <span>{registered.type}</span>
            ) : (
              <>
                Tag Code <strong>{registered.id || registered.formattedTagCode}</strong> has been assigned.
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
              </>
            )}
          </p>
          {!isBatch && <BarcodeVisual value={registered.id} />}
          {!isBatch && <p className="mt-4 text-xs text-muted">Print or scan this barcode to identify the animal.</p>}
          <div className="flex gap-3 mt-6">
            <button
              className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors"
              onClick={() => {
                setRegistered(null)
                setForm(EMPTY_FORM)
              }}
            >
              {isBatch ? 'Continue' : 'Register Another'}
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
          <button
            className="p-1.5 rounded hover:bg-background text-muted transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {!editingAnimal && (
          <p className="mb-5 text-xs text-muted bg-background border border-border rounded-lg px-4 py-3">
            Select animal type, tag color, tag type, and then choose an available tag code for this animal.
          </p>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Animal Type */}
          {!editingAnimal && (
            <div className="col-span-2">
              <label className={LABEL}>
                Animal Type <span className="text-red-500">*</span>
              </label>
              {isLoadingData ? (
                <div className="text-xs text-muted py-2">Loading...</div>
              ) : animalTypes.length === 0 ? (
                <p className="mt-1 text-xs text-orange-500">
                  No animal types available. Create them in Animal Administration first.
                </p>
              ) : (
                <select
                  className={FIELD}
                  value={form.animal_type_id}
                  onChange={(e) => set('animal_type_id', e.target.value)}
                  aria-label="Animal Type"
                >
                  <option value="">-- Select Animal Type --</option>
                  {animalTypes.map((at) => (
                    <option key={at.id} value={at.id}>
                      {at.animal_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Tag Color */}
          {!editingAnimal && (
            <div>
              <label className={LABEL}>
                Tag Color <span className="text-red-500">*</span>
              </label>
              {isLoadingData ? (
                <div className="text-xs text-muted py-2">Loading...</div>
              ) : tagColors.length === 0 ? (
                <p className="mt-1 text-xs text-orange-500">No colors available</p>
              ) : (
                <select
                  className={FIELD}
                  value={form.tag_color_id}
                  onChange={(e) => set('tag_color_id', e.target.value)}
                  disabled={!form.animal_type_id}
                  aria-label="Tag Color"
                >
                  <option value="">-- Select Color --</option>
                  {tagColors.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.color_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Tag Type */}
          {!editingAnimal && (
            <div>
              <label className={LABEL}>
                Tag Type <span className="text-red-500">*</span>
              </label>
              {isLoadingData ? (
                <div className="text-xs text-muted py-2">Loading...</div>
              ) : tagTypes.length === 0 ? (
                <p className="mt-1 text-xs text-orange-500">No types available</p>
              ) : (
                <select
                  className={FIELD}
                  value={form.tag_type_id}
                  onChange={(e) => set('tag_type_id', e.target.value)}
                  disabled={!form.animal_type_id}
                  aria-label="Tag Type"
                >
                  <option value="">-- Select Type --</option>
                  {tagTypes.map((tt) => (
                    <option key={tt.id} value={tt.id}>
                      {tt.type}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Tag Code */}
          {!editingAnimal && (
            <div className="col-span-2">
              <label className={LABEL}>
                Tag Code <span className="text-red-500">*</span>
              </label>
              {!form.animal_type_id || !form.tag_color_id || !form.tag_type_id ? (
                <p className="mt-1 text-xs text-muted py-2">
                  Select animal type, color, and type first
                </p>
              ) : availableTagCodes.length === 0 ? (
                <p className="mt-1 text-xs text-orange-500 py-2 px-3 bg-orange-50 border border-orange-200 rounded-lg">
                  ⚠️ No available tag codes for this combination. All tags may already be assigned or create new tags in Animal Admin.
                </p>
              ) : (
                <select
                  className={FIELD}
                  value={form.tag_code_id}
                  onChange={(e) => {
                    const selectedCode = allTagCodes.find((tc) => tc.id === e.target.value)
                    if (selectedCode) handleSelectTagCode(selectedCode)
                  }}
                  aria-label="Tag Code"
                >
                  <option value="">-- Select Tag Code --</option>
                  {availableTagCodes.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {formatTagCode(tc)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Tag Code Display (Read-only when selected or editing) */}
          {form.formattedTagCode && (
            <div className="col-span-2 p-3 bg-background border border-border rounded-lg">
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted font-semibold mb-1">TAG CODE</p>
                  <p className="font-bold text-foreground">{form.formattedTagCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted font-semibold mb-1">TYPE</p>
                  <p className="font-semibold text-foreground">
                    {tagTypes.find((tt) => tt.id === form.tag_type_id)?.type || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted font-semibold mb-1">COLOR</p>
                  <p className="font-semibold text-foreground">
                    {tagColors.find((tc) => tc.id === form.tag_color_id)?.color_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted font-semibold mb-1">ANIMAL TYPE</p>
                  <p className="font-semibold text-foreground">
                    {animalTypes.find((at) => at.id === form.animal_type_id)?.animal_name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sex */}
          <div>
            <label className={LABEL}>Sex</label>
            <select
              className={FIELD}
              value={form.sex}
              onChange={(e) => set('sex', e.target.value as AnimalSex)}
              aria-label="Animal sex"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className={LABEL}>
              Weight (kg) <span className="text-red-500">*</span>
            </label>
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
            <select
              className={FIELD}
              value={form.status}
              onChange={(e) => set('status', e.target.value as AnimalStatus)}
              aria-label="Animal status"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Cage */}
          <div data-cage-select className="col-span-2">
            <label className={LABEL}>
              Cage <span className="text-red-500">*</span>
            </label>
            {cages.length === 0 ? (
              <p className="mt-1 text-xs text-orange-500">
                No cages available. Create a cage first.
              </p>
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
          <div data-parent-select className="col-span-2">
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
          <div data-parent-select className="col-span-2">
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

        {/* Batch Items Display */}
        {batch.length > 0 && (
          <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-success">Batch Queue ({batch.length} animals)</h3>
              <button
                type="button"
                className="text-xs text-muted hover:text-foreground transition-colors"
                onClick={() => setBatch([])}
              >
                Clear
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {batch.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-background p-2 rounded text-xs">
                  <div className="flex-1">
                    <span className="font-mono font-semibold">{item.formattedTagCode}</span>
                    <span className="text-muted ml-2">· {item.sex} · {item.weight} kg · Cage:</span>
                    <span className="font-medium ml-1">{cages.find((c) => c.id === item.current_cage_id)?.cage_label || 'N/A'}</span>
                  </div>
                  <button
                    type="button"
                    className="ml-2 text-danger hover:text-danger/80 transition-colors px-2 py-1"
                    onClick={() => handleRemoveFromBatch(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting || isRegisteringBatch}
          >
            Cancel
          </button>
          {batch.length > 0 && (
            <button
              className="flex-1 py-2.5 bg-warning text-white rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={() => setBatch([])}
              disabled={isRegisteringBatch}
            >
              Clear Batch
            </button>
          )}
          {batch.length > 0 ? (
            <button
              className="flex-1 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={handleRegisterBatch}
              disabled={isRegisteringBatch}
            >
              {isRegisteringBatch && <Loader2 className="w-4 h-4 animate-spin" />}
              Register All ({batch.length})
            </button>
          ) : (
            <button
              className="flex-1 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting || !form.tag_animals_colors_id}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingAnimal ? 'Save Changes' : 'Add to Batch'}
            </button>
          )}
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
      // Check if tag code is already used
      const exists = animals.some((a) => a.tag_animals_colors_id === values.tag_animals_colors_id)
      if (exists) {
        throw new Error('This tag code is already assigned to another animal')
      }

      // Check cage capacity if a cage is selected
      if (values.current_cage_id) {
        const capacityInfo = await checkCageCapacity(values.current_cage_id)
        if (capacityInfo.isFull) {
          throw new Error(
            `Cage is full! Current: ${capacityInfo.currentCount}/${capacityInfo.maxCapacity}. Please select a different cage.`
          )
        }
      }

      const newAnimal = await animalService.createAnimal({
        id: values.tag_animals_colors_id,
        tag_animals_colors_id: values.tag_animals_colors_id,
        sex: values.sex,
        weight: parseFloat(values.weight),
        status: values.status,
        current_cage_id: values.current_cage_id || null,
        mother_id: values.mother_id || null,
        father_id: values.father_id || null,
      })

      setAnimals((prev) => [newAnimal, ...prev])
      setShowModal(false)
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
      // Check cage capacity if cage is being changed or assigned
      if (values.current_cage_id && values.current_cage_id !== editingAnimal.current_cage_id) {
        const capacityInfo = await checkCageCapacity(values.current_cage_id, editingAnimal.id)
        if (capacityInfo.isFull) {
          throw new Error(
            `Cage is full! Current: ${capacityInfo.currentCount}/${capacityInfo.maxCapacity}. Please select a different cage.`
          )
        }
      }

      const updated = await animalService.updateAnimal(editingAnimal.id, {
        sex: values.sex,
        weight: parseFloat(values.weight),
        status: values.status,
        current_cage_id: values.current_cage_id || null,
        mother_id: values.mother_id || null,
        father_id: values.father_id || null,
      })

      if (!updated) {
        throw new Error('Failed to update animal. Please check the console for details.')
      }

      setAnimals((prev) => prev.map((a) => (a.id === editingAnimal.id ? updated : a)))
      setShowModal(false)
      setEditingAnimal(null)
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
          (a.type && a.type.toLowerCase().includes(q)) ||
          a.sex.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q)
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
          <Tag className="w-5 h-5" /> {a.formattedTagCode || a.id}
        </button>
      ),
    },
    {
      key: 'type' as const,
      header: 'Type',
      render: (a: DBAnimal) => <span className="text-base font-semibold text-foreground">{a.animalType || a.type?.split('|')[1]?.trim() || ''}</span>,
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

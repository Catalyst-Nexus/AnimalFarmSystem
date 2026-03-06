import { useState, useEffect } from 'react'
import { Settings, Plus, RefreshCw } from 'lucide-react'
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  Tabs,
} from '@/components/ui'
import {
  fetchAnimalTypes,
  createAnimalType,
  updateAnimalType,
  deleteAnimalType,
  fetchTagColors,
  createTagColor,
  updateTagColor,
  deleteTagColor,
  fetchTagTypes,
  createTagType,
  updateTagType,
  deleteTagType,
  fetchTagAnimalColors,
  createTagAnimalColor,
  updateTagAnimalColor,
  deleteTagAnimalColor,
  bulkCreateTagCodes,
  type AnimalType,
  type TagColor,
  type TagType,
  type TagAnimalColor,
} from '@/services/animalAdminService'

import AnimalTypesList from './AnimalTypesList'
import AnimalTypeDialog from './AnimalTypeDialog'
import TagColorsList from './TagColorsList'
import TagColorDialog from './TagColorDialog'
import TagTypesList from './TagTypesList'
import TagTypeDialog from './TagTypeDialog'
import TagCodesList from './TagCodesList'
import TagCodeDialog from './TagCodeDialog'
import BulkTagCodeDialog from './BulkTagCodeDialog'

type TabKey = 'animal-types' | 'tag-colors' | 'tag-types' | 'tag-codes'

const tabs = [
  { key: 'animal-types', label: 'Animal Types' },
  { key: 'tag-colors', label: 'Tag Colors' },
  { key: 'tag-types', label: 'Tag Types' },
  { key: 'tag-codes', label: 'Tag Codes' },
]

export default function AnimalAdmin() {
  const [activeTab, setActiveTab] = useState<TabKey>('animal-types')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Data
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([])
  const [tagColors, setTagColors] = useState<TagColor[]>([])
  const [tagTypes, setTagTypes] = useState<TagType[]>([])
  const [tagCodes, setTagCodes] = useState<TagAnimalColor[]>([])

  // Search states
  const [animalTypeSearch, setAnimalTypeSearch] = useState('')
  const [tagColorSearch, setTagColorSearch] = useState('')
  const [tagTypeSearch, setTagTypeSearch] = useState('')
  const [tagCodeSearch, setTagCodeSearch] = useState('')

  // ─── Animal Type form state ────────────────────────────────────────────────
  const [showAnimalTypeDialog, setShowAnimalTypeDialog] = useState(false)
  const [editingAnimalTypeId, setEditingAnimalTypeId] = useState<string | null>(
    null
  )
  const [formAnimalName, setFormAnimalName] = useState('')
  const [animalTypeLoading, setAnimalTypeLoading] = useState(false)

  // ─── Tag Color form state ──────────────────────────────────────────────────
  const [showTagColorDialog, setShowTagColorDialog] = useState(false)
  const [editingTagColorId, setEditingTagColorId] = useState<string | null>(
    null
  )
  const [formColorName, setFormColorName] = useState('')
  const [formColorHex, setFormColorHex] = useState('#FF0000')
  const [tagColorLoading, setTagColorLoading] = useState(false)

  // ─── Tag Type form state ───────────────────────────────────────────────────
  const [showTagTypeDialog, setShowTagTypeDialog] = useState(false)
  const [editingTagTypeId, setEditingTagTypeId] = useState<string | null>(null)
  const [formType, setFormType] = useState('')
  const [tagTypeLoading, setTagTypeLoading] = useState(false)

  // ─── Tag Code form state ───────────────────────────────────────────────────
  const [showTagCodeDialog, setShowTagCodeDialog] = useState(false)
  const [showBulkTagCodeDialog, setShowBulkTagCodeDialog] = useState(false)
  const [editingTagCodeId, setEditingTagCodeId] = useState<string | null>(null)
  const [formAnimalTypeId, setFormAnimalTypeId] = useState('')
  const [formTagColorId, setFormTagColorId] = useState('')
  const [formTagTypeId, setFormTagTypeId] = useState('')
  const [formTagCode, setFormTagCode] = useState('')
  const [tagCodeLoading, setTagCodeLoading] = useState(false)
  // Bulk creation
  const [formBulkAnimalTypeId, setFormBulkAnimalTypeId] = useState('')
  const [formBulkTagColorId, setFormBulkTagColorId] = useState('')
  const [formBulkTagTypeId, setFormBulkTagTypeId] = useState('')
  const [formBulkStartNumber, setFormBulkStartNumber] = useState('1')
  const [formBulkCount, setFormBulkCount] = useState('100')
  const [bulkLoading, setBulkLoading] = useState(false)

  // ─── Load all data ─────────────────────────────────────────────────────────

  const loadAllData = async () => {
    setIsLoading(true)
    setError('')
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
      setTagCodes(codes)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // ─── Animal Type handlers ──────────────────────────────────────────────────

  const handleOpenAnimalTypeDialog = (animalType?: AnimalType) => {
    if (animalType) {
      setEditingAnimalTypeId(animalType.id)
      setFormAnimalName(animalType.animal_name)
    } else {
      setEditingAnimalTypeId(null)
      setFormAnimalName('')
    }
    setShowAnimalTypeDialog(true)
  }

  const handleCloseAnimalTypeDialog = () => {
    setShowAnimalTypeDialog(false)
    setEditingAnimalTypeId(null)
    setFormAnimalName('')
  }

  const handleSaveAnimalType = async () => {
    if (!formAnimalName.trim()) {
      alert('Please enter an animal name')
      return
    }

    setAnimalTypeLoading(true)
    try {
      if (editingAnimalTypeId) {
        await updateAnimalType(editingAnimalTypeId, formAnimalName.trim())
      } else {
        await createAnimalType(formAnimalName.trim())
      }
      await fetchAnimalTypes().then(setAnimalTypes)
      handleCloseAnimalTypeDialog()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save animal type'
      alert(message)
    } finally {
      setAnimalTypeLoading(false)
    }
  }

  const handleDeleteAnimalType = async (id: string) => {
    if (!confirm('Delete this animal type?')) return
    try {
      await deleteAnimalType(id)
      await fetchAnimalTypes().then(setAnimalTypes)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete animal type'
      alert(message)
    }
  }

  // ─── Tag Color handlers ────────────────────────────────────────────────────

  const handleOpenTagColorDialog = (tagColor?: TagColor) => {
    if (tagColor) {
      setEditingTagColorId(tagColor.id)
      setFormColorName(tagColor.color_name)
      setFormColorHex(tagColor.color)
    } else {
      setEditingTagColorId(null)
      setFormColorName('')
      setFormColorHex('#FF0000')
    }
    setShowTagColorDialog(true)
  }

  const handleCloseTagColorDialog = () => {
    setShowTagColorDialog(false)
    setEditingTagColorId(null)
    setFormColorName('')
    setFormColorHex('#FF0000')
  }

  const handleSaveTagColor = async () => {
    if (!formColorName.trim()) {
      alert('Please enter a color name')
      return
    }
    if (!formColorHex.trim()) {
      alert('Please select a color')
      return
    }

    setTagColorLoading(true)
    try {
      if (editingTagColorId) {
        await updateTagColor(editingTagColorId, formColorName.trim(), formColorHex.trim())
      } else {
        await createTagColor(formColorName.trim(), formColorHex.trim())
      }
      await fetchTagColors().then(setTagColors)
      handleCloseTagColorDialog()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save tag color'
      alert(message)
    } finally {
      setTagColorLoading(false)
    }
  }

  const handleDeleteTagColor = async (id: string) => {
    if (!confirm('Delete this tag color?')) return
    try {
      await deleteTagColor(id)
      await fetchTagColors().then(setTagColors)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete tag color'
      alert(message)
    }
  }

  // ─── Tag Type handlers ─────────────────────────────────────────────────────

  const handleOpenTagTypeDialog = (tagType?: TagType) => {
    if (tagType) {
      setEditingTagTypeId(tagType.id)
      setFormType(tagType.type)
    } else {
      setEditingTagTypeId(null)
      setFormType('')
    }
    setShowTagTypeDialog(true)
  }

  const handleCloseTagTypeDialog = () => {
    setShowTagTypeDialog(false)
    setEditingTagTypeId(null)
    setFormType('')
  }

  const handleSaveTagType = async () => {
    if (!formType.trim()) {
      alert('Please enter a tag type')
      return
    }

    setTagTypeLoading(true)
    try {
      if (editingTagTypeId) {
        await updateTagType(editingTagTypeId, formType.trim())
      } else {
        await createTagType(formType.trim())
      }
      await fetchTagTypes().then(setTagTypes)
      handleCloseTagTypeDialog()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save tag type'
      alert(message)
    } finally {
      setTagTypeLoading(false)
    }
  }

  const handleDeleteTagType = async (id: string) => {
    if (!confirm('Delete this tag type?')) return
    try {
      await deleteTagType(id)
      await fetchTagTypes().then(setTagTypes)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete tag type'
      alert(message)
    }
  }

  // ─── Tag Code handlers ─────────────────────────────────────────────────────

  const handleOpenTagCodeDialog = (tagCode?: TagAnimalColor) => {
    if (tagCode) {
      setEditingTagCodeId(tagCode.id)
      setFormAnimalTypeId(tagCode.animal_type_id)
      setFormTagColorId(tagCode.tag_color_id)
      setFormTagTypeId(tagCode.tag_type_id)
      setFormTagCode(tagCode.tag_code.toString())
    } else {
      setEditingTagCodeId(null)
      setFormAnimalTypeId('')
      setFormTagColorId('')
      setFormTagTypeId('')
      setFormTagCode('')
    }
    setShowTagCodeDialog(true)
  }

  const handleCloseTagCodeDialog = () => {
    setShowTagCodeDialog(false)
    setEditingTagCodeId(null)
    setFormAnimalTypeId('')
    setFormTagColorId('')
    setFormTagTypeId('')
    setFormTagCode('')
  }

  const handleSaveTagCode = async () => {
    if (
      !formAnimalTypeId ||
      !formTagColorId ||
      !formTagTypeId ||
      !formTagCode.trim()
    ) {
      alert('Please fill in all fields')
      return
    }

    setTagCodeLoading(true)
    try {
      const tagCodeNum = parseInt(formTagCode)
      if (isNaN(tagCodeNum)) {
        alert('Tag code must be a valid number')
        setTagCodeLoading(false)
        return
      }

      const payload = {
        animal_type_id: formAnimalTypeId,
        tag_color_id: formTagColorId,
        tag_type_id: formTagTypeId,
        tag_code: tagCodeNum,
      }

      if (editingTagCodeId) {
        await updateTagAnimalColor(editingTagCodeId, payload)
      } else {
        await createTagAnimalColor(payload)
      }
      await fetchTagAnimalColors().then(setTagCodes)
      handleCloseTagCodeDialog()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save tag code'
      alert(message)
    } finally {
      setTagCodeLoading(false)
    }
  }

  const handleDeleteTagCode = async (id: string) => {
    if (!confirm('Delete this tag code?')) return
    try {
      await deleteTagAnimalColor(id)
      await fetchTagAnimalColors().then(setTagCodes)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete tag code'
      alert(message)
    }
  }

  // ─── Bulk Tag Code handlers ────────────────────────────────────────────────

  const handleOpenBulkTagCodeDialog = () => {
    setFormBulkAnimalTypeId('')
    setFormBulkTagColorId('')
    setFormBulkTagTypeId('')
    setFormBulkStartNumber('1')
    setFormBulkCount('100')
    setShowBulkTagCodeDialog(true)
  }

  const handleCloseBulkTagCodeDialog = () => {
    setShowBulkTagCodeDialog(false)
  }

  const handleBulkCreateTagCodes = async () => {
    if (!formBulkAnimalTypeId || !formBulkTagColorId || !formBulkTagTypeId) {
      alert('Please select all fields')
      return
    }

    const startNum = parseInt(formBulkStartNumber)
    const count = parseInt(formBulkCount)

    if (isNaN(startNum) || isNaN(count) || count <= 0) {
      alert('Please enter valid numbers')
      return
    }

    setBulkLoading(true)
    try {
      await bulkCreateTagCodes({
        animal_type_id: formBulkAnimalTypeId,
        tag_color_id: formBulkTagColorId,
        tag_type_id: formBulkTagTypeId,
        start_number: startNum,
        count: count,
      })
      await fetchTagAnimalColors().then(setTagCodes)
      handleCloseBulkTagCodeDialog()
      alert(`Successfully created ${count} tag codes`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to bulk create tag codes'
      alert(message)
    } finally {
      setBulkLoading(false)
    }
  }

  // ─── Filter data ───────────────────────────────────────────────────────────

  const filteredAnimalTypes = animalTypes.filter((at) =>
    at.animal_name.toLowerCase().includes(animalTypeSearch.toLowerCase())
  )

  const filteredTagColors = tagColors.filter((tc) =>
    tc.color.toLowerCase().includes(tagColorSearch.toLowerCase())
  )

  const filteredTagTypes = tagTypes.filter((tt) =>
    tt.type.toLowerCase().includes(tagTypeSearch.toLowerCase())
  )

  const filteredTagCodes = tagCodes.filter((tac) => {
    const searchLower = tagCodeSearch.toLowerCase()
    const animalName =
      tac.animal_types?.animal_name?.toLowerCase() || ''
    const color = tac.tag_colors?.color?.toLowerCase() || ''
    const type = tac.tag_types?.type?.toLowerCase() || ''
    const code = tac.tag_code.toString().toLowerCase()

    return (
      animalName.includes(searchLower) ||
      color.includes(searchLower) ||
      type.includes(searchLower) ||
      code.includes(searchLower)
    )
  })

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        icon={<Settings className="w-6 h-6" />} 
        title="Animal Administration" 
        subtitle="Manage animal types, tag colors, tag types, and tag codes"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <StatsRow>
        <StatCard
          label="Animal Types"
          value={animalTypes.length}
          color="default"
        />
        <StatCard
          label="Tag Colors"
          value={tagColors.length}
          color="success"
        />
        <StatCard label="Tag Types" value={tagTypes.length} color="default" />
        <StatCard
          label="Total Tag Codes"
          value={tagCodes.length}
          color="warning"
        />
      </StatsRow>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabKey)}
      />

      {/* ─── Animal Types Tab ─────────────────────────────────────────── */}
      {activeTab === 'animal-types' && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={() => handleOpenAnimalTypeDialog()}>
              <Plus className="w-4 h-4" />
              Add Animal Type
            </PrimaryButton>
            <PrimaryButton onClick={loadAllData}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </PrimaryButton>
          </ActionsBar>

          <AnimalTypesList
            animalTypes={filteredAnimalTypes}
            search={animalTypeSearch}
            onSearchChange={setAnimalTypeSearch}
            onEdit={handleOpenAnimalTypeDialog}
            onDelete={handleDeleteAnimalType}
            isLoading={isLoading}
          />

          <AnimalTypeDialog
            open={showAnimalTypeDialog}
            onClose={handleCloseAnimalTypeDialog}
            animalName={formAnimalName}
            onAnimalNameChange={setFormAnimalName}
            onSave={handleSaveAnimalType}
            isEditing={!!editingAnimalTypeId}
            isLoading={animalTypeLoading}
          />
        </>
      )}

      {/* ─── Tag Colors Tab ───────────────────────────────────────────── */}
      {activeTab === 'tag-colors' && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={() => handleOpenTagColorDialog()}>
              <Plus className="w-4 h-4" />
              Add Tag Color
            </PrimaryButton>
            <PrimaryButton onClick={loadAllData}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </PrimaryButton>
          </ActionsBar>

          <TagColorsList
            tagColors={filteredTagColors}
            search={tagColorSearch}
            onSearchChange={setTagColorSearch}
            onEdit={handleOpenTagColorDialog}
            onDelete={handleDeleteTagColor}
            isLoading={isLoading}
          />

          <TagColorDialog
            open={showTagColorDialog}
            onClose={handleCloseTagColorDialog}
            colorName={formColorName}
            colorHex={formColorHex}
            onColorNameChange={setFormColorName}
            onColorHexChange={setFormColorHex}
            onSave={handleSaveTagColor}
            isEditing={!!editingTagColorId}
            isLoading={tagColorLoading}
          />
        </>
      )}

      {/* ─── Tag Types Tab ────────────────────────────────────────────── */}
      {activeTab === 'tag-types' && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={() => handleOpenTagTypeDialog()}>
              <Plus className="w-4 h-4" />
              Add Tag Type
            </PrimaryButton>
            <PrimaryButton onClick={loadAllData}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </PrimaryButton>
          </ActionsBar>

          <TagTypesList
            tagTypes={filteredTagTypes}
            search={tagTypeSearch}
            onSearchChange={setTagTypeSearch}
            onEdit={handleOpenTagTypeDialog}
            onDelete={handleDeleteTagType}
            isLoading={isLoading}
          />

          <TagTypeDialog
            open={showTagTypeDialog}
            onClose={handleCloseTagTypeDialog}
            type={formType}
            onTypeChange={setFormType}
            onSave={handleSaveTagType}
            isEditing={!!editingTagTypeId}
            isLoading={tagTypeLoading}
          />
        </>
      )}

      {/* ─── Tag Codes Tab ────────────────────────────────────────────── */}
      {activeTab === 'tag-codes' && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={() => handleOpenTagCodeDialog()}>
              <Plus className="w-4 h-4" />
              Add Single Tag Code
            </PrimaryButton>
            <PrimaryButton onClick={handleOpenBulkTagCodeDialog}>
              <Plus className="w-4 h-4" />
              Bulk Create Tag Codes
            </PrimaryButton>
            <PrimaryButton onClick={loadAllData}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </PrimaryButton>
          </ActionsBar>

          <TagCodesList
            tagCodes={filteredTagCodes}
            search={tagCodeSearch}
            onSearchChange={setTagCodeSearch}
            onEdit={handleOpenTagCodeDialog}
            onDelete={handleDeleteTagCode}
            isLoading={isLoading}
          />

          <TagCodeDialog
            open={showTagCodeDialog}
            onClose={handleCloseTagCodeDialog}
            animalTypeId={formAnimalTypeId}
            tagColorId={formTagColorId}
            tagTypeId={formTagTypeId}
            tagCode={formTagCode}
            onAnimalTypeIdChange={setFormAnimalTypeId}
            onTagColorIdChange={setFormTagColorId}
            onTagTypeIdChange={setFormTagTypeId}
            onTagCodeChange={setFormTagCode}
            animalTypes={animalTypes}
            tagColors={tagColors}
            tagTypes={tagTypes}
            onSave={handleSaveTagCode}
            isEditing={!!editingTagCodeId}
            isLoading={tagCodeLoading}
          />

          <BulkTagCodeDialog
            open={showBulkTagCodeDialog}
            onClose={handleCloseBulkTagCodeDialog}
            animalTypeId={formBulkAnimalTypeId}
            tagColorId={formBulkTagColorId}
            tagTypeId={formBulkTagTypeId}
            startNumber={formBulkStartNumber}
            count={formBulkCount}
            onAnimalTypeIdChange={setFormBulkAnimalTypeId}
            onTagColorIdChange={setFormBulkTagColorId}
            onTagTypeIdChange={setFormBulkTagTypeId}
            onStartNumberChange={setFormBulkStartNumber}
            onCountChange={setFormBulkCount}
            animalTypes={animalTypes}
            tagColors={tagColors}
            tagTypes={tagTypes}
            onSave={handleBulkCreateTagCodes}
            isLoading={bulkLoading}
          />
        </>
      )}
    </div>
  )
}

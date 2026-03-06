import { useState, useEffect, useCallback } from 'react'
import { Settings, Plus, RefreshCw, Palette, Tag, Tags, Hash, PawPrint } from 'lucide-react'
import { PageHeader } from '@/components/ui'
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
import { useAuthStore } from '@/store/authStore'
import { getUserFacilityInfo } from '@/services/facilityFilterService'

import AnimalTypesList from '../components/lists/AnimalTypesList'
import AnimalTypeDialog from '../components/dialogs/AnimalTypeDialog'
import TagColorsList from '../components/lists/TagColorsList'
import TagColorDialog from '../components/dialogs/TagColorDialog'
import TagTypesList from '../components/lists/TagTypesList'
import TagTypeDialog from '../components/dialogs/TagTypeDialog'
import TagCodesList from '../components/lists/TagCodesList'
import TagCodeDialog from '../components/dialogs/TagCodeDialog'
import BulkTagCodeDialog from '../components/dialogs/BulkTagCodeDialog'

type TabKey = 'animal-types' | 'tag-colors' | 'tag-types' | 'tag-codes'

export default function AnimalAdmin() {
  const { user } = useAuthStore()
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

  const loadAllData = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    setError('')
    try {
      const [types, colors, tagTypesData, codes] = await Promise.all([
        fetchAnimalTypes(user.id),
        fetchTagColors(user.id),
        fetchTagTypes(user.id),
        fetchTagAnimalColors(user.id),
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
  }, [user?.id])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

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
    if (!user?.id) { alert('User not authenticated'); return }
    if (!formAnimalName.trim()) {
      alert('Please enter an animal name')
      return
    }

    setAnimalTypeLoading(true)
    try {
      if (editingAnimalTypeId) {
        await updateAnimalType(editingAnimalTypeId, formAnimalName.trim(), user.id)
      } else {
        await createAnimalType(formAnimalName.trim(), user.id)
      }
      await fetchAnimalTypes(user.id).then(setAnimalTypes)
      handleCloseAnimalTypeDialog()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save animal type'
      alert(message)
    } finally {
      setAnimalTypeLoading(false)
    }
  }

  const handleDeleteAnimalType = async (id: string) => {
    if (!confirm('Delete this animal type?') || !user?.id) return
    try {
      await deleteAnimalType(id, user.id)
      await fetchAnimalTypes(user.id).then(setAnimalTypes)
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
    if (!user?.id) { alert('User not authenticated'); return }
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
        await updateTagColor(editingTagColorId, formColorName.trim(), formColorHex.trim(), user.id)
      } else {
        await createTagColor(formColorName.trim(), formColorHex.trim(), user.id)
      }
      await fetchTagColors(user.id).then(setTagColors)
      handleCloseTagColorDialog()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save tag color'
      alert(message)
    } finally {
      setTagColorLoading(false)
    }
  }

  const handleDeleteTagColor = async (id: string) => {
    if (!confirm('Delete this tag color?') || !user?.id) return
    try {
      await deleteTagColor(id, user.id)
      await fetchTagColors(user.id).then(setTagColors)
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
    if (!user?.id) { alert('User not authenticated'); return }
    if (!formType.trim()) {
      alert('Please enter a tag type')
      return
    }

    setTagTypeLoading(true)
    try {
      if (editingTagTypeId) {
        await updateTagType(editingTagTypeId, formType.trim(), user.id)
      } else {
        await createTagType(formType.trim(), user.id)
      }
      await fetchTagTypes(user.id).then(setTagTypes)
      handleCloseTagTypeDialog()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save tag type'
      alert(message)
    } finally {
      setTagTypeLoading(false)
    }
  }

  const handleDeleteTagType = async (id: string) => {
    if (!confirm('Delete this tag type?') || !user?.id) return
    try {
      await deleteTagType(id, user.id)
      await fetchTagTypes(user.id).then(setTagTypes)
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
    if (!user?.id) {
      alert('User not authenticated')
      return
    }

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

      // Get user's facility ID for insert
      const { insertId } = await getUserFacilityInfo(user.id)
      if (!insertId) {
        throw new Error('User is not assigned to any facility')
      }
      const userFacilityId = insertId

      const payload = {
        animal_type_id: formAnimalTypeId,
        tag_color_id: formTagColorId,
        tag_type_id: formTagTypeId,
        tag_code: tagCodeNum,
        user_facility_id: userFacilityId,
      }

      if (editingTagCodeId) {
        await updateTagAnimalColor(editingTagCodeId, user.id, payload)
      } else {
        await createTagAnimalColor(payload)
      }
      await fetchTagAnimalColors(user.id).then(setTagCodes)
      handleCloseTagCodeDialog()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save tag code'
      alert(message)
    } finally {
      setTagCodeLoading(false)
    }
  }

  const handleDeleteTagCode = async (id: string) => {
    if (!confirm('Delete this tag code?') || !user?.id) return
    try {
      await deleteTagAnimalColor(id, user.id)
      await fetchTagAnimalColors(user.id).then(setTagCodes)
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
    if (!user?.id) {
      alert('User not authenticated')
      return
    }

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
      // Get user's facility ID for insert
      const { insertId } = await getUserFacilityInfo(user.id)
      if (!insertId) {
        throw new Error('User is not assigned to any facility')
      }
      const userFacilityId = insertId

      await bulkCreateTagCodes({
        animal_type_id: formBulkAnimalTypeId,
        tag_color_id: formBulkTagColorId,
        tag_type_id: formBulkTagTypeId,
        start_number: startNum,
        count: count,
        user_facility_id: userFacilityId,
      })
      await fetchTagAnimalColors(user.id).then(setTagCodes)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          icon={<Settings className="w-7 h-7" />} 
          title="Animal Administration" 
          subtitle="Manage animal types, tag colors, tag types, and tag codes"
        />

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg shadow-sm animate-in slide-in-from-top">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Enhanced Stats Cards with Gradients and Icons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <PawPrint className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {animalTypes.length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Animal Types</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {tagColors.length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Tag Colors</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {tagTypes.length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Tag Types</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg">
                  <Hash className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  {tagCodes.length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Total Tag Codes</p>
            </div>
          </div>
        </div>

        {/* Modern Enhanced Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <nav className="flex space-x-2 px-6 pt-4">
              {[
                { key: 'animal-types', label: 'Animal Types', icon: PawPrint },
                { key: 'tag-colors', label: 'Tag Colors', icon: Palette },
                { key: 'tag-types', label: 'Tag Types', icon: Tag },
                { key: 'tag-codes', label: 'Tag Codes', icon: Tags }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`
                    flex items-center gap-2 px-5 py-3 font-medium text-sm rounded-t-xl transition-all duration-200
                    ${activeTab === tab.key 
                      ? 'bg-white text-green-600 border-t-2 border-x border-green-500 shadow-sm -mb-px' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* ─── Animal Types Tab ─────────────────────────────────────────── */}
            {activeTab === 'animal-types' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Manage Animal Types</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={loadAllData}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() => handleOpenAnimalTypeDialog()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Animal Type
                    </button>
                  </div>
                </div>

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
              </div>
            )}

            {/* ─── Tag Colors Tab ───────────────────────────────────────────── */}
            {activeTab === 'tag-colors' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Manage Tag Colors</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={loadAllData}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() => handleOpenTagColorDialog()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Tag Color
                    </button>
                  </div>
                </div>

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
              </div>
            )}

            {/* ─── Tag Types Tab ────────────────────────────────────────────── */}
            {activeTab === 'tag-types' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Manage Tag Types</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={loadAllData}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() => handleOpenTagTypeDialog()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Tag Type
                    </button>
                  </div>
                </div>

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
              </div>
            )}

            {/* ─── Tag Codes Tab ────────────────────────────────────────────── */}
            {activeTab === 'tag-codes' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Manage Tag Codes</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={loadAllData}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() => handleOpenTagCodeDialog()}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Single Tag Code
                    </button>
                    <button
                      onClick={handleOpenBulkTagCodeDialog}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    >
                      <Tags className="w-4 h-4" />
                      Bulk Create Tag Codes
                    </button>
                  </div>
                </div>

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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

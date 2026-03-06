import { BaseDialog } from '@/components/ui/dialog'
import type { AnimalType, TagColor, TagType } from '@/services/animalAdminService'

interface TagCodeDialogProps {
  open: boolean
  onClose: () => void
  animalTypeId: string
  tagColorId: string
  tagTypeId: string
  tagCode: string
  onAnimalTypeIdChange: (value: string) => void
  onTagColorIdChange: (value: string) => void
  onTagTypeIdChange: (value: string) => void
  onTagCodeChange: (value: string) => void
  animalTypes: AnimalType[]
  tagColors: TagColor[]
  tagTypes: TagType[]
  onSave: () => void
  isEditing: boolean
  isLoading: boolean
}

export default function TagCodeDialog({
  open,
  onClose,
  animalTypeId,
  tagColorId,
  tagTypeId,
  tagCode,
  onAnimalTypeIdChange,
  onTagColorIdChange,
  onTagTypeIdChange,
  onTagCodeChange,
  animalTypes,
  tagColors,
  tagTypes,
  onSave,
  isEditing,
  isLoading,
}: TagCodeDialogProps) {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Tag Code' : 'Add Tag Code'}
      onSubmit={onSave}
      submitLabel={isLoading ? 'Saving...' : 'Save'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Animal Type *
          </label>
          <select
            value={animalTypeId}
            onChange={(e) => onAnimalTypeIdChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">Select Animal Type</option>
            {animalTypes.map((at) => (
              <option key={at.id} value={at.id}>
                {at.animal_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tag Color *
          </label>
          <select
            value={tagColorId}
            onChange={(e) => onTagColorIdChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">Select Tag Color</option>
            {tagColors.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {tc.color}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tag Type *
          </label>
          <select
            value={tagTypeId}
            onChange={(e) => onTagTypeIdChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">Select Tag Type</option>
            {tagTypes.map((tt) => (
              <option key={tt.id} value={tt.id}>
                {tt.type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tag Code *
          </label>
          <input
            type="number"
            value={tagCode}
            onChange={(e) => onTagCodeChange(e.target.value)}
            placeholder="e.g., 1, 2, 3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a numeric code (e.g., 1, 2, 3). It will be combined with the tag type.
          </p>
        </div>

        {tagTypeId && tagCode && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Preview:</span>{' '}
              {tagTypes.find((tt) => tt.id === tagTypeId)?.type}-{parseInt(tagCode)}
            </p>
          </div>
        )}
      </div>
    </BaseDialog>
  )
}

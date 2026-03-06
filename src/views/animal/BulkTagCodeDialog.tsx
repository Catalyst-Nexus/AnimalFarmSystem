import { BaseDialog } from '@/components/ui/dialog'
import type { AnimalType, TagColor, TagType } from '@/services/animalAdminService'

interface BulkTagCodeDialogProps {
  open: boolean
  onClose: () => void
  animalTypeId: string
  tagColorId: string
  tagTypeId: string
  startNumber: string
  count: string
  onAnimalTypeIdChange: (value: string) => void
  onTagColorIdChange: (value: string) => void
  onTagTypeIdChange: (value: string) => void
  onStartNumberChange: (value: string) => void
  onCountChange: (value: string) => void
  animalTypes: AnimalType[]
  tagColors: TagColor[]
  tagTypes: TagType[]
  onSave: () => void
  isLoading: boolean
}

export default function BulkTagCodeDialog({
  open,
  onClose,
  animalTypeId,
  tagColorId,
  tagTypeId,
  startNumber,
  count,
  onAnimalTypeIdChange,
  onTagColorIdChange,
  onTagTypeIdChange,
  onStartNumberChange,
  onCountChange,
  animalTypes,
  tagColors,
  tagTypes,
  onSave,
  isLoading,
}: BulkTagCodeDialogProps) {
  const selectedTagType = tagTypes.find((tt) => tt.id === tagTypeId)
  const startNum = parseInt(startNumber) || 1
  const numCount = parseInt(count) || 0

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Bulk Create Tag Codes"
      onSubmit={onSave}
      submitLabel={isLoading ? 'Creating...' : 'Create Tags'}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Number *
            </label>
            <input
              type="number"
              value={startNumber}
              onChange={(e) => onStartNumberChange(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Count *
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => onCountChange(e.target.value)}
              min="1"
              max="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>

        {selectedTagType && numCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Preview:</span>
            </p>
            <p className="text-xs text-gray-600">
              Will create {numCount} tags from{' '}
              <span className="font-mono">
                {selectedTagType.type}-{startNum}
              </span>{' '}
              to{' '}
              <span className="font-mono">
                {selectedTagType.type}-{startNum + numCount - 1}
              </span>
            </p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-xs text-yellow-800">
            <span className="font-medium">Note:</span> Tag codes can be reused
            across different animal types. This allows you to create 100 tags for
            pigs and 100 tags for chickens with the same codes.
          </p>
        </div>
      </div>
    </BaseDialog>
  )
}

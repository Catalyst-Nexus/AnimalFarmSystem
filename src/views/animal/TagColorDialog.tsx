import { BaseDialog } from '@/components/ui/dialog'

interface TagColorDialogProps {
  open: boolean
  onClose: () => void
  color: string
  onColorChange: (value: string) => void
  onSave: () => void
  isEditing: boolean
  isLoading: boolean
}

export default function TagColorDialog({
  open,
  onClose,
  color,
  onColorChange,
  onSave,
  isEditing,
  isLoading,
}: TagColorDialogProps) {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Tag Color' : 'Add Tag Color'}
      onSubmit={onSave}
      submitLabel={isLoading ? 'Saving...' : 'Save'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color Name *
          </label>
          <input
            type="text"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            placeholder="e.g., Red, Blue, Green, Yellow"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
      </div>
    </BaseDialog>
  )
}

import { BaseDialog } from '@/components/ui/dialog'

interface TagColorDialogProps {
  open: boolean
  onClose: () => void
  colorName: string
  colorHex: string
  onColorNameChange: (value: string) => void
  onColorHexChange: (value: string) => void
  onSave: () => void
  isEditing: boolean
  isLoading: boolean
}

export default function TagColorDialog({
  open,
  onClose,
  colorName,
  colorHex,
  onColorNameChange,
  onColorHexChange,
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
            value={colorName}
            onChange={(e) => onColorNameChange(e.target.value)}
            placeholder="e.g., Red, Blue, Green, Yellow"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color *
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => onColorHexChange(e.target.value)}
              className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
              disabled={isLoading}
            />
            <input
              type="text"
              value={colorHex}
              onChange={(e) => onColorHexChange(e.target.value)}
              placeholder="#FF0000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </BaseDialog>
  )
}

import { BaseDialog } from '@/components/ui/dialog'

interface TagTypeDialogProps {
  open: boolean
  onClose: () => void
  type: string
  onTypeChange: (value: string) => void
  onSave: () => void
  isEditing: boolean
  isLoading: boolean
}

export default function TagTypeDialog({
  open,
  onClose,
  type,
  onTypeChange,
  onSave,
  isEditing,
  isLoading,
}: TagTypeDialogProps) {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Tag Type' : 'Add Tag Type'}
      onSubmit={onSave}
      submitLabel={isLoading ? 'Saving...' : 'Save'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tag Type (Prefix) *
          </label>
          <input
            type="text"
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            placeholder="e.g., TAG, EAR, RFID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be the prefix before the tag code (e.g., TAG-001)
          </p>
        </div>
      </div>
    </BaseDialog>
  )
}

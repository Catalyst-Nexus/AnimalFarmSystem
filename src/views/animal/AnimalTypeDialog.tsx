import { BaseDialog } from '@/components/ui/dialog'

interface AnimalTypeDialogProps {
  open: boolean
  onClose: () => void
  animalName: string
  onAnimalNameChange: (value: string) => void
  onSave: () => void
  isEditing: boolean
  isLoading: boolean
}

export default function AnimalTypeDialog({
  open,
  onClose,
  animalName,
  onAnimalNameChange,
  onSave,
  isEditing,
  isLoading,
}: AnimalTypeDialogProps) {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Animal Type' : 'Add Animal Type'}
      onSubmit={onSave}
      submitLabel={isLoading ? 'Saving...' : 'Save'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Animal Name *
          </label>
          <input
            type="text"
            value={animalName}
            onChange={(e) => onAnimalNameChange(e.target.value)}
            placeholder="e.g., Pig, Chicken, Cow"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
      </div>
    </BaseDialog>
  )
}

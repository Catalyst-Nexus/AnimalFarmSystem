import { BaseDialog, FormInput } from '@/components/ui/dialog'

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
        <FormInput
          id="animal-name"
          label="Animal Name"
          value={animalName}
          onChange={onAnimalNameChange}
          placeholder="e.g., Pig, Chicken, Cow"
          required
          disabled={isLoading}
        />
      </div>
    </BaseDialog>
  )
}

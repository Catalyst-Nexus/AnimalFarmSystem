import { BaseDialog, FormInput, FormColorPicker } from '@/components/ui/dialog'

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
        <FormInput
          id="color-name"
          label="Color Name"
          value={colorName}
          onChange={onColorNameChange}
          placeholder="e.g., Red, Blue, Green, Yellow"
          required
          disabled={isLoading}
        />
        <FormColorPicker
          id="color-hex"
          label="Color"
          value={colorHex}
          onChange={onColorHexChange}
          required
          disabled={isLoading}
        />
      </div>
    </BaseDialog>
  )
}

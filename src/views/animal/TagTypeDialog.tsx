import { BaseDialog, FormInput } from '@/components/ui/dialog'

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
        <FormInput
          id="tag-type"
          label="Tag Type (Prefix)"
          value={type}
          onChange={onTypeChange}
          placeholder="e.g., TAG, EAR, RFID"
          description="This will be the prefix before the tag code (e.g., TAG-001)"
          required
          disabled={isLoading}
        />
      </div>
    </BaseDialog>
  )
}

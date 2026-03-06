import { BaseDialog, FormSelect, FormNumber, FormPreview } from '@/components/ui/dialog'
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
        <FormSelect
          id="animal-type"
          label="Animal Type"
          value={animalTypeId}
          onChange={onAnimalTypeIdChange}
          options={animalTypes.map((at) => ({ value: at.id, label: at.animal_name }))}
          placeholder="Select Animal Type"
          required
          disabled={isLoading}
        />

        <FormSelect
          id="tag-color"
          label="Tag Color"
          value={tagColorId}
          onChange={onTagColorIdChange}
          options={tagColors.map((tc) => ({ value: tc.id, label: tc.color }))}
          placeholder="Select Tag Color"
          required
          disabled={isLoading}
        />

        <FormSelect
          id="tag-type"
          label="Tag Type"
          value={tagTypeId}
          onChange={onTagTypeIdChange}
          options={tagTypes.map((tt) => ({ value: tt.id, label: tt.type }))}
          placeholder="Select Tag Type"
          required
          disabled={isLoading}
        />

        <FormNumber
          id="tag-code"
          label="Tag Code"
          value={tagCode}
          onChange={onTagCodeChange}
          placeholder="e.g., 1, 2, 3"
          description="Enter a numeric code (e.g., 1, 2, 3). It will be combined with the tag type."
          min={1}
          required
          disabled={isLoading}
        />

        {tagTypeId && tagCode && (
          <FormPreview>
            <p className="text-sm">
              <span className="font-medium">Preview:</span>{' '}
              {tagTypes.find((tt) => tt.id === tagTypeId)?.type}-{parseInt(tagCode)}
            </p>
          </FormPreview>
        )}
      </div>
    </BaseDialog>
  )
}

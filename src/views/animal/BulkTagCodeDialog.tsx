import { BaseDialog, FormSelect, FormNumber, FormPreview } from '@/components/ui/dialog'
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

        <div className="grid grid-cols-2 gap-4">
          <FormNumber
            id="start-number"
            label="Start Number"
            value={startNumber}
            onChange={onStartNumberChange}
            min={1}
            required
            disabled={isLoading}
          />

          <FormNumber
            id="count"
            label="Count"
            value={count}
            onChange={onCountChange}
            min={1}
            max={1000}
            required
            disabled={isLoading}
          />
        </div>

        {selectedTagType && numCount > 0 && (
          <FormPreview>
            <p className="text-sm mb-2">
              <span className="font-medium">Preview:</span>
            </p>
            <p className="text-xs">
              Will create {numCount} tags from{' '}
              <span className="font-mono">
                {selectedTagType.type}-{startNum}
              </span>{' '}
              to{' '}
              <span className="font-mono">
                {selectedTagType.type}-{startNum + numCount - 1}
              </span>
            </p>
          </FormPreview>
        )}

        <FormPreview variant="warning">
          <p className="text-xs">
            <span className="font-medium">Note:</span> Tag codes can be reused
            across different animal types. This allows you to create 100 tags for
            pigs and 100 tags for chickens with the same codes.
          </p>
        </FormPreview>
      </div>
    </BaseDialog>
  )
}

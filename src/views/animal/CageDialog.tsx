import { BaseDialog, FormInput, FormNumber, FormCheckbox } from '@/components/ui/dialog'

interface CageDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  cageLabel: string
  onCageLabelChange: (val: string) => void
  maxCapacity: string
  onMaxCapacityChange: (val: string) => void
  isActive: boolean
  onIsActiveChange: (val: boolean) => void
  editMode?: boolean
  isLoading?: boolean
}

export default function CageDialog({
  open,
  onClose,
  onSubmit,
  cageLabel,
  onCageLabelChange,
  maxCapacity,
  onMaxCapacityChange,
  isActive,
  onIsActiveChange,
  editMode = false,
  isLoading = false,
}: CageDialogProps) {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? 'Edit Cage' : 'Add Cage'}
      onSubmit={onSubmit}
      submitLabel={editMode ? 'Save Changes' : 'Add Cage'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <FormInput
          id="cage-label"
          label="Cage Label"
          value={cageLabel}
          onChange={onCageLabelChange}
          placeholder="e.g. Pen A, Cage 101"
          required
          disabled={isLoading}
        />

        <FormNumber
          id="max-capacity"
          label="Maximum Capacity"
          value={maxCapacity}
          onChange={onMaxCapacityChange}
          placeholder="e.g. 20"
          min={1}
          required
          disabled={isLoading}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Status
          </label>
          <FormCheckbox
            id="is-active"
            label="Active"
            checked={isActive}
            onChange={onIsActiveChange}
            description={
              isActive
                ? 'This cage is currently active and can be used for animal assignments.'
                : 'This cage is inactive and will not be available for animal assignments.'
            }
            disabled={isLoading}
          />
        </div>
      </div>
    </BaseDialog>
  )
}

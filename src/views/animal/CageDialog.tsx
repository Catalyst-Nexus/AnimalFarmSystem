import { BaseDialog, FormInput } from '@/components/ui/dialog'

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
        />

        <div className="space-y-1.5">
          <label
            htmlFor="max-capacity"
            className="block text-sm font-medium text-foreground"
          >
            Maximum Capacity <span className="text-error ml-1">*</span>
          </label>
          <input
            id="max-capacity"
            type="number"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={maxCapacity}
            onChange={(e) => onMaxCapacityChange(e.target.value)}
            placeholder="e.g. 20"
            min="1"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Status
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => onIsActiveChange(e.target.checked)}
                className="w-4 h-4 text-success border-border rounded focus:ring-success"
              />
              <span className="text-sm text-foreground">
                Active {isActive ? '✓' : ''}
              </span>
            </label>
          </div>
          <p className="text-xs text-muted mt-1">
            {isActive
              ? 'This cage is currently active and can be used for animal assignments.'
              : 'This cage is inactive and will not be available for animal assignments.'}
          </p>
        </div>
      </div>
    </BaseDialog>
  )
}

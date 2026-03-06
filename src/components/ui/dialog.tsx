import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface BaseDialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  onSubmit: () => void
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
}

export const BaseDialog = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'Create',
  cancelLabel = 'Cancel',
  isLoading = false,
}: BaseDialogProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl z-50">
          {/* Hidden description for accessibility */}
          <Dialog.Description className="hidden">Dialog form</Dialog.Description>
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-primary">
              {title}
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-lg hover:bg-background transition-colors text-muted">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="p-5">{children}</div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-border">
            <Dialog.Close className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-background transition-colors disabled:opacity-50" disabled={isLoading}>
              {cancelLabel}
            </Dialog.Close>
            <button
              className="px-4 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : submitLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Form Input Component
interface FormInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'textarea'
  rows?: number
  required?: boolean
  disabled?: boolean
  description?: string
}

export const FormInput = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  rows = 4,
  required = false,
  disabled = false,
  description,
}: FormInputProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        id={id}
        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      />
    ) : (
      <input
        id={id}
        type={type}
        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      />
    )}
    {description && (
      <p className="text-xs text-muted">{description}</p>
    )}
  </div>
)

// Form Select Component
interface FormSelectOption {
  value: string
  label: string
}

interface FormSelectProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: FormSelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  description?: string
}

export const FormSelect = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  description,
}: FormSelectProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={disabled}
      required={required}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {description && (
      <p className="text-xs text-muted">{description}</p>
    )}
  </div>
)

// Form Number Component
interface FormNumberProps {
  id: string
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  min?: number
  max?: number
  required?: boolean
  disabled?: boolean
  description?: string
}

export const FormNumber = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  required = false,
  disabled = false,
  description,
}: FormNumberProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    <input
      id={id}
      type="number"
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success disabled:opacity-50 disabled:cursor-not-allowed"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      required={required}
      disabled={disabled}
    />
    {description && (
      <p className="text-xs text-muted">{description}</p>
    )}
  </div>
)

// Form Color Picker Component
interface FormColorPickerProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  description?: string
}

export const FormColorPicker = ({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  description,
}: FormColorPickerProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    <div className="flex gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 h-10 border border-border rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
        title={label}
      />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#FF0000"
        className="flex-1 px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success font-mono disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
        required={required}
      />
    </div>
    {description && (
      <p className="text-xs text-muted">{description}</p>
    )}
  </div>
)

// Form Checkbox Component
interface FormCheckboxProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
  disabled?: boolean
}

export const FormCheckbox = ({
  id,
  label,
  checked,
  onChange,
  description,
  disabled = false,
}: FormCheckboxProps) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-success border-border rounded focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
      />
      <label htmlFor={id} className="text-sm text-foreground cursor-pointer">
        {label} {checked ? '✓' : ''}
      </label>
    </div>
    {description && (
      <p className="text-xs text-muted">{description}</p>
    )}
  </div>
)

// Form Preview Component
interface FormPreviewProps {
  children: ReactNode
  variant?: 'info' | 'warning' | 'success'
}

export const FormPreview = ({
  children,
  variant = 'info',
}: FormPreviewProps) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-gray-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  }

  return (
    <div className={`border rounded-lg p-3 ${variantClasses[variant]}`}>
      {children}
    </div>
  )
}

export default BaseDialog

// ─── Constants ────────────────────────────────────────────────────────────────

export const getStatusDot = (status: string): string => {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('active')) return 'bg-emerald-500'
  if (statusLower.includes('sick')) return 'bg-amber-500'
  if (statusLower.includes('deceased') || statusLower.includes('dead')) return 'bg-red-500'
  if (statusLower.includes('sold')) return 'bg-sky-500'
  return 'bg-gray-400'
}

export const SEX_STYLES = {
  Male:   'bg-blue-50 text-blue-600 border-blue-200',
  Female: 'bg-pink-50 text-pink-600 border-pink-200',
} as const

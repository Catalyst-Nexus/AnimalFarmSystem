import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  XCircle,
  Filter,
  Save,
  SortAsc,
  Eye,
  Percent,
  AlertTriangle,
  PiggyBank,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { updateAnimalCage } from '@/services/cageService'
import { useMonitoring } from '../MonitoringContext'
import { useToast } from '../ToastContext'
import { OccupancyRing } from '../components/OccupancyRing'
import { SEX_STYLES } from '../utils'
import { useAuthStore } from '@/store/authStore'

export const SortingTab = () => {
  const { pigs, cages } = useMonitoring()
  const { showToast } = useToast()
  const user = useAuthStore((s) => s.user)
  const [sortBy, setSortBy] = useState<'weight-asc' | 'weight-desc' | 'gender-male' | 'gender-female'>('weight-desc')
  const [selectedCages, setSelectedCages] = useState<string[]>([])
  const [preview, setPreview] = useState<{ cageId: string; animals: typeof pigs }[]>([])
  const [excludedCount, setExcludedCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const activeCages = useMemo(() => cages.filter(c => c.isActive), [cages])

  const toggleCage = (cageId: string) => {
    setSelectedCages(prev =>
      prev.includes(cageId) ? prev.filter(id => id !== cageId) : [...prev, cageId]
    )
  }

  const generatePreview = () => {
    if (selectedCages.length === 0) {
      showToast('Select at least one cage', 'warning')
      return
    }

    const selectedCageObjects = cages.filter(c => selectedCages.includes(c.id))
    
    let allAnimals = pigs.filter(p => selectedCages.includes(p.cageId || ''))
    
    const originalCount = allAnimals.length
    if (sortBy === 'gender-male') {
      allAnimals = allAnimals.filter(p => p.sex === 'Male')
    } else if (sortBy === 'gender-female') {
      allAnimals = allAnimals.filter(p => p.sex === 'Female')
    }
    const totalExcluded = originalCount - allAnimals.length
    
    if (sortBy === 'weight-desc' || sortBy === 'gender-male' || sortBy === 'gender-female') {
      allAnimals.sort((a, b) => b.weight - a.weight)
    } else if (sortBy === 'weight-asc') {
      allAnimals.sort((a, b) => a.weight - b.weight)
    }
    
    const distribution: { cageId: string; animals: typeof pigs }[] = []
    let animalIndex = 0
    
    for (const cage of selectedCageObjects) {
      const cageAnimals: typeof pigs = []
      while (animalIndex < allAnimals.length && cageAnimals.length < cage.maxCapacity) {
        cageAnimals.push(allAnimals[animalIndex])
        animalIndex++
      }
      distribution.push({ cageId: cage.id, animals: cageAnimals })
    }
    
    setExcludedCount(totalExcluded)
    setPreview(distribution)
    showToast('Preview generated', 'success')
  }

  const handleSave = async () => {
    if (preview.length === 0) {
      showToast('Generate a preview first', 'warning')
      return
    }

    if (!user?.id) {
      showToast('User not authenticated', 'error')
      return
    }

    if (!confirm('This will redistribute all animals according to the preview. Continue?')) return

    setIsSaving(true)
    try {
      const updates: Promise<void>[] = []
      
      for (const group of preview) {
        for (const animal of group.animals) {
          if (animal.cageId !== group.cageId) {
            updates.push(updateAnimalCage(animal.id, user.id, group.cageId).then(() => {}))
          }
        }
      }
      
      await Promise.all(updates)
      
      showToast('Animals redistributed!', 'success')
      setPreview([])
      setSelectedCages([])
      setExcludedCount(0)
      window.location.reload()
    } catch (error) {
      console.error('Error saving redistribution:', error)
      showToast('Redistribution failed', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const sortOptions = [
    { key: 'weight-desc' as const, icon: <TrendingDown className="w-5 h-5" />, label: 'Heaviest First', desc: 'Largest animals ranked first', color: 'success' },
    { key: 'weight-asc' as const, icon: <TrendingUp className="w-5 h-5" />, label: 'Lightest First', desc: 'Smallest animals ranked first', color: 'success' },
    { key: 'gender-male' as const, icon: <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">M</span>, label: 'Male Only', desc: 'Filter & sort male animals', color: 'blue' },
    { key: 'gender-female' as const, icon: <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-black">F</span>, label: 'Female Only', desc: 'Filter & sort female animals', color: 'pink' },
  ]

  return (
    <div className="space-y-5">
      {/* Config Panel */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-blue-500/15 to-purple-500/10 rounded-xl">
              <SortAsc className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Sorting & Redistribution</h3>
              <p className="text-xs text-muted">Sort animals across cages by weight or gender</p>
            </div>
          </div>

          {/* Sort Criteria */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
              <Filter className="w-4 h-4 text-muted" />
              Sort Criteria
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className={cn(
                    'px-4 py-3.5 rounded-xl text-sm font-semibold transition-all border flex items-center gap-3 text-left',
                    sortBy === opt.key
                      ? opt.color === 'blue' ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : opt.color === 'pink' ? 'bg-pink-600 text-white border-pink-600 shadow-lg'
                        : 'bg-success text-white border-success shadow-lg'
                      : 'bg-background text-foreground border-border hover:border-muted hover:shadow-sm'
                  )}
                >
                  {opt.icon}
                  <div>
                    <div>{opt.label}</div>
                    <div className={cn('text-[11px] font-normal', sortBy === opt.key ? 'text-white/70' : 'text-muted')}>
                      {opt.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cage Selection */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
              <PiggyBank className="w-4 h-4 text-muted" />
              Target Cages
              <span className="text-xs font-normal text-muted">({selectedCages.length} selected)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {activeCages.map(cage => {
                const selected = selectedCages.includes(cage.id)
                const count = pigs.filter(p => p.cageId === cage.id).length
                return (
                  <button
                    key={cage.id}
                    onClick={() => toggleCage(cage.id)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border',
                      selected
                        ? 'bg-success text-white border-success shadow-md'
                        : 'bg-background text-foreground border-border hover:border-success/50'
                    )}
                  >
                    {cage.label}
                    <span className={cn('ml-1.5 text-[10px]', selected ? 'text-white/70' : 'text-muted')}>
                      {count}/{cage.maxCapacity}
                    </span>
                  </button>
                )
              })}
            </div>
            {activeCages.length === 0 && (
              <p className="text-sm text-muted italic mt-2">No active cages available.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-5 border-t border-border">
            <button
              onClick={generatePreview}
              disabled={selectedCages.length === 0}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={preview.length === 0 || isSaving}
              className="px-5 py-3 bg-success text-white rounded-xl text-sm font-bold hover:bg-success/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Apply'}
            </button>
            {preview.length > 0 && (
              <button
                onClick={() => { setPreview([]); setExcludedCount(0); }}
                className="px-5 py-3 border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-background active:scale-95 transition-all flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-surface border border-emerald-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-5 border-b border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900">Redistribution Preview</h3>
                <p className="text-xs text-emerald-700/80">Review before applying</p>
              </div>
            </div>
            {excludedCount > 0 && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <strong>{excludedCount}</strong> animal{excludedCount > 1 ? 's' : ''} excluded by gender filter
              </div>
            )}
          </div>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {preview.map(group => {
              const cage = cages.find(c => c.id === group.cageId)
              const filledPct = cage ? (group.animals.length / cage.maxCapacity) * 100 : 0
              const totalW = group.animals.reduce((s, a) => s + a.weight, 0)
              return (
                <div key={group.cageId} className="border border-border rounded-xl overflow-hidden bg-background">
                  <div className="px-4 py-3 bg-surface border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <OccupancyRing percent={filledPct} size={36} strokeWidth={4} />
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{cage?.label}</h4>
                        <p className="text-[10px] text-muted">{group.animals.length}/{cage?.maxCapacity} · {totalW} kg total</p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-border/50 max-h-56 overflow-y-auto">
                    {group.animals.map((pig, i) => (
                      <div key={pig.id} className="flex items-center justify-between px-4 py-2 text-xs hover:bg-surface/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center',
                            i < 3 ? 'bg-success/15 text-success' : 'bg-muted/10 text-muted'
                          )}>{i + 1}</span>
                          <span className="font-mono font-bold text-foreground">{pig.tagId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-foreground">{pig.weight} kg</span>
                          <span className={cn('w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border', SEX_STYLES[pig.sex])}>
                            {pig.sex[0]}
                          </span>
                        </div>
                      </div>
                    ))}
                    {group.animals.length === 0 && (
                      <div className="px-4 py-6 text-center text-xs text-muted italic">No animals assigned</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Percent className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Summary</h3>
        </div>
        {selectedCages.length === 0 ? (
          <p className="text-xs text-muted">Select cages to see the scope of redistribution.</p>
        ) : (
          <p className="text-xs text-muted">
            <strong className="text-foreground text-base font-black">
              {pigs.filter(p => selectedCages.includes(p.cageId || '')).length}
            </strong> animal{pigs.filter(p => selectedCages.includes(p.cageId || '')).length !== 1 ? 's' : ''} across <strong className="text-foreground font-bold">{selectedCages.length}</strong> cage{selectedCages.length !== 1 ? 's' : ''} will be sorted.
          </p>
        )}
      </div>
    </div>
  )
}

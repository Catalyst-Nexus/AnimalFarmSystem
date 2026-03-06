import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  PiggyBank,
  ClipboardList,
  Search,
  Save,
} from 'lucide-react'
import { useMonitoring } from '../MonitoringContext'
import { SEX_STYLES } from '../utils'

export const MonitoringSheetTab = () => {
  const { pigs, cages, updatePigWeight } = useMonitoring()
  const [selectedCages, setSelectedCages] = useState<string[]>([])
  const [editingWeights, setEditingWeights] = useState<Record<string, string>>({})
  const [updatingPigs, setUpdatingPigs] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState('')

  const activeCages = useMemo(() => cages.filter(c => c.isActive), [cages])
  
  const toggleCage = (cageId: string) => {
    setSelectedCages(prev =>
      prev.includes(cageId) ? prev.filter(id => id !== cageId) : [...prev, cageId]
    )
  }

  const selectAllCages = () => {
    setSelectedCages(activeCages.map(c => c.id))
  }

  const clearAllCages = () => {
    setSelectedCages([])
  }

  const animalsToMonitor = useMemo(() => {
    let filtered = pigs.filter(p => selectedCages.includes(p.cageId || ''))
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase()
      filtered = filtered.filter(p =>
        p.tagId.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      )
    }
    return filtered.sort((a, b) => {
      const cageA = cages.find(c => c.id === a.cageId)?.label || ''
      const cageB = cages.find(c => c.id === b.cageId)?.label || ''
      if (cageA !== cageB) return cageA.localeCompare(cageB)
      return b.weight - a.weight
    })
  }, [pigs, selectedCages, cages, searchFilter])

  const handleWeightChange = (tagId: string, value: string) => {
    setEditingWeights(prev => ({ ...prev, [tagId]: value }))
  }

  const handleUpdateWeight = async (pig: { id: string; tagId: string; weight: number }) => {
    const newWeightStr = editingWeights[pig.tagId]
    if (!newWeightStr) return
    
    const newWeight = parseFloat(newWeightStr)
    if (isNaN(newWeight) || newWeight <= 0) return

    if (newWeight === pig.weight) return

    setUpdatingPigs(prev => new Set(prev).add(pig.tagId))
    try {
      await updatePigWeight(pig.id, newWeight)
    } finally {
      setUpdatingPigs(prev => {
        const next = new Set(prev)
        next.delete(pig.tagId)
        return next
      })
    }
  }

  return (
    <div className="space-y-5">
      {/* Cage Selection */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <PiggyBank className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Cages to Monitor</h3>
              <p className="text-xs text-muted">
                <strong className="text-foreground">{selectedCages.length}</strong> cage{selectedCages.length !== 1 ? 's' : ''} · <strong className="text-foreground">{animalsToMonitor.length}</strong> animal{animalsToMonitor.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAllCages}
              className="px-3 py-1.5 text-xs font-semibold text-success border border-success/30 rounded-lg hover:bg-success hover:text-white transition-all"
            >
              All
            </button>
            <button
              onClick={clearAllCages}
              className="px-3 py-1.5 text-xs font-semibold text-muted border border-border rounded-lg hover:bg-background transition-all"
            >
              None
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {activeCages.map(cg => {
            const animalCount = pigs.filter(p => p.cageId === cg.id).length
            const selected = selectedCages.includes(cg.id)
            return (
              <button
                key={cg.id}
                onClick={() => toggleCage(cg.id)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border',
                  selected
                    ? 'bg-success text-white border-success shadow-md'
                    : 'bg-background text-foreground border-border hover:border-success/50'
                )}
              >
                {cg.label}
                <span className={cn('ml-1.5 text-[10px]', selected ? 'text-white/70' : 'text-muted')}>
                  {animalCount}
                </span>
              </button>
            )
          })}
        </div>
        
        {activeCages.length === 0 && (
          <p className="text-sm text-muted italic">No active cages.</p>
        )}
      </div>

      {/* Monitoring List */}
      {selectedCages.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-muted/20">
            <ClipboardList className="w-8 h-8 text-muted/20" />
          </div>
          <p className="text-sm font-medium text-muted/60">Select cages above to start monitoring</p>
        </div>
      ) : animalsToMonitor.length === 0 && !searchFilter ? (
        <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-muted/20">
            <PiggyBank className="w-8 h-8 text-muted/20" />
          </div>
          <p className="text-sm font-medium text-muted/60">No animals in selected cages</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Table header bar */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Weight Update Sheet</h3>
                  <p className="text-xs text-muted">{animalsToMonitor.length} animal{animalsToMonitor.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {/* Search filter */}
              <div className="relative">
                <input
                  className="w-56 px-3 py-2 pl-9 border border-border rounded-lg text-xs bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all"
                  placeholder="Filter by tag, breed..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                <Search className="w-3.5 h-3.5 text-muted/50 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Sticky table header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-background/80 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wider sticky top-0 z-10">
            <div className="col-span-3">Tag ID</div>
            <div className="col-span-2">Cage</div>
            <div className="col-span-2">Breed</div>
            <div className="col-span-1">Sex</div>
            <div className="col-span-2">Weight</div>
            <div className="col-span-2">Update</div>
          </div>

          {/* Rows */}
          <div className="max-h-[520px] overflow-y-auto divide-y divide-border/50">
            {animalsToMonitor.map((pig) => {
              const currentCage = cages.find(c => c.id === pig.cageId)
              const isUpdating = updatingPigs.has(pig.tagId)
              const editWeight = editingWeights[pig.tagId] ?? pig.weight.toString()
              const weightChanged = editWeight !== pig.weight.toString()
              
              return (
                <div
                  key={pig.id}
                  id={`pig-row-${pig.tagId}`}
                  className="grid grid-cols-12 gap-3 px-5 py-3.5 hover:bg-background/50 transition-all"
                >
                  <div className="col-span-3 flex items-center">
                    <span className="font-mono text-[11px] font-bold bg-background px-2.5 py-1 rounded-lg border border-border/60 truncate">
                      {pig.tagId}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-muted truncate">{currentCage?.label || '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-muted truncate">{pig.breed}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className={cn('w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center border', SEX_STYLES[pig.sex])}>
                      {pig.sex[0]}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-black text-foreground">{pig.weight}<span className="text-[10px] text-muted font-normal ml-0.5">kg</span></span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={cn(
                        'w-20 px-2.5 py-1.5 border rounded-lg text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-2 transition-all',
                        weightChanged ? 'border-success focus:border-success focus:ring-success/20' : 'border-border focus:border-border focus:ring-border/10'
                      )}
                      value={editWeight}
                      onChange={(e) => handleWeightChange(pig.tagId, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateWeight(pig) }}
                      disabled={isUpdating}
                      aria-label="New weight in kg"
                    />
                    <button
                      onClick={() => handleUpdateWeight(pig)}
                      disabled={isUpdating || !weightChanged}
                      className={cn(
                        'p-1.5 rounded-lg transition-all',
                        weightChanged
                          ? 'bg-success text-white hover:bg-success/90 active:scale-95 shadow-sm'
                          : 'bg-border/30 text-muted/40 cursor-not-allowed'
                      )}
                      title="Save weight"
                    >
                      {isUpdating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
            {animalsToMonitor.length === 0 && searchFilter && (
              <div className="text-center py-10 text-sm text-muted">
                No animals match "{searchFilter}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

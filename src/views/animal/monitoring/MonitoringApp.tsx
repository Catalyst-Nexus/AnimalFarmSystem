import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  PageHeader,
  PrimaryButton,
} from '@/components/ui'
import {
  Activity,
  ArrowUp,
  ArrowDown,
  Weight,
  PiggyBank,
  MoveRight,
  CheckCircle2,
  Plus,
  LayoutDashboard,
  SortAsc,
  ClipboardList,
  Search,
  RefreshCw,
  Hash,
  AlertTriangle,
} from 'lucide-react'
import { useMonitoring } from './MonitoringContext'
import { useToast } from './ToastContext'
import { CageCard } from './components'
import { MonitoringSheetTab, SortingTab } from './tabs'
import CageDialog from '../components/dialogs/CageDialog'
import type { Cage } from './types'

export const MonitoringApp = () => {
  const { pigs, cages, addCage, editCage, removeCage, isLoading, refreshData, bulkMovePigs, sortDir, setSortDir } = useMonitoring()
  const { showToast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'monitoring' | 'sheet' | 'sorting'>('monitoring')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Bulk transfer mode
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedPigs, setSelectedPigs] = useState<Set<string>>(new Set())
  const [bulkMoveDropdownOpen, setBulkMoveDropdownOpen] = useState(false)
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCageId, setEditingCageId] = useState<string | null>(null)
  const [cageLabel, setCageLabel] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stats = useMemo(() => {
    const activePigs = pigs.filter((p) => p.status.toLowerCase().includes('active'))
    const sickPigs = pigs.filter((p) => p.status.toLowerCase().includes('sick'))
    const weights = pigs.map((p) => p.weight)
    const totalWeight = weights.reduce((s, w) => s + w, 0)
    const avgWeight = weights.length ? (totalWeight / weights.length).toFixed(1) : '0'
    return {
      total: pigs.length,
      active: activePigs.length,
      sick: sickPigs.length,
      cages: cages.filter(c => c.isActive).length,
      heaviest: weights.length ? Math.max(...weights) : 0,
      lightest: weights.length ? Math.min(...weights) : 0,
      avgWeight,
    }
  }, [pigs, cages])

  const filteredCages = useMemo(() => {
    if (!searchQuery.trim()) return cages
    const q = searchQuery.toLowerCase()
    return cages.filter(c => {
      if (c.label.toLowerCase().includes(q)) return true
      const cagePigs = pigs.filter(p => p.cageId === c.id)
      return cagePigs.some(p => p.tagId.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q))
    })
  }, [cages, pigs, searchQuery])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
      showToast('Data refreshed', 'success')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAddCage = () => {
    setCageLabel('')
    setMaxCapacity('')
    setIsActive(true)
    setEditingCageId(null)
    setDialogOpen(true)
  }

  const handleEditCage = (cage: Cage) => {
    setCageLabel(cage.label)
    setMaxCapacity(cage.maxCapacity.toString())
    setIsActive(cage.isActive)
    setEditingCageId(cage.id)
    setDialogOpen(true)
  }

  const handleDeleteCage = async (cageId: string) => {
    if (!confirm('Delete this cage? This cannot be undone.')) return
    
    try {
      await removeCage(cageId)
    } catch {
      // toast handled in context
    }
  }

  const handleSubmit = async () => {
    if (!cageLabel.trim() || !maxCapacity) {
      showToast('Please fill all fields', 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      const cageData = {
        cage_label: cageLabel.trim(),
        max_capacity: parseInt(maxCapacity),
        is_active: isActive,
      }

      if (editingCageId) {
        await editCage(editingCageId, cageData)
      } else {
        await addCage(cageData)
      }
      setDialogOpen(false)
    } catch {
      // toast handled in context
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    setSelectedPigs(new Set())
    setBulkMoveDropdownOpen(false)
  }

  const togglePigSelection = (pigId: string) => {
    setSelectedPigs(prev => {
      const next = new Set(prev)
      if (next.has(pigId)) {
        next.delete(pigId)
      } else {
        next.add(pigId)
      }
      return next
    })
  }

  const deselectAll = () => {
    setSelectedPigs(new Set())
  }

  const handleBulkMove = async (targetCageId: string) => {
    if (selectedPigs.size === 0) {
      showToast('No animals selected', 'warning')
      return
    }

    try {
      await bulkMovePigs(Array.from(selectedPigs), targetCageId)
      setSelectedPigs(new Set())
      setBulkMode(false)
      setBulkMoveDropdownOpen(false)
    } catch {
      // Error handled in context
    }
  }

  const tabs = [
    { key: 'monitoring' as const, label: 'Monitoring', icon: LayoutDashboard, count: cages.length },
    { key: 'sheet' as const, label: 'Weight Sheet', icon: ClipboardList },
    { key: 'sorting' as const, label: 'Sorting', icon: SortAsc },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-border" />
            <div className="absolute inset-0 rounded-full border-4 border-t-success animate-spin" />
          </div>
          <p className="text-sm text-muted font-medium">Loading monitoring data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Animal Monitoring"
        subtitle="Track animals per cage, scan tags, and manage cage assignments."
        icon={<Activity className="w-6 h-6" />}
      />

      {/* Enhanced Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total Animals', value: stats.total, icon: <PiggyBank className="w-4 h-4" />, color: 'text-foreground', bg: 'bg-muted/10' },
          { label: 'Active', value: stats.active, icon: <Activity className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Sick', value: stats.sick, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Cages', value: stats.cages, icon: <Hash className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Heaviest', value: `${stats.heaviest} kg`, icon: <ArrowUp className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Weight', value: `${stats.avgWeight} kg`, icon: <Weight className="w-4 h-4" />, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('p-1.5 rounded-lg', s.bg)}><span className={s.color}>{s.icon}</span></div>
            </div>
            <p className="text-[10px] font-medium text-muted uppercase tracking-wider">{s.label}</p>
            <p className={cn('text-xl font-black mt-0.5', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="bg-surface border border-border rounded-xl p-1 mb-6 shadow-sm">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-success text-white shadow-md'
                  : 'text-muted hover:text-foreground hover:bg-background'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  'text-[10px] font-black px-1.5 py-0.5 rounded-full',
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-muted/10 text-muted'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'monitoring' ? (
        <>
          {/* Controls bar */}
          <div className="flex items-center justify-between gap-3 mb-5">
            {/* Search */}
            <div className="relative">
              <input
                className="w-56 px-3 py-2 pl-9 border border-border rounded-lg text-xs bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:border-success focus:ring-2 focus:ring-success/10 transition-all"
                placeholder="Search cages or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="w-3.5 h-3.5 text-muted/50 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-border rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 text-muted hover:text-foreground hover:bg-background"
                title={sortDir === 'asc' ? 'Sorted: Lightest First' : 'Sorted: Heaviest First'}
              >
                {sortDir === 'asc' ? (
                  <><ArrowUp className="w-3.5 h-3.5" /> Lightest</>
                ) : (
                  <><ArrowDown className="w-3.5 h-3.5" /> Heaviest</>
                )}
              </button>
              <button
                onClick={toggleBulkMode}
                className={cn(
                  'px-3 py-2 border rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  bulkMode
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                    : 'border-border text-muted hover:text-foreground hover:bg-background'
                )}
                title="Bulk transfer mode"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {bulkMode ? 'Bulk Mode' : 'Bulk Transfer'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 border border-border rounded-lg text-muted hover:text-foreground hover:bg-background transition-all disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              </button>
              <PrimaryButton onClick={handleAddCage}>
                <Plus className="w-4 h-4" />
                Add Cage
              </PrimaryButton>
            </div>
          </div>

          {/* Bulk transfer action bar */}
          {bulkMode && (
            <div className="mb-5 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 text-white rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-900">
                      {selectedPigs.size} animal{selectedPigs.size !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-purple-600">Click animals to select, then choose target cage</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPigs.size > 0 && (
                    <>
                      <button
                        onClick={deselectAll}
                        className="px-3 py-1.5 text-xs font-semibold text-purple-600 border border-purple-300 rounded-lg hover:bg-white transition-all"
                      >
                        Clear
                      </button>
                      <div className="relative">
                        <button 
                          onClick={() => setBulkMoveDropdownOpen(!bulkMoveDropdownOpen)}
                          className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-1.5"
                        >
                          <MoveRight className="w-3.5 h-3.5" />
                          Move To...
                        </button>
                        {bulkMoveDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setBulkMoveDropdownOpen(false)} />
                            <div className="absolute right-0 top-full mt-1.5 z-30 bg-white border-2 border-purple-200 rounded-xl shadow-xl p-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
                              <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-2.5 py-1.5 mb-1">Select Cage</p>
                              {cages.filter(c => c.isActive).map(cage => {
                                const occupancy = pigs.filter(p => p.cageId === cage.id).length
                                const available = cage.maxCapacity - occupancy
                                const canFit = available >= selectedPigs.size
                                return (
                                  <button
                                    key={cage.id}
                                    onClick={() => canFit && handleBulkMove(cage.id)}
                                    disabled={!canFit}
                                    className={cn(
                                      'flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all',
                                      canFit
                                        ? 'hover:bg-purple-500 hover:text-white text-foreground'
                                        : 'opacity-50 cursor-not-allowed text-muted'
                                    )}
                                  >
                                    <span className="flex items-center gap-2">
                                      <MoveRight className="w-3 h-3" />
                                      {cage.label}
                                    </span>
                                    <span className={cn(
                                      'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                      canFit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    )}>
                                      {available} left
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cage grid */}
          {filteredCages.length === 0 && !searchQuery ? (
            <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-muted/20">
                <PiggyBank className="w-8 h-8 text-muted/20" />
              </div>
              <p className="text-sm font-medium text-muted/60 mb-4">No cages yet</p>
              <button
                onClick={handleAddCage}
                className="px-4 py-2 bg-success text-white rounded-lg text-sm font-semibold hover:bg-success/90 transition-all inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create First Cage
              </button>
            </div>
          ) : filteredCages.length === 0 && searchQuery ? (
            <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
              <Search className="w-8 h-8 text-muted/20 mx-auto mb-3" />
              <p className="text-sm text-muted/60">No cages match "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCages.map((cage) => (
                <CageCard
                  key={cage.id}
                  cage={cage}
                  onEdit={() => handleEditCage(cage)}
                  onDelete={() => handleDeleteCage(cage.id)}
                  bulkMode={bulkMode}
                  selectedPigs={selectedPigs}
                  onToggleSelect={togglePigSelection}
                />
              ))}
            </div>
          )}
        </>
      ) : activeTab === 'sheet' ? (
        <MonitoringSheetTab />
      ) : (
        <SortingTab />
      )}

      <CageDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        cageLabel={cageLabel}
        onCageLabelChange={setCageLabel}
        maxCapacity={maxCapacity}
        onMaxCapacityChange={setMaxCapacity}
        isActive={isActive}
        onIsActiveChange={setIsActive}
        editMode={!!editingCageId}
        isLoading={isSubmitting}
      />
    </div>
  )
}

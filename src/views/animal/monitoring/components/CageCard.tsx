import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Maximize2,
  Minimize2,
  PiggyBank,
  Eye,
} from 'lucide-react'
import { useMonitoring } from '../MonitoringContext'
import { PigRow } from './PigRow'
import type { Cage } from '../types'

interface CageCardProps {
  cage: Cage
  onEdit: () => void
  onDelete: () => void
  bulkMode?: boolean
  selectedPigs?: Set<string>
  onToggleSelect?: (pigId: string) => void
}

export const CageCard = ({ cage, onEdit, onDelete, bulkMode, selectedPigs, onToggleSelect }: CageCardProps) => {
  const { pigsInCage, sortDir, movePig } = useMonitoring()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const pigId = e.dataTransfer.getData('pigId')
    
    if (pigId) {
      try {
        await movePig(pigId, cage.id)
      } catch (error) {
        // Error handled by movePig
      }
    }
  }
  const pigs = pigsInCage(cage.id)
  const totalWeight = pigs.reduce((s, p) => s + p.weight, 0)
  const occupancyPercent = cage.maxCapacity > 0 ? (pigs.length / cage.maxCapacity) * 100 : 0
  const maleCount = pigs.filter(p => p.sex === 'Male').length
  const femaleCount = pigs.filter(p => p.sex === 'Female').length

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface shadow-sm hover:shadow-lg transition-all duration-300 group/card",
        !cage.isActive && "opacity-60",
        isDragOver && "ring-4 ring-success/30 border-success scale-[1.02]",
        occupancyPercent >= 100 ? 'border-red-200' : occupancyPercent >= 80 ? 'border-orange-200' : 'border-border'
      )}
    >
      {/* Top accent bar */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-1',
        occupancyPercent >= 100 ? 'bg-gradient-to-r from-red-400 to-red-500'
          : occupancyPercent >= 80 ? 'bg-gradient-to-r from-orange-400 to-amber-500'
          : 'bg-gradient-to-r from-success to-emerald-400'
      )} />

      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              {cage.label}
              {!cage.isActive && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-gray-500 uppercase tracking-wider">
                  Inactive
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted">
                <strong className={cn(
                  'font-black',
                  occupancyPercent >= 100 ? 'text-red-600' : occupancyPercent >= 80 ? 'text-orange-600' : 'text-success'
                )}>
                  {pigs.length}
                </strong>/{cage.maxCapacity} animals
                </span>
                {pigs.length > 0 && (
                  <span className="text-[11px] text-muted flex items-center gap-1.5">
                    <span className="text-blue-500">{maleCount}M</span>
                    <span className="text-muted/40">/</span>
                    <span className="text-pink-500">{femaleCount}F</span>
                  </span>
                )}
              </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-muted hover:text-success hover:bg-success/10 transition-all"
              title="Edit cage"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={pigs.length > 0 ? "Cannot delete cage with animals" : "Delete cage"}
              disabled={pigs.length > 0}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-all"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-4 mt-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-purple-50 rounded">
              <ArrowUp className="w-3 h-3 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted leading-tight">Total</p>
              <p className="text-sm font-black text-foreground leading-tight">{totalWeight}<span className="text-[10px] text-muted ml-0.5">kg</span></p>
            </div>
          </div>
          {pigs.length > 0 && (
            <>
              <div className="w-px h-8 bg-border/60" />
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-blue-50 rounded">
                  <ArrowUp className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted leading-tight">Max</p>
                  <p className="text-sm font-black text-foreground leading-tight">
                    {Math.max(...pigs.map(p => p.weight))}<span className="text-[10px] text-muted ml-0.5">kg</span>
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-orange-50 rounded">
                  <ArrowDown className="w-3 h-3 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted leading-tight">Min</p>
                  <p className="text-sm font-black text-foreground leading-tight">
                    {Math.min(...pigs.map(p => p.weight))}<span className="text-[10px] text-muted ml-0.5">kg</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expandable body */}
      <div className={cn(
        'overflow-hidden transition-all duration-300',
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="p-5 pt-3">
          {/* Column headers */}
          {pigs.length > 0 && (
            <div className="flex items-center gap-3 px-3 pb-2 mb-2 text-[10px] font-bold text-muted uppercase tracking-wider">
              <span className="w-6 shrink-0">#</span>
              <span className="shrink-0 w-28">Tag ID</span>
              <span className="w-16 shrink-0 flex items-center gap-1">
                Weight {sortDir === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
              </span>
              <span className="flex-1 hidden sm:block">Breed</span>
              <span className="shrink-0">Info</span>
            </div>
          )}

          {/* Pig list */}
          <div className="flex flex-col gap-1">
            {pigs.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-muted/5 flex items-center justify-center mx-auto mb-3 border border-dashed border-muted/20">
                  <PiggyBank className="w-7 h-7 text-muted/20" />
                </div>
                <p className="text-sm text-muted/60 font-medium">{isDragOver ? 'Drop animal here' : 'Empty cage'}</p>
                <p className="text-xs text-muted/40 mt-0.5">{isDragOver ? 'Release to assign to this cage' : 'Assign animals to see them here'}</p>
              </div>
            ) : (
              pigs.map((p, i) => (
                <PigRow 
                  key={p.id} 
                  pig={p} 
                  rank={i + 1}
                  bulkMode={bulkMode}
                  selected={selectedPigs?.has(p.id)}
                  onToggleSelect={() => onToggleSelect?.(p.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Collapsed summary when collapsed */}
      {!isExpanded && pigs.length > 0 && (
        <div className="px-5 pb-4 pt-2 flex items-center gap-2 text-xs text-muted">
          <Eye className="w-3 h-3" />
          <span>{pigs.length} animal{pigs.length > 1 ? 's' : ''} hidden — click expand to view</span>
        </div>
      )}
    </div>
  )
}

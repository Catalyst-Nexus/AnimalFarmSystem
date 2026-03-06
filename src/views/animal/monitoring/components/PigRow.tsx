import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getStatusDot, SEX_STYLES } from '../utils'
import { MovePigButton } from './MovePigButton'
import type { Pig } from '../types'

interface PigRowProps {
  pig: Pig
  rank: number
  bulkMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

export const PigRow = ({ pig, rank, bulkMode, selected, onToggleSelect }: PigRowProps) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('pigId', pig.id)
    e.dataTransfer.setData('pigTag', pig.tagId)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
  <div 
    draggable={!bulkMode}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    className={cn(
      'flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all group bg-surface/30 border hover:shadow-sm',
      bulkMode ? 'cursor-pointer' : 'cursor-move hover:bg-background/80',
      isDragging && 'opacity-50',
      selected && 'bg-success/10 border-success/50 border-2',
      !selected && 'border-transparent hover:border-border/60'
    )}
    onClick={() => bulkMode && onToggleSelect?.()}
  >
    {/* rank or checkbox */}
    {bulkMode ? (
      <div className="w-6 h-6 flex items-center justify-center shrink-0">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-2 border-border text-success focus:ring-2 focus:ring-success/20 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Select animal for bulk transfer"
        />
      </div>
    ) : (
      <span className={cn(
        'w-6 h-6 text-center text-[10px] font-black rounded-full flex items-center justify-center shrink-0',
        rank <= 3 ? 'bg-success/15 text-success' : 'bg-muted/10 text-muted'
      )}>
        {rank}
      </span>
    )}

    {/* tag */}
    <span className="font-mono text-[11px] font-bold text-foreground shrink-0 w-28 truncate bg-background px-2.5 py-1 rounded-lg border border-border/60">
      {pig.tagId}
    </span>

    {/* weight highlight */}
    <div className="w-16 shrink-0 flex items-baseline gap-0.5">
      <span className="text-sm font-black text-foreground">{pig.weight}</span>
      <span className="text-[10px] text-muted">kg</span>
    </div>

    {/* breed */}
    <span className="text-xs text-muted flex-1 truncate hidden sm:block">{pig.breed}</span>

    {/* badges */}
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={cn('w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center border', SEX_STYLES[pig.sex])}>
        {pig.sex[0]}
      </span>
      <span className="flex items-center gap-1">
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', getStatusDot(pig.status))} />
        <span className="text-[11px] font-medium text-muted hidden md:inline">{pig.status}</span>
      </span>
    </div>

    {/* move button - always visible now */}
    {!bulkMode && (
      <div className="shrink-0">
        <MovePigButton pig={pig} />
      </div>
    )}
  </div>
  )
}

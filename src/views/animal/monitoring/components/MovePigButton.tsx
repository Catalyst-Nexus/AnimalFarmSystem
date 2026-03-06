import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MoveRight } from 'lucide-react'
import { useMonitoring } from '../MonitoringContext'
import type { Pig } from '../types'

interface MovePigButtonProps {
  pig: Pig
}

export const MovePigButton = ({ pig }: MovePigButtonProps) => {
  const { movePig, cages, pigs } = useMonitoring()
  const [open, setOpen] = useState(false)

  const availableCages = cages.filter((c) => {
    if (c.id === pig.cageId || !c.isActive) return false
    const currentOccupancy = pigs.filter(p => p.cageId === c.id).length
    return currentOccupancy < c.maxCapacity
  })

  return (
    <div className="relative">
      <button
        title="Move to cage"
        className="p-1.5 rounded-lg hover:bg-background text-muted hover:text-success transition-all hover:scale-110 active:scale-95"
        onClick={() => setOpen((v) => !v)}
      >
        <MoveRight className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-surface border border-border rounded-xl shadow-xl p-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-2.5 py-1.5 mb-1">Move to</p>
            {availableCages.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted text-center bg-background rounded-lg">
                No cages available
              </div>
            ) : (
              availableCages.map((c) => {
                const occupancy = pigs.filter(p => p.cageId === c.id).length
                const pct = (occupancy / c.maxCapacity) * 100
                return (
                  <button
                    key={c.id}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all hover:bg-success/10 hover:text-success text-foreground group"
                    onClick={() => { movePig(pig.id, c.id); setOpen(false) }}
                  >
                    <span className="flex items-center gap-2">
                      <MoveRight className="w-3 h-3 text-muted group-hover:text-success transition-colors" />
                      {c.label}
                    </span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                      pct >= 80 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    )}>
                      {occupancy}/{c.maxCapacity}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}

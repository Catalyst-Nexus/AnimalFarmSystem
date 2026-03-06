import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { GripVertical, LucideIcon } from 'lucide-react'

interface DraggableSidebarItemProps {
  id: string
  to: string
  icon: LucideIcon
  label: string
  sidebarCollapsed: boolean
  compactMode: boolean
  isEditMode: boolean
}

export const DraggableSidebarItem = ({
  id,
  to,
  icon: Icon,
  label,
  sidebarCollapsed,
  compactMode,
  isEditMode,
}: DraggableSidebarItemProps) => {
  const location = useLocation()
  const isActive = location.pathname === to

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isEditMode) {
    return (
      <li
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative',
          isDragging && 'z-50 opacity-90'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
            compactMode ? 'px-3 py-2' : 'px-4 py-3',
            sidebarCollapsed && 'justify-center px-2',
            isActive
              ? 'bg-success text-white'
              : 'text-foreground hover:bg-background',
            isDragging && 'shadow-lg ring-2 ring-primary bg-background'
          )}
        >
          <div
            {...attributes}
            {...listeners}
            className={cn(
              'cursor-grab active:cursor-grabbing touch-none',
              sidebarCollapsed ? 'absolute left-0 top-0 bottom-0 w-full flex items-center justify-center' : ''
            )}
          >
            <GripVertical className={cn(
              'w-4 h-4 text-muted shrink-0',
              sidebarCollapsed && 'hidden'
            )} />
          </div>
          <Icon className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="flex-1">{label}</span>}
        </div>
      </li>
    )
  }

  return (
    <li ref={setNodeRef} style={style}>
      <Link
        to={to}
        className={cn(
          'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
          compactMode ? 'px-3 py-2' : 'px-4 py-3',
          sidebarCollapsed && 'justify-center px-2',
          isActive
            ? 'bg-success text-white'
            : 'text-foreground hover:bg-background'
        )}
        title={sidebarCollapsed ? label : undefined}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!sidebarCollapsed && <span>{label}</span>}
      </Link>
    </li>
  )
}

export default DraggableSidebarItem

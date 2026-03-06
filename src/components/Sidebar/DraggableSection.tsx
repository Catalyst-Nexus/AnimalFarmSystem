import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { GripVertical, LucideIcon } from 'lucide-react'
import { DraggableSidebarItem } from './DraggableSidebarItem'

interface MenuItem {
  id: string
  to: string
  icon: LucideIcon
  label: string
}

interface DraggableSectionProps {
  id: string
  title: string
  items: MenuItem[]
  sidebarCollapsed: boolean
  compactMode: boolean
  isEditMode: boolean
  onItemReorder: (sectionId: string, oldIndex: number, newIndex: number) => void
}

export const DraggableSection = ({
  id,
  title,
  items,
  sidebarCollapsed,
  compactMode,
  isEditMode,
  onItemReorder,
}: DraggableSectionProps) => {
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      onItemReorder(id, oldIndex, newIndex)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'mb-2',
        isDragging && 'z-50 opacity-90 shadow-lg rounded-lg bg-surface'
      )}
    >
      {!sidebarCollapsed && (
        <div
          className={cn(
            'px-3 text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2',
            compactMode ? 'py-3' : 'py-5',
            isEditMode && 'cursor-grab active:cursor-grabbing'
          )}
          {...(isEditMode ? { ...attributes, ...listeners } : {})}
        >
          {isEditMode && (
            <GripVertical className="w-3 h-3 text-muted shrink-0" />
          )}
          <span>{title}</span>
        </div>
      )}
      {sidebarCollapsed && isEditMode && (
        <div
          className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted" />
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-0.5">
            {items.map((item) => (
              <DraggableSidebarItem
                key={item.id}
                id={item.id}
                to={item.to}
                icon={item.icon}
                label={item.label}
                sidebarCollapsed={sidebarCollapsed}
                compactMode={compactMode}
                isEditMode={isEditMode}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default DraggableSection

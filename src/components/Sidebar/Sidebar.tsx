import { useMemo, useCallback, useEffect } from 'react'
import { useSettingsStore, useSidebarOrderStore } from '@/store'
import { useRBAC } from '@/contexts/RBACContext'
import { getIconByName } from '@/lib/iconMap'
import { cn } from '@/lib/utils'
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { DraggableSection } from './DraggableSection'
import {
  LayoutDashboard,
  User,
  ChevronLeft,
  ChevronRight,
  Settings2,
  RotateCcw,
  LucideIcon,
} from 'lucide-react'

interface MenuItem {
  id: string
  to: string
  icon: LucideIcon
  label: string
}

interface MenuSection {
  id: string
  title: string
  items: MenuItem[]
}

const Sidebar = () => {
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useSettingsStore((state) => state.setSidebarCollapsed)
  const compactMode = useSettingsStore((state) => state.compactMode)
  const systemLogo = useSettingsStore((state) => state.systemLogo)
  const sidebarEditMode = useSettingsStore((state) => state.sidebarEditMode)
  const setSidebarEditMode = useSettingsStore((state) => state.setSidebarEditMode)
  
  // Sidebar order store
  const sectionOrder = useSidebarOrderStore((state) => state.sectionOrder)
  const itemOrderBySection = useSidebarOrderStore((state) => state.itemOrderBySection)
  const setSectionOrder = useSidebarOrderStore((state) => state.setSectionOrder)
  const setItemOrderForSection = useSidebarOrderStore((state) => state.setItemOrderForSection)
  const resetOrder = useSidebarOrderStore((state) => state.resetOrder)
  
  // Get modules from RBAC context
  const { userModules } = useRBAC()

  // DnD sensors
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

  // Static menu sections
  const staticSections: MenuSection[] = useMemo(() => [
    {
      id: 'section-main',
      title: 'MAIN',
      items: [
        { id: 'item-dashboard', to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      id: 'section-user',
      title: 'USER',
      items: [
        { id: 'item-profile', to: '/dashboard/profile', icon: User, label: 'User Profile' },
      ],
    },
  ], [])

  // Build dynamic sections from RBAC user modules grouped by category
  const dynamicSections: MenuSection[] = useMemo(() => {
    if (userModules.length === 0) return []
    
    // Group modules by category
    const grouped = userModules.reduce((acc, module) => {
      const category = module.category || 'MODULES'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push({
        id: `item-${module.id || module.module_name.toLowerCase().replace(/\s+/g, '-')}`,
        to: module.route_path,
        icon: getIconByName(module.icons),
        label: module.module_name,
      })
      return acc
    }, {} as Record<string, MenuItem[]>)
    
    // Convert to MenuSection array
    return Object.entries(grouped).map(([title, items]) => ({
      id: `section-${title.toLowerCase().replace(/\s+/g, '-')}`,
      title: title.toUpperCase(),
      items,
    }))
  }, [userModules])

  // Base sections (unordered)
  const baseSections: MenuSection[] = useMemo(() => {
    return [...staticSections, ...dynamicSections]
  }, [staticSections, dynamicSections])

  // Apply stored order to sections
  const orderedSections: MenuSection[] = useMemo(() => {
    if (sectionOrder.length === 0) {
      return baseSections
    }
    
    // Sort sections based on stored order
    const sectionsMap = new Map(baseSections.map(s => [s.id, s]))
    const ordered: MenuSection[] = []
    
    // Add sections in stored order
    sectionOrder.forEach(sectionId => {
      const section = sectionsMap.get(sectionId)
      if (section) {
        ordered.push(section)
        sectionsMap.delete(sectionId)
      }
    })
    
    // Add any new sections not in stored order
    sectionsMap.forEach(section => ordered.push(section))
    
    return ordered
  }, [baseSections, sectionOrder])

  // Apply stored order to items within sections
  const menuSections: MenuSection[] = useMemo(() => {
    return orderedSections.map(section => {
      const itemOrder = itemOrderBySection[section.id]
      if (!itemOrder || itemOrder.length === 0) {
        return section
      }
      
      const itemsMap = new Map(section.items.map(item => [item.id, item]))
      const orderedItems: MenuItem[] = []
      
      itemOrder.forEach(itemId => {
        const item = itemsMap.get(itemId)
        if (item) {
          orderedItems.push(item)
          itemsMap.delete(itemId)
        }
      })
      
      // Add any new items not in stored order
      itemsMap.forEach(item => orderedItems.push(item))
      
      return { ...section, items: orderedItems }
    })
  }, [orderedSections, itemOrderBySection])

  // Handle section drag end
  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = menuSections.findIndex((s) => s.id === active.id)
      const newIndex = menuSections.findIndex((s) => s.id === over.id)
      
      const newOrder = arrayMove(
        menuSections.map(s => s.id),
        oldIndex,
        newIndex
      )
      setSectionOrder(newOrder)
    }
  }, [menuSections, setSectionOrder])

  // Handle item reorder within a section
  const handleItemReorder = useCallback((sectionId: string, oldIndex: number, newIndex: number) => {
    const section = menuSections.find(s => s.id === sectionId)
    if (!section) return
    
    const newOrder = arrayMove(
      section.items.map(item => item.id),
      oldIndex,
      newIndex
    )
    setItemOrderForSection(sectionId, newOrder)
  }, [menuSections, setItemOrderForSection])

  // Initialize section order if not set
  useEffect(() => {
    if (sectionOrder.length === 0 && baseSections.length > 0) {
      setSectionOrder(baseSections.map(s => s.id))
    }
  }, [baseSections, sectionOrder.length, setSectionOrder])

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-2.5 border-b border-border',
        compactMode ? 'px-3 py-4' : 'px-5 py-6',
        sidebarCollapsed && 'justify-center px-2'
      )}>
        {systemLogo ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-border shrink-0 flex items-center justify-center">
            <img
              src={systemLogo}
              alt="System Logo"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary rounded-lg shrink-0" />
        )}
        {!sidebarCollapsed && (
          <span className="text-xl font-bold text-primary">Animal Farm</span>
        )}
      </div>

      {/* Edit Mode Toggle */}
      <div className={cn(
        'flex items-center gap-2 border-b border-border px-3 py-2',
        sidebarCollapsed && 'justify-center'
      )}>
        <button
          onClick={() => setSidebarEditMode(!sidebarEditMode)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            sidebarEditMode
              ? 'bg-primary text-white'
              : 'bg-background text-foreground hover:bg-muted/20'
          )}
          title={sidebarEditMode ? 'Done editing' : 'Customize sidebar'}
        >
          <Settings2 className="w-4 h-4" />
          {!sidebarCollapsed && (sidebarEditMode ? 'Done' : 'Customize')}
        </button>
        {sidebarEditMode && !sidebarCollapsed && (
          <button
            onClick={resetOrder}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-background text-foreground hover:bg-muted/20 transition-all"
            title="Reset to default order"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sidebarEditMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext
              items={menuSections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {menuSections.map((section) => (
                <DraggableSection
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  items={section.items}
                  sidebarCollapsed={sidebarCollapsed}
                  compactMode={compactMode}
                  isEditMode={sidebarEditMode}
                  onItemReorder={handleItemReorder}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          menuSections.map((section) => (
            <DraggableSection
              key={section.id}
              id={section.id}
              title={section.title}
              items={section.items}
              sidebarCollapsed={sidebarCollapsed}
              compactMode={compactMode}
              isEditMode={false}
              onItemReorder={handleItemReorder}
            />
          ))
        )}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          'absolute -right-3 top-1/2 -translate-y-1/2 z-50',
          'flex items-center justify-center w-6 h-6 rounded-full',
          'bg-success text-white cursor-pointer',
          'hover:bg-success/90 transition-colors shadow-md'
        )}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}

export default Sidebar

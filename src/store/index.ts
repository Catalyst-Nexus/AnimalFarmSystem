import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Re-export auth store
export { useAuthStore, type User, type AuthState } from './authStore'

// Sidebar item order type
export interface SidebarItemOrder {
  id: string
  sectionId: string
}

// Sidebar section order type
export interface SidebarSectionOrder {
  id: string
  title: string
  itemOrder: string[]
}

// Sidebar store for managing draggable order
interface SidebarOrderState {
  sectionOrder: string[]
  itemOrderBySection: Record<string, string[]>
  setSectionOrder: (order: string[]) => void
  setItemOrderForSection: (sectionId: string, order: string[]) => void
  resetOrder: () => void
}

export const useSidebarOrderStore = create<SidebarOrderState>()(
  persist(
    (set) => ({
      sectionOrder: [],
      itemOrderBySection: {},
      setSectionOrder: (order) => set({ sectionOrder: order }),
      setItemOrderForSection: (sectionId, order) => 
        set((state) => ({
          itemOrderBySection: {
            ...state.itemOrderBySection,
            [sectionId]: order,
          },
        })),
      resetOrder: () => set({ sectionOrder: [], itemOrderBySection: {} }),
    }),
    {
      name: 'sidebar-order-storage',
    }
  )
)

// Settings store using Zustand
interface SettingsState {
  darkMode: boolean
  compactMode: boolean
  fontSize: 'small' | 'medium' | 'large'
  tableDensity: 'comfortable' | 'standard' | 'compact'
  autoLogout: boolean
  highContrast: boolean
  reducedMotion: boolean
  sidebarCollapsed: boolean
  systemLogo: string | null
  sidebarEditMode: boolean
  setDarkMode: (value: boolean) => void
  setCompactMode: (value: boolean) => void
  setFontSize: (value: 'small' | 'medium' | 'large') => void
  setTableDensity: (value: 'comfortable' | 'standard' | 'compact') => void
  setAutoLogout: (value: boolean) => void
  setHighContrast: (value: boolean) => void
  setReducedMotion: (value: boolean) => void
  setSidebarCollapsed: (value: boolean) => void
  setSystemLogo: (url: string | null) => void
  setSidebarEditMode: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      compactMode: false,
      fontSize: 'medium',
      tableDensity: 'standard',
      autoLogout: false,
      highContrast: false,
      reducedMotion: false,
      sidebarCollapsed: false,
      systemLogo: null,
      sidebarEditMode: false,
      setDarkMode: (value) => set({ darkMode: value }),
      setCompactMode: (value) => set({ compactMode: value }),
      setFontSize: (value) => set({ fontSize: value }),
      setTableDensity: (value) => set({ tableDensity: value }),
      setAutoLogout: (value) => set({ autoLogout: value }),
      setHighContrast: (value) => set({ highContrast: value }),
      setReducedMotion: (value) => set({ reducedMotion: value }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      setSystemLogo: (url) => set({ systemLogo: url }),
      setSidebarEditMode: (value) => set({ sidebarEditMode: value }),
    }),
    {
      name: 'settings-storage',
    }
  )
)

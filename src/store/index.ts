import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  setDarkMode: (value: boolean) => void
  setCompactMode: (value: boolean) => void
  setFontSize: (value: 'small' | 'medium' | 'large') => void
  setTableDensity: (value: 'comfortable' | 'standard' | 'compact') => void
  setAutoLogout: (value: boolean) => void
  setHighContrast: (value: boolean) => void
  setReducedMotion: (value: boolean) => void
  setSidebarCollapsed: (value: boolean) => void
  setSystemLogo: (url: string | null) => void
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
      setDarkMode: (value) => set({ darkMode: value }),
      setCompactMode: (value) => set({ compactMode: value }),
      setFontSize: (value) => set({ fontSize: value }),
      setTableDensity: (value) => set({ tableDensity: value }),
      setAutoLogout: (value) => set({ autoLogout: value }),
      setHighContrast: (value) => set({ highContrast: value }),
      setReducedMotion: (value) => set({ reducedMotion: value }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      setSystemLogo: (url) => set({ systemLogo: url }),
    }),
    {
      name: 'settings-storage',
    }
  )
)

// Auth store using Zustand
interface User {
  id: string
  username: string
  email: string
  role: string
  profilePicture?: string | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfilePicture: (url: string | null) => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (username: string, password: string) => {
        // Mock login - replace with actual API call
        if (username && password) {
          const mockUser: User = {
            id: '1',
            username: username,
            email: `${username}@example.com`,
            role: 'admin',
            profilePicture: null,
          }
          set({ user: mockUser, isAuthenticated: true })
          return true
        }
        return false
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
      },
      updateProfilePicture: (url) => {
        set((state) => ({
          user: state.user ? { ...state.user, profilePicture: url } : null,
        }))
      },
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import type { Toast } from './types'

let toastId = 0

interface ToastContextType {
  showToast: (message: string, type: Toast['type']) => void
}

export const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
})

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type']) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto px-5 py-3 rounded-xl shadow-xl border-2 text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-right-5 fade-in duration-300',
              t.type === 'success' && 'bg-green-50 border-green-300 text-green-800',
              t.type === 'error' && 'bg-red-50 border-red-300 text-red-800',
              t.type === 'warning' && 'bg-orange-50 border-orange-300 text-orange-800',
            )}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {t.type === 'error' && <XCircle className="w-4 h-4" />}
            {t.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

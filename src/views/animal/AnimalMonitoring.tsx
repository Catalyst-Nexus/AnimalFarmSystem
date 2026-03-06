import { ToastProvider, MonitoringProvider, MonitoringApp } from './monitoring'

export default function AnimalMonitoring() {
  return (
    <ToastProvider>
      <MonitoringProvider>
        <MonitoringApp />
      </MonitoringProvider>
    </ToastProvider>
  )
}
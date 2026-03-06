import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  PiggyBank,
  ClipboardList,
  Search,
  Save,
  Bluetooth,
  Wifi,
  WifiOff,
  Scale,
  XCircle,
} from 'lucide-react'
import { useMonitoring } from '../MonitoringContext'
import { SEX_STYLES } from '../utils'

// BLE Constants for ESP32 Weight Scale
const BLE_SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb'
const BLE_CHARACTERISTIC_UUID = '00002a9d-0000-1000-8000-00805f9b34fb'

export const MonitoringSheetTab = () => {
  const { pigs, cages, updatePigWeight } = useMonitoring()
  const [selectedCages, setSelectedCages] = useState<string[]>([])
  const [editingWeights, setEditingWeights] = useState<Record<string, string>>({})
  const [updatingPigs, setUpdatingPigs] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState('')
  
  // BLE State
  const [bleStatus, setBleStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [bleError, setBleError] = useState<string | null>(null)
  const [bleWeight, setBleWeight] = useState<string>('')
  const [selectedAnimalForBle, setSelectedAnimalForBle] = useState<string | null>(null)
  const bleDeviceRef = useRef<BluetoothDevice | null>(null)
  const bleCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)

  const activeCages = useMemo(() => cages.filter(c => c.isActive), [cages])
  
  const toggleCage = (cageId: string) => {
    setSelectedCages(prev =>
      prev.includes(cageId) ? prev.filter(id => id !== cageId) : [...prev, cageId]
    )
  }

  const selectAllCages = () => {
    setSelectedCages(activeCages.map(c => c.id))
  }

  const clearAllCages = () => {
    setSelectedCages([])
  }

  const animalsToMonitor = useMemo(() => {
    let filtered = pigs.filter(p => selectedCages.includes(p.cageId || ''))
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase()
      filtered = filtered.filter(p =>
        p.tagId.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      )
    }
    return filtered.sort((a, b) => {
      const cageA = cages.find(c => c.id === a.cageId)?.label || ''
      const cageB = cages.find(c => c.id === b.cageId)?.label || ''
      if (cageA !== cageB) return cageA.localeCompare(cageB)
      return b.weight - a.weight
    })
  }, [pigs, selectedCages, cages, searchFilter])

  const handleWeightChange = (tagId: string, value: string) => {
    setEditingWeights(prev => ({ ...prev, [tagId]: value }))
  }
  
  // BLE notification handler
  const handleBleNotification = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic
    const value = target.value
    if (!value) return

    const decoder = new TextDecoder()
    const text = decoder.decode(value)

    // Parse "Weight:XX.X" format from ESP32
    const match = text.match(/Weight:([\d.]+)/)
    if (match) {
      const weight = match[1]
      setBleWeight(weight)
      // Auto-fill weight for selected animal
      if (selectedAnimalForBle) {
        setEditingWeights(prev => ({ ...prev, [selectedAnimalForBle]: weight }))
      }
    }
  }, [selectedAnimalForBle])

  // Connect to ESP32 via BLE
  const connectBle = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (!navigator.bluetooth) {
      if (isIOS) {
        setBleError(
          'Web Bluetooth is not supported on iOS (iPhone/iPad). Apple does not allow it in any browser on iOS. Please use an Android device with Chrome, or a desktop with Chrome or Edge.'
        )
      } else {
        setBleError(
          'Web Bluetooth is not available. Make sure you are using Chrome or Edge on Android or desktop, Bluetooth is enabled on your device, and the page is served over HTTPS or localhost.'
        )
      }
      return
    }

    setBleStatus('connecting')
    setBleError(null)

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ESP32_WeightScale' }],
        optionalServices: [BLE_SERVICE_UUID],
      })

      device.addEventListener('gattserverdisconnected', () => {
        setBleStatus('disconnected')
        setBleWeight('')
        bleCharRef.current = null
      })

      const server = await device.gatt!.connect()
      const service = await server.getPrimaryService(BLE_SERVICE_UUID)
      const characteristic = await service.getCharacteristic(BLE_CHARACTERISTIC_UUID)

      await characteristic.startNotifications()
      characteristic.addEventListener('characteristicvaluechanged', handleBleNotification)

      bleDeviceRef.current = device
      bleCharRef.current = characteristic
      setBleStatus('connected')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect'
      if (!message.includes('cancelled')) {
        setBleError(message)
      }
      setBleStatus('disconnected')
    }
  }

  // Disconnect BLE
  const disconnectBle = () => {
    if (bleCharRef.current) {
      bleCharRef.current.removeEventListener('characteristicvaluechanged', handleBleNotification)
    }
    if (bleDeviceRef.current?.gatt?.connected) {
      bleDeviceRef.current.gatt.disconnect()
    }
    bleDeviceRef.current = null
    bleCharRef.current = null
    setBleStatus('disconnected')
    setBleWeight('')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectBle()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdateWeight = async (pig: { id: string; tagId: string; weight: number }) => {
    const newWeightStr = editingWeights[pig.tagId]
    if (!newWeightStr) return
    
    const newWeight = parseFloat(newWeightStr)
    if (isNaN(newWeight) || newWeight <= 0) return

    if (newWeight === pig.weight) return

    setUpdatingPigs(prev => new Set(prev).add(pig.tagId))
    try {
      await updatePigWeight(pig.id, newWeight)
    } finally {
      setUpdatingPigs(prev => {
        const next = new Set(prev)
        next.delete(pig.tagId)
        return next
      })
    }
  }

  return (
    <div className="space-y-5">
      {/* BLE Connection Panel */}
      <div className="bg-gradient-to-br from-surface to-background border-2 border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-500/10 rounded-xl">
            <Bluetooth className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">Bluetooth Scale Connection</h3>
            <p className="text-xs text-muted">Connect to ESP32_WeightScale via Bluetooth Low Energy</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border-2',
              bleStatus === 'connected'
                ? 'bg-green-50 text-green-700 border-green-300'
                : bleStatus === 'connecting'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                : 'bg-gray-100 text-gray-600 border-gray-300'
            )}>
              {bleStatus === 'connected' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {bleStatus === 'connected' ? 'Connected' : bleStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </div>
            {bleStatus === 'disconnected' ? (
              <button
                onClick={connectBle}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 shadow-sm"
              >
                <Bluetooth className="w-4 h-4" /> Connect
              </button>
            ) : bleStatus === 'connected' ? (
              <button
                onClick={disconnectBle}
                className="px-5 py-2.5 border-2 border-red-300 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 active:scale-95 transition-all flex items-center gap-2"
              >
                <WifiOff className="w-4 h-4" /> Disconnect
              </button>
            ) : null}
          </div>
        </div>

        {bleError && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{bleError}</p>
          </div>
        )}

        {bleStatus === 'connected' && !bleWeight && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Waiting for weight data from scale... Place an animal on the scale to begin.
            </p>
          </div>
        )}

        {bleStatus === 'connected' && bleWeight && (
          <div className="mt-4 flex items-center gap-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl animate-in fade-in duration-300">
            <div className="p-3 bg-white rounded-xl border-2 border-green-300">
              <Scale className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Live Weight Reading</p>
              <p className="text-4xl font-bold text-green-700">{bleWeight}<span className="text-lg font-normal text-green-500 ml-1">kg</span></p>
              {selectedAnimalForBle ? (
                <p className="text-xs text-green-600 mt-1 font-semibold">
                  ✓ Auto-filling for {selectedAnimalForBle}
                </p>
              ) : (
                <p className="text-xs text-muted mt-1">
                  Click the <Bluetooth className="w-3 h-3 inline" /> button next to an animal to use this reading
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cage Selection */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <PiggyBank className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Cages to Monitor</h3>
              <p className="text-xs text-muted">
                <strong className="text-foreground">{selectedCages.length}</strong> cage{selectedCages.length !== 1 ? 's' : ''} · <strong className="text-foreground">{animalsToMonitor.length}</strong> animal{animalsToMonitor.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAllCages}
              className="px-3 py-1.5 text-xs font-semibold text-success border border-success/30 rounded-lg hover:bg-success hover:text-white transition-all"
            >
              All
            </button>
            <button
              onClick={clearAllCages}
              className="px-3 py-1.5 text-xs font-semibold text-muted border border-border rounded-lg hover:bg-background transition-all"
            >
              None
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {activeCages.map(cg => {
            const animalCount = pigs.filter(p => p.cageId === cg.id).length
            const selected = selectedCages.includes(cg.id)
            return (
              <button
                key={cg.id}
                onClick={() => toggleCage(cg.id)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border',
                  selected
                    ? 'bg-success text-white border-success shadow-md'
                    : 'bg-background text-foreground border-border hover:border-success/50'
                )}
              >
                {cg.label}
                <span className={cn('ml-1.5 text-[10px]', selected ? 'text-white/70' : 'text-muted')}>
                  {animalCount}
                </span>
              </button>
            )
          })}
        </div>
        
        {activeCages.length === 0 && (
          <p className="text-sm text-muted italic">No active cages.</p>
        )}
      </div>

      {/* Monitoring List */}
      {selectedCages.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-muted/20">
            <ClipboardList className="w-8 h-8 text-muted/20" />
          </div>
          <p className="text-sm font-medium text-muted/60">Select cages above to start monitoring</p>
        </div>
      ) : animalsToMonitor.length === 0 && !searchFilter ? (
        <div className="text-center py-16 bg-surface border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-muted/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-muted/20">
            <PiggyBank className="w-8 h-8 text-muted/20" />
          </div>
          <p className="text-sm font-medium text-muted/60">No animals in selected cages</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Table header bar */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Weight Update Sheet</h3>
                  <p className="text-xs text-muted">{animalsToMonitor.length} animal{animalsToMonitor.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {/* Search filter */}
              <div className="relative">
                <input
                  className="w-56 px-3 py-2 pl-9 border border-border rounded-lg text-xs bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all"
                  placeholder="Filter by tag, breed..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                <Search className="w-3.5 h-3.5 text-muted/50 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Sticky table header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-background/80 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wider sticky top-0 z-10">
            <div className="col-span-3">Tag ID</div>
            <div className="col-span-2">Cage</div>
            <div className="col-span-1">Breed</div>
            <div className="col-span-1">Sex</div>
            <div className="col-span-2">Weight</div>
            <div className="col-span-3">Update Weight</div>
          </div>

          {/* Rows */}
          <div className="max-h-[520px] overflow-y-auto divide-y divide-border/50">
            {animalsToMonitor.map((pig) => {
              const currentCage = cages.find(c => c.id === pig.cageId)
              const isUpdating = updatingPigs.has(pig.tagId)
              const editWeight = editingWeights[pig.tagId] ?? pig.weight.toString()
              const weightChanged = editWeight !== pig.weight.toString()
              const isBleTarget = selectedAnimalForBle === pig.tagId
              
              return (
                <div
                  key={pig.id}
                  id={`pig-row-${pig.tagId}`}
                  className={cn(
                    "grid grid-cols-12 gap-3 px-5 py-3.5 hover:bg-background/50 transition-all",
                    isBleTarget && "bg-blue-50/50 ring-2 ring-blue-200 ring-inset"
                  )}
                >
                  <div className="col-span-3 flex items-center">
                    <span className="font-mono text-[11px] font-bold bg-background px-2.5 py-1 rounded-lg border border-border/60 truncate">
                      {pig.tagId}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-muted truncate">{currentCage?.label || '—'}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-[10px] text-muted truncate">{pig.breed}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className={cn('w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center border', SEX_STYLES[pig.sex])}>
                      {pig.sex[0]}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-black text-foreground">{pig.weight}<span className="text-[10px] text-muted font-normal ml-0.5">kg</span></span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className={cn(
                        'w-20 px-2.5 py-1.5 border rounded-lg text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-2 transition-all',
                        weightChanged ? 'border-success focus:border-success focus:ring-success/20' : 'border-border focus:border-border focus:ring-border/10',
                        isBleTarget && 'ring-2 ring-blue-300 border-blue-400'
                      )}
                      value={editWeight}
                      onChange={(e) => handleWeightChange(pig.tagId, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateWeight(pig) }}
                      disabled={isUpdating}
                      placeholder="Enter weight"
                      aria-label="New weight in kg"
                    />
                    {bleStatus === 'connected' && (
                      <button
                        onClick={() => {
                          const newTarget = isBleTarget ? null : pig.tagId
                          setSelectedAnimalForBle(newTarget)
                          if (newTarget && bleWeight) {
                            handleWeightChange(pig.tagId, bleWeight)
                          }
                        }}
                        className={cn(
                          'p-1.5 rounded-lg transition-all border',
                          isBleTarget
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                        )}
                        title={isBleTarget ? "Using BLE - Click to use manual" : "Click to use BLE reading"}
                      >
                        <Bluetooth className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateWeight(pig)}
                      disabled={isUpdating || !weightChanged}
                      className={cn(
                        'p-1.5 rounded-lg transition-all',
                        weightChanged
                          ? 'bg-success text-white hover:bg-success/90 active:scale-95 shadow-sm'
                          : 'bg-border/30 text-muted/40 cursor-not-allowed'
                      )}
                      title="Save weight"
                    >
                      {isUpdating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
            {animalsToMonitor.length === 0 && searchFilter && (
              <div className="text-center py-10 text-sm text-muted">
                No animals match "{searchFilter}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

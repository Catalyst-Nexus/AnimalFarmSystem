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
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { useMonitoring } from '../MonitoringContext'
import { SEX_STYLES } from '../utils'
import { useAuthStore } from '@/store/authStore'
import { isDeviceRegistered, registerDevice, updateLastConnected } from '@/services/bleDeviceService'

// BLE Constants for ESP32 Weight Scale
const BLE_SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb'
const BLE_CHARACTERISTIC_UUID = '00002a9d-0000-1000-8000-00805f9b34fb'

export const MonitoringSheetTab = () => {
  const { pigs, cages, updatePigWeight } = useMonitoring()
  const { user } = useAuthStore()
  const [selectedCages, setSelectedCages] = useState<string[]>([])
  const [editingWeights, setEditingWeights] = useState<Record<string, string>>({})
  const [updatingPigs, setUpdatingPigs] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState('')
  
  // BLE State
  const [bleStatus, setBleStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [bleError, setBleError] = useState<string | null>(null)
  const [bleWeight, setBleWeight] = useState<string>('')
  const [bleDeviceMac, setBleDeviceMac] = useState<string | null>(null)
  const [selectedAnimalForBle, setSelectedAnimalForBle] = useState<string | null>(null)
  const [pendingDevice, setPendingDevice] = useState<{ device: BluetoothDevice; deviceId: string } | null>(null)
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

    const macMatch = text.match(/MAC:([0-9a-f:]+)/i)
    const weightMatch = text.match(/Weight:([\d.]+)/)

    if (macMatch) {
      const macAddress = macMatch[1].toLowerCase()
      setBleDeviceMac(macAddress)
    }

    if (weightMatch) {
      const weight = weightMatch[1]
      setBleWeight(weight)
      // Auto-fill weight for selected animal
      if (selectedAnimalForBle) {
        setEditingWeights(prev => ({ ...prev, [selectedAnimalForBle]: weight }))
      }
    }
  }, [selectedAnimalForBle])

  // Connect to ESP32 via BLE with device verification
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

    if (!user) {
      setBleError('You must be logged in to connect to a Bluetooth device.')
      return
    }

    setBleStatus('connecting')
    setBleError(null)

    try {
      // Step 1: Request device
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'ESP32_WeightScale' }],
        optionalServices: [BLE_SERVICE_UUID],
      })

      // Step 2: Extract MAC address from device name (format: ESP32_WeightScale_aa:bb:cc:dd:ee:ff)
      const deviceId = device.id
      let macAddress: string | undefined
      
      if (device.name) {
        const macMatch = device.name.match(/ESP32_WeightScale_([0-9a-fA-F:]{17})/)
        if (macMatch) {
          macAddress = macMatch[1].toLowerCase() // Normalize to lowercase
          console.log('✓ Extracted MAC address:', macAddress)
        }
      }

      // Step 3: Check if device is registered (by MAC address or device ID)
      const { registered, device: registeredDevice, error: checkError } = await isDeviceRegistered(deviceId, macAddress)

      if (checkError) {
        setBleError(`Database error: ${checkError}`)
        setBleStatus('disconnected')
        return
      }

      if (!registered) {
        // Device not registered - show registration prompt
        setPendingDevice({ device, deviceId })
        setBleStatus('disconnected')
        const macInfo = macAddress ? ` MAC: ${macAddress}` : ''
        setBleError(
          `⚠️ Device "${device.name}" (ID: ${deviceId.substring(0, 16)}...${macInfo}) is not registered in the database. You must register it before connecting.`
        )
        return
      }

      // Step 4: Device is registered - proceed with connection
      console.log('✓ Device verified:', registeredDevice)

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
      setPendingDevice(null)

      // Update last connected timestamp (prefer MAC, fallback to device ID)
      if (macAddress) {
        // Update using MAC address as primary identifier
        await updateLastConnected(deviceId)
      } else {
        await updateLastConnected(deviceId)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect'
      if (!message.includes('cancelled')) {
        setBleError(message)
      }
      setBleStatus('disconnected')
    }
  }

  // Register pending device
  const registerPendingDevice = async () => {
    if (!pendingDevice || !user) return

    setBleStatus('connecting')
    setBleError(null)

    const { device, deviceId } = pendingDevice

    try {
      // Extract MAC address from device name (format: ESP32_WeightScale_aa:bb:cc:dd:ee:ff)
      let macAddress: string | undefined
      
      if (device.name) {
        const macMatch = device.name.match(/ESP32_WeightScale_([0-9a-fA-F:]{17})/)
        if (macMatch) {
          macAddress = macMatch[1].toLowerCase() // Normalize to lowercase
        }
      }


      // Register the device
      const resolvedMac = macAddress ?? bleDeviceMac ?? undefined
      const { success, error: regError } = await registerDevice(
        deviceId,
        device.name || 'ESP32_WeightScale',
        user.id,
        resolvedMac, // Full MAC address (aa:bb:cc:dd:ee:ff)
        'Registered via Animal Monitoring'
      )

      if (!success) {
        setBleError(`Failed to register device: ${regError}`)
        setBleStatus('disconnected')
        return
      }

      console.log('✓ Device registered successfully with MAC:', macAddress)

      // Now connect to the device
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
      setPendingDevice(null)
      setBleError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect'
      setBleError(message)
      setBleStatus('disconnected')
    }
  }

  // Cancel pending device registration
  const cancelPendingDevice = () => {
    setPendingDevice(null)
    setBleError(null)
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

        {bleError && !pendingDevice && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{bleError}</p>
          </div>
        )}

        {pendingDevice && bleError && (
          <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900 mb-1">Unregistered Device Detected</p>
                <p className="text-xs text-amber-700 mb-2">{bleError}</p>
                <div className="bg-amber-100/50 border border-amber-200 rounded-lg p-3 mb-3">
                  <p className="text-xs text-amber-800 font-semibold mb-1">Device Information:</p>
                  <div className="text-xs text-amber-700 space-y-0.5 font-mono">
                    <div>Name: <span className="font-bold">{pendingDevice.device.name}</span></div>
                    <div>ID: <span className="font-bold">{pendingDevice.deviceId}</span></div>
                  </div>
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  <ShieldCheck className="w-3 h-3 inline mr-1" />
                  For security, only registered devices can connect to the system. Would you like to register this device?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={registerPendingDevice}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Register & Connect
                  </button>
                  <button
                    onClick={cancelPendingDevice}
                    className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
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

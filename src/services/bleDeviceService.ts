import { supabase, isSupabaseConfigured } from './supabase'

export interface BLEDevice {
  id: string
  device_id: string // Bluetooth device ID (unique identifier)
  device_name: string
  mac_address?: string // Optional: if we can extract from advertising data
  registered_by: string // User ID who registered the device
  registered_at: string
  is_active: boolean
  last_connected_at?: string
  notes?: string
}

/**
 * Check if a BLE device is registered in the database
 * Checks both device_id and mac_address for maximum compatibility
 * @param deviceId - The Bluetooth device ID from navigator.bluetooth
 * @param macAddress - Optional MAC address extracted from device name
 * @returns Promise with registration status and device info
 */
export const isDeviceRegistered = async (
  deviceId: string,
  macAddress?: string
): Promise<{ registered: boolean; device?: BLEDevice; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { registered: false, error: 'Supabase is not configured' }
  }

  try {
    // First, try checking by MAC address (most reliable for BLE devices)
    if (macAddress) {
      const { data: macData, error: macError } = await supabase
        .schema('module2')
        .from('ble_devices')
        .select('*')
        .eq('mac_address', macAddress)
        .eq('is_active', true)
        .maybeSingle()

      if (macData) {
        return { registered: true, device: macData as BLEDevice }
      }
      
      if (macError && macError.code !== 'PGRST116') {
        console.error('Error checking device by MAC:', macError)
      }
    }

    // Fallback: check by device_id
    const { data, error } = await supabase
      .schema('module2')
      .from('ble_devices')
      .select('*')
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .single()

    if (error) {
      // Not found is acceptable - means device not registered
      if (error.code === 'PGRST116') {
        return { registered: false }
      }
      console.error('Error checking device registration:', error)
      return { registered: false, error: error.message }
    }

    return { registered: true, device: data as BLEDevice }
  } catch (error) {
    console.error('Error checking device registration:', error)
    return {
      registered: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Register a new BLE device
 * @param deviceId - The Bluetooth device ID
 * @param deviceName - The device name (e.g., "ESP32_WeightScale")
 * @param userId - The user ID registering the device
 * @param macAddress - Optional MAC address if available
 * @param notes - Optional notes about the device
 */
export const registerDevice = async (
  deviceId: string,
  deviceName: string,
  userId: string,
  macAddress?: string,
  notes?: string
): Promise<{ success: boolean; device?: BLEDevice; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' }
  }

  try {
    const { data, error } = await supabase
      .schema('module2')
      .from('ble_devices')
      .insert({
        device_id: deviceId,
        device_name: deviceName,
        mac_address: macAddress || null,
        registered_by: userId,
        is_active: true,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error registering device:', error)
      return { success: false, error: error.message }
    }

    return { success: true, device: data as BLEDevice }
  } catch (error) {
    console.error('Error registering device:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update the last connected timestamp for a device
 * @param deviceId - The Bluetooth device ID
 */
export const updateLastConnected = async (
  deviceId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' }
  }

  try {
    const { error } = await supabase
      .schema('module2')
      .from('ble_devices')
      .update({ last_connected_at: new Date().toISOString() })
      .eq('device_id', deviceId)

    if (error) {
      console.error('Error updating last connected:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating last connected:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get all registered BLE devices
 * @param activeOnly - If true, only return active devices
 */
export const getAllDevices = async (
  activeOnly: boolean = true
): Promise<{ devices: BLEDevice[]; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { devices: [], error: 'Supabase is not configured' }
  }

  try {
    let query = supabase.schema('module2').from('ble_devices').select('*').order('registered_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching devices:', error)
      return { devices: [], error: error.message }
    }

    return { devices: data as BLEDevice[] }
  } catch (error) {
    console.error('Error fetching devices:', error)
    return {
      devices: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Deactivate a BLE device
 * @param deviceId - The Bluetooth device ID
 */
export const deactivateDevice = async (
  deviceId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' }
  }

  try {
    const { error } = await supabase
      .schema('module2')
      .from('ble_devices')
      .update({ is_active: false })
      .eq('device_id', deviceId)

    if (error) {
      console.error('Error deactivating device:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deactivating device:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Reactivate a BLE device
 * @param deviceId - The Bluetooth device ID
 */
export const reactivateDevice = async (
  deviceId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' }
  }

  try {
    const { error } = await supabase
      .schema('module2')
      .from('ble_devices')
      .update({ is_active: true })
      .eq('device_id', deviceId)

    if (error) {
      console.error('Error reactivating device:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error reactivating device:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

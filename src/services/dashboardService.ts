import { supabase, isSupabaseConfigured } from './supabase'
import { getUserFacilityIds, applyFacilityFilter } from './facilityFilterService'

const module2 = () => supabase!.schema('module2')
const module3 = () => supabase!.schema('module3')
const module4 = () => supabase!.schema('module4')

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalAnimals: number
  activeAnimals: number
  totalCages: number
  cageOccupancy: number // percentage
  inventoryItems: number
  lowStockItems: number
  pendingRequests: number
  totalUsers: number
  activeUsers: number
  totalFacilities: number
  totalRoles: number
  totalModules: number
}

export interface AnimalByType {
  type: string
  count: number
}

export interface AnimalBySex {
  sex: string
  count: number
}

export interface AnimalByStatus {
  status: string
  count: number
}

export interface CageOccupancy {
  label: string
  occupied: number
  capacity: number
}

export interface InventoryByCategory {
  category: string
  totalValue: number
  itemCount: number
}

export interface RecentAnimal {
  id: string
  tagCode: string
  animalType: string
  sex: string
  weight: number
  status: string
  createdAt: string
}

export interface ExpiringItem {
  id: string
  description: string
  category: string
  expiryDate: string
  quantity: number
  daysUntilExpiry: number
}

export interface StockRequestSummary {
  id: string
  status: string
  quantity: number
  createdAt: string
  purpose: string
}

export interface RationTrend {
  date: string
  count: number
  totalQuantity: number
}

export interface StockTransactionTrend {
  date: string
  requests: number
  returns: number
}

// ─── Dashboard Data Fetching ─────────────────────────────────────────────────

export const dashboardService = {
  /**
   * Fetch all dashboard KPI stats
   */
  async getStats(userId: string): Promise<DashboardStats> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        totalAnimals: 0, activeAnimals: 0, totalCages: 0, cageOccupancy: 0,
        inventoryItems: 0, lowStockItems: 0, pendingRequests: 0,
        totalUsers: 0, activeUsers: 0, totalFacilities: 0, totalRoles: 0, totalModules: 0,
      }
    }

    const facilityIds = await getUserFacilityIds(userId)

    // Fire all queries in parallel
    const [
      animalsResult,
      cagesResult,
      inventoryResult,
      pendingRequestsResult,
      usersResult,
      facilitiesResult,
      rolesResult,
      modulesResult,
    ] = await Promise.all([
      // Animals count
      (() => {
        let q = module2().from('animals').select('id, is_active', { count: 'exact', head: false })
        q = applyFacilityFilter(q, facilityIds)
        return q
      })(),
      // Cages count
      (() => {
        let q = module2().from('cages').select('id, max_capacity', { count: 'exact', head: false })
        q = applyFacilityFilter(q, facilityIds)
        return q
      })(),
      // Inventory items
      module3().from('delivery_items').select('id, quantity_delivery', { count: 'exact', head: false }),
      // Pending stock requests
      module3().from('stock_request').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      // Users
      supabase!.from('pending_users').select('id, is_confirmed', { count: 'exact', head: false }),
      // Facilities
      supabase!.from('facilities').select('id', { count: 'exact', head: true }),
      // Roles
      supabase!.from('roles').select('id', { count: 'exact', head: true }),
      // Modules
      supabase!.from('modules').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])

    const animals = animalsResult.data || []
    const cages = cagesResult.data || []
    const inventory = inventoryResult.data || []
    const users = usersResult.data || []

    const totalCapacity = cages.reduce((sum: number, c: { max_capacity: number }) => sum + (c.max_capacity || 0), 0)
    const cageOccupancy = totalCapacity > 0 ? Math.round((animals.length / totalCapacity) * 100) : 0

    return {
      totalAnimals: animals.length,
      activeAnimals: animals.filter((a: { is_active: boolean }) => a.is_active).length,
      totalCages: cages.length,
      cageOccupancy,
      inventoryItems: inventory.length,
      lowStockItems: inventory.filter((i: { quantity_delivery: number }) => i.quantity_delivery <= 10).length,
      pendingRequests: pendingRequestsResult.count || 0,
      totalUsers: users.length,
      activeUsers: users.filter((u: { is_confirmed: boolean }) => u.is_confirmed).length,
      totalFacilities: facilitiesResult.count || 0,
      totalRoles: rolesResult.count || 0,
      totalModules: modulesResult.count || 0,
    }
  },

  /**
   * Animal distribution by type
   */
  async getAnimalsByType(userId: string): Promise<AnimalByType[]> {
    if (!isSupabaseConfigured() || !supabase) return []

    const facilityIds = await getUserFacilityIds(userId)
    let q = module2().from('animals').select(`
      tag_animals_colors!tag_animals_colors_id(
        animal_types!animal_type_id(animal_name)
      )
    `)
    q = applyFacilityFilter(q, facilityIds)
    const { data, error } = await q
    if (error) { console.error('getAnimalsByType error:', error); return [] }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      const name = (row as any)?.tag_animals_colors?.animal_types?.animal_name || 'Unknown'
      counts[name] = (counts[name] || 0) + 1
    }
    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
  },

  /**
   * Animal distribution by sex
   */
  async getAnimalsBySex(userId: string): Promise<AnimalBySex[]> {
    if (!isSupabaseConfigured() || !supabase) return []

    const facilityIds = await getUserFacilityIds(userId)
    let q = module2().from('animals').select('sex')
    q = applyFacilityFilter(q, facilityIds)
    const { data, error } = await q
    if (error) { console.error('getAnimalsBySex error:', error); return [] }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      const sex = (row as any).sex || 'Unknown'
      counts[sex] = (counts[sex] || 0) + 1
    }
    return Object.entries(counts).map(([sex, count]) => ({ sex, count }))
  },

  /**
   * Animal distribution by status
   */
  async getAnimalsByStatus(userId: string): Promise<AnimalByStatus[]> {
    if (!isSupabaseConfigured() || !supabase) return []

    const facilityIds = await getUserFacilityIds(userId)
    let q = module2().from('animals').select('status')
    q = applyFacilityFilter(q, facilityIds)
    const { data, error } = await q
    if (error) { console.error('getAnimalsByStatus error:', error); return [] }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      const status = (row as any).status || 'Unknown'
      counts[status] = (counts[status] || 0) + 1
    }
    return Object.entries(counts).map(([status, count]) => ({ status, count }))
  },

  /**
   * Cage occupancy breakdown
   */
  async getCageOccupancy(userId: string): Promise<CageOccupancy[]> {
    if (!isSupabaseConfigured() || !supabase) return []

    const facilityIds = await getUserFacilityIds(userId)

    // Get cages
    let cagesQuery = module2().from('cages').select('id, cage_label, max_capacity')
    cagesQuery = applyFacilityFilter(cagesQuery, facilityIds)
    const { data: cages, error: cagesError } = await cagesQuery
    if (cagesError) { console.error('getCageOccupancy cages error:', cagesError); return [] }

    // Get animal counts per cage
    let animalsQuery = module2().from('animals').select('current_cage_id')
    animalsQuery = applyFacilityFilter(animalsQuery, facilityIds)
    const { data: animals, error: animalsError } = await animalsQuery
    if (animalsError) { console.error('getCageOccupancy animals error:', animalsError); return [] }

    const cageCounts: Record<string, number> = {}
    for (const a of animals || []) {
      const cageId = (a as any).current_cage_id
      if (cageId) cageCounts[cageId] = (cageCounts[cageId] || 0) + 1
    }

    return (cages || []).map((c: any) => ({
      label: c.cage_label,
      occupied: cageCounts[c.id] || 0,
      capacity: c.max_capacity || 0,
    })).sort((a: CageOccupancy, b: CageOccupancy) => (b.occupied / Math.max(b.capacity, 1)) - (a.occupied / Math.max(a.capacity, 1)))
  },

  /**
   * Inventory by category with total value
   */
  async getInventoryByCategory(): Promise<InventoryByCategory[]> {
    if (!isSupabaseConfigured() || !supabase) return []

    const { data, error } = await module3()
      .from('delivery_items')
      .select('total_price, quantity_delivery, category(name)')
    if (error) { console.error('getInventoryByCategory error:', error); return [] }

    const grouped: Record<string, { totalValue: number; itemCount: number }> = {}
    for (const row of data || []) {
      const catName = (row as any).category?.name || 'Uncategorized'
      if (!grouped[catName]) grouped[catName] = { totalValue: 0, itemCount: 0 }
      grouped[catName].totalValue += (row as any).total_price || 0
      grouped[catName].itemCount += 1
    }
    return Object.entries(grouped)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.totalValue - a.totalValue)
  },

  /**
   * Recently added animals
   */
  async getRecentAnimals(userId: string, limit = 5): Promise<RecentAnimal[]> {
    if (!isSupabaseConfigured() || !supabase) return []

    const facilityIds = await getUserFacilityIds(userId)
    let q = module2().from('animals').select(`
      id, sex, weight, status, created_at,
      tag_animals_colors!tag_animals_colors_id(
        tag_code,
        animal_types!animal_type_id(animal_name),
        tag_types!tag_type_id(type)
      )
    `)
    q = applyFacilityFilter(q, facilityIds)
    const { data, error } = await q
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) { console.error('getRecentAnimals error:', error); return [] }

    return (data || []).map((row: any) => {
      const tag = row.tag_animals_colors
      return {
        id: row.id,
        tagCode: tag ? `${tag.tag_types?.type || ''}-${tag.tag_code || ''}` : 'N/A',
        animalType: tag?.animal_types?.animal_name || 'Unknown',
        sex: row.sex,
        weight: row.weight,
        status: row.status,
        createdAt: row.created_at,
      }
    })
  },

  /**
   * Expiring inventory items (within next 30 days)
   */
  async getExpiringItems(daysAhead = 30): Promise<ExpiringItem[]> {
    if (!isSupabaseConfigured() || !supabase) return []

    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + daysAhead)

    const { data, error } = await module3()
      .from('delivery_items')
      .select('id, description, expiry_date, quantity_delivery, category(name)')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true })
      .limit(10)
    if (error) { console.error('getExpiringItems error:', error); return [] }

    return (data || []).map((row: any) => {
      const expiry = new Date(row.expiry_date)
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: row.id,
        description: row.description || 'No description',
        category: row.category?.name || 'Uncategorized',
        expiryDate: row.expiry_date,
        quantity: row.quantity_delivery,
        daysUntilExpiry: diffDays,
      }
    })
  },

  /**
   * Ration trends (last 14 days)
   */
  async getRationTrends(): Promise<RationTrend[]> {
    if (!isSupabaseConfigured() || !supabase) return []

    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const { data, error } = await module4()
      .from('ration')
      .select('date_given, quantity_used')
      .gte('date_given', twoWeeksAgo.toISOString().split('T')[0])
      .order('date_given', { ascending: true })
    if (error) { console.error('getRationTrends error:', error); return [] }

    const grouped: Record<string, { count: number; totalQuantity: number }> = {}
    for (const row of data || []) {
      const date = (row as any).date_given?.split('T')[0] || ''
      if (!grouped[date]) grouped[date] = { count: 0, totalQuantity: 0 }
      grouped[date].count += 1
      grouped[date].totalQuantity += (row as any).quantity_used || 0
    }

    // Fill missing dates
    const result: RationTrend[] = []
    const current = new Date(twoWeeksAgo)
    const now = new Date()
    while (current <= now) {
      const dateStr = current.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        count: grouped[dateStr]?.count || 0,
        totalQuantity: grouped[dateStr]?.totalQuantity || 0,
      })
      current.setDate(current.getDate() + 1)
    }
    return result
  },

  /**
   * Stock transaction trends (last 14 days)
   */
  async getStockTransactionTrends(): Promise<StockTransactionTrend[]> {
    if (!isSupabaseConfigured() || !supabase) return []

    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const { data, error } = await module4()
      .from('stock_transaction')
      .select('created_at, type')
      .gte('created_at', twoWeeksAgo.toISOString())
      .order('created_at', { ascending: true })
    if (error) { console.error('getStockTransactionTrends error:', error); return [] }

    const grouped: Record<string, { requests: number; returns: number }> = {}
    for (const row of data || []) {
      const date = (row as any).created_at?.split('T')[0] || ''
      if (!grouped[date]) grouped[date] = { requests: 0, returns: 0 }
      if ((row as any).type === 'request') grouped[date].requests += 1
      else if ((row as any).type === 'return') grouped[date].returns += 1
    }

    const result: StockTransactionTrend[] = []
    const current = new Date(twoWeeksAgo)
    const now = new Date()
    while (current <= now) {
      const dateStr = current.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        requests: grouped[dateStr]?.requests || 0,
        returns: grouped[dateStr]?.returns || 0,
      })
      current.setDate(current.getDate() + 1)
    }
    return result
  },

  /**
   * Weight distribution of animals
   */
  async getAnimalWeightDistribution(userId: string): Promise<{ range: string; count: number }[]> {
    if (!isSupabaseConfigured() || !supabase) return []

    const facilityIds = await getUserFacilityIds(userId)
    let q = module2().from('animals').select('weight')
    q = applyFacilityFilter(q, facilityIds)
    const { data, error } = await q
    if (error) { console.error('getAnimalWeightDistribution error:', error); return [] }

    const ranges = [
      { label: '0-5 kg', min: 0, max: 5 },
      { label: '5-10 kg', min: 5, max: 10 },
      { label: '10-20 kg', min: 10, max: 20 },
      { label: '20-50 kg', min: 20, max: 50 },
      { label: '50+ kg', min: 50, max: Infinity },
    ]

    const distribution = ranges.map(r => ({
      range: r.label,
      count: (data || []).filter((a: any) => a.weight >= r.min && a.weight < r.max).length,
    }))

    return distribution
  },
}

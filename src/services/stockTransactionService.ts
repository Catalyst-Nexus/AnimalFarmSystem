import { supabase, isSupabaseConfigured } from './supabase'

const module4 = () => supabase!.schema('module4')

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StockTransaction {
  id: string
  status: string
  created_at: string
  type: string              // 'request' | 'return'
  ration_id: string | null
  delivery_item_id: string
  unit_id: string
  quantity: number
  approved_quantity: number | null
  purpose: string | null
  reason: string | null
  requested_by: string
  reviewed_by: string | null
  reviewed_at: string | null
  notes: string | null
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export const fetchStockTransactions = async (
  type?: 'request' | 'return'
): Promise<StockTransaction[]> => {
  if (!isSupabaseConfigured() || !supabase) return []
  let query = module4()
    .from('stock_transaction')
    .select('*')
    .order('created_at', { ascending: false })
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) {
    console.error('fetchStockTransactions error:', error)
    return []
  }
  return data || []
}

// ─── Create ──────────────────────────────────────────────────────────────────

export const createStockTransaction = async (fields: {
  type: string
  delivery_item_id: string
  unit_id: string
  quantity: number
  ration_id?: string | null
  approved_quantity?: number | null
  purpose?: string | null
  reason?: string | null
  requested_by: string
  reviewed_by?: string | null
  reviewed_at?: string | null
  notes?: string | null
  status?: string
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured', data: null }
  const { data, error } = await module4()
    .from('stock_transaction')
    .insert(fields)
    .select('*')
    .single()
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data, error: null }
}

// ─── Update ──────────────────────────────────────────────────────────────────

export const updateStockTransaction = async (
  id: string,
  fields: Partial<Omit<StockTransaction, 'id' | 'created_at'>>
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured', data: null }
  const { data, error } = await module4()
    .from('stock_transaction')
    .update(fields)
    .eq('id', id)
    .select('*')
    .single()
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data, error: null }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export const deleteStockTransaction = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: 'Supabase not configured' }
  const { error } = await module4()
    .from('stock_transaction')
    .delete()
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── Approved Stock Items for Feeding/Vitamins ──────────────────────────────

export interface ApprovedStockItem {
  id: string
  delivery_item_id: string
  description: string | null
  brand_name: string | null
  category_name: string | null
  unit_issuance_name: string
  unit_issuance_id: string
  available_quantity: number // in issuance units (kg, ml, etc.)
  unit_price_per_issuance: number // price per kg/ml/etc
  expiry_date: string | null
}

/**
 * Fetch approved stock request items available for feeding/vitamins
 * Returns items with quantities in issuance units (kg, ml, etc.)
 */
export const fetchApprovedStockItems = async (): Promise<ApprovedStockItem[]> => {
  if (!isSupabaseConfigured() || !supabase) return []
  
  try {
    // Fetch approved stock requests
    const { data: transactions, error: txError } = await module4()
      .from('stock_transaction')
      .select(`
        id,
        delivery_item_id,
        approved_quantity,
        unit_id
      `)
      .eq('type', 'request')
      .eq('status', 'approved')
      .not('approved_quantity', 'is', null)
      .gt('approved_quantity', 0)

    if (txError) {
      console.error('Error fetching approved stock transactions:', txError)
      return []
    }

    if (!transactions || transactions.length === 0) {
      console.log('No approved stock transactions found')
      return []
    }

    // Get unique delivery item IDs
    const deliveryItemIds = [...new Set(transactions.map(t => t.delivery_item_id))]

    // Fetch delivery items with all details
    const { data: deliveryItems, error: diError } = await supabase!
      .schema('module3')
      .from('delivery_items')
      .select(`
        id,
        description,
        expiry_date,
        unit_issuance_rate,
        unit_price_delivery,
        quantity_delivery,
        unit_delivery_id,
        unit_issuance_id,
        brand:brand_id(name),
        category:category_id(name),
        unit_issuance:unit!unit_issuance_id(id, name)
      `)
      .in('id', deliveryItemIds)

    if (diError) {
      console.error('Error fetching delivery items:', diError)
      return []
    }

    // Group transactions by delivery_item_id and sum approved quantities (convert to issuance units)
    const itemQuantities: Record<string, number> = {}
    
    transactions.forEach(tx => {
      const deliveryItem = deliveryItems?.find(di => di.id === tx.delivery_item_id)
      if (!deliveryItem) return
      
      let qtyInIssuanceUnits = tx.approved_quantity || 0
      
      // If approved in delivery units (sacks), convert to issuance units (kg)
      if (tx.unit_id === deliveryItem.unit_delivery_id) {
        const conversionRate = deliveryItem.unit_issuance_rate || 1
        qtyInIssuanceUnits = qtyInIssuanceUnits * conversionRate
      }
      
      itemQuantities[tx.delivery_item_id] = (itemQuantities[tx.delivery_item_id] || 0) + qtyInIssuanceUnits
    })

    // Map to ApprovedStockItem format
    const approvedItems: ApprovedStockItem[] = deliveryItems
      ?.filter(item => itemQuantities[item.id] > 0)
      .map(item => {
        const availableQty = itemQuantities[item.id]
        const pricePerSack = item.unit_price_delivery || 0
        const kgPerSack = item.unit_issuance_rate || 1
        const pricePerKg = kgPerSack > 0 ? pricePerSack / kgPerSack : 0

        return {
          id: item.id,
          delivery_item_id: item.id,
          description: item.description,
          brand_name: (item.brand as any)?.name || null,
          category_name: (item.category as any)?.name || null,
          unit_issuance_name: (item.unit_issuance as any)?.name || 'unit',
          unit_issuance_id: (item.unit_issuance as any)?.id || '',
          available_quantity: availableQty,
          unit_price_per_issuance: pricePerKg,
          expiry_date: item.expiry_date,
        }
      }) || []

    console.log('Fetched approved stock items:', approvedItems.length)
    return approvedItems
  } catch (err) {
    console.error('Error in fetchApprovedStockItems:', err)
    return []
  }
}

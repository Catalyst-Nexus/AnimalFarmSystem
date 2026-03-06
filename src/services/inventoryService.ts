import { supabase, isSupabaseConfigured } from "./supabase";
import { getUserFacilityIds, applyFacilityFilter } from './facilityFilterService'

// Helper to query tables in the module3 schema using the shared auth session
const module3 = () => supabase!.schema("module3");

// ─── Types ───────────────────────────────────────────────────────────────────

export const ITEM_CATEGORIES = [
  "Feeds",
  "Vitamins",
  "Supplements",
  "Medicine",
  "Equipment",
  "Other",
] as const;

export interface Item {
  id: string;
  created_at: string;
  item_name: string;
  full_kg: number;
  category: string | null;
  supplier: string | null;
  description: string | null;
  unit: string | null;
}

export interface Warehouse {
  id: string;
  created_at: string;
  item_id: string;
  sacks: number;
  cost: number;
  batch_no: string | null;
  expiry_date: string | null;
  notes: string | null;
  items?: Item;
}

export interface Storage {
  id: string;
  created_at: string;
  item_id: string;
  rem_kg: number;
  is_open: boolean;
  location: string | null;
  items?: Item;
}

export interface Log {
  id: string;
  created_at: string;
  storage_id: string;
  used_kg: number;
  spend: number;
  purpose: string | null;
  logged_by: string | null;
  storage?: Storage & { items?: Item };
}

// ─── Items CRUD ──────────────────────────────────────────────────────────────

/**
 * Fetch items filtered by user's facilities
 * NOTE: Items might be shared globally across facilities, or facility-specific
 * depending on your schema. If items table has user_facility_id, filtering is applied.
 * @param userId - The user ID to filter by their assigned facilities
 */
export const fetchItems = async (userId: string): Promise<Item[]> => {
  if (!isSupabaseConfigured() ||!supabase) return [];
  
  // Get user's facility IDs
  const facilityIds = await getUserFacilityIds(userId)
  
  let query = module3()
    .from("items")
    .select("*")

  // Apply facility filter if items table has user_facility_id column
  query = applyFacilityFilter(query, facilityIds)

  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) {
    console.error("fetchItems error:", error);
    return [];
  }
  return data || [];
};

export const createItem = async (fields: {
  item_name: string;
  full_kg: number;
  user_facility_id: string; // REQUIRED: Facility assignment
  category?: string;
  supplier?: string;
  description?: string;
  unit?: string;
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("items").insert(fields);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const updateItem = async (
  id: string,
  userId: string,
  fields: {
    item_name: string;
    full_kg: number;
    category?: string;
    supplier?: string;
    description?: string;
    unit?: string;
    user_facility_id?: string;
  },
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  
  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  let query = module3().from("items").update(fields).eq("id", id);
  
  // Apply facility filter to ensure user can only update their facility's items
  query = applyFacilityFilter(query, facilityIds)

  const { error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteItem = async (id: string, userId: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  
  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  let query = module3().from("items").delete().eq("id", id);
  
  // Apply facility filter to ensure user can only delete their facility's items
  query = applyFacilityFilter(query, facilityIds)

  const { error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Warehouse CRUD ──────────────────────────────────────────────────────────

/**
 * Fetch warehouse entries filtered by user's facilities
 * @param userId - The user ID to filter by their assigned facilities
 */
export const fetchWarehouse = async (userId: string): Promise<Warehouse[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  
  // Get user's facility IDs
  const facilityIds = await getUserFacilityIds(userId)

  let query = module3()
    .from("warehouse")
    .select("*, items(*)")

  // Apply facility filter
  query = applyFacilityFilter(query, facilityIds)

  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) {
    console.error("fetchWarehouse error:", error);
    return [];
  }
  return data || [];
};

export const createWarehouseEntry = async (fields: {
  item_id: string;
  sacks: number;
  cost: number;
  user_facility_id: string; // REQUIRED: Facility assignment
  batch_no?: string;
  expiry_date?: string;
  notes?: string;
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("warehouse").insert(fields);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const updateWarehouseEntry = async (
  id: string,
  userId: string,
  fields: {
    item_id: string;
    sacks: number;
    cost: number;
    batch_no?: string;
    expiry_date?: string;
    notes?: string;
    user_facility_id?: string;
  },
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  
  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  let query = module3()
    .from("warehouse")
    .update(fields)
    .eq("id", id);

  // Apply facility filter to ensure user can only update their facility's warehouse entries
  query = applyFacilityFilter(query, facilityIds)

  const { error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteWarehouseEntry = async (id: string, userId: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  
  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  let query = module3().from("warehouse").delete().eq("id", id);

  // Apply facility filter to ensure user can only delete their facility's warehouse entries
  query = applyFacilityFilter(query, facilityIds)

  const { error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Storage CRUD ────────────────────────────────────────────────────────────

/**
 * Fetch storage entries filtered by user's facilities
 * @param userId - The user ID to filter by their assigned facilities
 */
export const fetchStorage = async (userId: string): Promise<Storage[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  
  // Get user's facility IDs
  const facilityIds = await getUserFacilityIds(userId)

  let query = module3()
    .from("storage")
    .select("*, items(*)")

  // Apply facility filter
  query = applyFacilityFilter(query, facilityIds)

  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) {
    console.error("fetchStorage error:", error);
    return [];
  }
  return data || [];
};

export const createStorageEntry = async (fields: {
  item_id: string;
  rem_kg: number;
  is_open: boolean;
  user_facility_id: string; // REQUIRED: Facility assignment
  location?: string;
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("storage").insert(fields);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const updateStorageEntry = async (
  id: string,
  userId: string,
  fields: {
    item_id: string;
    rem_kg: number;
    is_open: boolean;
    location?: string;
    user_facility_id?: string;
  },
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  
  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  let query = module3().from("storage").update(fields).eq("id", id);

  // Apply facility filter to ensure user can only update their facility's storage entries
  query = applyFacilityFilter(query, facilityIds)

  const { error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteStorageEntry = async (id: string, userId: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  
  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  let query = module3().from("storage").delete().eq("id", id);

  // Apply facility filter to ensure user can only delete their facility's storage entries
  query = applyFacilityFilter(query, facilityIds)

  const { error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Logs CRUD ───────────────────────────────────────────────────────────────

/**
 * Fetch logs filtered by user's facilities
 * @param userId - The user ID to filter by their assigned facilities
 */
export const fetchLogs = async (userId: string): Promise<Log[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  
  // Get user's facility IDs
  const facilityIds = await getUserFacilityIds(userId)

  let query = module3()
    .from("logs")
    .select("*, storage(*, items(*))")

  // Apply facility filter
  query = applyFacilityFilter(query, facilityIds)

  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) {
    console.error("fetchLogs error:", error);
    return [];
  }
  return data || [];
};

/**
 * Create a log entry and auto-deduct used_kg from the storage entry's rem_kg.
 * If rem_kg reaches 0, the storage sack is automatically marked as closed.
 * Respects facility filtering.
 */
export const createLog = async (
  userId: string,
  fields: {
    storage_id: string;
    used_kg: number;
    spend: number;
    user_facility_id: string; // REQUIRED: Facility assignment
    purpose?: string;
    logged_by?: string;
  }
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };

  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  // 1. Get current storage entry to validate remaining kg (with facility filter)
  let storageQuery = module3()
    .from("storage")
    .select("rem_kg, is_open")
    .eq("id", fields.storage_id)

  storageQuery = applyFacilityFilter(storageQuery, facilityIds)

  const { data: storage, error: fetchErr } = await storageQuery.single();
  
  if (fetchErr || !storage)
    return { success: false, error: "Storage entry not found" };

  const currentRemKg = Number(storage.rem_kg);
  if (fields.used_kg > currentRemKg) {
    return {
      success: false,
      error: `Cannot use ${fields.used_kg} kg — only ${currentRemKg} kg remaining`,
    };
  }

  // 2. Insert the log
  const { error: logErr } = await module3().from("logs").insert(fields);
  if (logErr) return { success: false, error: logErr.message };

  // 3. Deduct used_kg from storage rem_kg
  const newRemKg = Math.max(0, currentRemKg - fields.used_kg);
  const updateFields: { rem_kg: number; is_open?: boolean } = {
    rem_kg: newRemKg,
  };
  // Auto-close sack if fully consumed
  if (newRemKg === 0) updateFields.is_open = false;

  const { error: updateErr } = await module3()
    .from("storage")
    .update(updateFields)
    .eq("id", fields.storage_id);
  if (updateErr) console.error("Failed to update storage rem_kg:", updateErr);

  return { success: true };
};

export const deleteLog = async (id: string, userId: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  
  // Get user's facility IDs to verify access
  const facilityIds = await getUserFacilityIds(userId)

  let query = module3().from("logs").delete().eq("id", id);

  // Apply facility filter to ensure user can only delete their facility's logs
  query = applyFacilityFilter(query, facilityIds)

  const { error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true };
};

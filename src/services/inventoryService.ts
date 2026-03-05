import { supabase, isSupabaseConfigured } from "./supabase";

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

export const fetchItems = async (): Promise<Item[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await module3()
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchItems error:", error);
    return [];
  }
  return data || [];
};

export const createItem = async (fields: {
  item_name: string;
  full_kg: number;
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
  fields: {
    item_name: string;
    full_kg: number;
    category?: string;
    supplier?: string;
    description?: string;
    unit?: string;
  },
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("items").update(fields).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteItem = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("items").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Warehouse CRUD ──────────────────────────────────────────────────────────

export const fetchWarehouse = async (): Promise<Warehouse[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await module3()
    .from("warehouse")
    .select("*, items(*)")
    .order("created_at", { ascending: false });
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
  fields: {
    item_id: string;
    sacks: number;
    cost: number;
    batch_no?: string;
    expiry_date?: string;
    notes?: string;
  },
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3()
    .from("warehouse")
    .update(fields)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteWarehouseEntry = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("warehouse").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Storage CRUD ────────────────────────────────────────────────────────────

export const fetchStorage = async (): Promise<Storage[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await module3()
    .from("storage")
    .select("*, items(*)")
    .order("created_at", { ascending: false });
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
  fields: {
    item_id: string;
    rem_kg: number;
    is_open: boolean;
    location?: string;
  },
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("storage").update(fields).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteStorageEntry = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("storage").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Logs CRUD ───────────────────────────────────────────────────────────────

export const fetchLogs = async (): Promise<Log[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await module3()
    .from("logs")
    .select("*, storage(*, items(*))")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchLogs error:", error);
    return [];
  }
  return data || [];
};

/**
 * Create a log entry and auto-deduct used_kg from the storage entry's rem_kg.
 * If rem_kg reaches 0, the storage sack is automatically marked as closed.
 */
export const createLog = async (fields: {
  storage_id: string;
  used_kg: number;
  spend: number;
  purpose?: string;
  logged_by?: string;
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };

  // 1. Get current storage entry to validate remaining kg
  const { data: storage, error: fetchErr } = await module3()
    .from("storage")
    .select("rem_kg, is_open")
    .eq("id", fields.storage_id)
    .single();
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

export const deleteLog = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("logs").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

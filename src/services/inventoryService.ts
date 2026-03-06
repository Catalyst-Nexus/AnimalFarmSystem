import { supabase, isSupabaseConfigured } from "./supabase";


// Helper to query tables in the module3 schema using the shared auth session
const module3 = () => supabase!.schema("module3");
// Helper to query tables in the module4 schema (feeding/ration)
const module4 = () => supabase!.schema("module4");

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
}

export interface DeliveryItem {
  id: string;
  created_at: string;
  category_id: string;
  description: string | null;
  brand_id: string | null;
  expiry_date: string | null;
  delivery_receipt: string | null;
  unit_delivery_id: string;
  unit_issuance_id: string;
  unit_price_delivery: number;
  quantity_delivery: number;
  total_price: number; // generated column
  quantity_issuance: number; // generated column
  unit_price_issuance: number; // generated column
  unit_issuance_rate: number;
  status: string;
  // joined lookups
  category?: Category;
  brand?: Brand;
  unit_delivery?: Unit;
  unit_issuance?: Unit;
}

// ─── Lookup: Category ────────────────────────────────────────────────────────

export const fetchCategories = async (): Promise<Category[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await module3()
    .from("category")
    .select("*")
    .order("name");
  if (error) {
    console.error("fetchCategories error:", error);
    return [];
  }
  return data || [];
};

export const createCategory = async (name: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("category").insert({ name });
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteCategory = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("category").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Lookup: Brand ───────────────────────────────────────────────────────────

export const fetchBrands = async (): Promise<Brand[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await module3()
    .from("brand")
    .select("*")
    .order("name");
  if (error) {
    console.error("fetchBrands error:", error);
    return [];
  }
  return data || [];
};

export const createBrand = async (name: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("brand").insert({ name });
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteBrand = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("brand").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Lookup: Unit ────────────────────────────────────────────────────────────

export const fetchUnits = async (): Promise<Unit[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await module3()
    .from("unit")
    .select("*")
    .order("name");
  if (error) {
    console.error("fetchUnits error:", error);
    return [];
  }
  return data || [];
};

export const createUnit = async (name: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("unit").insert({ name });
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteUnit = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("unit").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Delivery Items CRUD ─────────────────────────────────────────────────────

export const fetchDeliveryItems = async (): Promise<DeliveryItem[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await module3()
    .from("delivery_items")
    .select(
      "*, category(*), brand(*), unit_delivery:unit!unit_delivery_id(*), unit_issuance:unit!unit_issuance_id(*)",
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchDeliveryItems error:", error);
    return [];
  }
  return data || [];
};

export const createDeliveryItem = async (fields: {
  category_id: string;
  description?: string;
  brand_id?: string;
  expiry_date?: string;
  delivery_receipt?: string;
  unit_delivery_id: string;
  unit_issuance_id: string;
  unit_price_delivery: number;
  quantity_delivery: number;
  unit_issuance_rate: number;
  status?: string;
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("delivery_items").insert(fields);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const updateDeliveryItem = async (
  id: string,
  fields: {
    category_id?: string;
    description?: string;
    brand_id?: string | null;
    expiry_date?: string | null;
    delivery_receipt?: string | null;
    unit_delivery_id?: string;
    unit_issuance_id?: string;
    unit_price_delivery?: number;
    quantity_delivery?: number;
    unit_issuance_rate?: number;
    status?: string;
  },
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3()
    .from("delivery_items")
    .update(fields)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteDeliveryItem = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3()
    .from("delivery_items")
    .delete()
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Stock Requests ──────────────────────────────────────────────────────────

export interface StockRequest {
  id: string;
  created_at: string;
  delivery_item_id: string;
  requested_quantity: number;
  requested_by: string;
  purpose: string | null;
  status: string;
  reviewed_at: string | null;
  notes: string | null;
  // joined
  delivery_item?: DeliveryItem;
}

export const fetchStockRequests = async (): Promise<StockRequest[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await module3()
    .from("stock_request")
    .select(
      "*, delivery_item:delivery_items!delivery_item_id(*, category(*), brand(*), unit_delivery:unit!unit_delivery_id(*), unit_issuance:unit!unit_issuance_id(*))",
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchStockRequests error:", error);
    return [];
  }
  return data || [];
};

export const createStockRequest = async (fields: {
  delivery_item_id: string;
  requested_quantity: number;
  requested_by: string;
  purpose?: string;
  notes?: string;
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("stock_request").insert(fields);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const approveStockRequest = async (
  requestId: string,
  deliveryItemId: string,
  quantityToDeduct: number,
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { data: item, error: fetchError } = await module3()
    .from("delivery_items")
    .select("quantity_delivery")
    .eq("id", deliveryItemId)
    .single();
  if (fetchError || !item)
    return { success: false, error: "Failed to fetch delivery item" };
  const newQty = item.quantity_delivery - quantityToDeduct;
  if (newQty < 0)
    return {
      success: false,
      error: `Insufficient stock. Available: ${item.quantity_delivery}`,
    };
  const { error: reqError } = await module3()
    .from("stock_request")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", requestId);
  if (reqError) return { success: false, error: reqError.message };
  const { error: deductError } = await module3()
    .from("delivery_items")
    .update({ quantity_delivery: newQty })
    .eq("id", deliveryItemId);
  if (deductError) return { success: false, error: deductError.message };
  return { success: true };
};

export const rejectStockRequest = async (requestId: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3()
    .from("stock_request")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const deleteStockRequest = async (id: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module3().from("stock_request").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ─── Module4 Ration Requests (read-only from inventory side) ─────────────────

export interface RationRequest {
  id: string;
  created_at: string;
  ration_type_id: string;
  delivery_item_id: string;
  unit_id: string;
  meal_number: number | null;
  administered_by: string;
  notes: string | null;
  quantity_used: number;
  date_given: string;
  status: string;
  // JS-merged lookups
  delivery_item?: DeliveryItem;
  ration_type?: { id: string; name: string };
  unit?: Unit;
}

export const fetchRationRequests = async (): Promise<RationRequest[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  // Fetch from module4 and resolve lookups from module3 in JS
  // (cross-schema PostgREST joins are not supported)
  const [
    { data: rations, error },
    { data: rationTypes },
    { data: deliveryItems },
    { data: units },
  ] = await Promise.all([
    module4()
      .from("ration")
      .select("*")
      .order("created_at", { ascending: false }),
    module4().from("ration_type").select("*"),
    module3()
      .from("delivery_items")
      .select(
        "*, category(*), brand(*), unit_delivery:unit!unit_delivery_id(*), unit_issuance:unit!unit_issuance_id(*)",
      ),
    module3().from("unit").select("*"),
  ]);
  if (error) {
    console.error("fetchRationRequests error:", error);
    return [];
  }
  return (rations || []).map((r) => ({
    ...r,
    delivery_item: (deliveryItems || []).find(
      (d) => d.id === r.delivery_item_id,
    ),
    ration_type: (rationTypes || []).find((t) => t.id === r.ration_type_id),
    unit: (units || []).find((u) => u.id === r.unit_id),
  }));
};

export const approveRationRequest = async (
  rationId: string,
  deliveryItemId: string,
  quantityToDeduct: number,
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { data: item, error: fetchError } = await module3()
    .from("delivery_items")
    .select("quantity_delivery")
    .eq("id", deliveryItemId)
    .single();
  if (fetchError || !item)
    return { success: false, error: "Failed to fetch delivery item" };
  const newQty = item.quantity_delivery - quantityToDeduct;
  if (newQty < 0)
    return {
      success: false,
      error: `Insufficient stock. Available: ${item.quantity_delivery}`,
    };
  const { error: rationError } = await module4()
    .from("ration")
    .update({ status: "approved" })
    .eq("id", rationId);
  if (rationError) return { success: false, error: rationError.message };
  const { error: deductError } = await module3()
    .from("delivery_items")
    .update({ quantity_delivery: newQty })
    .eq("id", deliveryItemId);
  if (deductError) return { success: false, error: deductError.message };
  return { success: true };
};

export const rejectRationRequest = async (rationId: string) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module4()
    .from("ration")
    .update({ status: "rejected" })
    .eq("id", rationId);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

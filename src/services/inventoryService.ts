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

// ─── Module4 Stock Transactions (cross-schema requests) ──────────────────────

export interface StockTransaction {
  id: string;
  created_at: string;
  type: string;
  delivery_item_id: string;
  unit_id: string;
  quantity: number;
  approved_quantity: number | null;
  purpose: string | null;
  reason: string | null;
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: string;
  notes: string | null;
  ration_id: string | null;
  // JS-merged lookups
  delivery_item?: DeliveryItem;
  unit?: Unit;
}

export const fetchStockTransactions = async (): Promise<StockTransaction[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const [{ data: txns, error }, { data: deliveryItems }, { data: units }] =
    await Promise.all([
      module4()
        .from("stock_transaction")
        .select("*")
        .order("created_at", { ascending: false }),
      module3()
        .from("delivery_items")
        .select(
          "*, category(*), brand(*), unit_delivery:unit!unit_delivery_id(*), unit_issuance:unit!unit_issuance_id(*)",
        ),
      module3().from("unit").select("*"),
    ]);
  if (error) {
    console.error("fetchStockTransactions error:", error);
    return [];
  }
  return (txns || []).map((t) => ({
    ...t,
    delivery_item: (deliveryItems || []).find(
      (d) => d.id === t.delivery_item_id,
    ),
    unit: (units || []).find((u) => u.id === t.unit_id),
  }));
};

export const createStockTransaction = async (fields: {
  delivery_item_id: string;
  unit_id: string;
  quantity: number;
  purpose?: string;
  requested_by: string;
  notes?: string;
  type?: string;
}) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module4()
    .from("stock_transaction")
    .insert({ status: "pending", type: fields.type || "request", ...fields });
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const approveStockTransaction = async (
  txnId: string,
  deliveryItemId: string,
  quantityToDeduct: number,
  reviewedBy: string,
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
  const { error: txnError } = await module4()
    .from("stock_transaction")
    .update({
      status: "approved",
      approved_quantity: quantityToDeduct,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", txnId);
  if (txnError) return { success: false, error: txnError.message };
  const { error: deductError } = await module3()
    .from("delivery_items")
    .update({ quantity_delivery: newQty })
    .eq("id", deliveryItemId);
  if (deductError) return { success: false, error: deductError.message };
  return { success: true };
};

export const rejectStockTransaction = async (
  txnId: string,
  reviewedBy: string,
  reason?: string,
) => {
  if (!isSupabaseConfigured() || !supabase)
    return { success: false, error: "Supabase not configured" };
  const { error } = await module4()
    .from("stock_transaction")
    .update({
      status: "rejected",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      reason: reason || null,
    })
    .eq("id", txnId);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
  IconButton,
} from "@/components/ui";
import {
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  Syringe,
  FlaskConical,
  CalendarCheck,
  Loader2,
  Users,
  User,
} from "lucide-react";
import {
  createRation,
  updateRation,
  deleteRation as deleteRationApi,
  fetchRationAnimals,
  createRationAnimal,
  updateRationAnimal,
  deleteRationAnimal as deleteRationAnimalApi,
  fetchRationTypes,
  type RationAnimal,
  type RationType,
} from "@/services/rationService";
import {
  animalService,
  cageService,
  type Animal,
  type Cage,
} from "@/services/animalService";
import { useAuthStore } from "@/store/authStore";
import {
  fetchDeliveryItems,
  type DeliveryItem,
} from "@/services/inventoryService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedingRecord {
  id: string;
  ration_id: string;
  animal_id: string;
  quantity_given: number;
  meal_number: number | null;
  date_given: string;
  administered_by: string;
  status: string;
  notes: string | null;
  ration_type_name: string;
  // from the ration join
  delivery_item_id: string;
  unit_id: string;
  quantity_used: number;
}

interface FeedingFormValues {
  animal_id: string;
  delivery_item_id: string;
  unit_id: string;
  quantity_given: string;
  quantity_used: string;
  meal_number: string;
  date_given: string;
  administered_by: string;
  status: string;
  notes: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface FeedingContextType {
  records: FeedingRecord[];
  loading: boolean;
  rationTypes: RationType[];
  feedingTypeId: string | null;
  animals: (Animal & { tag_code: number | null; cage_label: string | null })[];
  cages: Cage[];
  deliveryItems: DeliveryItem[];
  addRecord: (values: FeedingFormValues) => Promise<void>;
  addBulkRecords: (
    animalIds: string[],
    values: FeedingFormValues,
  ) => Promise<void>;
  updateRecord: (
    id: string,
    rationId: string,
    values: FeedingFormValues,
  ) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  changeStatus: (id: string, status: string) => Promise<void>;
  reload: () => Promise<void>;
}

const FeedingContext = createContext<FeedingContextType | undefined>(undefined);

const FeedingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rationTypes, setRationTypes] = useState<RationType[]>([]);
  const [feedingTypeId, setFeedingTypeId] = useState<string | null>(null);
  const [animals, setAnimals] = useState<
    (Animal & { tag_code: number | null; cage_label: string | null })[]
  >([]);
  const [cages, setCages] = useState<Cage[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);

  const mapRationAnimalToRecord = (ra: RationAnimal): FeedingRecord => ({
    id: ra.id,
    ration_id: ra.ration_id,
    animal_id: ra.animal_id,
    quantity_given: ra.quantity_given,
    meal_number: ra.ration?.meal_number ?? null,
    date_given: ra.ration?.date_given ?? "",
    administered_by: ra.ration?.administered_by ?? "",
    status: ra.status,
    notes: ra.notes ?? ra.ration?.notes ?? null,
    ration_type_name: ra.ration?.ration_type?.name ?? "",
    delivery_item_id: ra.ration?.delivery_item_id ?? "",
    unit_id: ra.ration?.unit_id ?? "",
    quantity_used: ra.ration?.quantity_used ?? 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [types, allRationAnimals, allAnimals, allCages, allDeliveryItems] =
        await Promise.all([
          fetchRationTypes(),
          fetchRationAnimals(),
          animalService.getAnimalsWithTag(),
          cageService.getCages(user?.id ?? ""),
          fetchDeliveryItems(),
        ]);
      setRationTypes(types);
      setAnimals(allAnimals);
      setCages(allCages);
      setDeliveryItems(allDeliveryItems);
      const feedType = types.find((t) => t.name === "Feeding");
      setFeedingTypeId(feedType?.id ?? null);

      // Filter only feeding ration_animals
      const feedingRecords = allRationAnimals
        .filter((ra) => ra.ration?.ration_type?.name === "Feeding")
        .map(mapRationAnimalToRecord);
      setRecords(feedingRecords);
    } catch (err) {
      console.error("Error loading feeding data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addRecord = async (values: FeedingFormValues) => {
    if (!feedingTypeId) return;
    // 1. Create the ration (parent)
    const rationResult = await createRation({
      ration_type_id: feedingTypeId,
      delivery_item_id: values.delivery_item_id,
      unit_id: values.unit_id,
      quantity_used: parseFloat(values.quantity_used) || 0,
      date_given: values.date_given,
      meal_number: values.meal_number ? parseInt(values.meal_number) : null,
      administered_by: values.administered_by,
      status: values.status,
      notes: values.notes || null,
    });
    if (!rationResult.success || !rationResult.data) {
      alert("Error creating ration: " + rationResult.error);
      return;
    }
    // 2. Create the ration_animal (child)
    const raResult = await createRationAnimal({
      ration_id: rationResult.data.id,
      animal_id: values.animal_id,
      quantity_given: parseFloat(values.quantity_given) || 0,
      status: values.status,
      notes: values.notes || null,
    });
    if (!raResult.success) {
      alert("Error creating ration animal: " + raResult.error);
      return;
    }
    await loadData();
  };

  const addBulkRecords = async (
    animalIds: string[],
    values: FeedingFormValues,
  ) => {
    if (!feedingTypeId || animalIds.length === 0) return;
    const rationResult = await createRation({
      ration_type_id: feedingTypeId,
      delivery_item_id: values.delivery_item_id,
      unit_id: values.unit_id,
      quantity_used: parseFloat(values.quantity_used) || 0,
      date_given: values.date_given,
      meal_number: values.meal_number ? parseInt(values.meal_number) : null,
      administered_by: values.administered_by,
      status: values.status,
      notes: values.notes || null,
    });
    if (!rationResult.success || !rationResult.data) {
      alert("Error creating ration: " + rationResult.error);
      return;
    }
    for (const animalId of animalIds) {
      await createRationAnimal({
        ration_id: rationResult.data.id,
        animal_id: animalId,
        quantity_given: parseFloat(values.quantity_given) || 0,
        status: values.status,
        notes: values.notes || null,
      });
    }
    await loadData();
  };

  const updateRecordFn = async (
    id: string,
    rationId: string,
    values: FeedingFormValues,
  ) => {
    // Update ration parent
    await updateRation(rationId, {
      delivery_item_id: values.delivery_item_id,
      unit_id: values.unit_id,
      quantity_used: parseFloat(values.quantity_used) || 0,
      date_given: values.date_given,
      meal_number: values.meal_number ? parseInt(values.meal_number) : null,
      administered_by: values.administered_by,
      status: values.status,
      notes: values.notes || null,
    });
    // Update ration_animal child
    await updateRationAnimal(id, {
      animal_id: values.animal_id,
      quantity_given: parseFloat(values.quantity_given) || 0,
      status: values.status,
      notes: values.notes || null,
    });
    await loadData();
  };

  const deleteRecordFn = async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    // Delete ration_animal first, then ration (cascade should handle it, but be explicit)
    await deleteRationAnimalApi(id);
    await deleteRationApi(record.ration_id);
    await loadData();
  };

  const changeStatus = async (id: string, status: string) => {
    await updateRationAnimal(id, { status });
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <FeedingContext.Provider
      value={{
        records,
        loading,
        rationTypes,
        feedingTypeId,
        animals,
        cages,
        deliveryItems,
        addRecord,
        addBulkRecords,
        updateRecord: updateRecordFn,
        deleteRecord: deleteRecordFn,
        changeStatus,
        reload: loadData,
      }}
    >
      {children}
    </FeedingContext.Provider>
  );
};

const useFeeding = () => {
  const ctx = useContext(FeedingContext);
  if (!ctx) throw new Error("useFeeding must be used inside FeedingProvider");
  return ctx;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["fed", "pending", "skipped"];
const TAB_FILTERS = ["All", "fed", "pending", "skipped"] as const;
type TabFilter = (typeof TAB_FILTERS)[number];

const EMPTY_FORM: FeedingFormValues = {
  animal_id: "",
  delivery_item_id: "",
  unit_id: "",
  quantity_given: "",
  quantity_used: "",
  meal_number: "",
  date_given: new Date().toISOString().slice(0, 10),
  administered_by: "",
  status: "pending",
  notes: "",
};

const STATUS_STYLES: Record<string, string> = {
  fed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  skipped: "bg-red-100 text-red-600",
};

// ─── Badges ───────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={cn(
      "inline-block px-2.5 py-0.5 text-xs font-medium rounded-full capitalize",
      STATUS_STYLES[status] || "bg-gray-100 text-gray-600",
    )}
  >
    {status}
  </span>
);

const MealNumberBadge = ({ mealNumber }: { mealNumber: number | null }) => (
  <span
    className={cn(
      "inline-block px-2.5 py-0.5 text-xs font-medium rounded-full",
      "bg-blue-50 text-blue-600",
    )}
  >
    {mealNumber ? `Meal #${mealNumber}` : "—"}
  </span>
);

// ─── Form Modal ───────────────────────────────────────────────────────────────

const FIELD =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success";
const LABEL =
  "block text-xs font-semibold text-muted uppercase tracking-wide mb-1";

const RecordModal = ({
  editing,
  onClose,
}: {
  editing: FeedingRecord | null;
  onClose: () => void;
}) => {
  const {
    addRecord,
    addBulkRecords,
    updateRecord,
    animals,
    cages,
    deliveryItems,
  } = useFeeding();
  const [selectionMode, setSelectionMode] = useState<"individual" | "cage">(
    editing ? "individual" : "individual",
  );
  const [selectedCageId, setSelectedCageId] = useState("");
  const [cageAnimals, setCageAnimals] = useState<Animal[]>([]);
  const [loadingCage, setLoadingCage] = useState(false);
  const [form, setForm] = useState<FeedingFormValues>(
    editing
      ? {
          animal_id: editing.animal_id,
          delivery_item_id: editing.delivery_item_id,
          unit_id: editing.unit_id,
          quantity_given: String(editing.quantity_given),
          quantity_used: String(editing.quantity_used),
          meal_number: editing.meal_number ? String(editing.meal_number) : "",
          date_given: editing.date_given,
          administered_by: editing.administered_by,
          status: editing.status,
          notes: editing.notes ?? "",
        }
      : EMPTY_FORM,
  );

  const handleCageChange = async (cageId: string) => {
    setSelectedCageId(cageId);
    if (!cageId) {
      setCageAnimals([]);
      return;
    }
    setLoadingCage(true);
    const result = await animalService.getAnimalsByCage(cageId);
    setCageAnimals(result);
    setLoadingCage(false);
  };

  const set = (key: keyof FeedingFormValues, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // Find selected delivery item and compute cost
  const selectedItem = useMemo(
    () => deliveryItems.find((d) => d.id === form.delivery_item_id) ?? null,
    [deliveryItems, form.delivery_item_id],
  );

  const costPerUnit = useMemo(() => {
    if (!selectedItem) return 0;
    return selectedItem.unit_price_delivery ?? 0;
  }, [selectedItem]);

  const qtyGiven = parseFloat(form.quantity_given) || 0;
  const unitCost = qtyGiven * costPerUnit;
  const animalCount = selectionMode === "cage" ? cageAnimals.length : 1;
  const totalCost = unitCost * animalCount;

  const handleSubmit = async () => {
    if (
      !form.delivery_item_id.trim() ||
      !form.unit_id.trim() ||
      !form.quantity_given ||
      !form.date_given ||
      !form.administered_by.trim()
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editing) {
      await updateRecord(editing.id, editing.ration_id, form);
    } else if (selectionMode === "cage") {
      if (cageAnimals.length === 0) {
        alert("No animals in the selected cage.");
        return;
      }
      await addBulkRecords(
        cageAnimals.map((a) => a.id),
        form,
      );
    } else {
      if (!form.animal_id.trim()) {
        alert("Please select an animal.");
        return;
      }
      await addRecord(form);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-success" />
            {editing ? "Edit Feeding Record" : "Log Feeding"}
          </h2>
          <button
            className="p-1.5 rounded hover:bg-background text-muted transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Selection Mode Toggle (only when adding) */}
        {!editing && (
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all",
                selectionMode === "individual"
                  ? "bg-success text-white border-success"
                  : "border-border text-muted hover:text-foreground hover:bg-background",
              )}
              onClick={() => {
                setSelectionMode("individual");
                setSelectedCageId("");
                setCageAnimals([]);
              }}
            >
              <User className="w-4 h-4" /> Individual
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all",
                selectionMode === "cage"
                  ? "bg-success text-white border-success"
                  : "border-border text-muted hover:text-foreground hover:bg-background",
              )}
              onClick={() => {
                setSelectionMode("cage");
                set("animal_id", "");
              }}
            >
              <Users className="w-4 h-4" /> By Cage
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Animal Selection */}
          {selectionMode === "individual" ? (
            <div className="col-span-2">
              <label className={LABEL}>
                Animal <span className="text-red-500">*</span>
              </label>
              <select
                className={FIELD}
                value={form.animal_id}
                onChange={(e) => set("animal_id", e.target.value)}
              >
                <option value="">Select animal…</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.tag_code ? `Tag #${a.tag_code}` : a.id.slice(0, 8)} —{" "}
                    {a.sex} {a.weight}kg{" "}
                    {a.cage_label ? `(${a.cage_label})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : !editing ? (
            <div className="col-span-2">
              <label className={LABEL}>
                Cage <span className="text-red-500">*</span>
              </label>
              <select
                className={FIELD}
                value={selectedCageId}
                onChange={(e) => handleCageChange(e.target.value)}
              >
                <option value="">Select cage…</option>
                {cages.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cage_label} (capacity: {c.max_capacity})
                  </option>
                ))}
              </select>
              {loadingCage && (
                <p className="text-xs text-muted mt-1">Loading animals…</p>
              )}
              {!loadingCage && selectedCageId && (
                <p className="text-xs mt-1 text-success font-medium">
                  {cageAnimals.length} animal
                  {cageAnimals.length !== 1 ? "s" : ""} will be fed
                </p>
              )}
            </div>
          ) : null}

          {/* Delivery Item */}
          <div className="col-span-2">
            <label className={LABEL}>
              Feed Item <span className="text-red-500">*</span>
            </label>
            <select
              className={FIELD}
              value={form.delivery_item_id}
              onChange={(e) => {
                const item = deliveryItems.find((d) => d.id === e.target.value);
                set("delivery_item_id", e.target.value);
                set("unit_id", item?.unit_delivery_id ?? "");
              }}
            >
              <option value="">Select feed item…</option>
              {deliveryItems.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.description ?? d.id.slice(0, 8)}{" "}
                  {d.brand?.name ? `(${d.brand.name})` : ""} —{" "}
                  {d.category?.name ?? ""} — ₱
                  {d.unit_price_delivery?.toFixed(2) ?? "0.00"}/
                  {d.unit_delivery?.name ?? "unit"}
                </option>
              ))}
            </select>
            {selectedItem && (
              <p className="text-xs text-muted mt-1">
                Unit: {selectedItem.unit_delivery?.name ?? "—"} · Qty:{" "}
                {selectedItem.quantity_delivery} · Expiry:{" "}
                {selectedItem.expiry_date ?? "—"}
              </p>
            )}
          </div>

          {/* Quantity Given */}
          <div>
            <label className={LABEL}>
              Qty Given <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              className={FIELD}
              placeholder="e.g. 3.5"
              value={form.quantity_given}
              onChange={(e) => set("quantity_given", e.target.value)}
            />
          </div>

          {/* Quantity Used (from inventory) */}
          <div>
            <label className={LABEL}>Qty Used (inventory)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              className={FIELD}
              placeholder="e.g. 3.5"
              value={form.quantity_used}
              onChange={(e) => set("quantity_used", e.target.value)}
            />
          </div>

          {/* Meal Number */}
          <div>
            <label className={LABEL}>Meal # (feeding count)</label>
            <input
              type="number"
              min="1"
              step="1"
              className={FIELD}
              placeholder="e.g. 1, 2, 3"
              value={form.meal_number}
              onChange={(e) => set("meal_number", e.target.value)}
            />
          </div>

          {/* Date Given */}
          <div>
            <label className={LABEL}>
              Date Given <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={FIELD}
              value={form.date_given}
              onChange={(e) => set("date_given", e.target.value)}
            />
          </div>

          {/* Administered By */}
          <div>
            <label className={LABEL}>
              Administered By <span className="text-red-500">*</span>
            </label>
            <input
              className={FIELD}
              placeholder="e.g. Juan dela Cruz"
              value={form.administered_by}
              onChange={(e) => set("administered_by", e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <label className={LABEL}>Status</label>
            <select
              className={FIELD}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label className={LABEL}>Notes</label>
            <textarea
              className={cn(FIELD, "resize-none")}
              rows={3}
              placeholder="Optional remarks..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        {/* Cost Computation Display */}
        {selectedItem && qtyGiven > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200">
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2">
              Cost Estimate
            </h3>
            <div className="space-y-1 text-sm text-green-900">
              <div className="flex justify-between">
                <span>
                  Cost per {selectedItem.unit_delivery?.name ?? "unit"}
                </span>
                <span className="font-semibold">₱{costPerUnit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Qty × {qtyGiven.toFixed(1)} kg</span>
                <span className="font-semibold">₱{unitCost.toFixed(2)}</span>
              </div>
              {selectionMode === "cage" && animalCount > 1 && (
                <div className="flex justify-between border-t border-green-300 pt-1 mt-1">
                  <span>× {animalCount} animals</span>
                  <span className="font-bold text-green-800">
                    ₱{totalCost.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-green-300 pt-1 mt-1 text-base">
                <span className="font-bold">Total</span>
                <span className="font-bold text-green-800">
                  ₱{totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
            onClick={handleSubmit}
          >
            {editing
              ? "Save Changes"
              : selectionMode === "cage"
                ? `Feed ${cageAnimals.length} Animal${cageAnimals.length !== 1 ? "s" : ""}`
                : "Log Feeding"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({
  record,
  onConfirm,
  onClose,
}: {
  record: FeedingRecord;
  onConfirm: () => void;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h2 className="text-lg font-bold text-primary mb-2">Delete Record?</h2>
      <p className="text-sm text-muted mb-5">
        Remove feeding record for animal <strong>{record.animal_id}</strong> on{" "}
        <strong>{record.date_given}</strong>? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          onClick={onConfirm}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Quick Status Toggle ──────────────────────────────────────────────────────

const QuickStatusToggle = ({ record }: { record: FeedingRecord }) => {
  const { changeStatus } = useFeeding();
  const next: Record<string, string> = {
    pending: "fed",
    fed: "pending",
    skipped: "fed",
  };
  return (
    <button
      title={`Mark as ${next[record.status] || "fed"}`}
      onClick={() => changeStatus(record.id, next[record.status] || "fed")}
      className={cn(
        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
        record.status === "fed"
          ? "bg-green-500 border-green-500 text-white"
          : record.status === "skipped"
            ? "bg-red-400 border-red-400 text-white"
            : "border-border bg-background hover:border-green-400",
      )}
    >
      {record.status === "fed" && (
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

const FeedingApp = () => {
  const { records, loading, deleteRecord } = useFeeding();
  const [activeTab, setActiveTab] = useState<TabFilter>("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FeedingRecord | null>(null);
  const [deleting, setDeleting] = useState<FeedingRecord | null>(null);

  const filtered = useMemo(() => {
    let list = records;
    if (activeTab !== "All") list = list.filter((r) => r.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.animal_id.toLowerCase().includes(q) ||
          r.administered_by.toLowerCase().includes(q) ||
          (r.notes ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [records, activeTab, search]);

  const counts = useMemo(
    () => ({
      total: records.length,
      fed: records.filter((r) => r.status === "fed").length,
      pending: records.filter((r) => r.status === "pending").length,
      skipped: records.filter((r) => r.status === "skipped").length,
    }),
    [records],
  );

  const totalQtyToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return records
      .filter((r) => r.date_given === today && r.status === "fed")
      .reduce((sum, r) => sum + r.quantity_given, 0)
      .toFixed(1);
  }, [records]);

  const columns = [
    {
      key: "status" as const,
      header: "",
      className: "w-10",
      render: (r: FeedingRecord) => <QuickStatusToggle record={r} />,
    },
    {
      key: "animal_id" as const,
      header: "Animal",
      render: (r: FeedingRecord) => (
        <span
          className="text-sm font-mono font-semibold text-foreground truncate max-w-30 block"
          title={r.animal_id}
        >
          {r.animal_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "quantity_given" as const,
      header: "Qty Given",
      render: (r: FeedingRecord) => (
        <span className="text-sm font-semibold text-foreground">
          {r.quantity_given}
        </span>
      ),
    },
    {
      key: "meal_number" as const,
      header: "Meal #",
      render: (r: FeedingRecord) => (
        <MealNumberBadge mealNumber={r.meal_number} />
      ),
    },
    {
      key: "date_given" as const,
      header: "Date",
      render: (r: FeedingRecord) => (
        <span className="text-sm">{r.date_given}</span>
      ),
    },
    {
      key: "administered_by" as const,
      header: "Given By",
      render: (r: FeedingRecord) => (
        <span className="text-sm text-muted">{r.administered_by}</span>
      ),
    },
    {
      key: "notes" as const,
      header: "Notes",
      render: (r: FeedingRecord) =>
        r.notes ? (
          <span
            className="text-xs text-muted max-w-40 truncate block"
            title={r.notes}
          >
            {r.notes}
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      key: "actions" as const,
      header: "Status / Actions",
      render: (r: FeedingRecord) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={r.status} />
          <IconButton
            onClick={() => {
              setEditing(r);
              setShowModal(true);
            }}
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </IconButton>
          <IconButton
            onClick={() => setDeleting(r)}
            title="Delete"
            variant="danger"
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
        <span className="ml-2 text-muted text-sm">
          Loading feeding records…
        </span>
      </div>
    );
  }

  return (
    <div>
      <StatsRow>
        <StatCard label="Total Records" value={counts.total} color="default" />
        <StatCard label="Fed" value={counts.fed} color="success" />
        <StatCard label="Pending" value={counts.pending} color="warning" />
        <StatCard label="Skipped" value={counts.skipped} color="danger" />
      </StatsRow>

      {/* Today summary strip */}
      <div className="flex items-center gap-6 mb-5 px-5 py-3 bg-surface border border-border rounded-xl text-sm">
        <span className="text-muted font-medium">Today's Summary</span>
        <span className="text-foreground font-semibold">
          {totalQtyToday}{" "}
          <span className="font-normal text-muted">total fed today</span>
        </span>
        <span className="text-foreground font-semibold">
          {counts.pending}{" "}
          <span className="font-normal text-muted">pending feedings</span>
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-background rounded-lg mb-4 w-fit">
        {TAB_FILTERS.map((tab) => (
          <button
            key={tab}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
              activeTab === tab
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span
              className={cn(
                "ml-1.5 px-1.5 py-0.5 text-xs rounded-full",
                activeTab === tab
                  ? "bg-success/10 text-success"
                  : "bg-background text-muted",
              )}
            >
              {tab === "All"
                ? records.length
                : records.filter((r) => r.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      <ActionsBar>
        <PrimaryButton
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" /> Log Feeding
        </PrimaryButton>
      </ActionsBar>

      <DataTable
        data={filtered}
        columns={columns}
        emptyMessage="No feeding records found."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by animal, staff, notes..."
        title="Feeding Records"
        titleIcon={<UtensilsCrossed className="w-5 h-5" />}
        keyField="id"
      />

      {showModal && (
        <RecordModal
          editing={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <DeleteModal
          record={deleting}
          onConfirm={async () => {
            await deleteRecord(deleting.id);
            setDeleting(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// ─── VITAMINS & INJECTIONS ────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// ─── Vitamin Types ────────────────────────────────────────────────────────

interface VitaminRecord {
  id: string;
  ration_id: string;
  animal_id: string;
  ration_type_name: string;
  delivery_item_id: string;
  unit_id: string;
  quantity_given: number;
  quantity_used: number;
  date_given: string;
  administered_by: string;
  status: string;
  next_due_date: string | null;
  notes: string | null;
}

interface VitaminFormValues {
  animal_id: string;
  ration_type_id: string;
  delivery_item_id: string;
  unit_id: string;
  quantity_given: string;
  quantity_used: string;
  date_given: string;
  administered_by: string;
  status: string;
  next_due_date: string;
  notes: string;
}

// ─── Vitamin Context ──────────────────────────────────────────────────────

interface VitaminsContextType {
  records: VitaminRecord[];
  loading: boolean;
  rationTypes: RationType[];
  animals: (Animal & { tag_code: number | null; cage_label: string | null })[];
  cages: Cage[];
  deliveryItems: DeliveryItem[];
  addRecord: (values: VitaminFormValues) => Promise<void>;
  addBulkRecords: (
    animalIds: string[],
    values: VitaminFormValues,
  ) => Promise<void>;
  updateRecord: (
    id: string,
    rationId: string,
    values: VitaminFormValues,
  ) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  changeStatus: (id: string, status: string) => Promise<void>;
  reload: () => Promise<void>;
}

const VitaminsContext = createContext<VitaminsContextType | undefined>(
  undefined,
);

const VitaminsProvider = ({ children }: { children: ReactNode }) => {
  const [records, setRecords] = useState<VitaminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rationTypes, setRationTypes] = useState<RationType[]>([]);
  const [animals, setAnimals] = useState<
    (Animal & { tag_code: number | null; cage_label: string | null })[]
  >([]);
  const [cages, setCages] = useState<Cage[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);

  const { user } = useAuthStore();
  const VITAMIN_TYPE_NAMES = ["Vitamin", "Injection", "Supplement"];

  const mapToVitaminRecord = (ra: RationAnimal): VitaminRecord => ({
    id: ra.id,
    ration_id: ra.ration_id,
    animal_id: ra.animal_id,
    ration_type_name: ra.ration?.ration_type?.name ?? "",
    delivery_item_id: ra.ration?.delivery_item_id ?? "",
    unit_id: ra.ration?.unit_id ?? "",
    quantity_given: ra.quantity_given,
    quantity_used: ra.ration?.quantity_used ?? 0,
    date_given: ra.ration?.date_given ?? "",
    administered_by: ra.ration?.administered_by ?? "",
    status: ra.status,
    next_due_date: ra.next_due_date ?? null,
    notes: ra.notes ?? ra.ration?.notes ?? null,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [types, allRationAnimals, allAnimals, allCages, allDeliveryItems] =
        await Promise.all([
          fetchRationTypes(),
          fetchRationAnimals(),
          animalService.getAnimalsWithTag(),
          cageService.getCages(user?.id ?? ""),
          fetchDeliveryItems(),
        ]);
      setRationTypes(types);
      setAnimals(allAnimals);
      setCages(allCages);
      setDeliveryItems(allDeliveryItems);
      const vitaminRecords = allRationAnimals
        .filter((ra) =>
          VITAMIN_TYPE_NAMES.includes(ra.ration?.ration_type?.name ?? ""),
        )
        .map(mapToVitaminRecord);
      setRecords(vitaminRecords);
    } catch (err) {
      console.error("Error loading vitamin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addRecord = async (values: VitaminFormValues) => {
    const rationResult = await createRation({
      ration_type_id: values.ration_type_id,
      delivery_item_id: values.delivery_item_id,
      unit_id: values.unit_id,
      quantity_used: parseFloat(values.quantity_used) || 0,
      date_given: values.date_given,
      administered_by: values.administered_by,
      status: values.status,
      notes: values.notes || null,
    });
    if (!rationResult.success || !rationResult.data) {
      alert("Error creating ration: " + rationResult.error);
      return;
    }
    const raResult = await createRationAnimal({
      ration_id: rationResult.data.id,
      animal_id: values.animal_id,
      quantity_given: parseFloat(values.quantity_given) || 0,
      status: values.status,
      next_due_date: values.next_due_date || null,
      notes: values.notes || null,
    });
    if (!raResult.success) {
      alert("Error creating ration animal: " + raResult.error);
      return;
    }
    await loadData();
  };

  const addBulkRecords = async (
    animalIds: string[],
    values: VitaminFormValues,
  ) => {
    if (animalIds.length === 0) return;
    const rationResult = await createRation({
      ration_type_id: values.ration_type_id,
      delivery_item_id: values.delivery_item_id,
      unit_id: values.unit_id,
      quantity_used: parseFloat(values.quantity_used) || 0,
      date_given: values.date_given,
      administered_by: values.administered_by,
      status: values.status,
      notes: values.notes || null,
    });
    if (!rationResult.success || !rationResult.data) {
      alert("Error creating ration: " + rationResult.error);
      return;
    }
    for (const animalId of animalIds) {
      await createRationAnimal({
        ration_id: rationResult.data.id,
        animal_id: animalId,
        quantity_given: parseFloat(values.quantity_given) || 0,
        status: values.status,
        next_due_date: values.next_due_date || null,
        notes: values.notes || null,
      });
    }
    await loadData();
  };

  const updateRecordFn = async (
    id: string,
    rationId: string,
    values: VitaminFormValues,
  ) => {
    await updateRation(rationId, {
      ration_type_id: values.ration_type_id,
      delivery_item_id: values.delivery_item_id,
      unit_id: values.unit_id,
      quantity_used: parseFloat(values.quantity_used) || 0,
      date_given: values.date_given,
      administered_by: values.administered_by,
      status: values.status,
      notes: values.notes || null,
    });
    await updateRationAnimal(id, {
      animal_id: values.animal_id,
      quantity_given: parseFloat(values.quantity_given) || 0,
      status: values.status,
      next_due_date: values.next_due_date || null,
      notes: values.notes || null,
    });
    await loadData();
  };

  const deleteRecordFn = async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    await deleteRationAnimalApi(id);
    await deleteRationApi(record.ration_id);
    await loadData();
  };

  const changeStatus = async (id: string, status: string) => {
    await updateRationAnimal(id, { status });
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <VitaminsContext.Provider
      value={{
        records,
        loading,
        rationTypes,
        animals,
        cages,
        deliveryItems,
        addRecord,
        addBulkRecords,
        updateRecord: updateRecordFn,
        deleteRecord: deleteRecordFn,
        changeStatus,
        reload: loadData,
      }}
    >
      {children}
    </VitaminsContext.Provider>
  );
};

const useVitamins = () => {
  const ctx = useContext(VitaminsContext);
  if (!ctx) throw new Error("useVitamins must be used inside VitaminsProvider");
  return ctx;
};

// ─── Vitamin Constants ────────────────────────────────────────────────────

const VITAMIN_STATUS_OPTIONS = ["completed", "upcoming", "overdue"];
const VITAMIN_TAB_FILTERS = [
  "All",
  "completed",
  "upcoming",
  "overdue",
] as const;
type VitaminTabFilter = (typeof VITAMIN_TAB_FILTERS)[number];

const VITAMIN_EMPTY_FORM: VitaminFormValues = {
  animal_id: "",
  ration_type_id: "",
  delivery_item_id: "",
  unit_id: "",
  quantity_given: "",
  quantity_used: "",
  date_given: "",
  administered_by: "",
  status: "completed",
  next_due_date: "",
  notes: "",
};

const VITAMIN_STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  upcoming: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-600",
};

const ADMIN_TYPE_STYLES: Record<string, string> = {
  Vitamin: "bg-yellow-100 text-yellow-700",
  Injection: "bg-purple-100 text-purple-700",
  Supplement: "bg-teal-100 text-teal-700",
};

const ADMIN_TYPE_ICONS: Record<string, ReactNode> = {
  Injection: <Syringe className="w-3.5 h-3.5" />,
  Vitamin: <FlaskConical className="w-3.5 h-3.5" />,
  Supplement: <CalendarCheck className="w-3.5 h-3.5" />,
};

// ─── Vitamin Badges ───────────────────────────────────────────────────────

const VitaminStatusBadge = ({ status }: { status: string }) => (
  <span
    className={cn(
      "inline-block px-2.5 py-0.5 text-xs font-medium rounded-full capitalize",
      VITAMIN_STATUS_STYLES[status] || "bg-gray-100 text-gray-600",
    )}
  >
    {status}
  </span>
);

const AdminTypeBadge = ({ type }: { type: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full",
      ADMIN_TYPE_STYLES[type] || "bg-gray-100 text-gray-600",
    )}
  >
    {ADMIN_TYPE_ICONS[type]}
    {type}
  </span>
);

// ─── Vitamin Form Modal ───────────────────────────────────────────────────

const VIT_FIELD =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success";
const VIT_LABEL =
  "block text-xs font-semibold text-muted uppercase tracking-wide mb-1";

const VitaminRecordModal = ({
  editing,
  onClose,
}: {
  editing: VitaminRecord | null;
  onClose: () => void;
}) => {
  const {
    addRecord,
    addBulkRecords,
    updateRecord,
    rationTypes,
    animals,
    cages,
    deliveryItems,
  } = useVitamins();
  const vitaminTypes = rationTypes.filter((t) =>
    ["Vitamin", "Injection", "Supplement"].includes(t.name),
  );
  const [selectionMode, setSelectionMode] = useState<"individual" | "cage">(
    editing ? "individual" : "individual",
  );
  const [selectedCageId, setSelectedCageId] = useState("");
  const [cageAnimals, setCageAnimals] = useState<Animal[]>([]);
  const [loadingCage, setLoadingCage] = useState(false);

  const [form, setForm] = useState<VitaminFormValues>(
    editing
      ? {
          animal_id: editing.animal_id,
          ration_type_id:
            rationTypes.find((t) => t.name === editing.ration_type_name)?.id ??
            "",
          delivery_item_id: editing.delivery_item_id,
          unit_id: editing.unit_id,
          quantity_given: String(editing.quantity_given),
          quantity_used: String(editing.quantity_used),
          date_given: editing.date_given,
          administered_by: editing.administered_by,
          status: editing.status,
          next_due_date: editing.next_due_date ?? "",
          notes: editing.notes ?? "",
        }
      : VITAMIN_EMPTY_FORM,
  );

  const handleCageChange = async (cageId: string) => {
    setSelectedCageId(cageId);
    if (!cageId) {
      setCageAnimals([]);
      return;
    }
    setLoadingCage(true);
    const result = await animalService.getAnimalsByCage(cageId);
    setCageAnimals(result);
    setLoadingCage(false);
  };

  const set = (key: keyof VitaminFormValues, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // Find selected delivery item and compute cost
  const selectedItem = useMemo(
    () => deliveryItems.find((d) => d.id === form.delivery_item_id) ?? null,
    [deliveryItems, form.delivery_item_id],
  );

  const costPerUnit = useMemo(() => {
    if (!selectedItem) return 0;
    return selectedItem.unit_price_delivery ?? 0;
  }, [selectedItem]);

  const vitQtyGiven = parseFloat(form.quantity_given) || 0;
  const vitUnitCost = vitQtyGiven * costPerUnit;
  const vitAnimalCount = selectionMode === "cage" ? cageAnimals.length : 1;
  const vitTotalCost = vitUnitCost * vitAnimalCount;

  const handleSubmit = async () => {
    if (
      !form.delivery_item_id.trim() ||
      !form.quantity_given ||
      !form.date_given ||
      !form.administered_by.trim()
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    // Auto-assign ration_type_id from first matching vitamin type if not set
    const finalForm = { ...form };
    if (!finalForm.ration_type_id && vitaminTypes.length > 0) {
      finalForm.ration_type_id = vitaminTypes[0].id;
    }
    if (editing) {
      await updateRecord(editing.id, editing.ration_id, finalForm);
    } else if (selectionMode === "cage") {
      if (cageAnimals.length === 0) {
        alert("No animals in the selected cage.");
        return;
      }
      await addBulkRecords(
        cageAnimals.map((a) => a.id),
        finalForm,
      );
    } else {
      if (!finalForm.animal_id.trim()) {
        alert("Please select an animal.");
        return;
      }
      await addRecord(finalForm);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Syringe className="w-5 h-5 text-success" />
            {editing ? "Edit Record" : "Add Vitamin / Injection"}
          </h2>
          <button
            className="p-1.5 rounded hover:bg-background text-muted transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Selection Mode Toggle (only when adding) */}
        {!editing && (
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all",
                selectionMode === "individual"
                  ? "bg-success text-white border-success"
                  : "border-border text-muted hover:text-foreground hover:bg-background",
              )}
              onClick={() => {
                setSelectionMode("individual");
                setSelectedCageId("");
                setCageAnimals([]);
              }}
            >
              <User className="w-4 h-4" /> Individual
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all",
                selectionMode === "cage"
                  ? "bg-success text-white border-success"
                  : "border-border text-muted hover:text-foreground hover:bg-background",
              )}
              onClick={() => {
                setSelectionMode("cage");
                set("animal_id", "");
              }}
            >
              <Users className="w-4 h-4" /> By Cage
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Animal Selection */}
          {selectionMode === "individual" ? (
            <div>
              <label className={VIT_LABEL}>
                Animal <span className="text-red-500">*</span>
              </label>
              <select
                className={VIT_FIELD}
                value={form.animal_id}
                onChange={(e) => set("animal_id", e.target.value)}
              >
                <option value="">Select animal…</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.tag_code ? `Tag #${a.tag_code}` : a.id.slice(0, 8)} —{" "}
                    {a.sex} {a.weight}kg{" "}
                    {a.cage_label ? `(${a.cage_label})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : !editing ? (
            <div>
              <label className={VIT_LABEL}>
                Cage <span className="text-red-500">*</span>
              </label>
              <select
                className={VIT_FIELD}
                value={selectedCageId}
                onChange={(e) => handleCageChange(e.target.value)}
              >
                <option value="">Select cage…</option>
                {cages.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cage_label} (capacity: {c.max_capacity})
                  </option>
                ))}
              </select>
              {loadingCage && (
                <p className="text-xs text-muted mt-1">Loading animals…</p>
              )}
              {!loadingCage && selectedCageId && (
                <p className="text-xs mt-1 text-success font-medium">
                  {cageAnimals.length} animal
                  {cageAnimals.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          ) : null}

          <div className="col-span-2">
            <label className={VIT_LABEL}>
              Item <span className="text-red-500">*</span>
            </label>
            <select
              className={VIT_FIELD}
              value={form.delivery_item_id}
              onChange={(e) => {
                const item = deliveryItems.find((d) => d.id === e.target.value);
                set("delivery_item_id", e.target.value);
                set("unit_id", item?.unit_delivery_id ?? "");
              }}
            >
              <option value="">Select item…</option>
              {deliveryItems.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.description ?? d.id.slice(0, 8)}{" "}
                  {d.brand?.name ? `(${d.brand.name})` : ""} —{" "}
                  {d.category?.name ?? ""} — ₱
                  {d.unit_price_delivery?.toFixed(2) ?? "0.00"}/
                  {d.unit_delivery?.name ?? "unit"}
                </option>
              ))}
            </select>
            {selectedItem && (
              <p className="text-xs text-muted mt-1">
                Unit: {selectedItem.unit_delivery?.name ?? "—"} · Qty:{" "}
                {selectedItem.quantity_delivery} · Expiry:{" "}
                {selectedItem.expiry_date ?? "—"}
              </p>
            )}
          </div>

          <div>
            <label className={VIT_LABEL}>
              Qty Given <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              className={VIT_FIELD}
              placeholder="e.g. 2"
              value={form.quantity_given}
              onChange={(e) => set("quantity_given", e.target.value)}
            />
          </div>

          <div>
            <label className={VIT_LABEL}>Qty Used (inventory)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              className={VIT_FIELD}
              placeholder="e.g. 2"
              value={form.quantity_used}
              onChange={(e) => set("quantity_used", e.target.value)}
            />
          </div>

          <div>
            <label className={VIT_LABEL}>
              Administered By <span className="text-red-500">*</span>
            </label>
            <input
              className={VIT_FIELD}
              placeholder="e.g. Dr. Santos"
              value={form.administered_by}
              onChange={(e) => set("administered_by", e.target.value)}
            />
          </div>

          <div>
            <label className={VIT_LABEL}>
              Date Given <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={VIT_FIELD}
              value={form.date_given}
              onChange={(e) => set("date_given", e.target.value)}
            />
          </div>

          <div>
            <label className={VIT_LABEL}>Next Due Date</label>
            <input
              type="date"
              className={VIT_FIELD}
              value={form.next_due_date}
              onChange={(e) => set("next_due_date", e.target.value)}
            />
          </div>

          <div>
            <label className={VIT_LABEL}>Status</label>
            <select
              className={VIT_FIELD}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {VITAMIN_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className={VIT_LABEL}>Notes</label>
            <textarea
              className={cn(VIT_FIELD, "resize-none")}
              rows={3}
              placeholder="Optional remarks..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        {/* Cost Computation Display */}
        {selectedItem && vitQtyGiven > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-200">
            <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-2">
              Cost Estimate
            </h3>
            <div className="space-y-1 text-sm text-purple-900">
              <div className="flex justify-between">
                <span>
                  Cost per {selectedItem.unit_delivery?.name ?? "unit"}
                </span>
                <span className="font-semibold">₱{costPerUnit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Qty × {vitQtyGiven.toFixed(1)}</span>
                <span className="font-semibold">₱{vitUnitCost.toFixed(2)}</span>
              </div>
              {selectionMode === "cage" && vitAnimalCount > 1 && (
                <div className="flex justify-between border-t border-purple-300 pt-1 mt-1">
                  <span>× {vitAnimalCount} animals</span>
                  <span className="font-bold text-purple-800">
                    ₱{vitTotalCost.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-purple-300 pt-1 mt-1 text-base">
                <span className="font-bold">Total</span>
                <span className="font-bold text-purple-800">
                  ₱{vitTotalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
            onClick={handleSubmit}
          >
            {editing
              ? "Save Changes"
              : selectionMode === "cage"
                ? `Apply to ${cageAnimals.length} Animal${cageAnimals.length !== 1 ? "s" : ""}`
                : "Add Record"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Vitamin Delete Modal ─────────────────────────────────────────────────

const VitaminDeleteModal = ({
  record,
  onConfirm,
  onClose,
}: {
  record: VitaminRecord;
  onConfirm: () => void;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h2 className="text-lg font-bold text-primary mb-2">Delete Record?</h2>
      <p className="text-sm text-muted mb-5">
        Remove <strong>{record.ration_type_name}</strong> record for animal{" "}
        <strong>{record.animal_id}</strong> on{" "}
        <strong>{record.date_given}</strong>? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-background transition-colors"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          onClick={onConfirm}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Vitamins App ─────────────────────────────────────────────────────────

const VitaminsApp = () => {
  const { records, loading, deleteRecord } = useVitamins();
  const [activeTab, setActiveTab] = useState<VitaminTabFilter>("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<VitaminRecord | null>(null);
  const [deleting, setDeleting] = useState<VitaminRecord | null>(null);

  const filtered = useMemo(() => {
    let list = records;
    if (activeTab !== "All") list = list.filter((r) => r.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.animal_id.toLowerCase().includes(q) ||
          r.ration_type_name.toLowerCase().includes(q) ||
          r.administered_by.toLowerCase().includes(q) ||
          (r.notes ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [records, activeTab, search]);

  const counts = useMemo(
    () => ({
      total: records.length,
      completed: records.filter((r) => r.status === "completed").length,
      upcoming: records.filter((r) => r.status === "upcoming").length,
      overdue: records.filter((r) => r.status === "overdue").length,
    }),
    [records],
  );

  const columns = [
    {
      key: "animal_id" as const,
      header: "Animal",
      render: (r: VitaminRecord) => (
        <span
          className="text-sm font-mono font-semibold text-foreground truncate max-w-30 block"
          title={r.animal_id}
        >
          {r.animal_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "ration_type_name" as const,
      header: "Type",
      render: (r: VitaminRecord) => (
        <AdminTypeBadge type={r.ration_type_name} />
      ),
    },
    {
      key: "quantity_given" as const,
      header: "Qty Given",
      render: (r: VitaminRecord) => (
        <span className="text-sm font-medium text-foreground">
          {r.quantity_given}
        </span>
      ),
    },
    {
      key: "date_given" as const,
      header: "Date Given",
      render: (r: VitaminRecord) => (
        <span className="text-sm">{r.date_given}</span>
      ),
    },
    {
      key: "next_due_date" as const,
      header: "Next Due",
      render: (r: VitaminRecord) =>
        r.next_due_date ? (
          <span className="text-sm">{r.next_due_date}</span>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      key: "administered_by" as const,
      header: "Given By",
      render: (r: VitaminRecord) => (
        <span className="text-sm text-muted">{r.administered_by}</span>
      ),
    },
    {
      key: "status" as const,
      header: "Status",
      render: (r: VitaminRecord) => <VitaminStatusBadge status={r.status} />,
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (r: VitaminRecord) => (
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => {
              setEditing(r);
              setShowModal(true);
            }}
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </IconButton>
          <IconButton
            onClick={() => setDeleting(r)}
            title="Delete"
            variant="danger"
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
        <span className="ml-2 text-muted text-sm">
          Loading vitamin records…
        </span>
      </div>
    );
  }

  return (
    <div>
      <StatsRow>
        <StatCard label="Total Records" value={counts.total} color="default" />
        <StatCard label="Completed" value={counts.completed} color="success" />
        <StatCard label="Upcoming" value={counts.upcoming} color="warning" />
        <StatCard label="Overdue" value={counts.overdue} color="danger" />
      </StatsRow>

      <div className="flex gap-1 p-1 bg-background rounded-lg mb-4 w-fit">
        {VITAMIN_TAB_FILTERS.map((tab) => (
          <button
            key={tab}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
              activeTab === tab
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span
              className={cn(
                "ml-1.5 px-1.5 py-0.5 text-xs rounded-full",
                activeTab === tab
                  ? "bg-success/10 text-success"
                  : "bg-background text-muted",
              )}
            >
              {tab === "All"
                ? records.length
                : records.filter((r) => r.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      <ActionsBar>
        <PrimaryButton
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Record
        </PrimaryButton>
      </ActionsBar>

      <DataTable
        data={filtered}
        columns={columns}
        emptyMessage="No records found."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by animal, type, staff..."
        title="Vitamin & Injection Records"
        titleIcon={<Syringe className="w-5 h-5" />}
        keyField="id"
      />

      {showModal && (
        <VitaminRecordModal
          editing={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <VitaminDeleteModal
          record={deleting}
          onConfirm={async () => {
            await deleteRecord(deleting.id);
            setDeleting(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// ─── PAGE EXPORT (Tabbed) ─────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

type PageTab = "feeding" | "vitamins";

const PAGE_TABS: { key: PageTab; label: string; icon: ReactNode }[] = [
  {
    key: "feeding",
    label: "Feeding",
    icon: <UtensilsCrossed className="w-4 h-4" />,
  },
  {
    key: "vitamins",
    label: "Vitamins & Injections",
    icon: <Syringe className="w-4 h-4" />,
  },
];

export default function Storage() {
  const [activeTab, setActiveTab] = useState<PageTab>("feeding");

  return (
    <FeedingProvider>
      <VitaminsProvider>
        <PageHeader
          title={
            activeTab === "feeding"
              ? "Feeding Management"
              : "Vitamins & Injections"
          }
          subtitle={
            activeTab === "feeding"
              ? "Track daily feed logs for all animals — what, how much, and who fed them."
              : "Track all vitamins, injections, and supplements given to animals."
          }
          icon={
            activeTab === "feeding" ? (
              <UtensilsCrossed className="w-6 h-6" />
            ) : (
              <Syringe className="w-6 h-6" />
            )
          }
        />

        {/* Page-level tabs */}
        <div className="bg-linear-to-r from-surface via-background to-surface border border-border rounded-xl p-1.5 mb-6 shadow-sm">
          <div className="flex gap-1.5">
            {PAGE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all duration-300 group",
                  activeTab === tab.key
                    ? "bg-success text-white shadow-md scale-[1.02] border border-success"
                    : "bg-transparent text-muted hover:text-foreground hover:bg-surface/50 border border-transparent hover:border-border",
                )}
              >
                <span
                  className={cn(
                    "transition-transform",
                    activeTab === tab.key
                      ? "animate-in zoom-in-50"
                      : "group-hover:scale-110",
                  )}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === "feeding" ? <FeedingApp /> : <VitaminsApp />}
      </VitaminsProvider>
    </FeedingProvider>
  );
}

import { useState, useEffect } from "react";
import { Package, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  Tabs,
} from "@/components/ui";
import {
  fetchDeliveryItems,
  createDeliveryItem,
  updateDeliveryItem,
  deleteDeliveryItem,
  fetchCategories,
  fetchBrands,
  fetchUnits,
  createCategory,
  deleteCategory,
  createBrand,
  deleteBrand,
  createUnit,
  deleteUnit,
  fetchRationRequests,
  approveRationRequest,
  rejectRationRequest,
  type DeliveryItem,
  type Category,
  type Brand,
  type Unit,
  type RationRequest,
} from "@/services/inventoryService";

import DeliveryItemsList from "./DeliveryItemsList";
import DeliveryItemDialog from "./DeliveryItemDialog";
import RequestsList from "./RequestsList";

const TABS = [
  { key: "items", label: "Delivery Items" },
  { key: "requests", label: "Requests" },
  { key: "lookups", label: "Categories / Brands / Units" },
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("items");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Data
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [rationRequests, setRationRequests] = useState<RationRequest[]>([]);

  const [itemSearch, setItemSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");

  // ─── Delivery item form state ──────────────────────────────────────────────
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formDeliveryReceipt, setFormDeliveryReceipt] = useState("");
  const [formUnitDeliveryId, setFormUnitDeliveryId] = useState("");
  const [formUnitIssuanceId, setFormUnitIssuanceId] = useState("");
  const [formUnitPriceDelivery, setFormUnitPriceDelivery] = useState("");
  const [formQuantityDelivery, setFormQuantityDelivery] = useState("");
  const [formUnitIssuanceRate, setFormUnitIssuanceRate] = useState("");
  const [formStatus, setFormStatus] = useState("active");

  // ─── Lookup form state ─────────────────────────────────────────────────────
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");

  // ─── Load all data ─────────────────────────────────────────────────────────
  const loadAll = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [di, cats, brs, uns, reqs] = await Promise.all([
        fetchDeliveryItems(),
        fetchCategories(),
        fetchBrands(),
        fetchUnits(),
        fetchRationRequests(),
      ]);
      setDeliveryItems(di);
      setCategories(cats);
      setBrands(brs);
      setUnits(uns);
      setRationRequests(reqs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ─── Delivery Item CRUD handlers ──────────────────────────────────────────
  const resetForm = () => {
    setFormCategoryId("");
    setFormDescription("");
    setFormBrandId("");
    setFormExpiryDate("");
    setFormDeliveryReceipt("");
    setFormUnitDeliveryId("");
    setFormUnitIssuanceId("");
    setFormUnitPriceDelivery("");
    setFormQuantityDelivery("");
    setFormUnitIssuanceRate("");
    setFormStatus("active");
    setEditingId(null);
    setShowDialog(false);
  };

  const handleSubmit = async () => {
    if (
      !formCategoryId ||
      !formUnitDeliveryId ||
      !formUnitIssuanceId ||
      !formQuantityDelivery ||
      !formUnitPriceDelivery ||
      !formUnitIssuanceRate
    ) {
      alert("Please fill in all required fields");
      return;
    }
    const fields = {
      category_id: formCategoryId,
      description: formDescription.trim() || undefined,
      brand_id: formBrandId || undefined,
      expiry_date: formExpiryDate || undefined,
      delivery_receipt: formDeliveryReceipt.trim() || undefined,
      unit_delivery_id: formUnitDeliveryId,
      unit_issuance_id: formUnitIssuanceId,
      unit_price_delivery: Number(formUnitPriceDelivery),
      quantity_delivery: Number(formQuantityDelivery),
      unit_issuance_rate: Number(formUnitIssuanceRate),
      status: formStatus,
    };
    setFormLoading(true);
    const result = editingId
      ? await updateDeliveryItem(editingId, fields)
      : await createDeliveryItem(fields);
    setFormLoading(false);
    if (!result.success) {
      alert(result.error);
      return;
    }
    resetForm();
    await loadAll();
  };

  const handleEdit = (item: DeliveryItem) => {
    setFormCategoryId(item.category_id);
    setFormDescription(item.description || "");
    setFormBrandId(item.brand_id || "");
    setFormExpiryDate(item.expiry_date || "");
    setFormDeliveryReceipt(item.delivery_receipt || "");
    setFormUnitDeliveryId(item.unit_delivery_id);
    setFormUnitIssuanceId(item.unit_issuance_id);
    setFormUnitPriceDelivery(String(item.unit_price_delivery));
    setFormQuantityDelivery(String(item.quantity_delivery));
    setFormUnitIssuanceRate(String(item.unit_issuance_rate));
    setFormStatus(item.status);
    setEditingId(item.id);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this delivery item?")) return;
    const result = await deleteDeliveryItem(id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    await loadAll();
  };

  // ─── Lookup helpers ────────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const r = await createCategory(newCategoryName.trim());
    if (!r.success) {
      alert(r.error);
      return;
    }
    setNewCategoryName("");
    const cats = await fetchCategories();
    setCategories(cats);
  };

  // Quick-add from inside the dialog — creates and auto-selects
  const handleDialogAddCategory = async (name: string) => {
    const r = await createCategory(name);
    if (!r.success) {
      alert(r.error);
      return;
    }
    const cats = await fetchCategories();
    setCategories(cats);
    const created = cats.find((c) => c.name === name);
    if (created) setFormCategoryId(created.id);
  };

  const handleDialogAddBrand = async (name: string) => {
    const r = await createBrand(name);
    if (!r.success) {
      alert(r.error);
      return;
    }
    const brs = await fetchBrands();
    setBrands(brs);
    const created = brs.find((b) => b.name === name);
    if (created) setFormBrandId(created.id);
  };

  const handleDialogAddUnit = async (name: string) => {
    const r = await createUnit(name);
    if (!r.success) {
      alert(r.error);
      return;
    }
    const uns = await fetchUnits();
    setUnits(uns);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const r = await deleteCategory(id);
    if (!r.success) {
      alert(r.error);
      return;
    }
    const cats = await fetchCategories();
    setCategories(cats);
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    const r = await createBrand(newBrandName.trim());
    if (!r.success) {
      alert(r.error);
      return;
    }
    setNewBrandName("");
    const brs = await fetchBrands();
    setBrands(brs);
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm("Delete this brand?")) return;
    const r = await deleteBrand(id);
    if (!r.success) {
      alert(r.error);
      return;
    }
    const brs = await fetchBrands();
    setBrands(brs);
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return;
    const r = await createUnit(newUnitName.trim());
    if (!r.success) {
      alert(r.error);
      return;
    }
    setNewUnitName("");
    const uns = await fetchUnits();
    setUnits(uns);
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm("Delete this unit?")) return;
    const r = await deleteUnit(id);
    if (!r.success) {
      alert(r.error);
      return;
    }
    const uns = await fetchUnits();
    setUnits(uns);
  };

  // ─── Request handlers (module4 rations) ──────────────────────────────────
  const handleApproveRequest = async (req: RationRequest) => {
    if (
      !confirm(
        `Approve request for ${req.quantity_used} ${req.unit?.name || "units"} of "${req.delivery_item?.description || "item"}"? This will deduct from stock.`,
      )
    )
      return;
    const result = await approveRationRequest(
      req.id,
      req.delivery_item_id,
      req.quantity_used,
    );
    if (!result.success) {
      alert(result.error);
      return;
    }
    await loadAll();
  };

  const handleRejectRequest = async (req: RationRequest) => {
    if (!confirm("Reject this request?")) return;
    const result = await rejectRationRequest(req.id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    await loadAll();
  };

  // Compute stats
  const totalValue = deliveryItems.reduce(
    (s, i) => s + (i.total_price || 0),
    0,
  );
  const activeCount = deliveryItems.filter((i) => i.status === "active").length;
  const pendingRequestCount = rationRequests.filter(
    (r) => r.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Inventory"
        subtitle="Manage deliveries, issuance, and lookup data"
        icon={<Package className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Delivery Items" value={deliveryItems.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard
          label="Total Value"
          value={`₱${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
        <StatCard label="Categories" value={categories.length} />
        <StatCard label="Pending Requests" value={pendingRequestCount} />
      </StatsRow>

      {error && (
        <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
          {error}
        </div>
      )}

      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ─── Delivery Items Tab ───────────────────────────────────────────── */}
      {activeTab === "items" && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={loadAll} disabled={isLoading}>
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Delivery Item
            </PrimaryButton>
          </ActionsBar>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted">Loading...</p>
            </div>
          ) : (
            <DeliveryItemsList
              items={deliveryItems}
              search={itemSearch}
              onSearchChange={setItemSearch}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      {/* ─── Requests Tab ─────────────────────────────────────────────── */}
      {activeTab === "requests" && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={loadAll} disabled={isLoading}>
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </PrimaryButton>
          </ActionsBar>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted">Loading...</p>
            </div>
          ) : (
            <RequestsList
              requests={rationRequests}
              search={requestSearch}
              onSearchChange={setRequestSearch}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
            />
          )}
        </>
      )}

      {/* ─── Lookups Tab ──────────────────────────────────────────────────── */}
      {activeTab === "lookups" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Categories */}
          <LookupCard
            title="Categories"
            items={categories}
            newName={newCategoryName}
            onNewNameChange={setNewCategoryName}
            onAdd={handleAddCategory}
            onDelete={handleDeleteCategory}
          />

          {/* Brands */}
          <LookupCard
            title="Brands"
            items={brands}
            newName={newBrandName}
            onNewNameChange={setNewBrandName}
            onAdd={handleAddBrand}
            onDelete={handleDeleteBrand}
          />

          {/* Units */}
          <LookupCard
            title="Units"
            items={units}
            newName={newUnitName}
            onNewNameChange={setNewUnitName}
            onAdd={handleAddUnit}
            onDelete={handleDeleteUnit}
          />
        </div>
      )}

      {/* ─── Dialog ───────────────────────────────────────────────────────── */}
      <DeliveryItemDialog
        open={showDialog}
        onClose={resetForm}
        onSubmit={handleSubmit}
        editMode={!!editingId}
        isLoading={formLoading}
        categories={categories}
        brands={brands}
        units={units}
        onAddCategory={handleDialogAddCategory}
        onAddBrand={handleDialogAddBrand}
        onAddUnit={handleDialogAddUnit}
        categoryId={formCategoryId}
        onCategoryIdChange={setFormCategoryId}
        description={formDescription}
        onDescriptionChange={setFormDescription}
        brandId={formBrandId}
        onBrandIdChange={setFormBrandId}
        expiryDate={formExpiryDate}
        onExpiryDateChange={setFormExpiryDate}
        deliveryReceipt={formDeliveryReceipt}
        onDeliveryReceiptChange={setFormDeliveryReceipt}
        unitDeliveryId={formUnitDeliveryId}
        onUnitDeliveryIdChange={setFormUnitDeliveryId}
        unitIssuanceId={formUnitIssuanceId}
        onUnitIssuanceIdChange={setFormUnitIssuanceId}
        unitPriceDelivery={formUnitPriceDelivery}
        onUnitPriceDeliveryChange={setFormUnitPriceDelivery}
        quantityDelivery={formQuantityDelivery}
        onQuantityDeliveryChange={setFormQuantityDelivery}
        unitIssuanceRate={formUnitIssuanceRate}
        onUnitIssuanceRateChange={setFormUnitIssuanceRate}
        status={formStatus}
        onStatusChange={setFormStatus}
      />
    </div>
  );
}

// ─── Lookup Card (inline helper) ─────────────────────────────────────────────

function LookupCard({
  title,
  items,
  newName,
  onNewNameChange,
  onAdd,
  onDelete,
}: {
  title: string;
  items: { id: string; name: string }[];
  newName: string;
  onNewNameChange: (v: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
          placeholder={`New ${title.toLowerCase().slice(0, -1)}...`}
          value={newName}
          onChange={(e) => onNewNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <button
          onClick={onAdd}
          className="px-3 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {items.length === 0 && (
          <li className="text-xs text-muted py-2 text-center">
            No {title.toLowerCase()} yet
          </li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-background text-sm text-foreground"
          >
            <span>{item.name}</span>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 rounded hover:bg-danger/10 text-muted hover:text-danger transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

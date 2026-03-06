import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  RefreshCw,
  Trash2,
  Warehouse,
  ShieldCheck,
  Coins,
  FolderKanban,
  BellRing,
  Settings2,
  TrendingUp,
  ArrowDownToLine,
  PackageSearch,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
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
  fetchStockTransactions,
  approveStockTransaction,
  rejectStockTransaction,
  type DeliveryItem,
  type Category,
  type Brand,
  type Unit,
  type StockTransaction,
} from "@/services/inventoryService";

import DeliveryItemsList from "./DeliveryItemsList";
import DeliveryItemDialog from "./DeliveryItemDialog";
import RequestsList from "./RequestsList";
import StockOverview from "./StockOverview";

const TABS = [
  { key: "items", label: "Delivery Items", icon: ArrowDownToLine },
  { key: "stock", label: "Stock Overview", icon: TrendingUp },
  { key: "requests", label: "Requests", icon: PackageSearch },
  { key: "lookups", label: "Categories / Brands / Units", icon: Settings2 },
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

  const [stockTransactions, setStockTransactions] = useState<
    StockTransaction[]
  >([]);

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
        fetchStockTransactions(),
      ]);
      setDeliveryItems(di);
      setCategories(cats);
      setBrands(brs);
      setUnits(uns);
      setStockTransactions(reqs);
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
  const handleApproveRequest = async (req: StockTransaction) => {
    if (
      !confirm(
        `Approve request for ${req.quantity} ${req.unit?.name || "units"} of "${req.delivery_item?.description || "item"}"? This will deduct from stock.`,
      )
    )
      return;
    const result = await approveStockTransaction(
      req.id,
      req.delivery_item_id,
      req.quantity,
      "warehouse_admin",
    );
    if (!result.success) {
      alert(result.error);
      return;
    }
    await loadAll();
  };

  const handleRejectRequest = async (req: StockTransaction) => {
    if (!confirm("Reject this request?")) return;
    const result = await rejectStockTransaction(req.id, "warehouse_admin");
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
  const pendingRequestCount = stockTransactions.filter(
    (r) => r.status === "pending",
  ).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Warehouse Inventory"
          subtitle="Manage deliveries, issuance, and lookup data"
          icon={<Package className="w-7 h-7" />}
        />

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg shadow-sm animate-in slide-in-from-top">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* ─── Enhanced Stats Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-teal-500/10 to-cyan-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-linear-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg shadow-teal-200/50">
                  <Warehouse className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold bg-linear-to-br from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {deliveryItems.length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500 tracking-wide">
                Delivery Items
              </p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-emerald-500/10 to-green-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-linear-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-200/50">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold bg-linear-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {activeCount}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500 tracking-wide">
                Active Items
              </p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-violet-500/10 to-purple-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-linear-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-200/50">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-linear-to-br from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  ₱
                  {totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500 tracking-wide">
                Total Value
              </p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-sky-500/10 to-blue-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-linear-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg shadow-sky-200/50">
                  <FolderKanban className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold bg-linear-to-br from-sky-600 to-blue-600 bg-clip-text text-transparent">
                  {categories.length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500 tracking-wide">
                Categories
              </p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-rose-500/10 to-pink-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-linear-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg shadow-rose-200/50">
                  <BellRing className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold bg-linear-to-br from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  {pendingRequestCount}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500 tracking-wide">
                Pending Requests
              </p>
            </div>
          </div>
        </div>

        {/* ─── Tabs Card ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
            <nav className="flex space-x-2 px-6 pt-4">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-5 py-3 font-medium text-sm rounded-t-xl transition-all duration-200
                    ${
                      activeTab === tab.key
                        ? "bg-white text-green-600 border-t-2 border-x border-green-500 shadow-sm -mb-px"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* ─── Delivery Items Tab ─────────────────────────────────────── */}
            {activeTab === "items" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Manage Delivery Items
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={loadAll}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </button>
                    <button
                      onClick={() => {
                        resetForm();
                        setShowDialog(true);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Delivery Item
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                    <span className="ml-3 text-gray-500">Loading items...</span>
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
              </div>
            )}

            {/* ─── Stock Overview Tab ─────────────────────────────────────── */}
            {activeTab === "stock" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Stock Overview
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={loadAll}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                    <span className="ml-3 text-gray-500">
                      Loading stock data...
                    </span>
                  </div>
                ) : (
                  <StockOverview
                    items={deliveryItems}
                    transactions={stockTransactions}
                  />
                )}
              </div>
            )}

            {/* ─── Requests Tab ───────────────────────────────────────────── */}
            {activeTab === "requests" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Stock Requests
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={loadAll}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                    <span className="ml-3 text-gray-500">
                      Loading requests...
                    </span>
                  </div>
                ) : (
                  <RequestsList
                    requests={stockTransactions}
                    search={requestSearch}
                    onSearchChange={setRequestSearch}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                  />
                )}
              </div>
            )}

            {/* ─── Lookups Tab ────────────────────────────────────────────── */}
            {activeTab === "lookups" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Manage Lookups
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <LookupCard
                    title="Categories"
                    items={categories}
                    newName={newCategoryName}
                    onNewNameChange={setNewCategoryName}
                    onAdd={handleAddCategory}
                    onDelete={handleDeleteCategory}
                  />
                  <LookupCard
                    title="Brands"
                    items={brands}
                    newName={newBrandName}
                    onNewNameChange={setNewBrandName}
                    onAdd={handleAddBrand}
                    onDelete={handleDeleteBrand}
                  />
                  <LookupCard
                    title="Units"
                    items={units}
                    newName={newUnitName}
                    onNewNameChange={setNewUnitName}
                    onAdd={handleAddUnit}
                    onDelete={handleDeleteUnit}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
    <div className="bg-linear-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all"
          placeholder={`New ${title.toLowerCase().slice(0, -1)}...`}
          value={newName}
          onChange={(e) => onNewNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <button
          onClick={onAdd}
          className="px-3.5 py-2.5 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <ul className="space-y-1 max-h-56 overflow-y-auto pr-1">
        {items.length === 0 && (
          <li className="text-sm text-gray-400 py-4 text-center">
            No {title.toLowerCase()} yet
          </li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white hover:shadow-sm text-sm text-gray-700 transition-all duration-150"
          >
            <span className="font-medium">{item.name}</span>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
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

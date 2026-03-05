import { useState, useEffect } from "react";
import { Package, Plus, RefreshCw } from "lucide-react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  Tabs,
} from "@/components/ui";
import {
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  fetchWarehouse,
  createWarehouseEntry,
  updateWarehouseEntry,
  deleteWarehouseEntry,
  fetchStorage,
  createStorageEntry,
  updateStorageEntry,
  deleteStorageEntry,
  fetchLogs,
  createLog,
  deleteLog,
  ITEM_CATEGORIES,
  type Item,
  type Warehouse,
  type Storage,
  type Log,
} from "@/services/inventoryService";

import ItemsList from "./ItemsList";
import ItemDialog from "./ItemDialog";
import WarehouseList from "./WarehouseList";
import WarehouseDialog from "./WarehouseDialog";
import StorageList from "./StorageList";
import StorageDialog from "./StorageDialog";
import LogsList from "./LogsList";
import LogDialog from "./LogDialog";

type TabKey = "items" | "warehouse" | "storage" | "logs";

const tabs = [
  { key: "items", label: "Items" },
  { key: "warehouse", label: "Warehouse" },
  { key: "storage", label: "Storage" },
  { key: "logs", label: "Logs" },
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<TabKey>("items");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Data
  const [items, setItems] = useState<Item[]>([]);
  const [warehouseEntries, setWarehouseEntries] = useState<Warehouse[]>([]);
  const [storageEntries, setStorageEntries] = useState<Storage[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  // Search states
  const [itemSearch, setItemSearch] = useState("");
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [storageSearch, setStorageSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");

  // ─── Item form state ───────────────────────────────────────────────────────
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formItemName, setFormItemName] = useState("");
  const [formFullKg, setFormFullKg] = useState("");
  const [formItemCategory, setFormItemCategory] = useState<string>(
    ITEM_CATEGORIES[0],
  );
  const [formItemSupplier, setFormItemSupplier] = useState("");
  const [formItemDescription, setFormItemDescription] = useState("");
  const [formItemUnit, setFormItemUnit] = useState("kg");
  const [itemLoading, setItemLoading] = useState(false);

  // ─── Warehouse form state ──────────────────────────────────────────────────
  const [showWhDialog, setShowWhDialog] = useState(false);
  const [editingWhId, setEditingWhId] = useState<string | null>(null);
  const [formWhItemId, setFormWhItemId] = useState("");
  const [formWhSacks, setFormWhSacks] = useState("");
  const [formWhCost, setFormWhCost] = useState("");
  const [formWhBatchNo, setFormWhBatchNo] = useState("");
  const [formWhExpiryDate, setFormWhExpiryDate] = useState("");
  const [formWhNotes, setFormWhNotes] = useState("");
  const [whLoading, setWhLoading] = useState(false);

  // ─── Storage form state ────────────────────────────────────────────────────
  const [showStDialog, setShowStDialog] = useState(false);
  const [editingStId, setEditingStId] = useState<string | null>(null);
  const [formStItemId, setFormStItemId] = useState("");
  const [formStRemKg, setFormStRemKg] = useState("");
  const [formStIsOpen, setFormStIsOpen] = useState(false);
  const [formStLocation, setFormStLocation] = useState("");
  const [stLoading, setStLoading] = useState(false);

  // ─── Log form state ────────────────────────────────────────────────────────
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [formLogStorageId, setFormLogStorageId] = useState("");
  const [formLogUsedKg, setFormLogUsedKg] = useState("");
  const [formLogSpend, setFormLogSpend] = useState("");
  const [formLogPurpose, setFormLogPurpose] = useState("");
  const [logLoading, setLogLoading] = useState(false);

  // ─── Load all data ─────────────────────────────────────────────────────────
  const loadAll = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [i, w, s, l] = await Promise.all([
        fetchItems(),
        fetchWarehouse(),
        fetchStorage(),
        fetchLogs(),
      ]);
      setItems(i);
      setWarehouseEntries(w);
      setStorageEntries(s);
      setLogs(l);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ─── Items CRUD handlers ──────────────────────────────────────────────────
  const handleItemSubmit = async () => {
    if (!formItemName.trim() || !formFullKg) {
      alert("Please fill in all fields");
      return;
    }
    const fields = {
      item_name: formItemName.trim(),
      full_kg: Number(formFullKg),
      category: formItemCategory || undefined,
      supplier: formItemSupplier.trim() || undefined,
      description: formItemDescription.trim() || undefined,
      unit: formItemUnit || undefined,
    };
    setItemLoading(true);
    const result = editingItemId
      ? await updateItem(editingItemId, fields)
      : await createItem(fields);
    setItemLoading(false);
    if (!result.success) {
      alert(result.error);
      return;
    }
    resetItemForm();
    await loadAll();
  };

  const handleEditItem = (item: Item) => {
    setFormItemName(item.item_name);
    setFormFullKg(String(item.full_kg));
    setFormItemCategory(item.category || ITEM_CATEGORIES[0]);
    setFormItemSupplier(item.supplier || "");
    setFormItemDescription(item.description || "");
    setFormItemUnit(item.unit || "kg");
    setEditingItemId(item.id);
    setShowItemDialog(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const result = await deleteItem(id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    await loadAll();
  };

  const resetItemForm = () => {
    setFormItemName("");
    setFormFullKg("");
    setFormItemCategory(ITEM_CATEGORIES[0]);
    setFormItemSupplier("");
    setFormItemDescription("");
    setFormItemUnit("kg");
    setEditingItemId(null);
    setShowItemDialog(false);
  };

  // ─── Warehouse CRUD handlers ──────────────────────────────────────────────
  const handleWhSubmit = async () => {
    if (!formWhItemId || !formWhSacks || !formWhCost) {
      alert("Please fill in all fields");
      return;
    }
    const fields = {
      item_id: formWhItemId,
      sacks: Number(formWhSacks),
      cost: Number(formWhCost),
      batch_no: formWhBatchNo.trim() || undefined,
      expiry_date: formWhExpiryDate || undefined,
      notes: formWhNotes.trim() || undefined,
    };
    setWhLoading(true);
    const result = editingWhId
      ? await updateWarehouseEntry(editingWhId, fields)
      : await createWarehouseEntry(fields);
    setWhLoading(false);
    if (!result.success) {
      alert(result.error);
      return;
    }
    resetWhForm();
    await loadAll();
  };

  const handleEditWh = (entry: Warehouse) => {
    setFormWhItemId(entry.item_id);
    setFormWhSacks(String(entry.sacks));
    setFormWhCost(String(entry.cost));
    setFormWhBatchNo(entry.batch_no || "");
    setFormWhExpiryDate(entry.expiry_date || "");
    setFormWhNotes(entry.notes || "");
    setEditingWhId(entry.id);
    setShowWhDialog(true);
  };

  const handleDeleteWh = async (id: string) => {
    if (!confirm("Delete this warehouse entry?")) return;
    const result = await deleteWarehouseEntry(id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    await loadAll();
  };

  const resetWhForm = () => {
    setFormWhItemId("");
    setFormWhSacks("");
    setFormWhCost("");
    setFormWhBatchNo("");
    setFormWhExpiryDate("");
    setFormWhNotes("");
    setEditingWhId(null);
    setShowWhDialog(false);
  };

  // ─── Storage CRUD handlers ────────────────────────────────────────────────
  const handleStSubmit = async () => {
    if (!formStItemId || !formStRemKg) {
      alert("Please fill in all fields");
      return;
    }
    const fields = {
      item_id: formStItemId,
      rem_kg: Number(formStRemKg),
      is_open: formStIsOpen,
      location: formStLocation.trim() || undefined,
    };
    setStLoading(true);
    const result = editingStId
      ? await updateStorageEntry(editingStId, fields)
      : await createStorageEntry(fields);
    setStLoading(false);
    if (!result.success) {
      alert(result.error);
      return;
    }
    resetStForm();
    await loadAll();
  };

  const handleEditSt = (entry: Storage) => {
    setFormStItemId(entry.item_id);
    setFormStRemKg(String(entry.rem_kg));
    setFormStIsOpen(entry.is_open);
    setFormStLocation(entry.location || "");
    setEditingStId(entry.id);
    setShowStDialog(true);
  };

  const handleDeleteSt = async (id: string) => {
    if (!confirm("Delete this storage entry?")) return;
    const result = await deleteStorageEntry(id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    await loadAll();
  };

  const resetStForm = () => {
    setFormStItemId("");
    setFormStRemKg("");
    setFormStIsOpen(false);
    setFormStLocation("");
    setEditingStId(null);
    setShowStDialog(false);
  };

  // ─── Log CRUD handlers ────────────────────────────────────────────────────
  const handleLogSubmit = async () => {
    if (!formLogStorageId || !formLogUsedKg || !formLogSpend) {
      alert("Please fill in all fields");
      return;
    }
    const fields = {
      storage_id: formLogStorageId,
      used_kg: Number(formLogUsedKg),
      spend: Number(formLogSpend),
      purpose: formLogPurpose.trim() || undefined,
    };
    setLogLoading(true);
    const result = await createLog(fields);
    setLogLoading(false);
    if (!result.success) {
      alert(result.error);
      return;
    }
    resetLogForm();
    await loadAll();
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Delete this log?")) return;
    const result = await deleteLog(id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    await loadAll();
  };

  const resetLogForm = () => {
    setFormLogStorageId("");
    setFormLogUsedKg("");
    setFormLogSpend("");
    setFormLogPurpose("");
    setShowLogDialog(false);
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const totalSacks = warehouseEntries.reduce(
    (sum, w) => sum + (w.sacks || 0),
    0,
  );
  const openStorage = storageEntries.filter((s) => s.is_open).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        subtitle="Manage items, warehouse stock, storage distribution, and usage logs"
        icon={<Package className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Items" value={items.length} />
        <StatCard label="Warehouse Sacks" value={totalSacks} color="success" />
        <StatCard
          label="Storage Entries"
          value={storageEntries.length}
          color="warning"
        />
        <StatCard label="Open Sacks" value={openStorage} color="danger" />
      </StatsRow>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabKey)}
      />

      {error && (
        <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
          {error}
        </div>
      )}

      {/* ─── Items Tab ────────────────────────────────────────────────────── */}
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
                resetItemForm();
                setShowItemDialog(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Item
            </PrimaryButton>
          </ActionsBar>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted">Loading items...</p>
            </div>
          ) : (
            <ItemsList
              items={items}
              search={itemSearch}
              onSearchChange={setItemSearch}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          )}
        </>
      )}

      {/* ─── Warehouse Tab ────────────────────────────────────────────────── */}
      {activeTab === "warehouse" && (
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
                resetWhForm();
                setShowWhDialog(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add to Warehouse
            </PrimaryButton>
          </ActionsBar>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted">Loading warehouse...</p>
            </div>
          ) : (
            <WarehouseList
              entries={warehouseEntries}
              search={warehouseSearch}
              onSearchChange={setWarehouseSearch}
              onEdit={handleEditWh}
              onDelete={handleDeleteWh}
            />
          )}
        </>
      )}

      {/* ─── Storage Tab ──────────────────────────────────────────────────── */}
      {activeTab === "storage" && (
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
                resetStForm();
                setShowStDialog(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add to Storage
            </PrimaryButton>
          </ActionsBar>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted">Loading storage...</p>
            </div>
          ) : (
            <StorageList
              entries={storageEntries}
              search={storageSearch}
              onSearchChange={setStorageSearch}
              onEdit={handleEditSt}
              onDelete={handleDeleteSt}
            />
          )}
        </>
      )}

      {/* ─── Logs Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "logs" && (
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
                resetLogForm();
                setShowLogDialog(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Log
            </PrimaryButton>
          </ActionsBar>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted">Loading logs...</p>
            </div>
          ) : (
            <LogsList
              logs={logs}
              search={logSearch}
              onSearchChange={setLogSearch}
              onDelete={handleDeleteLog}
            />
          )}
        </>
      )}

      {/* ─── Dialogs ──────────────────────────────────────────────────────── */}
      <ItemDialog
        open={showItemDialog}
        onClose={resetItemForm}
        onSubmit={handleItemSubmit}
        itemName={formItemName}
        onItemNameChange={setFormItemName}
        fullKg={formFullKg}
        onFullKgChange={setFormFullKg}
        category={formItemCategory}
        onCategoryChange={setFormItemCategory}
        supplier={formItemSupplier}
        onSupplierChange={setFormItemSupplier}
        description={formItemDescription}
        onDescriptionChange={setFormItemDescription}
        unit={formItemUnit}
        onUnitChange={setFormItemUnit}
        editMode={!!editingItemId}
        isLoading={itemLoading}
      />

      <WarehouseDialog
        open={showWhDialog}
        onClose={resetWhForm}
        onSubmit={handleWhSubmit}
        items={items}
        selectedItemId={formWhItemId}
        onItemIdChange={setFormWhItemId}
        sacks={formWhSacks}
        onSacksChange={setFormWhSacks}
        cost={formWhCost}
        onCostChange={setFormWhCost}
        batchNo={formWhBatchNo}
        onBatchNoChange={setFormWhBatchNo}
        expiryDate={formWhExpiryDate}
        onExpiryDateChange={setFormWhExpiryDate}
        notes={formWhNotes}
        onNotesChange={setFormWhNotes}
        editMode={!!editingWhId}
        isLoading={whLoading}
      />

      <StorageDialog
        open={showStDialog}
        onClose={resetStForm}
        onSubmit={handleStSubmit}
        items={items}
        selectedItemId={formStItemId}
        onItemIdChange={setFormStItemId}
        remKg={formStRemKg}
        onRemKgChange={setFormStRemKg}
        isOpen={formStIsOpen}
        onIsOpenChange={setFormStIsOpen}
        location={formStLocation}
        onLocationChange={setFormStLocation}
        editMode={!!editingStId}
        isLoading={stLoading}
      />

      <LogDialog
        open={showLogDialog}
        onClose={resetLogForm}
        onSubmit={handleLogSubmit}
        storageEntries={storageEntries}
        selectedStorageId={formLogStorageId}
        onStorageIdChange={setFormLogStorageId}
        usedKg={formLogUsedKg}
        onUsedKgChange={setFormLogUsedKg}
        spend={formLogSpend}
        onSpendChange={setFormLogSpend}
        purpose={formLogPurpose}
        onPurposeChange={setFormLogPurpose}
        isLoading={logLoading}
      />
    </div>
  );
}

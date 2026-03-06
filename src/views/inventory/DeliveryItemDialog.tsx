import { useState } from "react";
import { Plus } from "lucide-react";
import { BaseDialog } from "@/components/ui/dialog";
import type { Category, Brand, Unit } from "@/services/inventoryService";

interface DeliveryItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editMode?: boolean;
  isLoading?: boolean;
  categories: Category[];
  brands: Brand[];
  units: Unit[];
  onAddCategory: (name: string) => Promise<void>;
  onAddBrand: (name: string) => Promise<void>;
  onAddUnit: (name: string) => Promise<void>;
  // form fields
  categoryId: string;
  onCategoryIdChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  brandId: string;
  onBrandIdChange: (val: string) => void;
  expiryDate: string;
  onExpiryDateChange: (val: string) => void;
  deliveryReceipt: string;
  onDeliveryReceiptChange: (val: string) => void;
  unitDeliveryId: string;
  onUnitDeliveryIdChange: (val: string) => void;
  unitIssuanceId: string;
  onUnitIssuanceIdChange: (val: string) => void;
  unitPriceDelivery: string;
  onUnitPriceDeliveryChange: (val: string) => void;
  quantityDelivery: string;
  onQuantityDeliveryChange: (val: string) => void;
  unitIssuanceRate: string;
  onUnitIssuanceRateChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
}

export default function DeliveryItemDialog({
  open,
  onClose,
  onSubmit,
  editMode = false,
  isLoading = false,
  categories,
  brands,
  units,
  onAddCategory,
  onAddBrand,
  onAddUnit,
  categoryId,
  onCategoryIdChange,
  description,
  onDescriptionChange,
  brandId,
  onBrandIdChange,
  expiryDate,
  onExpiryDateChange,
  deliveryReceipt,
  onDeliveryReceiptChange,
  unitDeliveryId,
  onUnitDeliveryIdChange,
  unitIssuanceId,
  onUnitIssuanceIdChange,
  unitPriceDelivery,
  onUnitPriceDeliveryChange,
  quantityDelivery,
  onQuantityDeliveryChange,
  unitIssuanceRate,
  onUnitIssuanceRateChange,
  status,
  onStatusChange,
}: DeliveryItemDialogProps) {
  // quick-add state
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [addingBrand, setAddingBrand] = useState(false);
  const [newUnitDelivery, setNewUnitDelivery] = useState("");
  const [addingUnitDelivery, setAddingUnitDelivery] = useState(false);
  const [newUnitIssuance, setNewUnitIssuance] = useState("");
  const [addingUnitIssuance, setAddingUnitIssuance] = useState(false);

  const handleQuickAddCategory = async () => {
    if (!newCategory.trim()) return;
    await onAddCategory(newCategory.trim());
    setNewCategory("");
    setAddingCategory(false);
  };

  const handleQuickAddBrand = async () => {
    if (!newBrand.trim()) return;
    await onAddBrand(newBrand.trim());
    setNewBrand("");
    setAddingBrand(false);
  };

  const handleQuickAddUnitDelivery = async () => {
    if (!newUnitDelivery.trim()) return;
    await onAddUnit(newUnitDelivery.trim());
    setNewUnitDelivery("");
    setAddingUnitDelivery(false);
  };

  const handleQuickAddUnitIssuance = async () => {
    if (!newUnitIssuance.trim()) return;
    await onAddUnit(newUnitIssuance.trim());
    setNewUnitIssuance("");
    setAddingUnitIssuance(false);
  };

  // computed previews
  const qty = Number(quantityDelivery) || 0;
  const price = Number(unitPriceDelivery) || 0;
  const rate = Number(unitIssuanceRate) || 0;
  const totalPrice = qty * price;
  const qtyIssuance = rate > 0 ? qty * rate : 0;
  const unitPriceIssuance = qtyIssuance > 0 ? totalPrice / qtyIssuance : 0;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const selectClass =
    "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success";
  const inputClass =
    "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success";

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? "Edit Delivery Item" : "Add Delivery Item"}
      onSubmit={onSubmit}
      submitLabel={editMode ? "Save Changes" : "Add Item"}
      isLoading={isLoading}
    >
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {/* Category */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="di-category"
              className="block text-sm font-medium text-foreground"
            >
              Category <span className="text-error ml-1">*</span>
            </label>
            <button
              type="button"
              onClick={() => setAddingCategory((v) => !v)}
              className="flex items-center gap-1 text-xs text-success hover:underline"
            >
              <Plus className="w-3 h-3" />
              Add new
            </button>
          </div>
          {addingCategory && (
            <div className="flex gap-2">
              <input
                type="text"
                className={`${inputClass} flex-1`}
                placeholder="New category name..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickAddCategory()}
                autoFocus
              />
              <button
                type="button"
                onClick={handleQuickAddCategory}
                className="px-3 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
              >
                Save
              </button>
            </div>
          )}
          <select
            id="di-category"
            className={selectClass}
            value={categoryId}
            onChange={(e) => onCategoryIdChange(e.target.value)}
          >
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label
            htmlFor="di-desc"
            className="block text-sm font-medium text-foreground"
          >
            Description
          </label>
          <textarea
            id="di-desc"
            className={`${inputClass} resize-none`}
            rows={2}
            placeholder="Brief description..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>

        {/* Brand + Expiry */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="di-brand"
                className="block text-sm font-medium text-foreground"
              >
                Brand
              </label>
              <button
                type="button"
                onClick={() => setAddingBrand((v) => !v)}
                className="flex items-center gap-1 text-xs text-success hover:underline"
              >
                <Plus className="w-3 h-3" />
                Add new
              </button>
            </div>
            {addingBrand && (
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`${inputClass} flex-1`}
                  placeholder="New brand name..."
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAddBrand()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleQuickAddBrand}
                  className="px-3 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
                >
                  Save
                </button>
              </div>
            )}
            <select
              id="di-brand"
              className={selectClass}
              value={brandId}
              onChange={(e) => onBrandIdChange(e.target.value)}
            >
              <option value="">None</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="di-expiry"
              className="block text-sm font-medium text-foreground"
            >
              Expiry Date
            </label>
            <input
              id="di-expiry"
              type="date"
              className={inputClass}
              value={expiryDate}
              onChange={(e) => onExpiryDateChange(e.target.value)}
            />
          </div>
        </div>

        {/* Delivery Receipt */}
        <div className="space-y-1.5">
          <label
            htmlFor="di-receipt"
            className="block text-sm font-medium text-foreground"
          >
            Delivery Receipt
          </label>
          <input
            id="di-receipt"
            type="text"
            className={inputClass}
            placeholder="e.g. DR-2024-001"
            value={deliveryReceipt}
            onChange={(e) => onDeliveryReceiptChange(e.target.value)}
          />
        </div>

        {/* Delivery Info */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-muted uppercase mb-3">
            Delivery Info
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="di-unit-del"
                  className="block text-sm font-medium text-foreground"
                >
                  Unit (Delivery) <span className="text-error ml-1">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAddingUnitDelivery((v) => !v)}
                  className="flex items-center gap-1 text-xs text-success hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  Add new
                </button>
              </div>
              {addingUnitDelivery && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`${inputClass} flex-1`}
                    placeholder="New unit..."
                    value={newUnitDelivery}
                    onChange={(e) => setNewUnitDelivery(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleQuickAddUnitDelivery()
                    }
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddUnitDelivery}
                    className="px-3 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              )}
              <select
                id="di-unit-del"
                className={selectClass}
                value={unitDeliveryId}
                onChange={(e) => onUnitDeliveryIdChange(e.target.value)}
              >
                <option value="">Select unit...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="di-qty"
                className="block text-sm font-medium text-foreground"
              >
                Quantity <span className="text-error ml-1">*</span>
              </label>
              <input
                id="di-qty"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="0"
                value={quantityDelivery}
                onChange={(e) => onQuantityDeliveryChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="di-price"
                className="block text-sm font-medium text-foreground"
              >
                Unit Price <span className="text-error ml-1">*</span>
              </label>
              <input
                id="di-price"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="0.00"
                value={unitPriceDelivery}
                onChange={(e) => onUnitPriceDeliveryChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Issuance Info */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-muted uppercase mb-3">
            Issuance Info
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="di-unit-iss"
                  className="block text-sm font-medium text-foreground"
                >
                  Unit (Issuance) <span className="text-error ml-1">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAddingUnitIssuance((v) => !v)}
                  className="flex items-center gap-1 text-xs text-success hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  Add new
                </button>
              </div>
              {addingUnitIssuance && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`${inputClass} flex-1`}
                    placeholder="New unit..."
                    value={newUnitIssuance}
                    onChange={(e) => setNewUnitIssuance(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleQuickAddUnitIssuance()
                    }
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddUnitIssuance}
                    className="px-3 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              )}
              <select
                id="di-unit-iss"
                className={selectClass}
                value={unitIssuanceId}
                onChange={(e) => onUnitIssuanceIdChange(e.target.value)}
              >
                <option value="">Select unit...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="di-rate"
                className="block text-sm font-medium text-foreground"
              >
                Issuance Rate <span className="text-error ml-1">*</span>
              </label>
              <input
                id="di-rate"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="e.g. 50"
                value={unitIssuanceRate}
                onChange={(e) => onUnitIssuanceRateChange(e.target.value)}
              />
              <p className="text-xs text-muted">
                Issuance units per 1 delivery unit
              </p>
            </div>
          </div>
        </div>

        {/* Computed preview */}
        <div className="bg-background border border-border rounded-lg p-3 space-y-1">
          <p className="text-xs font-semibold text-muted uppercase mb-2">
            Computed Preview
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Total Price</span>
            <span className="text-foreground font-medium">
              ₱{fmt(totalPrice)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Qty (Issuance)</span>
            <span className="text-foreground font-medium">
              {fmt(qtyIssuance)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Unit Price (Issuance)</span>
            <span className="text-foreground font-medium">
              ₱{fmt(unitPriceIssuance)}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label
            htmlFor="di-status"
            className="block text-sm font-medium text-foreground"
          >
            Status
          </label>
          <select
            id="di-status"
            className={selectClass}
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="consumed">Consumed</option>
          </select>
        </div>
      </div>
    </BaseDialog>
  );
}

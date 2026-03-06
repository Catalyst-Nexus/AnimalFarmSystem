import { useState } from "react";
import { Plus, Truck, ArrowRightLeft, Eye, Tags, FileText } from "lucide-react";
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
  const [mlPerBottle, setMlPerBottle] = useState("");

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

  // bottle helper
  const selectedIssuanceUnit = units.find((u) => u.id === unitIssuanceId);
  const isBottleUnit =
    selectedIssuanceUnit?.name.toLowerCase().includes("bottle") ?? false;
  const mlPerBottleNum = Number(mlPerBottle) || 0;
  const totalMl =
    isBottleUnit && mlPerBottleNum > 0 ? qtyIssuance * mlPerBottleNum : 0;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const selectClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all";
  const inputClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all";

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? "Edit Delivery Item" : "Add Delivery Item"}
      onSubmit={onSubmit}
      submitLabel={editMode ? "Save Changes" : "Add Item"}
      isLoading={isLoading}
    >
      <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
        {/* Category */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-teal-100 rounded-lg">
              <Tags className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              Category & Description
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="di-category"
                  className="block text-xs font-medium text-gray-500"
                >
                  Category <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAddingCategory((v) => !v)}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
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
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleQuickAddCategory()
                    }
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    className="px-3 py-2 bg-linear-to-r from-teal-500 to-cyan-600 text-white rounded-xl text-sm font-medium hover:from-teal-600 hover:to-cyan-700 transition-all shadow-sm"
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
            <div>
              <label
                htmlFor="di-desc"
                className="block text-xs font-medium text-gray-500 mb-1.5"
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
          </div>
        </div>

        {/* Brand + Expiry + Receipt */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-violet-100 rounded-lg">
              <FileText className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="di-brand"
                  className="block text-xs font-medium text-gray-500"
                >
                  Brand
                </label>
                <button
                  type="button"
                  onClick={() => setAddingBrand((v) => !v)}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
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
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleQuickAddBrand()
                    }
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddBrand}
                    className="px-3 py-2 bg-linear-to-r from-teal-500 to-cyan-600 text-white rounded-xl text-sm font-medium hover:from-teal-600 hover:to-cyan-700 transition-all shadow-sm"
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
            <div>
              <label
                htmlFor="di-expiry"
                className="block text-xs font-medium text-gray-500 mb-1.5"
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
          <div className="mt-3">
            <label
              htmlFor="di-receipt"
              className="block text-xs font-medium text-gray-500 mb-1.5"
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
        </div>

        {/* Delivery Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-sky-100 rounded-lg">
              <Truck className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              Delivery Info
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="di-unit-del"
                  className="block text-xs font-medium text-gray-500"
                >
                  Unit <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAddingUnitDelivery((v) => !v)}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  New
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
                    className="px-3 py-2 bg-linear-to-r from-teal-500 to-cyan-600 text-white rounded-xl text-sm font-medium hover:from-teal-600 hover:to-cyan-700 transition-all shadow-sm"
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
                <option value="">Select...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="di-qty"
                className="block text-xs font-medium text-gray-500 mb-1.5"
              >
                Quantity <span className="text-red-400">*</span>
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
            <div>
              <label
                htmlFor="di-price"
                className="block text-xs font-medium text-gray-500 mb-1.5"
              >
                Unit Price <span className="text-red-400">*</span>
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
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              Issuance Info
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="di-unit-iss"
                  className="block text-xs font-medium text-gray-500"
                >
                  Unit <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAddingUnitIssuance((v) => !v)}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  New
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
                    className="px-3 py-2 bg-linear-to-r from-teal-500 to-cyan-600 text-white rounded-xl text-sm font-medium hover:from-teal-600 hover:to-cyan-700 transition-all shadow-sm"
                  >
                    Save
                  </button>
                </div>
              )}
              <select
                id="di-unit-iss"
                className={selectClass}
                value={unitIssuanceId}
                onChange={(e) => {
                  onUnitIssuanceIdChange(e.target.value);
                  setMlPerBottle("");
                }}
              >
                <option value="">Select unit...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="di-rate"
                className="block text-xs font-medium text-gray-500 mb-1.5"
              >
                Issuance Rate <span className="text-red-400">*</span>
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
              <p className="text-[11px] text-gray-400">
                Units per 1 delivery unit
              </p>
            </div>
          </div>

          {/* mL per Bottle — shown only when issuance unit is a bottle */}
          {isBottleUnit && (
            <div className="mt-3">
              <label
                htmlFor="di-ml-per-bottle"
                className="block text-xs font-medium text-gray-500 mb-1.5"
              >
                mL per Bottle
              </label>
              <input
                id="di-ml-per-bottle"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="e.g. 500"
                value={mlPerBottle}
                onChange={(e) => setMlPerBottle(e.target.value)}
              />
              <p className="text-[11px] text-gray-400">
                Volume per bottle in mL (for reference)
              </p>
            </div>
          )}
        </div>

        {/* Computed preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              Computed Preview
            </h3>
          </div>
          <div className="bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Price</span>
              <span className="font-semibold text-gray-800">
                ₱{fmt(totalPrice)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Qty (Issuance)</span>
              <span className="font-semibold text-gray-800">
                {fmt(qtyIssuance)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Unit Price (Issuance)</span>
              <span className="font-semibold text-gray-800">
                ₱{fmt(unitPriceIssuance)}
              </span>
            </div>
            {isBottleUnit && mlPerBottleNum > 0 && (
              <div className="flex justify-between text-sm border-t border-emerald-200/60 pt-2 mt-2">
                <span className="text-gray-500">Total mL</span>
                <span className="font-semibold text-gray-800">
                  {totalMl.toLocaleString()} mL
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="di-status"
            className="block text-xs font-medium text-gray-500 mb-1.5"
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

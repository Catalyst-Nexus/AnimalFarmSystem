import {
  Package,
  User,
  FileText,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { BaseDialog } from "@/components/ui/dialog";
import type { DeliveryItem } from "@/services/inventoryService";

interface RequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  deliveryItems: DeliveryItem[];
  // form fields
  deliveryItemId: string;
  onDeliveryItemIdChange: (val: string) => void;
  requestedQuantity: string;
  onRequestedQuantityChange: (val: string) => void;
  requestedBy: string;
  onRequestedByChange: (val: string) => void;
  purpose: string;
  onPurposeChange: (val: string) => void;
  notes: string;
  onNotesChange: (val: string) => void;
}

export default function RequestDialog({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  deliveryItems,
  deliveryItemId,
  onDeliveryItemIdChange,
  requestedQuantity,
  onRequestedQuantityChange,
  requestedBy,
  onRequestedByChange,
  purpose,
  onPurposeChange,
  notes,
  onNotesChange,
}: RequestDialogProps) {
  const selectedItem = deliveryItems.find((i) => i.id === deliveryItemId);
  const unitName = selectedItem?.unit_delivery?.name || "";
  const available = selectedItem?.quantity_delivery ?? 0;

  const inputClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all";
  const selectClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-gray-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all";

  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Group delivery items by category for easier selection
  const activeItems = deliveryItems.filter((i) => i.status === "active");
  const exceeds = selectedItem && Number(requestedQuantity) > available;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="New Stock Request"
      onSubmit={onSubmit}
      submitLabel="Submit Request"
      isLoading={isLoading}
    >
      <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
        {/* Section 1: Select Item */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-teal-100 rounded-lg">
              <Package className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Select Item</h3>
          </div>
          <select
            id="req-item"
            className={selectClass}
            value={deliveryItemId}
            onChange={(e) => onDeliveryItemIdChange(e.target.value)}
          >
            <option value="">Choose a delivery item...</option>
            {activeItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.category?.name ? `[${item.category.name}] ` : ""}
                {item.description || "No description"} —{" "}
                {fmt(item.quantity_delivery)} {item.unit_delivery?.name || ""}{" "}
                available
              </option>
            ))}
          </select>
        </div>

        {/* Selected item details card */}
        {selectedItem && (
          <div className="bg-linear-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
              <p className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
                Item Details
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/80 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                  Category
                </p>
                <p className="text-xs font-semibold text-gray-800">
                  {selectedItem.category?.name || "—"}
                </p>
              </div>
              <div className="bg-white/80 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                  Brand
                </p>
                <p className="text-xs font-semibold text-gray-800">
                  {selectedItem.brand?.name || "—"}
                </p>
              </div>
              <div className="bg-white/80 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                  Available
                </p>
                <p className="text-xs font-bold text-teal-700">
                  {fmt(available)} {unitName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Quantity */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-violet-100 rounded-lg">
              <ChevronRight className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              Quantity{" "}
              {unitName && (
                <span className="text-gray-400 font-normal">({unitName})</span>
              )}
            </h3>
          </div>
          <input
            id="req-qty"
            type="number"
            min="0"
            step="0.01"
            className={`${inputClass} ${exceeds ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
            placeholder="Enter quantity needed..."
            value={requestedQuantity}
            onChange={(e) => onRequestedQuantityChange(e.target.value)}
          />
          {exceeds && (
            <div className="flex items-center gap-1.5 mt-2 text-red-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              <p className="text-xs font-medium">
                Exceeds available stock ({fmt(available)} {unitName})
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Requestor Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-sky-100 rounded-lg">
              <User className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              Requestor Info
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="req-by"
                className="block text-xs font-medium text-gray-500 mb-1.5"
              >
                Requested By <span className="text-red-400">*</span>
              </label>
              <input
                id="req-by"
                type="text"
                className={inputClass}
                placeholder="e.g. Feeding Station A"
                value={requestedBy}
                onChange={(e) => onRequestedByChange(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="req-purpose"
                className="block text-xs font-medium text-gray-500 mb-1.5"
              >
                Purpose
              </label>
              <input
                id="req-purpose"
                type="text"
                className={inputClass}
                placeholder="e.g. Daily feeding ration"
                value={purpose}
                onChange={(e) => onPurposeChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Notes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              Additional Notes
            </h3>
          </div>
          <textarea
            id="req-notes"
            className={`${inputClass} resize-none`}
            rows={2}
            placeholder="Any special instructions or notes..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>
    </BaseDialog>
  );
}

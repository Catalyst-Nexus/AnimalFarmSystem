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
    "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success";
  const selectClass =
    "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success";

  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Group delivery items by category for easier selection
  const activeItems = deliveryItems.filter((i) => i.status === "active");

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="New Stock Request"
      onSubmit={onSubmit}
      submitLabel="Submit Request"
      isLoading={isLoading}
    >
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {/* Delivery Item */}
        <div className="space-y-1.5">
          <label
            htmlFor="req-item"
            className="block text-sm font-medium text-foreground"
          >
            Delivery Item <span className="text-error ml-1">*</span>
          </label>
          <select
            id="req-item"
            className={selectClass}
            value={deliveryItemId}
            onChange={(e) => onDeliveryItemIdChange(e.target.value)}
          >
            <option value="">Select an item...</option>
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

        {/* Selected item info */}
        {selectedItem && (
          <div className="bg-background border border-border rounded-lg p-3 space-y-1">
            <p className="text-xs font-semibold text-muted uppercase mb-2">
              Item Details
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Category</span>
              <span className="text-foreground">
                {selectedItem.category?.name || "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Brand</span>
              <span className="text-foreground">
                {selectedItem.brand?.name || "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Available Stock</span>
              <span className="text-foreground font-medium">
                {fmt(available)} {unitName}
              </span>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-1.5">
          <label
            htmlFor="req-qty"
            className="block text-sm font-medium text-foreground"
          >
            Requested Quantity {unitName && `(${unitName})`}{" "}
            <span className="text-error ml-1">*</span>
          </label>
          <input
            id="req-qty"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            placeholder="e.g. 2"
            value={requestedQuantity}
            onChange={(e) => onRequestedQuantityChange(e.target.value)}
          />
          {selectedItem && Number(requestedQuantity) > available && (
            <p className="text-xs text-danger">
              Exceeds available stock ({fmt(available)} {unitName})
            </p>
          )}
        </div>

        {/* Requested By */}
        <div className="space-y-1.5">
          <label
            htmlFor="req-by"
            className="block text-sm font-medium text-foreground"
          >
            Requested By <span className="text-error ml-1">*</span>
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

        {/* Purpose */}
        <div className="space-y-1.5">
          <label
            htmlFor="req-purpose"
            className="block text-sm font-medium text-foreground"
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

        {/* Notes */}
        <div className="space-y-1.5">
          <label
            htmlFor="req-notes"
            className="block text-sm font-medium text-foreground"
          >
            Notes
          </label>
          <textarea
            id="req-notes"
            className={`${inputClass} resize-none`}
            rows={2}
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>
    </BaseDialog>
  );
}

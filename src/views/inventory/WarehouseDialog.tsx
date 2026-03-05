import { BaseDialog } from "@/components/ui/dialog";
import type { Item } from "@/services/inventoryService";

interface WarehouseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  items: Item[];
  selectedItemId: string;
  onItemIdChange: (val: string) => void;
  sacks: string;
  onSacksChange: (val: string) => void;
  cost: string;
  onCostChange: (val: string) => void;
  batchNo: string;
  onBatchNoChange: (val: string) => void;
  expiryDate: string;
  onExpiryDateChange: (val: string) => void;
  notes: string;
  onNotesChange: (val: string) => void;
  editMode?: boolean;
  isLoading?: boolean;
}

export default function WarehouseDialog({
  open,
  onClose,
  onSubmit,
  items,
  selectedItemId,
  onItemIdChange,
  sacks,
  onSacksChange,
  cost,
  onCostChange,
  batchNo,
  onBatchNoChange,
  expiryDate,
  onExpiryDateChange,
  notes,
  onNotesChange,
  editMode = false,
  isLoading = false,
}: WarehouseDialogProps) {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? "Edit Warehouse Entry" : "Add to Warehouse"}
      onSubmit={onSubmit}
      submitLabel={editMode ? "Save Changes" : "Add Entry"}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="wh-item"
            className="block text-sm font-medium text-foreground"
          >
            Item <span className="text-error ml-1">*</span>
          </label>
          <select
            id="wh-item"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={selectedItemId}
            onChange={(e) => onItemIdChange(e.target.value)}
          >
            <option value="">-- Select an item --</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_name} ({item.category || "Uncategorized"})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="wh-sacks"
              className="block text-sm font-medium text-foreground"
            >
              Number of Sacks <span className="text-error ml-1">*</span>
            </label>
            <input
              id="wh-sacks"
              type="number"
              min="0"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
              placeholder="e.g. 10"
              value={sacks}
              onChange={(e) => onSacksChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="wh-cost"
              className="block text-sm font-medium text-foreground"
            >
              Cost (₱) <span className="text-error ml-1">*</span>
            </label>
            <input
              id="wh-cost"
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
              placeholder="e.g. 5000"
              value={cost}
              onChange={(e) => onCostChange(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="wh-batch"
              className="block text-sm font-medium text-foreground"
            >
              Batch No.
            </label>
            <input
              id="wh-batch"
              type="text"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
              placeholder="e.g. BATCH-001"
              value={batchNo}
              onChange={(e) => onBatchNoChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="wh-expiry"
              className="block text-sm font-medium text-foreground"
            >
              Expiry Date
            </label>
            <input
              id="wh-expiry"
              type="date"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={expiryDate}
              onChange={(e) => onExpiryDateChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="wh-notes"
            className="block text-sm font-medium text-foreground"
          >
            Notes
          </label>
          <textarea
            id="wh-notes"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success resize-none"
            rows={2}
            placeholder="Purchase remarks..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>
    </BaseDialog>
  );
}

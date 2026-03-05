import { BaseDialog } from "@/components/ui/dialog";
import type { Item } from "@/services/inventoryService";

interface StorageDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  items: Item[];
  selectedItemId: string;
  onItemIdChange: (val: string) => void;
  remKg: string;
  onRemKgChange: (val: string) => void;
  isOpen: boolean;
  onIsOpenChange: (val: boolean) => void;
  location: string;
  onLocationChange: (val: string) => void;
  editMode?: boolean;
  isLoading?: boolean;
}

export default function StorageDialog({
  open,
  onClose,
  onSubmit,
  items,
  selectedItemId,
  onItemIdChange,
  remKg,
  onRemKgChange,
  isOpen,
  onIsOpenChange,
  location,
  onLocationChange,
  editMode = false,
  isLoading = false,
}: StorageDialogProps) {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? "Edit Storage Entry" : "Add to Storage"}
      onSubmit={onSubmit}
      submitLabel={editMode ? "Save Changes" : "Add Entry"}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="st-item"
            className="block text-sm font-medium text-foreground"
          >
            Item <span className="text-error ml-1">*</span>
          </label>
          <select
            id="st-item"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={selectedItemId}
            onChange={(e) => onItemIdChange(e.target.value)}
          >
            <option value="">-- Select an item --</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_name} ({item.full_kg} {item.unit || "kg"}/sack)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="st-rem-kg"
              className="block text-sm font-medium text-foreground"
            >
              Remaining KG <span className="text-error ml-1">*</span>
            </label>
            <input
              id="st-rem-kg"
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
              placeholder="e.g. 45.5"
              value={remKg}
              onChange={(e) => onRemKgChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="st-location"
              className="block text-sm font-medium text-foreground"
            >
              Location
            </label>
            <input
              id="st-location"
              type="text"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
              placeholder="e.g. Rack A, Shelf 3"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="st-is-open"
            type="checkbox"
            className="w-4 h-4 rounded border-border text-success focus:ring-success"
            checked={isOpen}
            onChange={(e) => onIsOpenChange(e.target.checked)}
          />
          <label
            htmlFor="st-is-open"
            className="text-sm font-medium text-foreground"
          >
            Sack is Open
          </label>
        </div>
      </div>
    </BaseDialog>
  );
}

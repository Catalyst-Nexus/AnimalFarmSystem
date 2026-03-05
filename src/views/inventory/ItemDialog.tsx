import { BaseDialog, FormInput } from "@/components/ui/dialog";
import { ITEM_CATEGORIES } from "@/services/inventoryService";

interface ItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  itemName: string;
  onItemNameChange: (val: string) => void;
  fullKg: string;
  onFullKgChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  supplier: string;
  onSupplierChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  unit: string;
  onUnitChange: (val: string) => void;
  editMode?: boolean;
  isLoading?: boolean;
}

export default function ItemDialog({
  open,
  onClose,
  onSubmit,
  itemName,
  onItemNameChange,
  fullKg,
  onFullKgChange,
  category,
  onCategoryChange,
  supplier,
  onSupplierChange,
  description,
  onDescriptionChange,
  unit,
  onUnitChange,
  editMode = false,
  isLoading = false,
}: ItemDialogProps) {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? "Edit Item" : "Add Item"}
      onSubmit={onSubmit}
      submitLabel={editMode ? "Save Changes" : "Add Item"}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <FormInput
          id="item-name"
          label="Item Name"
          value={itemName}
          onChange={onItemNameChange}
          placeholder="e.g. Pig Feed Premium"
          required
        />

        <div className="space-y-1.5">
          <label
            htmlFor="item-category"
            className="block text-sm font-medium text-foreground"
          >
            Category <span className="text-error ml-1">*</span>
          </label>
          <select
            id="item-category"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {ITEM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          id="item-supplier"
          label="Supplier"
          value={supplier}
          onChange={onSupplierChange}
          placeholder="e.g. AgriSupply Corp"
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="item-full-kg"
              className="block text-sm font-medium text-foreground"
            >
              Full KG per Sack <span className="text-error ml-1">*</span>
            </label>
            <input
              id="item-full-kg"
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
              placeholder="e.g. 50"
              value={fullKg}
              onChange={(e) => onFullKgChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="item-unit"
              className="block text-sm font-medium text-foreground"
            >
              Unit
            </label>
            <select
              id="item-unit"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={unit}
              onChange={(e) => onUnitChange(e.target.value)}
            >
              <option value="kg">kg</option>
              <option value="liters">liters</option>
              <option value="pcs">pcs</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="item-desc"
            className="block text-sm font-medium text-foreground"
          >
            Description
          </label>
          <textarea
            id="item-desc"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success resize-none"
            rows={2}
            placeholder="Brief description..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
      </div>
    </BaseDialog>
  );
}

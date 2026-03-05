import { BaseDialog } from "@/components/ui/dialog";
import type { Storage } from "@/services/inventoryService";

interface LogDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  storageEntries: Storage[];
  selectedStorageId: string;
  onStorageIdChange: (val: string) => void;
  usedKg: string;
  onUsedKgChange: (val: string) => void;
  spend: string;
  onSpendChange: (val: string) => void;
  purpose: string;
  onPurposeChange: (val: string) => void;
  isLoading?: boolean;
}

export default function LogDialog({
  open,
  onClose,
  onSubmit,
  storageEntries,
  selectedStorageId,
  onStorageIdChange,
  usedKg,
  onUsedKgChange,
  spend,
  onSpendChange,
  purpose,
  onPurposeChange,
  isLoading = false,
}: LogDialogProps) {
  const selectedStorage = storageEntries.find(
    (s) => s.id === selectedStorageId,
  );

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Add Log Entry"
      onSubmit={onSubmit}
      submitLabel="Add Log"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="log-storage"
            className="block text-sm font-medium text-foreground"
          >
            Storage Entry <span className="text-error ml-1">*</span>
          </label>
          <select
            id="log-storage"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={selectedStorageId}
            onChange={(e) => onStorageIdChange(e.target.value)}
          >
            <option value="">-- Select storage entry --</option>
            {storageEntries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.items?.item_name || "Unknown"} —{" "}
                {Number(s.rem_kg).toFixed(2)} kg remaining{" "}
                {s.is_open ? "(Open)" : "(Sealed)"}
                {s.location ? ` @ ${s.location}` : ""}
              </option>
            ))}
          </select>
          {selectedStorage && (
            <p className="text-xs text-muted mt-1">
              Available:{" "}
              <span className="font-semibold text-foreground">
                {Number(selectedStorage.rem_kg).toFixed(2)} kg
              </span>
              {selectedStorage.location && (
                <> · Location: {selectedStorage.location}</>
              )}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="log-used-kg"
              className="block text-sm font-medium text-foreground"
            >
              Used KG <span className="text-error ml-1">*</span>
            </label>
            <input
              id="log-used-kg"
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
              placeholder="e.g. 5"
              value={usedKg}
              onChange={(e) => onUsedKgChange(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="log-spend"
              className="block text-sm font-medium text-foreground"
            >
              Spend (₱) <span className="text-error ml-1">*</span>
            </label>
            <input
              id="log-spend"
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
              placeholder="e.g. 250"
              value={spend}
              onChange={(e) => onSpendChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="log-purpose"
            className="block text-sm font-medium text-foreground"
          >
            Purpose
          </label>
          <input
            id="log-purpose"
            type="text"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder="e.g. Feeding cage 1, Medication for pen 3..."
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value)}
          />
        </div>
      </div>
    </BaseDialog>
  );
}

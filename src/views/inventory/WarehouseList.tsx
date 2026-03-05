import { useState, useMemo } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
import { IconButton } from "@/components/ui";
import type { Warehouse } from "@/services/inventoryService";

interface WarehouseListProps {
  entries: Warehouse[];
  search: string;
  onSearchChange: (val: string) => void;
  onEdit: (entry: Warehouse) => void;
  onDelete: (id: string) => void;
}

export default function WarehouseList({
  entries,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: WarehouseListProps) {
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = [...entries];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.items?.item_name?.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      const nameA = a.items?.item_name || "";
      const nameB = b.items?.item_name || "";
      const cmp = nameA.localeCompare(nameB);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [entries, search, sortDir]);

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="relative w-64 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
          placeholder="Search warehouse..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th
                className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border cursor-pointer select-none"
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
              >
                Item {sortDir === "asc" ? "↑" : "↓"}
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Sacks
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Cost
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Batch No.
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Expiry
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Created
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-8">
                  No warehouse entries found.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-background transition-colors"
                >
                  <td className="px-4 py-3 border-b border-border/50 font-medium text-foreground">
                    {entry.items?.item_name || "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground">
                    {entry.sacks}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground">
                    ₱
                    {Number(entry.cost).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-muted">
                    {entry.batch_no || "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-muted">
                    {entry.expiry_date
                      ? new Date(entry.expiry_date).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "short", day: "numeric" },
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-muted">
                    {new Date(entry.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton onClick={() => onEdit(entry)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        onClick={() => onDelete(entry.id)}
                        title="Delete"
                        variant="danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted mt-3">
        Showing {filtered.length} of {entries.length} entries
      </div>
    </div>
  );
}

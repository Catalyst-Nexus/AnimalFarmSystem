import { useState, useMemo } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
import { IconButton } from "@/components/ui";
import type { Item } from "@/services/inventoryService";

interface ItemsListProps {
  items: Item[];
  search: string;
  onSearchChange: (val: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

export default function ItemsList({
  items,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: ItemsListProps) {
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.item_name.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.supplier?.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      const cmp = a.item_name.localeCompare(b.item_name);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [items, search, sortDir]);

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      {/* Search */}
      <div className="relative w-64 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
          placeholder="Search items..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Table */}
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
                Item Name {sortDir === "asc" ? "↑" : "↓"}
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Category
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Supplier
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Full KG / Sack
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Unit
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
                  No items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-background transition-colors"
                >
                  <td className="px-4 py-3 border-b border-border/50 font-medium text-foreground">
                    {item.item_name}
                    {item.description && (
                      <p className="text-xs text-muted mt-0.5 truncate max-w-[200px]">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground">
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                      {item.category || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground">
                    {item.supplier || "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground">
                    {item.full_kg} {item.unit || "kg"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-muted">
                    {item.unit || "kg"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-muted">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton onClick={() => onEdit(item)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        onClick={() => onDelete(item.id)}
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
        Showing {filtered.length} of {items.length} items
      </div>
    </div>
  );
}

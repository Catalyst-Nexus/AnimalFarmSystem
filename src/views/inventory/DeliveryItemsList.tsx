import { useState, useMemo } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
import { IconButton } from "@/components/ui";
import type { DeliveryItem } from "@/services/inventoryService";

interface DeliveryItemsListProps {
  items: DeliveryItem[];
  search: string;
  onSearchChange: (val: string) => void;
  onEdit: (item: DeliveryItem) => void;
  onDelete: (id: string) => void;
}

export default function DeliveryItemsList({
  items,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: DeliveryItemsListProps) {
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.description?.toLowerCase().includes(q) ||
          i.category?.name?.toLowerCase().includes(q) ||
          i.brand?.name?.toLowerCase().includes(q) ||
          i.delivery_receipt?.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortDir === "asc" ? dateA - dateB : dateB - dateA;
    });
    return result;
  }, [items, search, sortDir]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      {/* Search */}
      <div className="relative w-64 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
          placeholder="Search delivery items..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Category
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Description
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Brand
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Receipt
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Qty (Delivery)
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Unit Price
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Total Price
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Qty (Issuance)
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Status
              </th>
              <th
                className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border cursor-pointer select-none"
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
              >
                Date {sortDir === "asc" ? "↑" : "↓"}
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center text-muted py-8">
                  No delivery items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-background transition-colors"
                >
                  <td className="px-4 py-3 border-b border-border/50 text-foreground">
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                      {item.category?.name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 font-medium text-foreground max-w-[200px] truncate">
                    {item.description || "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground">
                    {item.brand?.name || "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-muted">
                    {item.delivery_receipt || "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground text-right">
                    {fmt(item.quantity_delivery)}{" "}
                    <span className="text-muted text-xs">
                      {item.unit_delivery?.name || ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground text-right">
                    ₱{fmt(item.unit_price_delivery)}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground text-right font-semibold">
                    ₱{fmt(item.total_price)}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground text-right">
                    {fmt(item.quantity_issuance)}{" "}
                    <span className="text-muted text-xs">
                      {item.unit_issuance?.name || ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                        item.status === "active"
                          ? "bg-success/10 text-success"
                          : item.status === "expired"
                            ? "bg-danger/10 text-danger"
                            : "bg-warning/10 text-warning"
                      }`}
                    >
                      {item.status}
                    </span>
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

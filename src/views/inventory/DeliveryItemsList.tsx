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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Search */}
      <div className="px-6 pt-5 pb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
            placeholder="Search delivery items..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-linear-to-r from-gray-50 to-gray-50/80">
              <th className="text-gray-500 font-semibold text-left px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Category
              </th>
              <th className="text-gray-500 font-semibold text-left px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Description
              </th>
              <th className="text-gray-500 font-semibold text-left px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Brand
              </th>
              <th className="text-gray-500 font-semibold text-left px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Receipt
              </th>
              <th className="text-gray-500 font-semibold text-right px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Qty (Delivery)
              </th>
              <th className="text-gray-500 font-semibold text-right px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Unit Price
              </th>
              <th className="text-gray-500 font-semibold text-right px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Total Price
              </th>
              <th className="text-gray-500 font-semibold text-right px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Qty (Issuance)
              </th>
              <th className="text-gray-500 font-semibold text-left px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Status
              </th>
              <th
                className="text-gray-500 font-semibold text-left px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
              >
                Date {sortDir === "asc" ? "↑" : "↓"}
              </th>
              <th className="text-gray-500 font-semibold text-right px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center text-gray-400 py-12">
                  No delivery items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/80 transition-colors duration-150"
                >
                  <td className="px-5 py-3.5 border-b border-gray-100 text-gray-700">
                    <span className="inline-block px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-600 font-medium">
                      {item.category?.name || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 border-b border-gray-100 font-medium text-gray-800 max-w-50 truncate">
                    {item.description || "—"}
                  </td>
                  <td className="px-5 py-3.5 border-b border-gray-100 text-gray-600">
                    {item.brand?.name || "—"}
                  </td>
                  <td className="px-5 py-3.5 border-b border-gray-100 text-gray-500">
                    {item.delivery_receipt || "—"}
                  </td>
                  <td className="px-5 py-3.5 border-b border-gray-100 text-gray-800 text-right">
                    {fmt(item.quantity_delivery)}{" "}
                    <span className="text-gray-400 text-xs">
                      {item.unit_delivery?.name || ""}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 border-b border-gray-100 text-gray-800 text-right">
                    ₱{fmt(item.unit_price_delivery)}
                  </td>
                  <td className="px-5 py-3.5 border-b border-gray-100 text-gray-800 text-right font-semibold">
                    ₱{fmt(item.total_price)}
                  </td>
                  <td className="px-5 py-3.5 border-b border-gray-100 text-gray-800 text-right">
                    {fmt(item.quantity_issuance)}{" "}
                    <span className="text-gray-400 text-xs">
                      {item.unit_issuance?.name || ""}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 border-b border-gray-100">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs rounded-full font-medium ${
                        item.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : item.status === "expired"
                            ? "bg-rose-50 text-rose-500"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 border-b border-gray-100 text-gray-500">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3.5 border-b border-gray-100">
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

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
        <span className="text-xs text-gray-500">
          Showing {filtered.length} of {items.length} items
        </span>
      </div>
    </div>
  );
}

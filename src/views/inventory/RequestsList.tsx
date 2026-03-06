import { useState, useMemo } from "react";
import { Check, X, Search } from "lucide-react";
import { IconButton } from "@/components/ui";
import type { StockTransaction } from "@/services/inventoryService";

interface RequestsListProps {
  requests: StockTransaction[];
  search: string;
  onSearchChange: (val: string) => void;
  onApprove: (req: StockTransaction) => void;
  onReject: (req: StockTransaction) => void;
}

export default function RequestsList({
  requests,
  search,
  onSearchChange,
  onApprove,
  onReject,
}: RequestsListProps) {
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const filtered = useMemo(() => {
    let result = [...requests];
    if (filter !== "all") {
      result = result.filter((r) => r.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.delivery_item?.description?.toLowerCase().includes(q) ||
          r.delivery_item?.category?.name?.toLowerCase().includes(q) ||
          r.requested_by?.toLowerCase().includes(q) ||
          r.purpose?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [requests, search, filter]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const statusBadge = (status: string) => {
    const cls =
      status === "pending"
        ? "bg-warning/10 text-warning"
        : status === "approved"
          ? "bg-success/10 text-success"
          : "bg-danger/10 text-danger";
    return (
      <span
        className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${cls}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      {/* Filter chips + search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder="Search requests..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-background text-muted hover:text-foreground border border-border"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 && (
                <span className="ml-1 bg-warning/20 text-warning px-1.5 rounded-full">
                  {pendingCount}
                </span>
              )}
              {f === "approved" && approvedCount > 0 && (
                <span className="ml-1 bg-success/20 text-success px-1.5 rounded-full">
                  {approvedCount}
                </span>
              )}
              {f === "rejected" && rejectedCount > 0 && (
                <span className="ml-1 bg-danger/20 text-danger px-1.5 rounded-full">
                  {rejectedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Item
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Category
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Requested Qty
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Available Stock
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Requested By
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Purpose
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Status
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Date
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-muted py-8">
                  {requests.length === 0
                    ? "No stock requests yet. Requests appear here when the storage module submits them."
                    : "No requests match the current filter."}
                </td>
              </tr>
            ) : (
              filtered.map((req) => {
                const item = req.delivery_item;
                const unitName =
                  req.unit?.name || item?.unit_delivery?.name || "";
                return (
                  <tr
                    key={req.id}
                    className="hover:bg-background transition-colors"
                  >
                    <td className="px-4 py-3 border-b border-border/50">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">
                          {item?.description || "—"}
                        </span>
                        {item?.brand?.name && (
                          <span className="text-xs text-muted">
                            {item.brand.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-border/50">
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                        {item?.category?.name || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-border/50 text-foreground text-right font-semibold">
                      {fmt(req.quantity)}{" "}
                      <span className="text-muted text-xs">{unitName}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-border/50 text-foreground text-right">
                      {item ? fmt(item.quantity_delivery) : "—"}{" "}
                      <span className="text-muted text-xs">
                        {item?.unit_delivery?.name || ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-border/50 text-foreground">
                      {req.requested_by || "—"}
                    </td>
                    <td className="px-4 py-3 border-b border-border/50 text-muted max-w-37.5 truncate">
                      {req.purpose || "—"}
                    </td>
                    <td className="px-4 py-3 border-b border-border/50">
                      {statusBadge(req.status)}
                    </td>
                    <td className="px-4 py-3 border-b border-border/50 text-muted">
                      {new Date(req.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 border-b border-border/50">
                      <div className="flex items-center justify-end gap-1">
                        {req.status === "pending" && (
                          <>
                            <IconButton
                              onClick={() => onApprove(req)}
                              title="Approve — releases stock"
                            >
                              <Check className="w-4 h-4 text-success" />
                            </IconButton>
                            <IconButton
                              onClick={() => onReject(req)}
                              title="Reject"
                              variant="danger"
                            >
                              <X className="w-4 h-4" />
                            </IconButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted mt-3">
        Showing {filtered.length} of {requests.length} requests
      </div>
    </div>
  );
}

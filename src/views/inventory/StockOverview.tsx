import { useMemo, useState } from "react";
import {
  Search,
  AlertTriangle,
  XCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type {
  DeliveryItem,
  StockTransaction,
} from "@/services/inventoryService";

interface StockOverviewProps {
  items: DeliveryItem[];
  transactions: StockTransaction[];
}

type StockStatus = "consumed" | "critical" | "low" | "normal";

const STATUS_CONFIG: Record<
  StockStatus,
  {
    label: string;
    bar: string;
    badge: string;
    text: string;
    icon: React.ReactNode;
  }
> = {
  consumed: {
    label: "Consumed",
    bar: "bg-danger",
    badge: "bg-danger/10 text-danger",
    text: "text-danger",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  critical: {
    label: "Critical",
    bar: "bg-orange-500",
    badge: "bg-orange-500/10 text-orange-500",
    text: "text-orange-500",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  low: {
    label: "Low Stock",
    bar: "bg-warning",
    badge: "bg-warning/10 text-warning",
    text: "text-warning",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  normal: {
    label: "Normal",
    bar: "bg-success",
    badge: "bg-success/10 text-success",
    text: "text-success",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
};

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function getStockStatus(pct: number, remaining: number): StockStatus {
  if (remaining <= 0) return "consumed";
  if (pct <= 20) return "critical";
  if (pct <= 40) return "low";
  return "normal";
}

export default function StockOverview({
  items,
  transactions,
}: StockOverviewProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | StockStatus>("all");

  // Build computed stock data per delivery item
  const stockData = useMemo(() => {
    return items.map((item) => {
      const approvedTxns = transactions.filter(
        (t) => t.delivery_item_id === item.id && t.status === "approved",
      );
      const pendingTxns = transactions.filter(
        (t) => t.delivery_item_id === item.id && t.status === "pending",
      );

      const totalIssued = approvedTxns.reduce(
        (sum, t) => sum + (t.approved_quantity ?? t.quantity),
        0,
      );
      const totalIssuance = item.quantity_issuance;
      const remaining = Math.max(0, totalIssuance - totalIssued);
      const pct = totalIssuance > 0 ? (remaining / totalIssuance) * 100 : 0;
      const stockStatus = getStockStatus(pct, remaining);

      return {
        item,
        totalIssued,
        remaining,
        pct,
        stockStatus,
        approvedCount: approvedTxns.length,
        pendingCount: pendingTxns.length,
      };
    });
  }, [items, transactions]);

  // Filtered rows
  const filtered = useMemo(() => {
    let result = stockData;
    if (filter !== "all")
      result = result.filter((d) => d.stockStatus === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.item.description?.toLowerCase().includes(q) ||
          d.item.category?.name?.toLowerCase().includes(q) ||
          d.item.brand?.name?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [stockData, filter, search]);

  // Summary counts
  const counts = useMemo(
    () => ({
      consumed: stockData.filter((d) => d.stockStatus === "consumed").length,
      critical: stockData.filter((d) => d.stockStatus === "critical").length,
      low: stockData.filter((d) => d.stockStatus === "low").length,
      normal: stockData.filter((d) => d.stockStatus === "normal").length,
    }),
    [stockData],
  );

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      {/* ── Summary indicator chips ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        {(["normal", "low", "critical", "consumed"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <div
              key={s}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.badge}`}
            >
              {cfg.icon}
              {cfg.label}: {counts[s]}
            </div>
          );
        })}
      </div>

      {/* ── Search + filter controls ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "normal", "low", "critical", "consumed"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-background text-muted hover:text-foreground border border-border"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "low"
                    ? "Low Stock"
                    : f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== "all" && counts[f] > 0 && (
                  <span
                    className={`ml-1 px-1.5 rounded-full ${STATUS_CONFIG[f].badge}`}
                  >
                    {counts[f]}
                  </span>
                )}
              </button>
            ),
          )}
        </div>
      </div>

      {/* ── Table ── */}
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
                Original Stock
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Total Issued
              </th>
              <th className="bg-background text-muted font-semibold text-right px-4 py-3 border-b border-border">
                Remaining
              </th>
              <th className="bg-background text-muted font-semibold text-center px-4 py-3 border-b border-border">
                Stock Level
              </th>
              <th className="bg-background text-muted font-semibold text-center px-4 py-3 border-b border-border">
                Pending
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-8">
                  {items.length === 0
                    ? "No delivery items found."
                    : "No items match the current filter."}
                </td>
              </tr>
            ) : (
              filtered.map(
                ({
                  item,
                  totalIssued,
                  remaining,
                  pct,
                  stockStatus,
                  pendingCount,
                }) => {
                  const cfg = STATUS_CONFIG[stockStatus];
                  const issuanceUnit = item.unit_issuance?.name ?? "";
                  const deliveryUnit = item.unit_delivery?.name ?? "";
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-background transition-colors"
                    >
                      {/* Item */}
                      <td className="px-4 py-3 border-b border-border/50">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">
                            {item.description || "—"}
                          </span>
                          {item.brand?.name && (
                            <span className="text-xs text-muted">
                              {item.brand.name}
                            </span>
                          )}
                          {item.expiry_date && (
                            <span className="text-xs text-muted">
                              Exp:{" "}
                              {new Date(item.expiry_date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 border-b border-border/50">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                          {item.category?.name || "—"}
                        </span>
                      </td>

                      {/* Original stock — both delivery and issuance */}
                      <td className="px-4 py-3 border-b border-border/50 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-medium text-foreground">
                            {fmt(item.quantity_delivery)}{" "}
                            <span className="text-muted text-xs">
                              {deliveryUnit}
                            </span>
                          </span>
                          <span className="text-xs text-muted">
                            {fmt(item.quantity_issuance)} {issuanceUnit}
                          </span>
                        </div>
                      </td>

                      {/* Total issued */}
                      <td className="px-4 py-3 border-b border-border/50 text-right text-foreground">
                        {fmt(totalIssued)}{" "}
                        <span className="text-muted text-xs">
                          {issuanceUnit}
                        </span>
                      </td>

                      {/* Remaining — coloured by status */}
                      <td className="px-4 py-3 border-b border-border/50 text-right">
                        <span className={`font-semibold ${cfg.text}`}>
                          {fmt(remaining)}{" "}
                          <span className="text-xs font-normal text-muted">
                            {issuanceUnit}
                          </span>
                        </span>
                      </td>

                      {/* Stock level progress bar */}
                      <td className="px-4 py-3 border-b border-border/50">
                        <div className="flex flex-col items-center gap-1 min-w-28">
                          <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${cfg.bar}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Pending requests */}
                      <td className="px-4 py-3 border-b border-border/50 text-center">
                        {pendingCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium bg-warning/10 text-warning">
                            <AlertTriangle className="w-3 h-3" />
                            {pendingCount}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3 border-b border-border/50">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${cfg.badge}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                },
              )
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

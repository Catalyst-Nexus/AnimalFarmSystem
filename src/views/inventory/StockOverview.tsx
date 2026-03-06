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
    bar: "bg-rose-500",
    badge: "bg-rose-50 text-rose-600",
    text: "text-rose-600",
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
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-600",
    text: "text-amber-600",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  normal: {
    label: "Normal",
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
    text: "text-emerald-600",
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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* ── Summary indicator chips ── */}
      <div className="px-6 pt-5 pb-2 flex flex-wrap gap-3">
        {(["normal", "low", "critical", "consumed"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <div
              key={s}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium ${cfg.badge}`}
            >
              {cfg.icon}
              {cfg.label}: {counts[s]}
            </div>
          );
        })}
      </div>

      {/* ── Search + filter controls ── */}
      <div className="px-6 py-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "normal", "low", "critical", "consumed"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  filter === f
                    ? "bg-linear-to-r from-teal-500 to-cyan-600 text-white shadow-md"
                    : "bg-white text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400"
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
            <tr className="bg-linear-to-r from-gray-50 to-gray-50/80">
              <th className="text-gray-500 font-semibold text-left px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Item
              </th>
              <th className="text-gray-500 font-semibold text-left px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Category
              </th>
              <th className="text-gray-500 font-semibold text-right px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Original Stock
              </th>
              <th className="text-gray-500 font-semibold text-right px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Total Issued
              </th>
              <th className="text-gray-500 font-semibold text-right px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Remaining
              </th>
              <th className="text-gray-500 font-semibold text-center px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Stock Level
              </th>
              <th className="text-gray-500 font-semibold text-center px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Pending
              </th>
              <th className="text-gray-500 font-semibold text-left px-5 py-3.5 border-b border-gray-200 text-xs uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-12">
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
                      className="hover:bg-gray-50/80 transition-colors duration-150"
                    >
                      {/* Item */}
                      <td className="px-5 py-3.5 border-b border-gray-100">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-gray-800">
                            {item.description || "—"}
                          </span>
                          {item.brand?.name && (
                            <span className="text-xs text-gray-400">
                              {item.brand.name}
                            </span>
                          )}
                          {item.expiry_date && (
                            <span className="text-xs text-gray-400">
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
                      <td className="px-5 py-3.5 border-b border-gray-100">
                        <span className="inline-block px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-600 font-medium">
                          {item.category?.name || "—"}
                        </span>
                      </td>

                      {/* Original stock — both delivery and issuance */}
                      <td className="px-5 py-3.5 border-b border-gray-100 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-medium text-gray-800">
                            {fmt(item.quantity_delivery)}{" "}
                            <span className="text-gray-400 text-xs">
                              {deliveryUnit}
                            </span>
                          </span>
                          <span className="text-xs text-gray-400">
                            {fmt(item.quantity_issuance)} {issuanceUnit}
                          </span>
                        </div>
                      </td>

                      {/* Total issued */}
                      <td className="px-5 py-3.5 border-b border-gray-100 text-right text-gray-800">
                        {fmt(totalIssued)}{" "}
                        <span className="text-gray-400 text-xs">
                          {issuanceUnit}
                        </span>
                      </td>

                      {/* Remaining — coloured by status */}
                      <td className="px-5 py-3.5 border-b border-gray-100 text-right">
                        <span className={`font-semibold ${cfg.text}`}>
                          {fmt(remaining)}{" "}
                          <span className="text-xs font-normal text-gray-400">
                            {issuanceUnit}
                          </span>
                        </span>
                      </td>

                      {/* Stock level progress bar */}
                      <td className="px-5 py-3.5 border-b border-gray-100">
                        <div className="flex flex-col items-center gap-1 min-w-28">
                          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${cfg.bar}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Pending requests */}
                      <td className="px-5 py-3.5 border-b border-gray-100 text-center">
                        {pendingCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium bg-amber-50 text-amber-600">
                            <AlertTriangle className="w-3 h-3" />
                            {pendingCount}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-3.5 border-b border-gray-100">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium ${cfg.badge}`}
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

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
        <span className="text-xs text-gray-500">
          Showing {filtered.length} of {items.length} items
        </span>
      </div>
    </div>
  );
}

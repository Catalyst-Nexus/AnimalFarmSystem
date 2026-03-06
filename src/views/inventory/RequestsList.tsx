import { useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  Package,
  User,
  MessageSquare,
  Calendar,
  Filter,
  Inbox,
} from "lucide-react";
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

  const statusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          bg: "bg-amber-50 border-amber-200",
          text: "text-amber-700",
          badge: "bg-amber-100 text-amber-700 border border-amber-200",
          icon: <Clock className="w-3.5 h-3.5" />,
          dot: "bg-amber-400",
        };
      case "approved":
        return {
          bg: "bg-emerald-50 border-emerald-200",
          text: "text-emerald-700",
          badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          dot: "bg-emerald-400",
        };
      default:
        return {
          bg: "bg-red-50 border-red-200",
          text: "text-red-600",
          badge: "bg-red-100 text-red-600 border border-red-200",
          icon: <XCircle className="w-3.5 h-3.5" />,
          dot: "bg-red-400",
        };
    }
  };

  const FILTERS = [
    {
      key: "all" as const,
      label: "All",
      count: requests.length,
      color: "gray",
    },
    {
      key: "pending" as const,
      label: "Pending",
      count: pendingCount,
      color: "amber",
    },
    {
      key: "approved" as const,
      label: "Approved",
      count: approvedCount,
      color: "emerald",
    },
    {
      key: "rejected" as const,
      label: "Rejected",
      count: rejectedCount,
      color: "red",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all"
              placeholder="Search by item, category, requestor..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-400 mr-1" />
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  filter === f.key
                    ? "bg-linear-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-200/50"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      filter === f.key
                        ? "bg-white/25 text-white"
                        : "bg-white text-gray-500"
                    }`}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Request Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-100 rounded-2xl">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <p className="text-gray-500 font-medium">
            {requests.length === 0
              ? "No stock requests yet"
              : "No requests match your filter"}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {requests.length === 0
              ? "Requests will appear here when the storage module submits them."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((req) => {
            const item = req.delivery_item;
            const unitName = req.unit?.name || item?.unit_delivery?.name || "";
            const cfg = statusConfig(req.status);

            return (
              <div
                key={req.id}
                className={`group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}
              >
                {/* Status accent stripe */}
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${cfg.dot} rounded-l-2xl`}
                />

                <div className="pl-3">
                  {/* Top row: Item + Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 truncate">
                        {item?.description || "—"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {item?.category?.name && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-md bg-sky-50 text-sky-600 font-medium border border-sky-100">
                            {item.category.name}
                          </span>
                        )}
                        {item?.brand?.name && (
                          <span className="text-xs text-gray-400">
                            {item.brand.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg font-semibold capitalize ${cfg.badge}`}
                    >
                      {cfg.icon}
                      {req.status}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-500">Requested</span>
                      <span className="text-xs font-semibold text-gray-800 ml-auto">
                        {fmt(req.quantity)} {unitName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-500">Available</span>
                      <span className="text-xs font-medium text-gray-600 ml-auto">
                        {item ? fmt(item.quantity_delivery) : "—"}{" "}
                        {item?.unit_delivery?.name || ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-500">By</span>
                      <span className="text-xs font-medium text-gray-700 ml-auto truncate max-w-30">
                        {req.requested_by || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-500">Date</span>
                      <span className="text-xs font-medium text-gray-600 ml-auto">
                        {new Date(req.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Purpose */}
                  {req.purpose && (
                    <div className="flex items-start gap-2 mb-4 bg-gray-50 rounded-lg px-3 py-2">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {req.purpose}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {req.status === "pending" && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => onApprove(req)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-linear-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-semibold hover:from-emerald-600 hover:to-green-700 shadow-md shadow-emerald-200/50 transition-all duration-200"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(req)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-red-500 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer count */}
      <div className="text-center">
        <span className="text-xs text-gray-400">
          Showing {filtered.length} of {requests.length} requests
        </span>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { Trash2, Search } from "lucide-react";
import { IconButton } from "@/components/ui";
import type { Log } from "@/services/inventoryService";

interface LogsListProps {
  logs: Log[];
  search: string;
  onSearchChange: (val: string) => void;
  onDelete: (id: string) => void;
}

export default function LogsList({
  logs,
  search,
  onSearchChange,
  onDelete,
}: LogsListProps) {
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = [...logs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.storage?.items?.item_name?.toLowerCase().includes(q) ||
          (l.purpose && l.purpose.toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) => {
      const cmp =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [logs, search, sortDir]);

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="relative w-64 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Item
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Used KG
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Spend (₱)
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Purpose
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
                <td colSpan={6} className="text-center text-muted py-8">
                  No logs found.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-background transition-colors"
                >
                  <td className="px-4 py-3 border-b border-border/50 font-medium text-foreground">
                    {log.storage?.items?.item_name || "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground">
                    {Number(log.used_kg).toFixed(2)} kg
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-foreground">
                    ₱
                    {Number(log.spend).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-muted">
                    {log.purpose || "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50 text-muted">
                    {new Date(log.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        onClick={() => onDelete(log.id)}
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
        Showing {filtered.length} of {logs.length} logs
      </div>
    </div>
  );
}

import { useState } from "react";
import "./UserActivation.css";

// ─── Magic UI: ShineBorder (inline) ──────────────────────────────────────────
const ShineBorder = ({
  shineColor = ["#22c55e", "#16a34a"],
  borderWidth = 1,
  duration = 10,
}: {
  shineColor?: string | string[];
  borderWidth?: number;
  duration?: number;
}) => (
  <span
    className="ua-shine-border"
    style={{
      ["--border-width" as string]: `${borderWidth}px`,
      ["--duration" as string]: `${duration}s`,
      backgroundImage: `radial-gradient(transparent, transparent, ${
        Array.isArray(shineColor) ? shineColor.join(",") : shineColor
      }, transparent, transparent)`,
    }}
  />
);
// ─────────────────────────────────────────────────────────────────────────────

interface PendingUser {
  id: number;
  name: string;
  email: string;
  registeredDate: string;
  status: "pending" | "approved" | "rejected";
}

const UserActivation = () => {
  // TODO: Replace with API call to fetch pending users
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [search, setSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: "approve" | "reject" | null;
    user: PendingUser | null;
  }>({ open: false, action: null, user: null });

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPending = users.filter((u) => u.status === "pending").length;
  const totalApproved = users.filter((u) => u.status === "approved").length;
  const totalRejected = users.filter((u) => u.status === "rejected").length;

  const openConfirm = (action: "approve" | "reject", user: PendingUser) => {
    setConfirmModal({ open: true, action, user });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, action: null, user: null });
  };

  const handleConfirm = () => {
    if (!confirmModal.user || !confirmModal.action) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === confirmModal.user!.id
          ? {
              ...u,
              status:
                confirmModal.action === "approve" ? "approved" : "rejected",
            }
          : u,
      ),
    );
    closeConfirm();
  };

  return (
    <div className="ua-page">
      {/* Page Header */}
      <div className="ua-page-header">
        <h1 className="ua-page-title">User Activation</h1>
        <p className="ua-page-subtitle">
          Review and approve pending user registration requests
        </p>
      </div>

      {/* Stat Cards */}
      <div className="ua-stats-row">
        <div className="ua-stat-card">
          <ShineBorder shineColor={["#f59e0b", "#fbbf24"]} />
          <span className="ua-stat-label">Pending Requests</span>
          <span className="ua-stat-value ua-val-orange">{totalPending}</span>
        </div>
        <div className="ua-stat-card">
          <ShineBorder shineColor={["#22c55e", "#4ade80"]} />
          <span className="ua-stat-label">Approved</span>
          <span className="ua-stat-value ua-val-green">{totalApproved}</span>
        </div>
        <div className="ua-stat-card">
          <ShineBorder shineColor={["#ef4444", "#f87171"]} />
          <span className="ua-stat-label">Rejected</span>
          <span className="ua-stat-value ua-val-red">{totalRejected}</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ua-table-card">
        <ShineBorder duration={14} />

        <div className="ua-card-header">
          <h2 className="ua-card-title">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ marginRight: 8, verticalAlign: "middle" }}
            >
              <path
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 8v6M22 11h-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Pending User Requests
          </h2>
        </div>

        <div className="ua-search-row">
          <div className="ua-search-wrap">
            <svg
              className="ua-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m21 21-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              className="ua-search-input"
              placeholder="Search pending users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="ua-table-wrap">
          <table className="ua-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Status</th>
                <th className="ua-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="ua-empty-cell">
                    No pending user requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="ua-tr">
                    <td className="ua-td-name">{user.name}</td>
                    <td className="ua-td-email">{user.email}</td>
                    <td className="ua-td-date">{user.registeredDate}</td>
                    <td>
                      <span
                        className={`ua-status-badge ${
                          user.status === "pending"
                            ? "ua-badge-pending"
                            : user.status === "approved"
                              ? "ua-badge-approved"
                              : "ua-badge-rejected"
                        }`}
                      >
                        {user.status === "pending" && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M12 6v6l4 2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                        {user.status === "approved" && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M20 6 9 17l-5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        {user.status === "rejected" && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M18 6 6 18M6 6l12 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                        {user.status.charAt(0).toUpperCase() +
                          user.status.slice(1)}
                      </span>
                    </td>
                    <td className="ua-td-actions">
                      {user.status === "pending" ? (
                        <>
                          <button
                            className="ua-approve-btn"
                            onClick={() => openConfirm("approve", user)}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <circle
                                cx="9"
                                cy="7"
                                r="4"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M19 8v6M22 11h-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                            Approve
                          </button>
                          <button
                            className="ua-reject-btn"
                            onClick={() => openConfirm("reject", user)}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <circle
                                cx="9"
                                cy="7"
                                r="4"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M18 6 6 18M6 6l12 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="ua-td-processed">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal.open && confirmModal.user && (
        <div className="ua-modal-overlay" onClick={closeConfirm}>
          <div className="ua-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ua-modal-header">
              <h2 className="ua-modal-title">
                {confirmModal.action === "approve"
                  ? "Approve User"
                  : "Reject User"}
              </h2>
              <button
                className="ua-modal-close"
                onClick={closeConfirm}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6 6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="ua-modal-body">
              <p className="ua-modal-text">
                Are you sure you want to{" "}
                <strong>{confirmModal.action}</strong> the registration request
                for <strong>{confirmModal.user.name}</strong> (
                {confirmModal.user.email})?
              </p>
            </div>

            <div className="ua-modal-footer">
              <button className="ua-modal-cancel" onClick={closeConfirm}>
                Cancel
              </button>
              <button
                className={
                  confirmModal.action === "approve"
                    ? "ua-modal-confirm-approve"
                    : "ua-modal-confirm-reject"
                }
                onClick={handleConfirm}
              >
                {confirmModal.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivation;

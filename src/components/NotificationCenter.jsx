import React, { useState, useEffect } from "react";
import { API_BASE } from "../config";

const NotificationCenter = ({ isOpen, onClose, onMarkRead, onMarkAllRead, unreadCount, notifications, onRefresh }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`${API_BASE}/api/notifications?unreadOnly=false`)
        .then((r) => r.json())
        .then((data) => {
          setList(Array.isArray(data) ? data : []);
          if (onRefresh) onRefresh();
        })
        .catch(() => setList([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, onRefresh]);

  const handleMarkRead = (id) => {
    fetch(`${API_BASE}/api/notifications/${id}/read`, { method: "PATCH" })
      .then(() => {
        setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        if (onMarkRead) onMarkRead(id);
      })
      .catch(() => {});
  };

  const handleMarkAllRead = () => {
    fetch(`${API_BASE}/api/notifications/read-all`, { method: "PATCH" })
      .then(() => {
        setList((prev) => prev.map((n) => ({ ...n, read: true })));
        if (onMarkAllRead) onMarkAllRead();
      })
      .catch(() => {});
  };

  if (!isOpen) return null;

  const unread = list.filter((n) => !n.read);

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: "8px",
        width: "360px",
        maxWidth: "95vw",
        maxHeight: "400px",
        background: "var(--bg-secondary)",
        borderRadius: "8px",
        boxShadow: "0 4px 20px var(--shadow)",
        border: "1px solid var(--border-color)",
        overflow: "hidden",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ color: "var(--text-primary)" }}>Notifications</strong>
        {unread.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            style={{ fontSize: "12px", padding: "4px 8px", background: "var(--bg-tertiary)", border: "none", borderRadius: "4px", cursor: "pointer", color: "var(--text-primary)" }}
          >
            Mark all read
          </button>
        )}
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>Loading…</div>
        ) : list.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>No notifications</div>
        ) : (
          list.map((n) => (
            <div
              key={n.id}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-color)",
                background: n.read ? "transparent" : "var(--bg-tertiary)",
                cursor: "pointer"
              }}
              onClick={() => !n.read && handleMarkRead(n.id)}
            >
              <div style={{ fontWeight: n.read ? "normal" : "bold", fontSize: "14px", color: "var(--text-primary)" }}>{n.title}</div>
              {n.body && <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{n.body}</div>}
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;

import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:3050";

export default function DeadlinesView({ onRefresh }) {
  const [upcoming, setUpcoming] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchDeadlines();
  }, [days]);

  async function fetchDeadlines() {
    setLoading(true);
    try {
      const [upRes, overRes] = await Promise.all([
        fetch(`${API_BASE}/api/notes/upcoming-deadlines?days=${days}`),
        fetch(`${API_BASE}/api/notes/overdue`)
      ]);
      if (upRes.ok) setUpcoming(await upRes.json());
      else setUpcoming([]);
      if (overRes.ok) setOverdue(await overRes.json());
      else setOverdue([]);
    } catch (e) {
      console.error("Error fetching deadlines", e);
      setUpcoming([]);
      setOverdue([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateDeadlineStatus(noteId, status) {
    setUpdatingId(noteId);
    try {
      const res = await fetch(`${API_BASE}/api/notes/${noteId}/deadline-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchDeadlines();
        if (onRefresh) onRefresh();
      }
    } finally {
      setUpdatingId(null);
    }
  }

  const sectionStyle = {
    marginBottom: "24px",
    padding: "16px",
    background: "var(--bg-secondary)",
    borderRadius: "7px",
    boxShadow: "0 1px 5px var(--shadow)"
  };
  const cardStyle = {
    padding: "12px",
    marginBottom: "8px",
    background: "var(--bg-tertiary)",
    borderRadius: "4px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px"
  };
  const overdueCardStyle = { ...cardStyle, borderLeft: "4px solid #f44336" };

  return (
    <div style={{ width: "95%", maxWidth: "640px", margin: "20px auto" }}>
      <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>
        <span role="img" aria-label="Deadlines">📅</span> Deadlines
      </h2>

      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <label style={{ color: "var(--text-primary)" }}>Upcoming (days):</label>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ padding: "6px", fontSize: "14px" }}
        >
          <option value={7}>7</option>
          <option value={14}>14</option>
          <option value={30}>30</option>
        </select>
        <button
          type="button"
          onClick={fetchDeadlines}
          disabled={loading}
          style={{ padding: "6px 12px", background: "#f5ba13", color: "white", border: "none", borderRadius: "4px", cursor: loading ? "wait" : "pointer" }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)" }}>Loading…</div>
      ) : (
        <>
          <div style={sectionStyle}>
            <h3 style={{ color: "#f44336", marginBottom: "12px" }}>Overdue</h3>
            {overdue.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No overdue notes.</p>
            ) : (
              overdue.map((note) => (
                <div key={note._id || note.id} style={overdueCardStyle}>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>{note.title || "Untitled"}</strong>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Due: {note.deadline && note.deadline.date ? new Date(note.deadline.date).toLocaleString() : "—"}
                    </div>
                  </div>
                  <select
                    value={note.deadline?.status || "pending"}
                    onChange={(e) => updateDeadlineStatus(note._id || note.id, e.target.value)}
                    disabled={updatingId === (note._id || note.id)}
                    style={{ padding: "4px 8px", fontSize: "12px" }}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              ))
            )}
          </div>

          <div style={sectionStyle}>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "12px" }}>Upcoming</h3>
            {upcoming.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No upcoming deadlines.</p>
            ) : (
              upcoming.map((note) => (
                <div key={note._id || note.id} style={cardStyle}>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>{note.title || "Untitled"}</strong>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Due: {note.deadline && note.deadline.date ? new Date(note.deadline.date).toLocaleString() : "—"}
                    </div>
                  </div>
                  <select
                    value={note.deadline?.status || "pending"}
                    onChange={(e) => updateDeadlineStatus(note._id || note.id, e.target.value)}
                    disabled={updatingId === (note._id || note.id)}
                    style={{ padding: "4px 8px", fontSize: "12px" }}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

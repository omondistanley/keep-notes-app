import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

const IntegrationDashboard = () => {
  const [stats, setStats] = useState({
    totalNotes: 0,
    pinnedNotes: 0,
    archivedNotes: 0,
    trashedNotes: 0,
    notesByPriority: {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [allNotes, archived, trashed] = await Promise.all([
        fetch("http://localhost:3050/api/notes/GetNotes").then(r => r.json()),
        fetch("http://localhost:3050/api/notes/archived").then(r => r.json()),
        fetch("http://localhost:3050/api/notes/trash").then(r => r.json())
      ]);

      const pinned = allNotes.filter(n => n.isPinned).length;
      const byPriority = {
        urgent: allNotes.filter(n => n.priority === "urgent").length,
        high: allNotes.filter(n => n.priority === "high").length,
        medium: allNotes.filter(n => n.priority === "medium").length,
        low: allNotes.filter(n => n.priority === "low").length
      };

      setStats({
        totalNotes: allNotes.length,
        pinnedNotes: pinned,
        archivedNotes: archived.length,
        trashedNotes: trashed.length,
        notesByPriority: byPriority
      });
    } catch (error) {
      console.error("Error fetching stats", error);
    }
  }

  return (
    <div
      style={{
        width: "480px",
        margin: "20px auto",
        padding: "20px",
        background: "var(--bg-secondary)",
        borderRadius: "7px",
        boxShadow: "0 1px 5px var(--shadow)"
      }}
    >
      <h2 style={{ marginBottom: "20px", color: "var(--text-primary)" }}>Dashboard</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
        <div
          style={{
            padding: "15px",
            background: "var(--bg-tertiary)",
            borderRadius: "4px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2196F3" }}>
            {stats.totalNotes}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Total Notes</div>
        </div>

        <div
          style={{
            padding: "15px",
            background: "var(--bg-tertiary)",
            borderRadius: "4px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f5ba13" }}>
            {stats.pinnedNotes}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Pinned</div>
        </div>

        <div
          style={{
            padding: "15px",
            background: "var(--bg-tertiary)",
            borderRadius: "4px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ff9800" }}>
            {stats.archivedNotes}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Archived</div>
        </div>

        <div
          style={{
            padding: "15px",
            background: "var(--bg-tertiary)",
            borderRadius: "4px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#999" }}>
            {stats.trashedNotes}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Trashed</div>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3 style={{ marginBottom: "10px", fontSize: "16px", color: "var(--text-primary)" }}>
          Notes by Priority
        </h3>
        <div style={{ height: "220px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: "Urgent", count: stats.notesByPriority.urgent, fill: "#ff4444" },
                { name: "High", count: stats.notesByPriority.high, fill: "#ff8800" },
                { name: "Medium", count: stats.notesByPriority.medium, fill: "#ffbb33" },
                { name: "Low", count: stats.notesByPriority.low, fill: "#99cc00" }
              ]}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-primary)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--text-primary)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
                labelStyle={{ color: "var(--text-primary)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {[
                  { fill: "#ff4444" },
                  { fill: "#ff8800" },
                  { fill: "#ffbb33" },
                  { fill: "#99cc00" }
                ].map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-primary)" }}>Urgent</span>
            <span style={{ color: "#ff4444", fontWeight: "bold" }}>{stats.notesByPriority.urgent}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-primary)" }}>High</span>
            <span style={{ color: "#ff8800", fontWeight: "bold" }}>{stats.notesByPriority.high}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-primary)" }}>Medium</span>
            <span style={{ color: "#ffbb33", fontWeight: "bold" }}>{stats.notesByPriority.medium}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-primary)" }}>Low</span>
            <span style={{ color: "#99cc00", fontWeight: "bold" }}>{stats.notesByPriority.low}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDashboard;


import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Note: If react-datepicker CSS doesn't load, you may need to import it in index.js or App.jsx

const EnhancedNoteForm = ({ note = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: note?.title || "",
    content: note?.content || "",
    tags: note?.tags || [],
    priority: note?.priority || "medium",
    deadline: note?.deadline || null,
    news: {
      enabled: note?.news?.enabled || false,
      keywords: note?.news?.keywords || []
    },
    financial: {
      enabled: note?.financial?.enabled || false,
      type: note?.financial?.type || "stock",
      symbols: note?.financial?.symbols || []
    },
    social: {
      x: {
        enabled: note?.social?.x?.enabled || false,
        keywords: note?.social?.x?.keywords || []
      }
    }
  });

  const [activeTab, setActiveTab] = useState("basic");
  const [tagInput, setTagInput] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(
    note?.deadline?.date ? new Date(note.deadline.date) : null
  );

  const handleChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      deadline: deadlineDate ? {
        date: deadlineDate.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: "pending",
        reminder: {
          enabled: true,
          intervals: [1440, 60] // 1 day, 1 hour before
        }
      } : null
    };
    onSave(submitData);
  };

  return (
    <div style={{
      width: "600px",
      margin: "20px auto",
      background: "var(--bg-secondary)",
      borderRadius: "8px",
      boxShadow: "0 2px 8px var(--shadow)"
    }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)" }}>
        {["basic", "deadline", "news", "financial", "social"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 20px",
              background: activeTab === tab ? "var(--bg-tertiary)" : "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #f5ba13" : "2px solid transparent",
              cursor: "pointer",
              color: "var(--text-primary)",
              textTransform: "capitalize"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: "20px" }}>
        {activeTab === "basic" && (
          <div>
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)"
              }}
            />
            <textarea
              placeholder="Content"
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              rows="10"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)"
              }}
            />
            <div style={{ marginBottom: "10px" }}>
              <input
                type="text"
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTagAdd()}
                style={{
                  padding: "8px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)"
                }}
              />
              <button onClick={handleTagAdd} style={{ marginLeft: "5px", padding: "8px 12px" }}>
                Add
              </button>
            </div>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
              {formData.tags.map((tag, i) => (
                <span
                  key={i}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    tags: prev.tags.filter(t => t !== tag)
                  }))}
                  style={{
                    padding: "4px 8px",
                    background: "#f5ba13",
                    color: "white",
                    borderRadius: "12px",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  {tag} ×
                </span>
              ))}
            </div>
            <select
              value={formData.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              style={{
                padding: "8px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)"
              }}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        )}

        {activeTab === "deadline" && (
          <div>
            <label style={{ display: "block", marginBottom: "10px", color: "var(--text-primary)" }}>
              Deadline Date & Time
            </label>
            <DatePicker
              selected={deadlineDate}
              onChange={(date) => setDeadlineDate(date)}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              style={{ width: "100%", padding: "10px" }}
            />
          </div>
        )}

        {activeTab === "news" && (
          <div>
            <label style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
              <input
                type="checkbox"
                checked={formData.news.enabled}
                onChange={(e) => handleChange("news.enabled", e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              <span style={{ color: "var(--text-primary)" }}>Enable News Integration</span>
            </label>
            {formData.news.enabled && (
              <div>
                <input
                  type="text"
                  placeholder="Enter keywords (comma-separated)"
                  value={formData.news.keywords.join(", ")}
                  onChange={(e) => handleChange("news.keywords", e.target.value.split(",").map(k => k.trim()).filter(k => k))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "financial" && (
          <div>
            <label style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
              <input
                type="checkbox"
                checked={formData.financial.enabled}
                onChange={(e) => handleChange("financial.enabled", e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              <span style={{ color: "var(--text-primary)" }}>Enable Financial Tracking</span>
            </label>
            {formData.financial.enabled && (
              <div>
                <select
                  value={formData.financial.type}
                  onChange={(e) => handleChange("financial.type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)"
                  }}
                >
                  <option value="stock">Stocks</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="predictive">Predictive Markets</option>
                </select>
                <input
                  type="text"
                  placeholder="Symbols (comma-separated, e.g., AAPL,TSLA or BTC,ETH)"
                  value={formData.financial.symbols.join(",")}
                  onChange={(e) => handleChange("financial.symbols", e.target.value.split(",").map(s => s.trim().toUpperCase()).filter(s => s))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "social" && (
          <div>
            <label style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
              <input
                type="checkbox"
                checked={formData.social.x.enabled}
                onChange={(e) => handleChange("social.x.enabled", e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              <span style={{ color: "var(--text-primary)" }}>Enable X/Twitter Integration</span>
            </label>
            {formData.social.x.enabled && (
              <div>
                <input
                  type="text"
                  placeholder="Keywords to track (comma-separated)"
                  value={formData.social.x.keywords.join(", ")}
                  onChange={(e) => handleChange("social.x.keywords", e.target.value.split(",").map(k => k.trim()).filter(k => k))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "15px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            background: "#999",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          style={{
            padding: "8px 16px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {note ? "Update" : "Create"} Note
        </button>
      </div>
    </div>
  );
};

export default EnhancedNoteForm;


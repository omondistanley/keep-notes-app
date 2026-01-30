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
      },
      reddit: {
        enabled: note?.social?.reddit?.enabled || false,
        keywords: note?.social?.reddit?.keywords || note?.social?.x?.keywords || []
      }
    }
  });

  const [activeTab, setActiveTab] = useState("basic");
  const [tagInput, setTagInput] = useState("");
  const [newsKeywordInput, setNewsKeywordInput] = useState("");
  const [financialSymbolInput, setFinancialSymbolInput] = useState("");
  const [socialKeywordInput, setSocialKeywordInput] = useState("");
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

  const MAX_TAGS = 50;

  const handleTagAdd = () => {
    const v = tagInput.trim();
    if (!v) return;
    const toAdd = v.split(",").map(t => t.trim()).filter(Boolean).filter(t => !formData.tags.includes(t));
    if (toAdd.length && formData.tags.length < MAX_TAGS) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, ...toAdd].slice(0, MAX_TAGS)
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
            type="button"
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
              <span style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px", display: "block" }}>Tags</span>
              {formData.tags.length > 0 && (
                <ol style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "12px" }}>
                  {formData.tags.map((tag, i) => (
                    <li key={i} style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{tag}</span>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, idx) => idx !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: "14px" }} aria-label="Remove">×</button>
                    </li>
                  ))}
                </ol>
              )}
              {formData.tags.length < MAX_TAGS && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <input
                    type="text"
                    placeholder="Add one or more tags (comma-separated)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleTagAdd()}
                    style={{
                      flex: 1,
                      padding: "8px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "4px",
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)"
                    }}
                  />
                  <button type="button" onClick={handleTagAdd} style={{ padding: "8px 12px" }}>Add</button>
                </div>
              )}
              <span style={{ fontSize: "12px", color: "var(--text-secondary, #666)", marginTop: "4px", display: "block" }}>{formData.tags.length} / {MAX_TAGS} tags</span>
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
                {formData.news.keywords.length > 0 && (
                  <ol style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "12px" }}>
                    {formData.news.keywords.map((k, i) => (
                      <li key={i} style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{k}</span>
                        <button type="button" onClick={() => handleChange("news.keywords", formData.news.keywords.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: "14px" }} aria-label="Remove">×</button>
                      </li>
                    ))}
                  </ol>
                )}
                {formData.news.keywords.length < 50 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <input
                      type="text"
                      placeholder="Add keyword(s), comma-separated"
                      value={newsKeywordInput}
                      onChange={(e) => setNewsKeywordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = newsKeywordInput.trim(); if (v) { const toAdd = v.split(",").map(x => x.trim()).filter(Boolean).filter(x => !formData.news.keywords.includes(x)); handleChange("news.keywords", [...formData.news.keywords, ...toAdd].slice(0, 50)); setNewsKeywordInput(""); } } }}
                      style={{ flex: 1, padding: "10px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                    />
                    <button type="button" onClick={() => { const v = newsKeywordInput.trim(); if (v) { const toAdd = v.split(",").map(x => x.trim()).filter(Boolean).filter(x => !formData.news.keywords.includes(x)); handleChange("news.keywords", [...formData.news.keywords, ...toAdd].slice(0, 50)); setNewsKeywordInput(""); } }} style={{ padding: "8px 12px" }}>Add</button>
                  </div>
                )}
                <span style={{ fontSize: "12px", color: "var(--text-secondary, #666)", marginTop: "4px", display: "block" }}>{formData.news.keywords.length} / 50 keywords</span>
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
                {formData.financial.symbols.length > 0 && (
                  <ol style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "12px" }}>
                    {formData.financial.symbols.map((s, i) => (
                      <li key={i} style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{s}</span>
                        <button type="button" onClick={() => handleChange("financial.symbols", formData.financial.symbols.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: "14px" }} aria-label="Remove">×</button>
                      </li>
                    ))}
                  </ol>
                )}
                {formData.financial.symbols.length < 50 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <input
                      type="text"
                      placeholder="Add symbol(s), comma-separated (e.g. AAPL, TSLA or BTC, ETH)"
                      value={financialSymbolInput}
                      onChange={(e) => setFinancialSymbolInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = financialSymbolInput.trim(); if (v) { const toAdd = v.split(",").map(x => x.trim().toUpperCase()).filter(Boolean).filter(x => !formData.financial.symbols.includes(x)); handleChange("financial.symbols", [...formData.financial.symbols, ...toAdd].slice(0, 50)); setFinancialSymbolInput(""); } } }}
                      style={{ flex: 1, padding: "10px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                    />
                    <button type="button" onClick={() => { const v = financialSymbolInput.trim(); if (v) { const toAdd = v.split(",").map(x => x.trim().toUpperCase()).filter(Boolean).filter(x => !formData.financial.symbols.includes(x)); handleChange("financial.symbols", [...formData.financial.symbols, ...toAdd].slice(0, 50)); setFinancialSymbolInput(""); } }} style={{ padding: "8px 12px" }}>Add</button>
                  </div>
                )}
                <span style={{ fontSize: "12px", color: "var(--text-secondary, #666)", marginTop: "4px", display: "block" }}>{formData.financial.symbols.length} / 50 symbols</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "social" && (
          <div>
            <label style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
              <input type="checkbox" checked={formData.social.x.enabled} onChange={(e) => setFormData(prev => ({ ...prev, social: { ...prev.social, x: { ...prev.social.x, enabled: e.target.checked } } }))} style={{ marginRight: "8px" }} />
              <span style={{ color: "var(--text-primary)" }}><span role="img" aria-label="X Twitter">🐦</span> X / Twitter</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
              <input type="checkbox" checked={formData.social.reddit.enabled} onChange={(e) => setFormData(prev => ({ ...prev, social: { ...prev.social, reddit: { ...prev.social.reddit, enabled: e.target.checked } } }))} style={{ marginRight: "8px" }} />
              <span style={{ color: "var(--text-primary)" }}><span role="img" aria-label="Reddit">📱</span> Reddit</span>
            </label>
            {(formData.social.x.enabled || formData.social.reddit.enabled) && (
              <div>
                {((formData.social.x.keywords?.length || formData.social.reddit.keywords?.length) || 0) > 0 && (
                  <ol style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "12px" }}>
                    {(formData.social.x.keywords?.length ? formData.social.x.keywords : formData.social.reddit.keywords || []).map((k, i) => (
                      <li key={i} style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{k}</span>
                        <button type="button" onClick={() => { const kw = (formData.social.x.keywords?.length ? formData.social.x.keywords : formData.social.reddit.keywords).filter((_, idx) => idx !== i); setFormData(prev => ({ ...prev, social: { ...prev.social, x: { ...prev.social.x, keywords: kw }, reddit: { ...prev.social.reddit, keywords: kw } } })); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: "14px" }} aria-label="Remove">×</button>
                      </li>
                    ))}
                  </ol>
                )}
                {((formData.social.x.keywords?.length || formData.social.reddit.keywords?.length) || 0) < 50 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <input
                      type="text"
                      placeholder="Keywords for X & Reddit (comma-separated)"
                      value={socialKeywordInput}
                      onChange={(e) => setSocialKeywordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = socialKeywordInput.trim(); if (v) { const kw = formData.social.x.keywords?.length ? formData.social.x.keywords : (formData.social.reddit.keywords || []); const toAdd = v.split(",").map(x => x.trim()).filter(Boolean).filter(x => !kw.includes(x)); const next = [...kw, ...toAdd].slice(0, 50); setFormData(prev => ({ ...prev, social: { ...prev.social, x: { ...prev.social.x, keywords: next }, reddit: { ...prev.social.reddit, keywords: next } } })); setSocialKeywordInput(""); } } }}
                      style={{ flex: 1, padding: "10px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                    />
                    <button type="button" onClick={() => { const v = socialKeywordInput.trim(); if (v) { const kw = formData.social.x.keywords?.length ? formData.social.x.keywords : (formData.social.reddit.keywords || []); const toAdd = v.split(",").map(x => x.trim()).filter(Boolean).filter(x => !kw.includes(x)); const next = [...kw, ...toAdd].slice(0, 50); setFormData(prev => ({ ...prev, social: { ...prev.social, x: { ...prev.social.x, keywords: next }, reddit: { ...prev.social.reddit, keywords: next } } })); setSocialKeywordInput(""); } }} style={{ padding: "8px 12px" }}>Add</button>
                  </div>
                )}
                <span style={{ fontSize: "12px", color: "var(--text-secondary, #666)", marginTop: "4px", display: "block" }}>{(formData.social.x.keywords?.length || formData.social.reddit.keywords?.length || 0)} / 50 keywords (shared)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "15px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          type="button"
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
          type="button"
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


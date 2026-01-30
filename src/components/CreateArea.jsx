import React, { useState, useEffect, useCallback } from "react";

const DRAFT_STORAGE_KEY = "keep-notes-create-draft";

const buttonStyle = {
  position: "absolute",
  right: "18px",
  bottom: "-18px",
  background: "#f5ba13",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: "36px",
  height: "36px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
  cursor: "pointer",
  outline: "none"
};

const noteStyle = {
  width: "100%",
  border: "none",
  padding: "4px",
  outline: "none",
  fontSize: "1.2em",
  fontFamily: "inherit",
  resize: "none"
};

const noteFormat = {
  position: "relative",
  width: "480px",
  margin: "30px auto 20px auto",
  background: "#fff",
  padding: "15px",
  borderRadius: "7px",
  boxShadow: "0 1px 5px rgb(138, 137, 137)"
};

const emptyIntegrations = () => ({
  deadline: null,
  news: { enabled: false, keywords: [] },
  financial: { enabled: false, type: "crypto", symbols: [] },
  social: { x: { enabled: false, keywords: [] } }
});

function readDraftFromStorage() {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d && typeof d === "object") {
      return {
        note: {
          title: d.note?.title ?? "",
          content: d.note?.content ?? "",
          tags: Array.isArray(d.note?.tags) ? d.note.tags : [],
          priority: d.note?.priority ?? "medium"
        },
        showIntegrations: Boolean(d.showIntegrations),
        integrations: d.integrations && typeof d.integrations === "object"
          ? {
              deadline: d.integrations.deadline ?? null,
              news: {
                enabled: Boolean(d.integrations.news?.enabled),
                keywords: Array.isArray(d.integrations.news?.keywords) ? d.integrations.news.keywords : []
              },
              financial: {
                enabled: Boolean(d.integrations.financial?.enabled),
                type: d.integrations.financial?.type ?? "crypto",
                symbols: Array.isArray(d.integrations.financial?.symbols) ? d.integrations.financial.symbols : []
              },
              social: {
                x: {
                  enabled: Boolean(d.integrations.social?.x?.enabled),
                  keywords: Array.isArray(d.integrations.social?.x?.keywords) ? d.integrations.social.x.keywords : []
                }
              }
            }
          : emptyIntegrations()
      };
    }
  } catch (_) {}
  return null;
}

function CreateArea(props) {
  const [initialDraft] = useState(() => readDraftFromStorage());
  const [note, setNote] = useState(initialDraft?.note ?? {
    title: "",
    content: "",
    tags: [],
    priority: "medium"
  });
  const [tagInput, setTagInput] = useState("");
  const [showIntegrations, setShowIntegrations] = useState(initialDraft?.showIntegrations ?? false);
  const [integrations, setIntegrations] = useState(initialDraft?.integrations ?? emptyIntegrations());
  const [newsKeywordInput, setNewsKeywordInput] = useState("");
  const [financialSymbolInput, setFinancialSymbolInput] = useState("");
  const [socialKeywordInput, setSocialKeywordInput] = useState("");

  // Persist draft so it survives remounts and page reloads
  useEffect(() => {
    const hasContent = note.title.trim() || note.content.trim() || note.tags.length > 0 || showIntegrations;
    if (!hasContent) return;
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      note,
      showIntegrations,
      integrations
    }));
  }, [note, showIntegrations, integrations]);

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setNote((prevNote) => {
      return {
        ...prevNote,
        [name]: value
      };
    });
  }

  const MAX_TAGS = 50;

  function handleTagInputKeyDown(event) {
    if (event.key === "Enter" && tagInput.trim()) {
      event.preventDefault();
      const toAdd = tagInput.trim().split(",").map(t => t.trim()).filter(Boolean).filter(t => !note.tags.includes(t));
      if (toAdd.length && note.tags.length < MAX_TAGS) {
        setNote((prevNote) => ({
          ...prevNote,
          tags: [...prevNote.tags, ...toAdd].slice(0, MAX_TAGS)
        }));
      }
      setTagInput("");
    } else if (event.key === "Backspace" && !tagInput && note.tags.length > 0) {
      setNote((prevNote) => ({
        ...prevNote,
        tags: prevNote.tags.slice(0, -1)
      }));
    }
  }

  function removeTag(tagToRemove) {
    setNote((prevNote) => ({
      ...prevNote,
      tags: prevNote.tags.filter(tag => tag !== tagToRemove)
    }));
  }

  function submitNote(event) {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    const payload = { ...note };
    if (showIntegrations) {
      if (integrations.deadline) {
        payload.deadline = {
          date: new Date(integrations.deadline).toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          status: "pending",
          reminder: { enabled: true, intervals: [1440, 60] }
        };
      }
      if (integrations.news.enabled && integrations.news.keywords.length) {
        payload.news = {
          enabled: true,
          keywords: integrations.news.keywords
        };
      }
      if (integrations.financial.enabled && integrations.financial.symbols.length) {
        payload.financial = {
          enabled: true,
          type: integrations.financial.type,
          symbols: integrations.financial.symbols
        };
      }
      if (integrations.social.x.enabled && integrations.social.x.keywords.length) {
        payload.social = {
          x: {
            enabled: true,
            keywords: integrations.social.x.keywords
          }
        };
      }
    }
    clearDraft();
    props.onAdd(payload);
    setNote({ title: "", content: "", tags: [], priority: "medium" });
    setTagInput("");
    setIntegrations(emptyIntegrations());
  }

  return (
    <div style={noteFormat}>
      {/* Form: only fields that can trigger submit. Integrations are outside so they never submit. */}
      <form onSubmit={submitNote} style={{ margin: 0, padding: 0 }}>
        <input
          name="title"
          onChange={handleChange}
          style={noteStyle}
          value={note.title}
          placeholder="Title"
        />
        <textarea
          name="content"
          onChange={handleChange}
          style={noteStyle}
          value={note.content}
          placeholder="Take a note..."
          rows="3"
        />
        
        {/* Tags — numbered list, up to 50 */}
        <div style={{ marginTop: "10px", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px", display: "block" }}>Tags</span>
          {note.tags.length > 0 && (
            <ol style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "12px" }}>
              {note.tags.map((tag, index) => (
                <li key={index} style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{tag}</span>
                  <button type="button" onClick={() => removeTag(tag)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: "14px" }} aria-label="Remove">×</button>
                </li>
              ))}
            </ol>
          )}
          {note.tags.length < MAX_TAGS && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add one or more (comma-separated), then Enter or Add"
                style={{ flex: 1, maxWidth: "280px", padding: "6px 8px", fontSize: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
              <button type="button" onClick={() => { const v = tagInput.trim(); if (v) { const toAdd = v.split(",").map(t => t.trim()).filter(Boolean).filter(t => !note.tags.includes(t)); setNote(prev => ({ ...prev, tags: [...prev.tags, ...toAdd].slice(0, MAX_TAGS) })); setTagInput(""); } }} style={{ padding: "6px 10px", fontSize: "12px" }}>Add</button>
            </div>
          )}
          <span style={{ fontSize: "11px", color: "#666", marginTop: "4px", display: "block" }}>{note.tags.length} / {MAX_TAGS} tags</span>
        </div>

        {/* Priority Selector */}
        <div style={{ marginTop: "10px", marginBottom: "10px" }}>
          <label style={{ fontSize: "12px", marginRight: "8px" }}>Priority: </label>
          <select
            name="priority"
            value={note.priority}
            onChange={handleChange}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <button type="submit" style={buttonStyle}>
          Add
        </button>
      </form>

      {/* Integrations: OUTSIDE the form so toggling/checking never submits or refreshes */}
      <div style={{ marginTop: "10px", marginBottom: "10px" }}>
        <button
          type="button"
          onClick={() => setShowIntegrations(!showIntegrations)}
          style={{
            fontSize: "12px",
            padding: "6px 10px",
            background: showIntegrations ? "#e6b800" : "#f0f0f0",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {showIntegrations ? "▼" : "▶"} Integrations (deadline, news, financial, social)
        </button>
        {showIntegrations && (
          <div
            role="group"
            aria-label="Integrations options"
            style={{ marginTop: "10px", padding: "10px", background: "#f9f9f9", borderRadius: "4px", fontSize: "12px" }}
          >
            {/* Deadline */}
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "4px" }}><span role="img" aria-label="calendar">📅</span> Deadline (optional)</label>
              <input
                type="datetime-local"
                value={integrations.deadline ?? ""}
                onChange={(e) => {
                  const v = e?.target?.value ?? "";
                  setIntegrations(prev => ({ ...prev, deadline: v || null }));
                }}
                style={{ padding: "4px 8px", width: "100%", maxWidth: "280px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>
            {/* News — keywords as numbered list */}
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                <input
                  type="checkbox"
                  checked={integrations.news.enabled}
                  onChange={(e) => setIntegrations(prev => ({
                    ...prev,
                    news: { ...prev.news, enabled: e.target.checked }
                  }))}
                  style={{ marginRight: "6px" }}
                />
                📰 News (keywords)
              </label>
              {integrations.news.enabled && (
                <>
                  {integrations.news.keywords.length > 0 && (
                    <ol style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "12px" }}>
                      {integrations.news.keywords.map((k, i) => (
                        <li key={i} style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{k}</span>
                          <button type="button" onClick={() => setIntegrations(prev => ({ ...prev, news: { ...prev.news, keywords: prev.news.keywords.filter((_, idx) => idx !== i) } }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: "14px" }} aria-label="Remove">×</button>
                        </li>
                      ))}
                    </ol>
                  )}
                  {integrations.news.keywords.length < 50 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                      <input
                        type="text"
                        value={newsKeywordInput}
                        onChange={(e) => setNewsKeywordInput(e.target.value)}
                        placeholder="Add keyword(s), comma-separated"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = newsKeywordInput.trim(); if (v) { const toAdd = v.split(",").map(x => x.trim()).filter(Boolean).filter(x => !integrations.news.keywords.includes(x)); setIntegrations(prev => ({ ...prev, news: { ...prev.news, keywords: [...prev.news.keywords, ...toAdd].slice(0, 50) } })); setNewsKeywordInput(""); } } }}
                        style={{ flex: 1, maxWidth: "280px", padding: "6px 8px", fontSize: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
                      />
                      <button type="button" onClick={() => { const v = newsKeywordInput.trim(); if (v) { const toAdd = v.split(",").map(x => x.trim()).filter(Boolean).filter(x => !integrations.news.keywords.includes(x)); setIntegrations(prev => ({ ...prev, news: { ...prev.news, keywords: [...prev.news.keywords, ...toAdd].slice(0, 50) } })); setNewsKeywordInput(""); } }} style={{ padding: "6px 10px", fontSize: "12px" }}>Add</button>
                    </div>
                  )}
                  <span style={{ fontSize: "11px", color: "#666", marginTop: "4px", display: "block" }}>{integrations.news.keywords.length} / 50 keywords</span>
                </>
              )}
            </div>
            {/* Financial */}
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                <input
                  type="checkbox"
                  checked={integrations.financial.enabled}
                  onChange={(e) => setIntegrations(prev => ({
                    ...prev,
                    financial: { ...prev.financial, enabled: e.target.checked }
                  }))}
                  style={{ marginRight: "6px" }}
                />
                📈 Financial
              </label>
              {integrations.financial.enabled && (
                <div style={{ marginTop: "4px" }}>
                  <select
                    value={integrations.financial.type}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      financial: { ...prev.financial, type: e.target.value }
                    }))}
                    style={{ padding: "4px 8px", marginRight: "8px", marginBottom: "6px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="crypto">Crypto</option>
                    <option value="stock">Stocks</option>
                  </select>
                  {integrations.financial.symbols.length > 0 && (
                    <ol style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "12px" }}>
                      {integrations.financial.symbols.map((s, i) => (
                        <li key={i} style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{s}</span>
                          <button type="button" onClick={() => setIntegrations(prev => ({ ...prev, financial: { ...prev.financial, symbols: prev.financial.symbols.filter((_, idx) => idx !== i) } }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: "14px" }} aria-label="Remove">×</button>
                        </li>
                      ))}
                    </ol>
                  )}
                  {integrations.financial.symbols.length < 50 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                      <input
                        type="text"
                        value={financialSymbolInput}
                        onChange={(e) => setFinancialSymbolInput(e.target.value)}
                        placeholder={integrations.financial.type === "crypto" ? "e.g. BTC, ETH (comma-separated)" : "e.g. AAPL, TSLA (comma-separated)"}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = financialSymbolInput.trim(); if (v) { const toAdd = v.split(",").map(x => x.trim().toUpperCase()).filter(Boolean).filter(x => !integrations.financial.symbols.includes(x)); setIntegrations(prev => ({ ...prev, financial: { ...prev.financial, symbols: [...prev.financial.symbols, ...toAdd].slice(0, 50) } })); setFinancialSymbolInput(""); } } }}
                        style={{ flex: 1, maxWidth: "280px", padding: "6px 8px", fontSize: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
                      />
                      <button type="button" onClick={() => { const v = financialSymbolInput.trim(); if (v) { const toAdd = v.split(",").map(x => x.trim().toUpperCase()).filter(Boolean).filter(x => !integrations.financial.symbols.includes(x)); setIntegrations(prev => ({ ...prev, financial: { ...prev.financial, symbols: [...prev.financial.symbols, ...toAdd].slice(0, 50) } })); setFinancialSymbolInput(""); } }} style={{ padding: "6px 10px", fontSize: "12px" }}>Add</button>
                    </div>
                  )}
                  <span style={{ fontSize: "11px", color: "#666", marginTop: "4px", display: "block" }}>{integrations.financial.symbols.length} / 50 symbols</span>
                </div>
              )}
            </div>
            {/* Social (X/Twitter) */}
            <div style={{ marginBottom: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                <input
                  type="checkbox"
                  checked={integrations.social.x.enabled}
                  onChange={(e) => setIntegrations(prev => ({
                    ...prev,
                    social: { ...prev.social, x: { ...prev.social.x, enabled: e.target.checked } }
                  }))}
                  style={{ marginRight: "6px" }}
                />
                🐦 X / Social keywords
              </label>
              {integrations.social.x.enabled && (
                <>
                  {integrations.social.x.keywords.length > 0 && (
                    <ol style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "12px" }}>
                      {integrations.social.x.keywords.map((k, i) => (
                        <li key={i} style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{k}</span>
                          <button type="button" onClick={() => setIntegrations(prev => ({ ...prev, social: { x: { ...prev.social.x, keywords: prev.social.x.keywords.filter((_, idx) => idx !== i) } } }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: "14px" }} aria-label="Remove">×</button>
                        </li>
                      ))}
                    </ol>
                  )}
                  {integrations.social.x.keywords.length < 50 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                      <input
                        type="text"
                        value={socialKeywordInput}
                        onChange={(e) => setSocialKeywordInput(e.target.value)}
                        placeholder="e.g. crypto, tech (comma-separated)"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = socialKeywordInput.trim(); if (v) { const toAdd = v.split(",").map(x => x.trim()).filter(Boolean).filter(x => !integrations.social.x.keywords.includes(x)); setIntegrations(prev => ({ ...prev, social: { x: { ...prev.social.x, keywords: [...prev.social.x.keywords, ...toAdd].slice(0, 50) } } })); setSocialKeywordInput(""); } } }}
                        style={{ flex: 1, maxWidth: "280px", padding: "6px 8px", fontSize: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
                      />
                      <button type="button" onClick={() => { const v = socialKeywordInput.trim(); if (v) { const toAdd = v.split(",").map(x => x.trim()).filter(Boolean).filter(x => !integrations.social.x.keywords.includes(x)); setIntegrations(prev => ({ ...prev, social: { x: { ...prev.social.x, keywords: [...prev.social.x.keywords, ...toAdd].slice(0, 50) } } })); setSocialKeywordInput(""); } }} style={{ padding: "6px 10px", fontSize: "12px" }}>Add</button>
                    </div>
                  )}
                  <span style={{ fontSize: "11px", color: "#666", marginTop: "4px", display: "block" }}>{integrations.social.x.keywords.length} / 50 keywords</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateArea;

import React, { useState } from "react";

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

function CreateArea(props) {
  const [note, setNote] = useState({
    title: "",
    content: "",
    tags: [],
    priority: "medium"
  });
  const [tagInput, setTagInput] = useState("");
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [integrations, setIntegrations] = useState(emptyIntegrations());

  function handleChange(event) {
    const { name, value } = event.target;

    setNote((prevNote) => {
      return {
        ...prevNote,
        [name]: value
      };
    });
  }

  function handleTagInputKeyDown(event) {
    if (event.key === "Enter" && tagInput.trim()) {
      event.preventDefault();
      const newTag = tagInput.trim();
      if (!note.tags.includes(newTag)) {
        setNote((prevNote) => ({
          ...prevNote,
          tags: [...prevNote.tags, newTag]
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
    event.preventDefault();
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
    props.onAdd(payload);
    setNote({ title: "", content: "", tags: [], priority: "medium" });
    setTagInput("");
    setIntegrations(emptyIntegrations());
  }

  return (
    <div>
      <form style={noteFormat} onSubmit={submitNote}>
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
        
        {/* Tags Input */}
        <div style={{ marginTop: "10px", marginBottom: "10px" }}>
          {note.tags.map((tag, index) => (
            <span
              key={index}
              style={{
                display: "inline-block",
                background: "#f5ba13",
                color: "white",
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                margin: "2px 4px 2px 0",
                cursor: "pointer"
              }}
              onClick={() => removeTag(tag)}
            >
              {tag} ×
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Add tags (press Enter)"
            style={{
              border: "none",
              outline: "none",
              fontSize: "12px",
              padding: "4px",
              width: "150px"
            }}
          />
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

        {/* Integrations (optional) */}
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
            <div style={{ marginTop: "10px", padding: "10px", background: "#f9f9f9", borderRadius: "4px", fontSize: "12px" }}>
              {/* Deadline */}
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>📅 Deadline (optional)</label>
                <input
                  type="datetime-local"
                  value={integrations.deadline || ""}
                  onChange={(e) => setIntegrations(prev => ({ ...prev, deadline: e.target.value || null }))}
                  style={{ padding: "4px 8px", width: "100%", maxWidth: "280px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>
              {/* News */}
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
                  <input
                    type="text"
                    placeholder="e.g. technology, AI, crypto"
                    value={integrations.news.keywords.join(", ")}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      news: { ...prev.news, keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean) }
                    }))}
                    style={{ padding: "4px 8px", width: "100%", maxWidth: "280px", marginTop: "4px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
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
                      style={{ padding: "4px 8px", marginRight: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                    >
                      <option value="crypto">Crypto</option>
                      <option value="stock">Stocks</option>
                    </select>
                    <input
                      type="text"
                      placeholder={integrations.financial.type === "crypto" ? "e.g. BTC, ETH" : "e.g. AAPL, TSLA"}
                      value={integrations.financial.symbols.join(", ")}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        financial: { ...prev.financial, symbols: e.target.value.split(",").map(s => s.trim().toUpperCase()).filter(Boolean) }
                      }))}
                      style={{ padding: "4px 8px", width: "100%", maxWidth: "200px", border: "1px solid #ddd", borderRadius: "4px" }}
                    />
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
                  <input
                    type="text"
                    placeholder="e.g. crypto, tech"
                    value={integrations.social.x.keywords.join(", ")}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      social: { x: { ...prev.social.x, keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean) } }
                    }))}
                    style={{ padding: "4px 8px", width: "100%", maxWidth: "280px", marginTop: "4px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <button type="submit" style={buttonStyle}>
          Add
        </button>
      </form>
    </div>
  );
}

export default CreateArea;

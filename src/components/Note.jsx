import React, { useState } from "react";

const buttonStyle = {
  position: "relative",
  float: "right",
  marginRight: "10px",
  color: "#f5ba13",
  border: "none",
  width: "36px",
  height: "36px",
  cursor: "pointer",
  outline: "none",
  background: "transparent",
  fontSize: "14px"
};

const tagStyle = {
  display: "inline-block",
  background: "#f5ba13",
  color: "white",
  padding: "2px 8px",
  borderRadius: "12px",
  fontSize: "12px",
  margin: "2px 4px 2px 0"
};

const priorityStyle = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "11px",
  fontWeight: "bold",
  marginLeft: "8px"
};

const priorityColors = {
  urgent: { background: "#ff4444", color: "white" },
  high: { background: "#ff8800", color: "white" },
  medium: { background: "#ffbb33", color: "black" },
  low: { background: "#99cc00", color: "black" }
};

const sectionStyle = {
  marginTop: "10px",
  padding: "8px",
  background: "var(--bg-tertiary, #f5f5f5)",
  borderRadius: "4px",
  fontSize: "12px",
  color: "var(--text-secondary, #666)"
};

function Note(props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(props.title || "");
  const [editContent, setEditContent] = useState(props.content || "");
  const [integrationLoading, setIntegrationLoading] = useState(null);

  function handleDelete() {
    if (window.confirm("Are you sure you want to delete this note?")) {
      props.onDelete(props.id);
    }
  }

  function handleEdit() {
    setIsEditing(true);
  }

  function handleSave() {
    props.onUpdate(props.id, {
      title: editTitle,
      content: editContent
    });
    setIsEditing(false);
  }

  function handleCancel() {
    setEditTitle(props.title || "");
    setEditContent(props.content || "");
    setIsEditing(false);
  }

  function handlePin() {
    props.onPin(props.id, !props.isPinned);
  }

  function handleArchive() {
    props.onArchive(props.id, !props.isArchived);
  }

  function handleTrash() {
    props.onTrash(props.id, true);
  }

  async function handleIntegrationAction(key, fn) {
    if (!fn) return;
    setIntegrationLoading(key);
    try {
      await fn(props.id);
      if (props.onIntegrationComplete) props.onIntegrationComplete();
    } finally {
      setIntegrationLoading(null);
    }
  }

  if (isEditing) {
    return (
      <div className="note" style={{ background: "#fffacd" }}>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "8px", fontSize: "1.2em", border: "1px solid #ddd", borderRadius: "4px" }}
          placeholder="Title"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          style={{ width: "100%", padding: "8px", minHeight: "100px", fontSize: "1em", border: "1px solid #ddd", borderRadius: "4px", resize: "vertical" }}
          placeholder="Content"
        />
        <div style={{ marginTop: "10px" }}>
          <button onClick={handleSave} style={{ ...buttonStyle, color: "#4CAF50", marginRight: "5px" }}>
            SAVE
          </button>
          <button onClick={handleCancel} style={{ ...buttonStyle, color: "#f44336" }}>
            CANCEL
          </button>
        </div>
      </div>
    );
  }

  const hasDeadline = props.deadline && (props.deadline.date || props.deadline.time);
  const hasNews = props.news && props.news.articles && props.news.articles.length > 0;
  const hasFinancial = props.financial && (props.financial.summary || (props.financial.data && props.financial.data.prices && props.financial.data.prices.length > 0));
  const tweets = props.social?.x?.tweets;
  const hasSocial = tweets && Array.isArray(tweets) && tweets.length > 0;
  const hasAttachments = props.attachments && props.attachments.length > 0;
  const hasDrawings = props.drawings && props.drawings.length > 0;
  const hasIntegrationActions = props.onFetchNews || props.onFetchTweets || props.onUpdateFinancial || props.onUpdateAll;

  return (
    <div className="note" style={{ position: "relative", borderLeft: props.isPinned ? "4px solid #f5ba13" : "none" }}>
      {props.isPinned && (
        <span role="img" aria-label="Pinned" style={{ position: "absolute", top: "5px", right: "5px", fontSize: "20px" }}>📌</span>
      )}
      <h1>{props.title}</h1>
      <p>{props.content}</p>

      {props.tags && props.tags.length > 0 && (
        <div style={{ marginTop: "10px", marginBottom: "10px" }}>
          {props.tags.map((tag, index) => (
            <span key={index} style={tagStyle}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {props.priority && (
        <span style={{ ...priorityStyle, ...priorityColors[props.priority] }}>
          {props.priority.toUpperCase()}
        </span>
      )}

      {/* Deadline */}
      {hasDeadline && (
        <div style={sectionStyle}>
          <strong><span role="img" aria-label="Deadline">📅</span> Deadline:</strong>{" "}
          {props.deadline.date ? new Date(props.deadline.date).toLocaleString() : ""}
          {props.deadline.status && ` (${props.deadline.status})`}
        </div>
      )}

      {/* News */}
      {hasNews && (
        <div style={sectionStyle}>
          <strong><span role="img" aria-label="News">📰</span> News:</strong>{" "}
          {props.news.articles[0].title || props.news.articles[0].snippet}
        </div>
      )}

      {/* Financial */}
      {hasFinancial && (
        <div style={sectionStyle}>
          <strong><span role="img" aria-label="Financial">📈</span> Financial:</strong>{" "}
          {props.financial.summary || (props.financial.data && props.financial.data.prices && props.financial.data.prices.length > 0
            ? props.financial.data.prices.map((p, i) => `${p.symbol}: ${p.price}`).join(", ")
            : "")}
        </div>
      )}

      {/* Social / Tweets */}
      {hasSocial && (
        <div style={sectionStyle}>
          <strong><span role="img" aria-label="Social">🐦</span> X:</strong>{" "}
          {tweets[0].text ? tweets[0].text.substring(0, 80) + "…" : "Tweets attached"}
        </div>
      )}

      {/* Attachments (e.g. drawing images) */}
      {hasAttachments && (
        <div style={{ ...sectionStyle, display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <strong><span role="img" aria-label="Attachments">📎</span> Attachments:</strong>
          {props.attachments.map((att, i) => (
            att.type === "image" && att.url ? (
              <img key={i} src={att.url} alt="" style={{ maxWidth: "120px", maxHeight: "80px", objectFit: "cover", borderRadius: "4px" }} />
            ) : (
              <span key={i}>{att.type}</span>
            )
          ))}
        </div>
      )}

      {/* Drawings */}
      {hasDrawings && (
        <div style={sectionStyle}>
          <span role="img" aria-label="Drawing">✏️</span> Drawing attached
        </div>
      )}

      {/* Integration action buttons */}
      {hasIntegrationActions && (
        <div style={{ ...sectionStyle, display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          <strong>Integrations:</strong>
          {props.onFetchNews && (
            <button
              type="button"
              disabled={integrationLoading === "news"}
              onClick={() => handleIntegrationAction("news", props.onFetchNews)}
              style={{ padding: "4px 8px", fontSize: "11px", cursor: integrationLoading === "news" ? "wait" : "pointer" }}
            >
              {integrationLoading === "news" ? "…" : "Fetch news"}
            </button>
          )}
          {props.onFetchTweets && (
            <button
              type="button"
              disabled={integrationLoading === "tweets"}
              onClick={() => handleIntegrationAction("tweets", props.onFetchTweets)}
              style={{ padding: "4px 8px", fontSize: "11px", cursor: integrationLoading === "tweets" ? "wait" : "pointer" }}
            >
              {integrationLoading === "tweets" ? "…" : "Fetch tweets"}
            </button>
          )}
          {props.onUpdateFinancial && (
            <button
              type="button"
              disabled={integrationLoading === "financial"}
              onClick={() => handleIntegrationAction("financial", props.onUpdateFinancial)}
              style={{ padding: "4px 8px", fontSize: "11px", cursor: integrationLoading === "financial" ? "wait" : "pointer" }}
            >
              {integrationLoading === "financial" ? "…" : "Update financial"}
            </button>
          )}
          {props.onUpdateAll && (
            <button
              type="button"
              disabled={integrationLoading === "all"}
              onClick={() => handleIntegrationAction("all", props.onUpdateAll)}
              style={{ padding: "4px 8px", fontSize: "11px", cursor: integrationLoading === "all" ? "wait" : "pointer" }}
            >
              {integrationLoading === "all" ? "…" : "Update all"}
            </button>
          )}
        </div>
      )}

      <div className="note-actions" style={{ marginTop: "10px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {props.onOpenEnhancedEdit && (
          <button onClick={props.onOpenEnhancedEdit} style={{ ...buttonStyle, color: "#9C27B0" }}>
            EDIT (ENHANCED)
          </button>
        )}
        <button onClick={handleEdit} style={{ ...buttonStyle, color: "#2196F3" }}>
          EDIT
        </button>
        <button onClick={handlePin} style={{ ...buttonStyle, color: props.isPinned ? "#f5ba13" : "#999" }}>
          <span role="img" aria-label={props.isPinned ? "Unpin" : "Pin"}>{props.isPinned ? "📌" : "📍"}</span>
        </button>
        <button onClick={handleArchive} style={{ ...buttonStyle, color: props.isArchived ? "#ff9800" : "#999" }}>
          <span role="img" aria-label={props.isArchived ? "Unarchive" : "Archive"}>{props.isArchived ? "📦" : "📁"}</span>
        </button>
        <button onClick={handleTrash} style={{ ...buttonStyle, color: "#999" }}>
          <span role="img" aria-label="Move to trash">🗑️</span>
        </button>
        <button onClick={handleDelete} style={{ ...buttonStyle, color: "#f44336" }}>
          DELETE
        </button>
      </div>
    </div>
  );
}

export default Note;

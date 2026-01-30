import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

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
  const { isModal = false, onCloseModal, onOpenModal } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editTitle, setEditTitle] = useState(props.title || "");
  const [editContent, setEditContent] = useState(props.content || "");
  const [integrationLoading, setIntegrationLoading] = useState(null);
  const [integrationError, setIntegrationError] = useState(null);

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
    setIntegrationError(null);
    setIntegrationLoading(key);
    try {
      await fn(props.id);
      if (props.onIntegrationComplete) props.onIntegrationComplete();
    } catch (e) {
      setIntegrationError(e.message || "Request failed. Add keywords/symbols in Integrations when creating or editing the note.");
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
  const hasDeadlineData = hasDeadline && props.deadline.date;
  const hasNewsData = props.news?.articles && Array.isArray(props.news.articles) && props.news.articles.length > 0;
  const articles = (hasNewsData && props.news.articles) || [];
  const newsSentiment = props.news?.sentiment;
  const hasFinancialData = props.financial && (props.financial.summary || (props.financial.data?.prices && props.financial.data.prices.length > 0));
  const prices = (hasFinancialData && props.financial?.data?.prices) || [];
  const tweets = props.social?.x?.tweets;
  const hasSocialData = tweets && Array.isArray(tweets) && tweets.length > 0;
  const socialSentiment = props.social?.x?.sentiment;
  const hasAttachments = props.attachments && props.attachments.length > 0;
  const hasDrawings = props.drawings && props.drawings.length > 0;
  const hasIntegrationActions = props.onFetchNews || props.onFetchTweets || props.onUpdateFinancial || props.onUpdateAll;

  const sentimentBadge = (label) => {
    const c = label === "positive" ? "#2e7d32" : label === "negative" ? "#c62828" : "#666";
    return (
      <span style={{ marginLeft: "6px", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", background: c, color: "#fff" }}>
        {label}
      </span>
    );
  };

  const integrationDetails = (
    <>
      {/* Deadline: show when configured (has date) or when deadline object exists */}
      {(hasDeadline || (props.deadline && typeof props.deadline === "object")) && (
        <div style={sectionStyle}>
          <strong><span role="img" aria-label="Deadline">📅</span> Deadline:</strong>{" "}
          {hasDeadlineData ? new Date(props.deadline.date).toLocaleString() : "Set in enhanced edit"}
          {props.deadline?.status && ` (${props.deadline.status})`}
        </div>
      )}

      {/* News: only when articles are available — sentiment + compact headlines */}
      {hasNewsData && (
        <div style={sectionStyle}>
          <strong><span role="img" aria-label="News">📰</span> News</strong>
          {newsSentiment && sentimentBadge(newsSentiment)}
          <span style={{ marginLeft: "6px", fontSize: "11px", color: "var(--text-secondary, #666)" }}>
            {articles.length} article{articles.length !== 1 ? "s" : ""}
          </span>
          <div style={{ marginTop: "6px", fontSize: "12px" }}>
            {articles.slice(0, 2).map((a, i) => (
              <div key={i} style={{ marginBottom: "4px" }}>
                {a.title ? (a.title.length > 80 ? a.title.substring(0, 80) + "…" : a.title) : (a.snippet || "").substring(0, 80) + "…"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial: only when data is available — tracking chart + compact table */}
      {hasFinancialData && (
        <div style={sectionStyle}>
          <strong><span role="img" aria-label="Financial">📈</span> Financial</strong>
          {props.financial?.type && (
            <span style={{ marginLeft: "6px", fontSize: "11px" }}>({props.financial.type})</span>
          )}
          {prices.length > 0 && (
            <>
              <div style={{ height: "120px", width: "100%", marginTop: "8px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prices.map((p) => ({ name: p.symbol, value: Number(p.price ?? p.last ?? 0), fill: (p.changePercent >= 0 ? "#2e7d32" : "#c62828") }))}
                    margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={36} />
                    <Tooltip formatter={(v) => [Number(v).toFixed(2), "Price"]} contentStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {prices.map((p, i) => (
                        <Cell key={i} fill={(p.changePercent >= 0 ? "#2e7d32" : "#c62828")} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "11px" }}>
                {prices.map((p, i) => (
                  <span key={i}>
                    {p.symbol}: {Number(p.price ?? p.last ?? 0).toFixed(2)}
                    {p.changePercent != null && (
                      <span style={{ color: p.changePercent >= 0 ? "#2e7d32" : "#c62828", marginLeft: "4px" }}>
                        ({p.changePercent >= 0 ? "+" : ""}{Number(p.changePercent).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </>
          )}
          {props.financial?.summary && prices.length === 0 && (
            <div style={{ marginTop: "6px" }}>{props.financial.summary}</div>
          )}
        </div>
      )}

      {/* Social / X: only when tweets are available — sentiment summary + 1–2 snippets */}
      {hasSocialData && (
        <div style={sectionStyle}>
          <strong><span role="img" aria-label="Social">🐦</span> X</strong>
          {socialSentiment && (
            <>
              {sentimentBadge(socialSentiment.overall)}
              <span style={{ marginLeft: "6px", fontSize: "11px", color: "var(--text-secondary, #666)" }}>
                ↑{(socialSentiment.positive * 100).toFixed(0)}% pos · ↓{(socialSentiment.negative * 100).toFixed(0)}% neg · {(socialSentiment.neutral * 100).toFixed(0)}% neutral
              </span>
            </>
          )}
          <div style={{ marginTop: "6px", fontSize: "12px" }}>
            {tweets.slice(0, 2).map((t, i) => (
              <div key={i} style={{ marginBottom: "4px" }}>
                {(t.text || t.title || "").length > 60 ? (t.text || t.title || "").substring(0, 60) + "…" : (t.text || t.title || "")}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const showCompact = onOpenModal && !isModal;
  const showFullContent = (isModal || isExpanded) && !showCompact;
  const contentPreview = props.content ? (props.content.length > 120 ? props.content.substring(0, 120) + "…" : props.content) : "";

  return (
    <div
      className="note"
      style={{
        position: "relative",
        borderLeft: props.isPinned ? "4px solid #f5ba13" : "none",
        cursor: showCompact ? "pointer" : undefined
      }}
      onClick={showCompact ? (e) => { if (!e.target.closest(".note-actions") && !e.target.closest("button")) onOpenModal(); } : undefined}
      role={showCompact ? "button" : undefined}
      tabIndex={showCompact ? 0 : undefined}
      onKeyDown={showCompact ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenModal(); } } : undefined}
    >
      {isModal && onCloseModal && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCloseModal(); }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 10,
            padding: "6px 12px",
            background: "#666",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px"
          }}
        >
          Close
        </button>
      )}
      {props.isPinned && (
        <span role="img" aria-label="Pinned" style={{ position: "absolute", top: "5px", right: isModal ? "70px" : "40px", fontSize: "20px" }}>📌</span>
      )}
      {!showCompact && !isModal && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          style={{ position: "absolute", top: "8px", right: "40px", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse note" : "Expand note"}
        >
          {isExpanded ? "▲" : "▼"}
        </button>
      )}
      <h1>{props.title}</h1>
      <p>{showCompact ? contentPreview : props.content}</p>

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

      {showCompact && (
        <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-secondary, #666)" }}>
          Click to open
        </div>
      )}

      {showFullContent && (
        <>
          {integrationDetails}

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

          {/* Integration error from backend (e.g. no keywords/symbols) */}
          {integrationError && (
            <div style={{ ...sectionStyle, background: "#ffebee", color: "#c62828", fontSize: "11px" }}>
              {integrationError}
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
        </>
      )}

      <div className="note-actions" style={{ marginTop: "10px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {props.onOpenEnhancedEdit && (
          <button type="button" onClick={props.onOpenEnhancedEdit} style={{ ...buttonStyle, color: "#2196F3" }}>
            Edit
          </button>
        )}
        <button type="button" onClick={handlePin} style={{ ...buttonStyle, color: props.isPinned ? "#f5ba13" : "#999" }}>
          <span role="img" aria-label={props.isPinned ? "Unpin" : "Pin"}>{props.isPinned ? "📌" : "📍"}</span>
        </button>
        <button type="button" onClick={handleArchive} style={{ ...buttonStyle, color: props.isArchived ? "#ff9800" : "#999" }}>
          <span role="img" aria-label={props.isArchived ? "Unarchive" : "Archive"}>{props.isArchived ? "📦" : "📁"}</span>
        </button>
        <button type="button" onClick={handleTrash} style={{ ...buttonStyle, color: "#999" }}>
          <span role="img" aria-label="Move to trash">🗑️</span>
        </button>
        <button type="button" onClick={handleDelete} style={{ ...buttonStyle, color: "#f44336" }}>
          DELETE
        </button>
      </div>
    </div>
  );
}

export default Note;

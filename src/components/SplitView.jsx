import React, { useState, useEffect, useCallback } from "react";
import Note from "./Note";
import VoiceRecorder from "./VoiceRecorder";
import DrawingCanvas from "./DrawingCanvas";

const SplitView = ({
  notes,
  onNoteSelect,
  selectedNoteId,
  onUpdate,
  onDelete,
  onPin,
  onArchive,
  onTrash,
  onOpenEnhancedEdit,
  onOpenNewsModal,
  onOpenFinancialModal,
  onFetchNews,
  onFetchTweets,
  onUpdateFinancial,
  onUpdateAll,
  onIntegrationComplete,
  onAddVoiceToNote,
  onAddDrawingToNote,
  onAddTextToNote
}) => {
  const [splitRatio, setSplitRatio] = useState(55);
  const [isDragging, setIsDragging] = useState(false);
  const [addText, setAddText] = useState("");
  const [showAddText, setShowAddText] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      const handleDocumentMouseMove = (e) => {
        const container = document.querySelector(".split-container");
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setSplitRatio(Math.max(30, Math.min(75, percentage)));
      };
      document.addEventListener("mousemove", handleDocumentMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleDocumentMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseUp]);

  const selectedNote = notes.find((n) => n._id === selectedNoteId);
  const hasNote = Boolean(selectedNote);
  const canAddToNote = hasNote && typeof onAddVoiceToNote === "function" && typeof onAddDrawingToNote === "function" && typeof onAddTextToNote === "function";

  const handleAddTextToNote = () => {
    const text = addText.trim();
    if (!text || !canAddToNote) return;
    onAddTextToNote(text);
    setAddText("");
    setShowAddText(false);
  };

  return (
    <div
      className="split-container"
      style={{
        display: "flex",
        height: "calc(100vh - 180px)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        background: "var(--bg-primary)",
        overflow: "hidden"
      }}
    >
      {/* Left: Note list + Note opens and fits in framed area */}
      <div
        style={{
          width: `${splitRatio}%`,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            borderBottom: "1px solid var(--border-color)",
            padding: "8px 12px",
            background: "var(--bg-secondary)"
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Current note</span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px", maxHeight: "80px", overflowY: "auto" }}>
            {notes.length === 0 ? (
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No notes yet</span>
            ) : (
              notes.map((note) => (
                <button
                  key={note._id}
                  type="button"
                  onClick={() => onNoteSelect(note._id)}
                  style={{
                    padding: "6px 10px",
                    fontSize: "12px",
                    border: "none",
                    borderRadius: "6px",
                    background: selectedNoteId === note._id ? "var(--bg-tertiary)" : "var(--bg-primary)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "160px",
                    borderLeft: selectedNoteId === note._id ? "3px solid var(--text-secondary)" : "3px solid transparent"
                  }}
                  title={note.title || "Untitled"}
                >
                  {note.title || "Untitled"}
                </button>
              ))
            )}
          </div>
        </div>
        {/* Note opens and fits into this framed area */}
        <div className="split-view-note-frame" style={{ margin: "8px", marginTop: "0" }}>
          {selectedNote ? (
            <Note
              id={selectedNote._id}
              title={selectedNote.title}
              content={selectedNote.content}
              tags={selectedNote.tags || []}
              priority={selectedNote.priority}
              isPinned={selectedNote.isPinned}
              isArchived={selectedNote.isArchived}
              deadline={selectedNote.deadline}
              news={selectedNote.news}
              financial={selectedNote.financial}
              social={selectedNote.social}
              attachments={selectedNote.attachments}
              drawings={selectedNote.drawings}
              onDelete={() => onDelete(selectedNote._id)}
              onUpdate={onUpdate}
              onPin={onPin}
              onArchive={onArchive}
              onTrash={onTrash}
              onOpenEnhancedEdit={onOpenEnhancedEdit ? () => onOpenEnhancedEdit(selectedNote._id) : undefined}
              onOpenNewsModal={onOpenNewsModal ? () => onOpenNewsModal(selectedNote._id) : undefined}
              onOpenFinancialModal={onOpenFinancialModal ? () => onOpenFinancialModal(selectedNote._id) : undefined}
              onFetchNews={onFetchNews}
              onFetchTweets={onFetchTweets}
              onUpdateFinancial={onUpdateFinancial}
              onUpdateAll={onUpdateAll}
              onIntegrationComplete={onIntegrationComplete}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)", fontSize: "14px" }}>
              Select a note to view and use integrations (news, financial, etc.)
            </div>
          )}
        </div>
      </div>

      {/* Resizer */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: "6px",
          background: isDragging ? "var(--text-secondary)" : "var(--border-color)",
          cursor: "col-resize",
          userSelect: "none",
          flexShrink: 0
        }}
        aria-hidden
      />

      {/* Right: Screenshot format – main content + toolbar bar + tool palette bar (no boxes per icon) */}
      <div
        style={{
          width: `${100 - splitRatio}%`,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
          background: "var(--bg-primary)"
        }}
      >
        {!hasNote && (
          <div style={{ padding: "10px 14px", fontSize: "12px", color: "var(--text-secondary)", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)" }}>
            Select a note on the left to add content. All tools save into that note.
          </div>
        )}

        {/* Main content area – framed, fits canvas / add-text / voice */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            border: "1px dashed var(--border-color)",
            borderRadius: "6px",
            margin: "8px",
            background: "var(--bg-secondary)",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {showAddText && (
            <div style={{ padding: "12px", borderBottom: "1px solid var(--border-color)" }}>
              <textarea
                value={addText}
                onChange={(e) => setAddText(e.target.value)}
                placeholder="Type to append to current note..."
                disabled={!hasNote}
                style={{
                  width: "100%",
                  minHeight: "70px",
                  padding: "10px",
                  fontSize: "13px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  resize: "vertical",
                  marginBottom: "8px"
                }}
              />
              <button
                type="button"
                onClick={handleAddTextToNote}
                disabled={!hasNote || !addText.trim()}
                style={{ padding: "6px 12px", fontSize: "12px", marginRight: "8px" }}
              >
                Add to note
              </button>
              <button type="button" onClick={() => setShowAddText(false)} style={{ padding: "6px 12px", fontSize: "12px" }}>
                Cancel
              </button>
            </div>
          )}
          {showVoice && (
            <div style={{ padding: "12px", borderBottom: "1px solid var(--border-color)" }}>
              <VoiceRecorder onTranscript={canAddToNote ? (t) => { onAddVoiceToNote(t); setShowVoice(false); } : undefined} />
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "8px" }}>
            <DrawingCanvas onSave={canAddToNote ? onAddDrawingToNote : undefined} />
          </div>
        </div>

        {/* Contextual toolbar – single bar, no boxes (Aa, Checklist, Grid, Paperclip, Pen, X) */}
        <div className="split-view-toolbar">
          <button
            type="button"
            className="split-view-toolbar-btn"
            onClick={() => setShowAddText((v) => !v)}
            disabled={!hasNote}
            title="Add text"
            aria-label="Add text"
          >
            Aa
          </button>
          <button
            type="button"
            className="split-view-toolbar-btn"
            onClick={() => canAddToNote && onAddTextToNote("- [ ] ")}
            disabled={!hasNote}
            title="Checklist"
            aria-label="Checklist"
          >
            ☑
          </button>
          <button type="button" className="split-view-toolbar-btn" disabled title="Table" aria-label="Table">
            ⊞
          </button>
          <button type="button" className="split-view-toolbar-btn" disabled title="Attachment" aria-label="Attachment">
            📎
          </button>
          <button
            type="button"
            className="split-view-toolbar-btn"
            onClick={() => setShowVoice((v) => !v)}
            disabled={!hasNote}
            title="Voice"
            aria-label="Voice"
          >
            🎤
          </button>
          <button
            type="button"
            className="split-view-toolbar-btn"
            onClick={() => { setShowAddText(false); setShowVoice(false); }}
            title="Close panels"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tool palette – single bar, no boxes (pen, eraser, pencil, ruler, color, +) */}
        <div className="split-view-toolbar" style={{ borderTop: "1px solid var(--border-color)" }}>
          <button type="button" className="split-view-toolbar-btn" title="Pen" aria-label="Pen">
            ✒
          </button>
          <button type="button" className="split-view-toolbar-btn" title="Marker" aria-label="Marker">
            🖍
          </button>
          <button type="button" className="split-view-toolbar-btn" title="Eraser" aria-label="Eraser">
            🧹
          </button>
          <button type="button" className="split-view-toolbar-btn" title="Pencil" aria-label="Pencil">
            ✏
          </button>
          <button type="button" className="split-view-toolbar-btn" title="Ruler" aria-label="Ruler">
            📏
          </button>
          <button type="button" className="split-view-toolbar-btn" title="Color" aria-label="Color">
            🎨
          </button>
          <button type="button" className="split-view-toolbar-btn" title="More" aria-label="More">
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitView;

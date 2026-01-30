import React, { useState, useEffect, useCallback, useRef } from "react";
import Note from "./Note";
import VoiceRecorder from "./VoiceRecorder";
import DrawingCanvas from "./DrawingCanvas";

const PALETTE_COLORS = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

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
  const [showPalette, setShowPalette] = useState(false);
  const [drawColor, setDrawColor] = useState("#000000");
  const [drawBrushSize, setDrawBrushSize] = useState(5);
  const drawingCanvasRef = useRef(null);

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
        {/* Note opens and fits into this framed area – fills entire tab */}
        <div className="split-view-note-frame" style={{ margin: "6px", marginTop: "0" }}>
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
            <DrawingCanvas
              ref={drawingCanvasRef}
              compact
              onSave={canAddToNote ? onAddDrawingToNote : undefined}
              color={drawColor}
              brushSize={drawBrushSize}
              onColorChange={setDrawColor}
              onBrushSizeChange={setDrawBrushSize}
            />
          </div>
        </div>

        {/* Contextual toolbar – single bar, no boxes (Aa, Checklist, Grid, Paperclip, Voice, X) */}
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
            <span role="img" aria-hidden="true">☑</span>
          </button>
          <button type="button" className="split-view-toolbar-btn" disabled title="Table" aria-label="Table">
            ⊞
          </button>
          <button type="button" className="split-view-toolbar-btn" disabled title="Attachment" aria-label="Attachment">
            <span role="img" aria-hidden="true">📎</span>
          </button>
          <button
            type="button"
            className="split-view-toolbar-btn"
            onClick={() => setShowVoice((v) => !v)}
            disabled={!hasNote}
            title="Voice"
            aria-label="Voice"
          >
            <span role="img" aria-hidden="true">🎤</span>
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

        {/* Palette row: color + size (when Palette tab active) */}
        {showPalette && (
          <div className="split-view-toolbar" style={{ borderTop: "1px solid var(--border-color)", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginRight: "4px" }}>Color:</span>
            {PALETTE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDrawColor(c)}
                style={{
                  width: "28px",
                  height: "28px",
                  padding: 0,
                  border: drawColor === c ? "3px solid var(--text-secondary)" : "1px solid var(--border-color)",
                  borderRadius: "4px",
                  background: c,
                  cursor: "pointer"
                }}
                aria-label={`Color ${c}`}
              />
            ))}
            <input
              type="color"
              value={drawColor}
              onChange={(e) => setDrawColor(e.target.value)}
              style={{ width: "32px", height: "28px", cursor: "pointer", verticalAlign: "middle" }}
              aria-label="Pick color"
            />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "8px", marginRight: "4px" }}>Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={drawBrushSize}
              onChange={(e) => setDrawBrushSize(parseInt(e.target.value, 10))}
              style={{ width: "80px", verticalAlign: "middle" }}
              aria-label="Brush size"
            />
            <span style={{ fontSize: "12px", color: "var(--text-primary)", marginLeft: "4px" }}>{drawBrushSize}px</span>
          </div>
        )}

        {/* Tool palette – single bar (pen, marker, eraser=clear, pencil, ruler, palette=color/size, save, +) */}
        <div className="split-view-toolbar" style={{ borderTop: "1px solid var(--border-color)" }}>
          <button type="button" className="split-view-toolbar-btn" title="Pen" aria-label="Pen">
            <span role="img" aria-hidden="true">✒</span>
          </button>
          <button type="button" className="split-view-toolbar-btn" title="Marker" aria-label="Marker">
            <span role="img" aria-hidden="true">🖍</span>
          </button>
          <button
            type="button"
            className="split-view-toolbar-btn"
            onClick={() => drawingCanvasRef.current?.clearCanvas()}
            title="Clear canvas"
            aria-label="Clear canvas"
          >
            <span role="img" aria-hidden="true">🧹</span>
          </button>
          <button type="button" className="split-view-toolbar-btn" title="Pencil" aria-label="Pencil">
            <span role="img" aria-hidden="true">✏</span>
          </button>
          <button type="button" className="split-view-toolbar-btn" title="Ruler" aria-label="Ruler">
            <span role="img" aria-hidden="true">📏</span>
          </button>
          <button
            type="button"
            className={`split-view-toolbar-btn ${showPalette ? "active" : ""}`}
            onClick={() => setShowPalette((v) => !v)}
            title="Color and size"
            aria-label="Color and size"
            aria-pressed={showPalette}
          >
            <span role="img" aria-hidden="true">🎨</span>
          </button>
          <button
            type="button"
            className="split-view-toolbar-btn"
            onClick={() => drawingCanvasRef.current?.saveDrawing()}
            disabled={!canAddToNote}
            title="Save drawing to note"
            aria-label="Save drawing to note"
          >
            <span role="img" aria-hidden="true">💾</span>
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

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
      {/* Left: Note list + Selected note with integrations */}
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
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
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

      {/* Right: Tools – add to current note */}
      <div
        style={{
          width: `${100 - splitRatio}%`,
          overflowY: "auto",
          padding: "16px",
          background: "var(--bg-primary)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          minWidth: 0
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
          Add to current note
        </div>
        {!hasNote && (
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 12px 0" }}>
            Select a note on the left to add voice, drawings, or text. Content is saved into that note and used for integrations.
          </p>
        )}

        {/* Add information (text) */}
        <section style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
            Add information
          </label>
          <textarea
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            placeholder="Type here to append to the current note..."
            disabled={!hasNote}
            style={{
              width: "100%",
              minHeight: "80px",
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
            style={{
              padding: "8px 14px",
              fontSize: "12px",
              border: "none",
              borderRadius: "6px",
              background: hasNote && addText.trim() ? "var(--text-secondary)" : "var(--bg-tertiary)",
              color: hasNote && addText.trim() ? "var(--bg-primary)" : "var(--text-secondary)",
              cursor: hasNote && addText.trim() ? "pointer" : "not-allowed"
            }}
          >
            Add to note
          </button>
        </section>

        {/* Voice */}
        <section style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <VoiceRecorder
            onTranscript={canAddToNote ? onAddVoiceToNote : undefined}
          />
        </section>

        {/* Drawing */}
        <section style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <DrawingCanvas
            onSave={canAddToNote ? onAddDrawingToNote : undefined}
          />
        </section>
      </div>
    </div>
  );
};

export default SplitView;

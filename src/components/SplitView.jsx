import React, { useState, useEffect, useCallback } from "react";
import Note from "./Note";

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
  onFetchNews,
  onFetchTweets,
  onUpdateFinancial,
  onUpdateAll,
  onIntegrationComplete
}) => {
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleDocumentMouseMove = (e) => {
        const container = document.querySelector('.split-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setSplitRatio(Math.max(20, Math.min(80, percentage)));
      };

      document.addEventListener("mousemove", handleDocumentMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleDocumentMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseUp]);

  const selectedNote = notes.find(n => n._id === selectedNoteId);

  return (
    <div
      className="split-container"
      style={{
        display: "flex",
        height: "calc(100vh - 200px)",
        border: "1px solid var(--border-color)",
        borderRadius: "4px"
      }}
    >
      {/* Left Panel - Note List */}
      <div
        style={{
          width: `${splitRatio}%`,
          overflowY: "auto",
          borderRight: "1px solid var(--border-color)",
          padding: "10px"
        }}
      >
        {notes.map((note) => (
          <div
            key={note._id}
            onClick={() => onNoteSelect(note._id)}
            style={{
              padding: "10px",
              marginBottom: "5px",
              background: selectedNoteId === note._id ? "var(--bg-tertiary)" : "var(--bg-secondary)",
              borderRadius: "4px",
              cursor: "pointer",
              border: selectedNoteId === note._id ? "2px solid #f5ba13" : "1px solid transparent"
            }}
          >
            <h3 style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)" }}>
              {note.title || "Untitled"}
            </h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
              {note.content?.substring(0, 100)}...
            </p>
          </div>
        ))}
      </div>

      {/* Resizer */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: "4px",
          background: isDragging ? "#f5ba13" : "var(--border-color)",
          cursor: "col-resize",
          userSelect: "none"
        }}
      />

      {/* Right Panel - Selected Note */}
      <div
        style={{
          width: `${100 - splitRatio}%`,
          overflowY: "auto",
          padding: "20px"
        }}
      >
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
            onFetchNews={onFetchNews}
            onFetchTweets={onFetchTweets}
            onUpdateFinancial={onUpdateFinancial}
            onUpdateAll={onUpdateAll}
            onIntegrationComplete={onIntegrationComplete}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            Select a note to view details
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitView;


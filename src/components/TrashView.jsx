import React, { useState, useEffect } from "react";
import Note from "./Note";

const TrashView = ({ onRestore, onDeletePermanent }) => {
  const [trashedNotes, setTrashedNotes] = useState([]);

  useEffect(() => {
    fetchTrashedNotes();
  }, []);

  async function fetchTrashedNotes() {
    try {
      const response = await fetch("http://localhost:3050/api/notes/trash");
      if (response.ok) {
        const notes = await response.json();
        setTrashedNotes(notes);
      }
    } catch (error) {
      console.error("Error fetching trashed notes", error);
    }
  }

  async function handleRestore(id) {
    try {
      const response = await fetch(`http://localhost:3050/api/notes/${id}/trash`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isDeleted: false }),
      });

      if (response.ok) {
        fetchTrashedNotes();
        if (onRestore) onRestore();
      }
    } catch (error) {
      console.error("Error restoring note", error);
    }
  }

  async function handleDeletePermanent(id) {
    if (window.confirm("Are you sure you want to permanently delete this note? This action cannot be undone.")) {
      try {
        const response = await fetch(`http://localhost:3050/api/notes/DeleteNote/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          fetchTrashedNotes();
          if (onDeletePermanent) onDeletePermanent();
        }
      } catch (error) {
        console.error("Error deleting note permanently", error);
      }
    }
  }

  async function handleEmptyTrash() {
    if (window.confirm(`Are you sure you want to permanently delete all ${trashedNotes.length} notes? This action cannot be undone.`)) {
      try {
        await Promise.all(
          trashedNotes.map(note =>
            fetch(`http://localhost:3050/api/notes/DeleteNote/${note._id}`, {
              method: "DELETE",
            })
          )
        );
        fetchTrashedNotes();
      } catch (error) {
        console.error("Error emptying trash", error);
      }
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Trash ({trashedNotes.length})</h2>
        {trashedNotes.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            style={{
              padding: "8px 16px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Empty Trash
          </button>
        )}
      </div>

      {trashedNotes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
          Trash is empty
        </div>
      ) : (
        <div>
          {trashedNotes.map((note) => (
            <div key={note._id} style={{ position: "relative", display: "inline-block", margin: "16px" }}>
              <Note
                id={note._id}
                title={note.title}
                content={note.content}
                tags={note.tags || []}
                priority={note.priority}
                isPinned={false}
                isArchived={false}
                onDelete={() => handleDeletePermanent(note._id)}
                onUpdate={() => {}}
                onPin={() => {}}
                onArchive={() => {}}
                onTrash={() => {}}
              />
              <div style={{ marginTop: "10px", textAlign: "center" }}>
                <button
                  onClick={() => handleRestore(note._id)}
                  style={{
                    padding: "6px 12px",
                    background: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginRight: "5px"
                  }}
                >
                  Restore
                </button>
                <button
                  onClick={() => handleDeletePermanent(note._id)}
                  style={{
                    padding: "6px 12px",
                    background: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashView;


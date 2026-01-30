import React, { useState } from "react";
import { API_BASE } from "../config";

const ExportImport = ({ notes, onImport }) => {
  const [importFile, setImportFile] = useState(null);
  const [exportingFromServer, setExportingFromServer] = useState(false);

  const exportFromServer = async () => {
    setExportingFromServer(true);
    try {
      const res = await fetch(`${API_BASE}/api/notes/export`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notes-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export from server failed", e);
      alert("Export from server failed. Check console.");
    } finally {
      setExportingFromServer(false);
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notes-export-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToMarkdown = () => {
    let markdown = "# Notes Export\n\n";
    markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
    markdown += `Total Notes: ${notes.length}\n\n`;
    markdown += "---\n\n";

    notes.forEach((note, index) => {
      markdown += `## ${note.title || `Note ${index + 1}`}\n\n`;
      if (note.tags && note.tags.length > 0) {
        markdown += `**Tags:** ${note.tags.join(", ")}\n\n`;
      }
      if (note.priority) {
        markdown += `**Priority:** ${note.priority}\n\n`;
      }
      markdown += `${note.content || ""}\n\n`;
      markdown += `*Created: ${new Date(note.createdAt).toLocaleString()}*\n\n`;
      markdown += "---\n\n";
    });

    const dataBlob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notes-export-${new Date().toISOString().split("T")[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
      setImportFile(file);
    } else {
      alert("Please select a valid JSON file");
    }
  };

  const handleImport = () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedNotes = JSON.parse(e.target.result);
        if (Array.isArray(importedNotes)) {
          if (onImport) {
            onImport(importedNotes);
          }
          alert(`Successfully imported ${importedNotes.length} notes!`);
          setImportFile(null);
        } else {
          alert("Invalid file format. Expected an array of notes.");
        }
      } catch (error) {
        alert("Error parsing JSON file: " + error.message);
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div
      style={{
        width: "480px",
        margin: "20px auto",
        padding: "20px",
        background: "var(--bg-secondary)",
        borderRadius: "7px",
        boxShadow: "0 1px 5px var(--shadow)"
      }}
    >
      <h3 style={{ marginBottom: "15px", color: "var(--text-primary)" }}>Export / Import Notes</h3>

      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ marginBottom: "10px", color: "var(--text-primary)" }}>Export</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <button
            onClick={exportToJSON}
            style={{
              padding: "8px 16px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Export as JSON (current page)
          </button>
          <button
            onClick={exportToMarkdown}
            style={{
              padding: "8px 16px",
              background: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Export as Markdown
          </button>
          <button
            onClick={exportFromServer}
            disabled={exportingFromServer}
            style={{
              padding: "8px 16px",
              background: "#673AB7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: exportingFromServer ? "wait" : "pointer"
            }}
          >
            {exportingFromServer ? "Exporting…" : "Export from server (all notes)"}
          </button>
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: "10px", color: "var(--text-primary)" }}>Import</h4>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
          Import preserves integrations (deadline, news, financial, social). Use JSON exported from this app.
        </p>
        <input
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ marginBottom: "10px" }}
        />
        {importFile && (
          <div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px" }}>
              Selected: {importFile.name}
            </p>
            <button
              onClick={handleImport}
              style={{
                padding: "8px 16px",
                background: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Import Notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportImport;


import React, { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";

const CommandPalette = ({ isOpen, onClose, onCommand }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = [
    { id: "create-note", label: "Create Note", action: () => onCommand("create-note") },
    { id: "search", label: "Search Notes", action: () => onCommand("search") },
    { id: "dashboard", label: "Open Dashboard", action: () => onCommand("dashboard") },
    { id: "deadlines", label: "Open Deadlines", action: () => onCommand("deadlines") },
    { id: "trash", label: "Open Trash", action: () => onCommand("trash") },
    { id: "export", label: "Export Notes", action: () => onCommand("export") },
    { id: "import", label: "Import Notes", action: () => onCommand("import") },
    { id: "dark-mode", label: "Toggle Dark Mode", action: () => onCommand("dark-mode") },
    { id: "focus-mode", label: "Focus Mode", action: () => onCommand("focus-mode") }
  ];

  const fuse = new Fuse(commands, {
    keys: ["label"],
    threshold: 0.3
  });

  const filteredCommands = query
    ? fuse.search(query).map(result => result.item)
    : commands;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        zIndex: 10000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "20vh"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "600px",
          background: "var(--bg-secondary)",
          borderRadius: "8px",
          boxShadow: "0 4px 6px var(--shadow)",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "12px", borderBottom: "1px solid var(--border-color)" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "16px",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--text-primary)"
            }}
          />
        </div>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <div
                key={command.id}
                onClick={() => {
                  command.action();
                  onClose();
                }}
                style={{
                  padding: "12px 16px",
                  background: index === selectedIndex ? "var(--bg-tertiary)" : "transparent",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  borderLeft: index === selectedIndex ? "3px solid #f5ba13" : "3px solid transparent"
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {command.label}
              </div>
            ))
          )}
        </div>
        <div style={{ padding: "8px", fontSize: "12px", color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)" }}>
          <span>↑↓ Navigate</span> • <span>Enter Select</span> • <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;


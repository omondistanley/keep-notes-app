import React, { useState, useEffect } from "react";
import { API_BASE } from "../config";

const TemplateSelector = ({ onSelectTemplate, open, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [showSelector, setShowSelector] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : showSelector;

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (isControlled && open) setShowSelector(true);
  }, [isControlled, open]);

  async function fetchTemplates() {
    try {
      const response = await fetch(`${API_BASE}/api/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates", error);
    }
  }

  function processTemplate(template) {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    
    let title = template.title;
    let content = template.content;
    
    // Replace template variables
    title = title.replace(/\{\{date\}\}/g, dateStr);
    title = title.replace(/\{\{topic\}\}/g, "");
    title = title.replace(/\{\{name\}\}/g, "");
    
    content = content.replace(/\{\{date\}\}/g, dateStr);
    content = content.replace(/\{\{startDate\}\}/g, dateStr);
    content = content.replace(/\{\{deadline\}\}/g, "");
    content = content.replace(/\{\{name\}\}/g, "");
    content = content.replace(/\{\{attendees\}\}/g, "");
    
    return {
      title: title,
      content: content,
      tags: template.tags || []
    };
  }

  function handleSelectTemplate(template) {
    const processed = processTemplate(template);
    if (onSelectTemplate) {
      onSelectTemplate(processed);
    }
    setShowSelector(false);
    if (isControlled && onClose) onClose();
  }

  function handleClose() {
    setShowSelector(false);
    if (isControlled && onClose) onClose();
  }

  return (
    <div>
      {!isControlled && (
        <button
          onClick={() => setShowSelector(!showSelector)}
          style={{
            padding: "8px 16px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "10px"
          }}
        >
          <span role="img" aria-label="Template">📋</span> Use Template
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select template"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px"
          }}
          onClick={handleClose}
        >
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 4px 20px var(--shadow)",
              minWidth: "280px",
              maxWidth: "90vw"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ marginBottom: "12px", color: "var(--text-primary)" }}>Select Template</h4>
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 12px",
                  marginBottom: "6px",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px"
                }}
              >
                {template.name}
              </button>
            ))}
            <button
              onClick={handleClose}
              style={{
                marginTop: "12px",
                padding: "8px 16px",
                background: "#666",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;


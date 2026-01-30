import React, { useState, useEffect } from "react";
import { API_BASE } from "../config";

const TemplateSelector = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

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
  }

  return (
    <div>
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

      {showSelector && (
        <div
          style={{
            position: "absolute",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            padding: "15px",
            boxShadow: "0 4px 6px var(--shadow)",
            zIndex: 1000,
            minWidth: "250px"
          }}
        >
          <h4 style={{ marginBottom: "10px", color: "var(--text-primary)" }}>Select Template</h4>
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              style={{
                display: "block",
                width: "100%",
                padding: "10px",
                marginBottom: "5px",
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              {template.name}
            </button>
          ))}
          <button
            onClick={() => setShowSelector(false)}
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              background: "#999",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;


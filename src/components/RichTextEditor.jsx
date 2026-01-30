import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { marked } from "marked";

const RichTextEditor = ({ value, onChange, placeholder = "Take a note..." }) => {
  const [showPreview, setShowPreview] = useState(false);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "code-block"],
      ["clean"]
    ]
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "code-block"
  ];

  return (
    <div>
      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            padding: "6px 12px",
            background: showPreview ? "#4CAF50" : "#999",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px"
          }}
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {showPreview ? (
        <div
          style={{
            minHeight: "200px",
            padding: "10px",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)"
          }}
          dangerouslySetInnerHTML={{ __html: marked(value || "") }}
        />
      ) : (
        <ReactQuill
          theme="snow"
          value={value || ""}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-primary)"
          }}
        />
      )}
    </div>
  );
};

export default RichTextEditor;


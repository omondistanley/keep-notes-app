import React, { useState, useEffect } from "react";

const FocusMode = ({ children, onExit }) => {
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Track fullscreen state if needed in the future
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const exitFocusMode = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      if (onExit) onExit();
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--bg-primary)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          padding: "10px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span style={{ color: "var(--text-primary)", fontSize: "14px" }}>Focus Mode</span>
        <button
          onClick={exitFocusMode}
          style={{
            padding: "6px 12px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Exit Focus Mode
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {children}
      </div>
    </div>
  );
};

export default FocusMode;


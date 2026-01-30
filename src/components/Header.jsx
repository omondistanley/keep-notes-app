import React from "react";

const navItemStyle = (active) => ({
  display: "block",
  width: "100%",
  padding: "12px 16px",
  textAlign: "left",
  border: "none",
  background: active ? "rgba(245, 186, 19, 0.25)" : "transparent",
  color: "inherit",
  cursor: "pointer",
  fontSize: "15px",
  fontFamily: "inherit",
  transition: "background 0.2s ease",
  borderRadius: "6px",
  marginBottom: "4px"
});

function Header({
  navOpen,
  onNavToggle,
  activeView,
  onSelectNotes,
  onSelectDashboard,
  onSelectDeadlines,
  onSelectTrash,
  onSelectExportImport,
  onSelectSplitView,
  onSelectVoice,
  onSelectDraw,
  onSelectEnhanced
}) {
  const handleNavSelect = (handler) => {
    if (typeof handler === "function") handler();
    onNavToggle(false);
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <h1 className="header-title">yApSs</h1>
        <button
          type="button"
          className="header-hamburger"
          onClick={() => onNavToggle(!navOpen)}
          aria-expanded={navOpen}
          aria-label={navOpen ? "Close menu" : "Open menu"}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>

      {navOpen && (
        <>
          <div
            className="nav-backdrop"
            onClick={() => onNavToggle(false)}
            aria-hidden="true"
          />
          <nav className="nav-drawer" role="navigation" aria-label="Main navigation">
            <ul className="nav-list">
              <li>
                <button
                  type="button"
                  style={navItemStyle(activeView === "notes")}
                  onClick={() => handleNavSelect(onSelectNotes)}
                >
                  📋 Notes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(activeView === "dashboard")}
                  onClick={() => handleNavSelect(onSelectDashboard)}
                >
                  📊 Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(activeView === "deadlines")}
                  onClick={() => handleNavSelect(onSelectDeadlines)}
                >
                  📅 Deadlines
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(activeView === "trash")}
                  onClick={() => handleNavSelect(onSelectTrash)}
                >
                  🗑️ Trash
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(activeView === "exportImport")}
                  onClick={() => handleNavSelect(onSelectExportImport)}
                >
                  📤 Export / Import
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(false)}
                  onClick={() => handleNavSelect(onSelectSplitView)}
                >
                  ⬌ Split View
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(false)}
                  onClick={() => handleNavSelect(onSelectVoice)}
                >
                  🎤 Voice
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(false)}
                  onClick={() => handleNavSelect(onSelectDraw)}
                >
                  ✏️ Draw
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(false)}
                  onClick={() => handleNavSelect(onSelectEnhanced)}
                >
                  ＋ Enhanced
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}

export default Header;

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
  onSelectEnhanced,
  sidebar = false
}) {
  const handleNavSelect = (handler) => {
    if (typeof handler === "function") handler();
    onNavToggle(false);
  };

  const brandAndHamburger = (
    <>
      <h1 className="header-title sidebar-brand-title">yApSs</h1>
      <button
        type="button"
        className="header-hamburger sidebar-hamburger"
        onClick={() => onNavToggle(!navOpen)}
        aria-expanded={navOpen}
        aria-label={navOpen ? "Close menu" : "Open menu"}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>
    </>
  );

  if (sidebar) {
    return (
      <div className="sidebar-header">
        {brandAndHamburger}
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
                    <span role="img" aria-label="Notes">📋</span> Notes
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    style={navItemStyle(activeView === "dashboard")}
                    onClick={() => handleNavSelect(onSelectDashboard)}
                  >
                    <span role="img" aria-label="Dashboard">📊</span> Dashboard
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    style={navItemStyle(activeView === "deadlines")}
                    onClick={() => handleNavSelect(onSelectDeadlines)}
                  >
                    <span role="img" aria-label="Deadlines">📅</span> Deadlines
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    style={navItemStyle(activeView === "trash")}
                    onClick={() => handleNavSelect(onSelectTrash)}
                  >
                    <span role="img" aria-label="Trash">🗑️</span> Trash
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    style={navItemStyle(activeView === "exportImport")}
                    onClick={() => handleNavSelect(onSelectExportImport)}
                  >
                    <span role="img" aria-label="Export Import">📤</span> Export / Import
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    style={navItemStyle(false)}
                    onClick={() => handleNavSelect(onSelectSplitView)}
                  >
                    <span role="img" aria-label="Split view">⬌</span> Split View
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    style={navItemStyle(false)}
                    onClick={() => handleNavSelect(onSelectVoice)}
                  >
                    <span role="img" aria-label="Voice">🎤</span> Voice
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    style={navItemStyle(false)}
                    onClick={() => handleNavSelect(onSelectDraw)}
                  >
                    <span role="img" aria-label="Draw">✏️</span> Draw
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    style={navItemStyle(false)}
                    onClick={() => handleNavSelect(onSelectEnhanced)}
                  >
                    <span role="img" aria-label="Enhanced">＋</span> Enhanced
                  </button>
                </li>
              </ul>
            </nav>
          </>
        )}
      </div>
    );
  }

  return (
    <header className="app-header">
      <div className="header-inner">
        {brandAndHamburger}
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
                  <span role="img" aria-label="Notes">📋</span> Notes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(activeView === "dashboard")}
                  onClick={() => handleNavSelect(onSelectDashboard)}
                >
                  <span role="img" aria-label="Dashboard">📊</span> Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(activeView === "deadlines")}
                  onClick={() => handleNavSelect(onSelectDeadlines)}
                >
                  <span role="img" aria-label="Deadlines">📅</span> Deadlines
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(activeView === "trash")}
                  onClick={() => handleNavSelect(onSelectTrash)}
                >
                  <span role="img" aria-label="Trash">🗑️</span> Trash
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(activeView === "exportImport")}
                  onClick={() => handleNavSelect(onSelectExportImport)}
                >
                  <span role="img" aria-label="Export Import">📤</span> Export / Import
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(false)}
                  onClick={() => handleNavSelect(onSelectSplitView)}
                >
                  <span role="img" aria-label="Split view">⬌</span> Split View
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(false)}
                  onClick={() => handleNavSelect(onSelectVoice)}
                >
                  <span role="img" aria-label="Voice">🎤</span> Voice
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(false)}
                  onClick={() => handleNavSelect(onSelectDraw)}
                >
                  <span role="img" aria-label="Draw">✏️</span> Draw
                </button>
              </li>
              <li>
                <button
                  type="button"
                  style={navItemStyle(false)}
                  onClick={() => handleNavSelect(onSelectEnhanced)}
                >
                  <span role="img" aria-label="Enhanced">＋</span> Enhanced
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

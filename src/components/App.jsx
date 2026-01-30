/**
 * Functional component that manages a list of notes in a React application.
 *
 * @returns {JSX.Element} The rendered React component.
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Note from "./Note";
import CreateArea from "./CreateArea";
import TrashView from "./TrashView";
import ExportImport from "./ExportImport";
import TemplateSelector from "./TemplateSelector";
import ThemeToggle from "./ThemeToggle";
import IntegrationDashboard from "./IntegrationDashboard";
import CommandPalette from "./CommandPalette";
import SplitView from "./SplitView";
import VoiceRecorder from "./VoiceRecorder";
import DrawingCanvas from "./DrawingCanvas";
import FocusMode from "./FocusMode";
import EnhancedNoteForm from "./EnhancedNoteForm";
import DeadlinesView from "./DeadlinesView";
import useWebSocket from "../hooks/useWebSocket";
import { useTheme } from "../contexts/ThemeContext";
import { API_BASE, WS_URL } from "../config";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getSymbolDisplay } from "../constants/symbolNames";

function App() {
  const { theme, toggleTheme } = useTheme();
  const searchInputRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  // eslint-disable-next-line no-unused-vars
  const [filterTags, setFilterTags] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [filterPriority, setFilterPriority] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [showArchived, setShowArchived] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showDeadlines, setShowDeadlines] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSplitView, setShowSplitView] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showEnhancedForm, setShowEnhancedForm] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [openNoteModalId, setOpenNoteModalId] = useState(null);
  const [openNewsModalNoteId, setOpenNewsModalNoteId] = useState(null);
  const [openFinancialModalNoteId, setOpenFinancialModalNoteId] = useState(null);
  const [financialChartSymbol, setFinancialChartSymbol] = useState(null);
  const [financialChartData, setFinancialChartData] = useState(null);
  const [financialChartLoading, setFinancialChartLoading] = useState(false);
  const [financialChartRange, setFinancialChartRange] = useState("1mo");
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topMoversLoadingId, setTopMoversLoadingId] = useState(null);
  const [predictiveSearchQ, setPredictiveSearchQ] = useState("");
  const [predictiveSearchResults, setPredictiveSearchResults] = useState([]);
  const [predictiveLinking, setPredictiveLinking] = useState(false);
  const [nyuziSearchQ, setNyuziSearchQ] = useState("");
  const [nyuziSearchResults, setNyuziSearchResults] = useState([]);
  const [nyuziLinking, setNyuziLinking] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [availableTags, setAvailableTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage] = useState(20);
  const [selectedNoteIdForView, setSelectedNoteIdForView] = useState(null);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`);
      if (res.ok) {
        const { count } = await res.json();
        setNotificationUnreadCount(count);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  /**
   * Fetches the notes from the API when the component mounts. 
   * Makes use of the get from the server.jsx file in the connection and database. 
   */
  const fetchNotes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (filterTags.length > 0) {
        filterTags.forEach(tag => params.append("tags", tag));
      }
      if (filterPriority) params.append("priority", filterPriority);
      if (showArchived) params.append("isArchived", "true");
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      params.append("page", currentPage);
      params.append("limit", 20);

      const url = searchQuery 
        ? `${API_BASE}/api/notes/search?${params.toString()}`
        : `${API_BASE}/api/notes/GetNotes?${params.toString()}`;

      const response = await fetch(url);

      if (response.ok) {
        const fetchedNotes = await response.json();
        setNotes(fetchedNotes);
      } else {
        console.error("Failed to fetch notes");
      }
    } catch (error) {
      console.error("Error fetching notes", error);
    }
  }, [searchQuery, filterTags, filterPriority, showArchived, sortBy, sortOrder, currentPage]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notes/tags`);
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error("Error fetching tags", error);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchTags();
    fetchNotificationCount();
  }, [fetchNotes, fetchTags, fetchNotificationCount]);

  // WebSocket for real-time updates
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === "note_update") {
      fetchNotes();
      fetchTags();
    }
    if (data.type === "notification" && data.data) {
      setNotificationUnreadCount((prev) => prev + 1);
      setToastNotification(data.data);
    }
  }, [fetchNotes, fetchTags]);

  useEffect(() => {
    if (!toastNotification) return;
    const t = setTimeout(() => setToastNotification(null), 4000);
    return () => clearTimeout(t);
  }, [toastNotification]);

  useWebSocket(WS_URL, handleWebSocketMessage);

  // Command Palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle command palette commands
  const handleCommand = useCallback((command) => {
    setShowCommandPalette(false);
    switch (command) {
      case "create-note":
        setShowEnhancedForm(true);
        setSelectedNoteId(null);
        break;
      case "search":
        setTimeout(() => searchInputRef.current?.focus(), 0);
        break;
      case "dashboard":
        setShowDashboard(true);
        setShowTrash(false);
        setShowExportImport(false);
        setShowDeadlines(false);
        break;
      case "trash":
        setShowTrash(true);
        setShowDashboard(false);
        setShowExportImport(false);
        setShowDeadlines(false);
        break;
      case "export":
        setShowExportImport(true);
        break;
      case "import":
        setShowExportImport(true);
        break;
      case "dark-mode":
        toggleTheme();
        break;
      case "focus-mode":
        setShowFocusMode(true);
        break;
      case "deadlines":
        setShowDeadlines(true);
        setShowDashboard(false);
        setShowTrash(false);
        setShowExportImport(false);
        break;
      default:
        break;
    }
  }, [toggleTheme]);

  const openEnhancedFormForNote = useCallback((noteId) => {
    setSelectedNoteId(noteId);
    setShowEnhancedForm(true);
  }, []);

  const fetchNewsForNote = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/api/notes/${id}/fetch-news`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to fetch news");
    await fetchNotes();
  }, [fetchNotes]);

  const fetchTweetsForNote = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/api/notes/${id}/fetch-tweets`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to fetch tweets");
    await fetchNotes();
  }, [fetchNotes]);

  const updateFinancialForNote = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/api/notes/${id}/update-financial`, { method: "POST", headers: { "Content-Type": "application/json" } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to update financial");
    await fetchNotes();
  }, [fetchNotes]);

  const updateAllForNote = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/api/notes/${id}/update-all`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to update all");
    await fetchNotes();
  }, [fetchNotes]);

  const searchPredictiveMarkets = useCallback(async (q) => {
    if (!q.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/predictive/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json().catch(() => ({}));
      setPredictiveSearchResults(data.markets || []);
    } catch (e) {
      setPredictiveSearchResults([]);
    }
  }, []);

  const linkPredictiveMarket = useCallback(async (noteId, platform, marketId) => {
    setPredictiveLinking(true);
    try {
      const res = await fetch(`${API_BASE}/api/notes/${noteId}/link-predictive-market`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, marketId })
      });
      if (res.ok) {
        await fetchNotes();
      }
    } finally {
      setPredictiveLinking(false);
    }
  }, [fetchNotes]);

  const searchNyuziMarkets = useCallback(async (q) => {
    if (!q.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/nyuzi/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json().catch(() => ({}));
      setNyuziSearchResults(Array.isArray(data) ? data : data.markets || []);
    } catch (e) {
      setNyuziSearchResults([]);
    }
  }, []);

  const linkNyuziMarket = useCallback(async (noteId, marketId) => {
    setNyuziLinking(true);
    try {
      const res = await fetch(`${API_BASE}/api/notes/${noteId}/nyuzi-market`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId })
      });
      if (res.ok) {
        await fetchNotes();
      }
    } finally {
      setNyuziLinking(false);
    }
  }, [fetchNotes]);

  const loadFinancialChart = useCallback(async (symbol, range = "1mo") => {
    if (!symbol) return;
    setFinancialChartSymbol(symbol);
    setFinancialChartLoading(true);
    setFinancialChartData(null);
    try {
      const res = await fetch(`${API_BASE}/api/financial/history?symbol=${encodeURIComponent(symbol)}&range=${range}`);
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.data && data.data.length > 0) {
        setFinancialChartData(data);
        setFinancialChartRange(range);
      } else {
        setFinancialChartData(null);
      }
    } catch (e) {
      setFinancialChartData(null);
    } finally {
      setFinancialChartLoading(false);
    }
  }, []);

  // Refetch notes when filters change
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  /**
   * Adds a new note to the `notes` state and the API.
   * Makes use of the post from the server.jsx file in the connection & database. 
   * @param {Object} newNote - The new note to be added.
   */
  const addNote = useCallback(async (newNote) => {
    try {
      const response = await fetch(`${API_BASE}/api/notes/AddNote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newNote),
      });

      if (response.ok) {
        fetchNotes();
        fetchTags();
      } else {
        console.error("Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note", error);
    }
  }, [fetchNotes, fetchTags]);

  /**
   * Updates an existing note.
   * @param {string} id - The id of the note to be updated.
   * @param {Object} updateData - The data to update.
   */
  const updateNote = useCallback(async (id, updateData) => {
    try {
      const response = await fetch(`${API_BASE}/api/notes/UpdateNote/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        fetchNotes();
        fetchTags();
      } else {
        console.error("Failed to update note");
      }
    } catch (error) {
      console.error("Error updating note", error);
    }
  }, [fetchNotes, fetchTags]);

  // Add content to current note (used in Split View – voice, drawing, text)
  const onAddVoiceToNote = useCallback((transcript) => {
    if (!selectedNoteId) return;
    const note = notes.find((n) => n._id === selectedNoteId);
    if (!note) return;
    const newContent = (note.content || "").trim() + (note.content ? "\n\n" : "") + "[Voice]: " + transcript;
    updateNote(selectedNoteId, { content: newContent });
  }, [selectedNoteId, notes, updateNote]);

  const onAddDrawingToNote = useCallback((dataURL) => {
    if (!selectedNoteId) return;
    const note = notes.find((n) => n._id === selectedNoteId);
    if (!note) return;
    const drawings = Array.isArray(note.drawings) ? [...note.drawings, dataURL] : [dataURL];
    updateNote(selectedNoteId, { drawings });
  }, [selectedNoteId, notes, updateNote]);

  const onAddTextToNote = useCallback((text) => {
    if (!selectedNoteId || !text.trim()) return;
    const note = notes.find((n) => n._id === selectedNoteId);
    if (!note) return;
    const newContent = (note.content || "").trim() + (note.content ? "\n\n" : "") + text.trim();
    updateNote(selectedNoteId, { content: newContent });
  }, [selectedNoteId, notes, updateNote]);

  // Handle template selection
  const handleTemplateSelect = useCallback((templateData) => {
    addNote(templateData);
  }, [addNote]);

  // Handle import
  const handleImport = useCallback(async (importedNotes) => {
    try {
      const response = await fetch(`${API_BASE}/api/notes/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: importedNotes }),
      });

      if (response.ok) {
        fetchNotes();
        fetchTags();
      }
    } catch (error) {
      console.error("Error importing notes", error);
    }
  }, [fetchNotes, fetchTags]);

  // Pagination
  const paginatedNotes = useMemo(() => {
    const startIndex = (currentPage - 1) * notesPerPage;
    return notes.slice(startIndex, startIndex + notesPerPage);
  }, [notes, currentPage, notesPerPage]);

  const totalPages = Math.ceil(notes.length / notesPerPage);

  const activeView = showDashboard ? "dashboard" : showDeadlines ? "deadlines" : showTrash ? "trash" : showExportImport ? "exportImport" : "notes";

  const closeAllModals = useCallback(() => {
    setShowDashboard(false);
    setShowTrash(false);
    setShowExportImport(false);
    setShowDeadlines(false);
  }, []);

  // Group notes by folder (first tag or "Notes" for unfiled)
  const notesByFolder = useMemo(() => {
    const map = new Map();
    paginatedNotes.forEach((note) => {
      const folderName = (note.tags && note.tags[0]) ? note.tags[0] : "Notes";
      if (!map.has(folderName)) map.set(folderName, []);
      map.get(folderName).push(note);
    });
    // Sort keys: "Notes" first, then alphabetical
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (a === "Notes") return -1;
      if (b === "Notes") return 1;
      return a.localeCompare(b);
    });
    return keys.map((key) => ({ folder: key, notes: map.get(key) }));
  }, [paginatedNotes]);

  const handleSidebarNoteClick = useCallback((noteId) => {
    closeAllModals();
    setSelectedNoteIdForView(noteId);
    setNavOpen(false);
  }, [closeAllModals]);

  // Note: Removed localStorage sync as we're using server-side storage

  /**
   * Pins or unpins a note.
   */
  async function pinNote(id, isPinned) {
    try {
      const response = await fetch(`${API_BASE}/api/notes/${id}/pin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPinned }),
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error("Error pinning note", error);
    }
  }

  /**
   * Archives or unarchives a note.
   */
  async function archiveNote(id, isArchived) {
    try {
      const response = await fetch(`${API_BASE}/api/notes/${id}/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isArchived }),
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error("Error archiving note", error);
    }
  }

  /**
   * Moves a note to trash.
   */
  async function trashNote(id, isDeleted) {
    try {
      const response = await fetch(`${API_BASE}/api/notes/${id}/trash`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isDeleted }),
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error("Error trashing note", error);
    }
  }

  /**
   * Deletes a note from the `notes` state and the API.
   * Makes use of the delete function from the server.jsx and the database. 
   * @param {string} id - The id of the note to be deleted.
   */
  async function deleteNote(id) {
    try {
      const response = await fetch(`${API_BASE}/api/notes/DeleteNote/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        response.json().then((addedNote) => {
          setNotes((prevNotes) => prevNotes.filter((noteItem) => noteItem._id !== id));
        });
      } else {
        console.error("Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note", error);
    }
  }

  // Handle enhanced form save
  const handleEnhancedFormSave = useCallback(async (formData) => {
    if (selectedNoteId) {
      await updateNote(selectedNoteId, formData);
      setSelectedNoteId(null);
    } else {
      await addNote(formData);
    }
    setShowEnhancedForm(false);
  }, [selectedNoteId, updateNote, addNote]);

  // Handle voice transcript
  const handleVoiceTranscript = useCallback((transcript) => {
    addNote({
      title: "Voice Note",
      content: transcript,
      tags: ["voice"]
    });
    setShowVoiceRecorder(false);
  }, [addNote]);

  // Handle drawing save
  const handleDrawingSave = useCallback((dataURL) => {
    addNote({
      title: "Drawing",
      content: "See attached drawing",
      attachments: [{ type: "image", url: dataURL }],
      tags: ["drawing"]
    });
    setShowDrawing(false);
  }, [addNote]);

  const modalOverlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  };
  const modalContentStyle = {
    background: "var(--bg-secondary, #fff)",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    maxWidth: "min(900px, 95vw)",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    padding: "16px"
  };

  return (
    <div style={{ background: theme === "dark" ? "#1a1a1a" : "#eee", minHeight: "100vh" }}>
      {toastNotification && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            maxWidth: "360px",
            padding: "12px 16px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            boxShadow: "0 4px 20px var(--shadow)",
            zIndex: 9999,
            fontSize: "14px",
            color: "var(--text-primary)"
          }}
        >
          <strong>{toastNotification.title}</strong>
          {toastNotification.body && <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-secondary)" }}>{toastNotification.body}</div>}
        </div>
      )}
      <div className="app-layout">
        <aside className={`app-sidebar ${sidebarCollapsed ? "app-sidebar--collapsed" : ""}`} aria-label="Sidebar">
          <Header
            sidebar
            navOpen={navOpen}
            onNavToggle={(open) => {
              if (sidebarCollapsed && open) setSidebarCollapsed(false);
              setNavOpen(open);
            }}
            sidebarCollapsed={sidebarCollapsed}
            onBrandSingleTap={() => setSidebarCollapsed((c) => !c)}
            onBrandDoubleTap={() => window.location.reload()}
            activeView={activeView}
            onSelectNotes={() => { closeAllModals(); setNavOpen(false); }}
            onSelectDashboard={() => { setShowTrash(false); setShowExportImport(false); setShowDeadlines(false); setShowDashboard(true); }}
            onSelectDeadlines={() => { setShowDashboard(false); setShowTrash(false); setShowExportImport(false); setShowDeadlines(true); }}
            onSelectTrash={() => { setShowDashboard(false); setShowExportImport(false); setShowDeadlines(false); setShowTrash(true); }}
            onSelectExportImport={() => { setShowTrash(false); setShowDashboard(false); setShowDeadlines(false); setShowExportImport(true); }}
            onSelectSplitView={() => {
              setShowSplitView(true);
              if (selectedNoteIdForView) setSelectedNoteId(selectedNoteIdForView);
            }}
            onSelectVoice={() => { setShowVoiceRecorder(true); setShowDrawing(false); }}
            onSelectDraw={() => { setShowDrawing(true); setShowVoiceRecorder(false); }}
            onSelectEnhanced={() => { setShowEnhancedForm(true); setSelectedNoteId(null); }}
            onSelectSearch={() => setTimeout(() => searchInputRef.current?.focus(), 0)}
            notificationUnreadCount={notificationUnreadCount}
            showNotificationPanel={showNotificationPanel}
            onNotificationPanelToggle={() => setShowNotificationPanel((v) => !v)}
            onNotificationsRefresh={fetchNotificationCount}
          />
          {!sidebarCollapsed && (
            <>
              <div className="sidebar-search-wrap">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sidebar-search-input"
                  aria-label="Search notes"
                />
                <div className="sidebar-sort-row">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sidebar-sort-select"
                    aria-label="Sort by"
                  >
                    <option value="updatedAt">Updated</option>
                    <option value="createdAt">Created</option>
                    <option value="title">Title</option>
                    <option value="priority">Priority</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="sidebar-sort-order-btn"
                    aria-label={sortOrder === "asc" ? "Sort ascending" : "Sort descending"}
                    title={sortOrder === "asc" ? "Ascending" : "Descending"}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
              <div className="sidebar-notes-label">
                <span role="img" aria-hidden="true">📁</span> Saved notes
              </div>
              <div className="sidebar-notes-list" role="navigation" aria-label="Saved notes">
                {notesByFolder.length === 0 ? (
                  <p className="sidebar-empty-state">{searchQuery ? "No matches" : "No notes yet"}</p>
                ) : (
                  <ul className="sidebar-folders">
                    {notesByFolder.map(({ folder, notes: folderNotes }) => (
                      <li key={folder} className="sidebar-folder">
                        <span className="sidebar-folder-name">
                          <span role="img" aria-hidden="true">📁</span> {folder}
                        </span>
                        <ul className="sidebar-notes-inner">
                          {folderNotes.map((noteItem) => (
                            <li key={noteItem._id}>
                              <button
                                type="button"
                                className={`sidebar-note-item ${selectedNoteIdForView === noteItem._id ? "active" : ""}`}
                                onClick={() => handleSidebarNoteClick(noteItem._id)}
                                aria-label={`Open note: ${noteItem.title || "Untitled"}`}
                                aria-current={selectedNoteIdForView === noteItem._id ? "true" : undefined}
                              >
                                <span className="sidebar-note-item-title">{noteItem.title || "Untitled"}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
                {totalPages > 1 && (
                  <div className="sidebar-pagination">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="sidebar-pagination-btn"
                      aria-label="Previous page"
                    >
                      Prev
                    </button>
                    <span className="sidebar-pagination-info" aria-live="polite">{currentPage}/{totalPages}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="sidebar-pagination-btn"
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
        <main className="app-main">
          <ThemeToggle />
      
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onCommand={handleCommand}
      />
      
      {showFocusMode && (
        <FocusMode onExit={() => setShowFocusMode(false)}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <CreateArea onAdd={addNote} />
            {notes.slice(0, 5).map((noteItem) => (
              <Note
                key={noteItem._id}
                id={noteItem._id}
                title={noteItem.title}
                content={noteItem.content}
                tags={noteItem.tags || []}
                priority={noteItem.priority}
                isPinned={noteItem.isPinned}
                isArchived={noteItem.isArchived}
                deadline={noteItem.deadline}
                news={noteItem.news}
                financial={noteItem.financial}
                social={noteItem.social}
                attachments={noteItem.attachments}
                drawings={noteItem.drawings}
                onOpenModal={() => setOpenNoteModalId(noteItem._id)}
                onOpenNewsModal={() => setOpenNewsModalNoteId(noteItem._id)}
                onOpenFinancialModal={() => setOpenFinancialModalNoteId(noteItem._id)}
                onDelete={() => deleteNote(noteItem._id)}
                onUpdate={updateNote}
                onPin={pinNote}
                onArchive={archiveNote}
                onTrash={trashNote}
                onOpenEnhancedEdit={() => openEnhancedFormForNote(noteItem._id)}
                onFetchNews={fetchNewsForNote}
                onFetchTweets={fetchTweetsForNote}
                onUpdateFinancial={updateFinancialForNote}
                onUpdateAll={updateAllForNote}
                onIntegrationComplete={fetchNotes}
              />
            ))}
          </div>
        </FocusMode>
      )}
      
      {showEnhancedForm && (
        <EnhancedNoteForm
          note={selectedNoteId ? notes.find(n => n._id === selectedNoteId) : null}
          onSave={handleEnhancedFormSave}
          onCancel={() => {
            setShowEnhancedForm(false);
            setSelectedNoteId(null);
          }}
        />
      )}

      {/* Note modal: open note in centered overlay when clicking a note card */}
      {openNoteModalId && (() => {
        const modalNote = notes.find(n => n._id === openNoteModalId);
        if (!modalNote) return null;
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Note details"
            onClick={() => setOpenNoteModalId(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-secondary, #fff)",
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                maxWidth: "min(720px, 92vw)",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                position: "relative",
                padding: "16px"
              }}
            >
              <Note
                key={modalNote._id}
                id={modalNote._id}
                title={modalNote.title}
                content={modalNote.content}
                tags={modalNote.tags || []}
                priority={modalNote.priority}
                isPinned={modalNote.isPinned}
                isArchived={modalNote.isArchived}
                deadline={modalNote.deadline}
                news={modalNote.news}
                financial={modalNote.financial}
                social={modalNote.social}
                attachments={modalNote.attachments}
                drawings={modalNote.drawings}
                isModal
                onCloseModal={() => setOpenNoteModalId(null)}
                onOpenNewsModal={() => setOpenNewsModalNoteId(modalNote._id)}
                onOpenFinancialModal={() => setOpenFinancialModalNoteId(modalNote._id)}
                onDelete={() => { deleteNote(modalNote._id); setOpenNoteModalId(null); }}
                onUpdate={updateNote}
                onPin={pinNote}
                onArchive={archiveNote}
                onTrash={trashNote}
                onOpenEnhancedEdit={() => { setOpenNoteModalId(null); openEnhancedFormForNote(modalNote._id); }}
                onFetchNews={fetchNewsForNote}
                onFetchTweets={fetchTweetsForNote}
                onUpdateFinancial={updateFinancialForNote}
                onUpdateAll={updateAllForNote}
                onIntegrationComplete={() => { fetchNotes(); }}
              />
            </div>
          </div>
        );
      })()}

      {/* News modal: subject-tied summary from top 25 articles + full article list */}
      {openNewsModalNoteId && (() => {
        const note = notes.find(n => n._id === openNewsModalNoteId);
        if (!note) return null;
        const articles = (note.news?.articles && Array.isArray(note.news.articles)) ? note.news.articles : [];
        const keywords = note.news?.keywords || [];
        const subjectSummary = note.news?.summary;
        const fallbackSummary = [
          note.title?.trim(),
          (note.content || "").trim().slice(0, 200),
          keywords.length ? `Topics: ${keywords.slice(0, 8).join(", ")}` : ""
        ].filter(Boolean).join(" · ");
        const displaySummary = subjectSummary || (fallbackSummary + (fallbackSummary.length > 250 ? "…" : "")) || "No summary.";
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="News"
            onClick={() => setOpenNewsModalNoteId(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-secondary, #fff)",
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                maxWidth: "640px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                position: "relative"
              }}
            >
              <div style={{ padding: "16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, color: "var(--text-primary)" }}><span role="img" aria-label="News">📰</span> News</h2>
                <button type="button" onClick={() => setOpenNewsModalNoteId(null)} style={{ padding: "6px 12px", background: "#666", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Close</button>
              </div>
              <div style={{ padding: "16px" }}>
                {subjectSummary ? (
                  <div style={{ marginBottom: "16px", padding: "12px", background: "var(--bg-tertiary, #f5f5f5)", borderRadius: "6px", borderLeft: "4px solid #1976d2" }}>
                    <strong style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Summary from top {Math.min(articles.length, 25)} articles (tied to this note)</strong>
                    <p style={{ fontSize: "14px", color: "var(--text-primary)", margin: "8px 0 0", lineHeight: 1.5 }}>{displaySummary}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary, #555)", marginBottom: "16px", fontStyle: "italic" }}>{displaySummary}</p>
                )}
                {articles.length === 0 ? (
                  <p style={{ color: "var(--text-secondary, #666)" }}>No articles yet. Use &quot;Fetch news&quot; on the note to load up to 25 articles and generate a subject summary.</p>
                ) : (
                  <>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>{articles.length} article{articles.length !== 1 ? "s" : ""} below.</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {articles.map((a, i) => (
                        <li key={i} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #eee" }}>
                          <a href={a.url || a.link || "#"} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", fontWeight: "bold" }}>{a.title || a.snippet || "Untitled"}</a>
                          {a.snippet && a.title && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>{a.snippet}</p>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Financial modal: top 100 gainers/losers/movers (relevance-first), then your symbols; click symbol for chart */}
      {openFinancialModalNoteId && (() => {
        const note = notes.find(n => n._id === openFinancialModalNoteId);
        if (!note) return null;
        const prices = (note.financial?.data?.prices && Array.isArray(note.financial.data.prices)) ? note.financial.data.prices : [];
        const type = note.financial?.type || "crypto";
        const indexes = (note.financial?.data?.indexes && Array.isArray(note.financial.data.indexes)) ? note.financial.data.indexes : [];
        const dataTopGainers = note.financial?.data?.topGainers;
        const dataTopLosers = note.financial?.data?.topLosers;
        const dataLargestMovers = note.financial?.data?.largestMovers;
        const hasTopMovers = dataTopGainers?.length || dataTopLosers?.length || dataLargestMovers?.length;
        const topGainers = (dataTopGainers && dataTopGainers.length > 0) ? dataTopGainers : [...prices].sort((a, b) => (Number(b.changePercent) ?? 0) - (Number(a.changePercent) ?? 0)).slice(0, 100);
        const topLosers = (dataTopLosers && dataTopLosers.length > 0) ? dataTopLosers : [...prices].sort((a, b) => (Number(a.changePercent) ?? 0) - (Number(b.changePercent) ?? 0)).slice(0, 100);
        const largestMovers = (dataLargestMovers && dataLargestMovers.length > 0) ? dataLargestMovers : [...prices].sort((a, b) => Math.abs(Number(b.changePercent) ?? 0) - Math.abs(Number(a.changePercent) ?? 0)).slice(0, 100);
        const topMoversLoading = topMoversLoadingId === note._id;
        const loadTopMovers = async () => {
          setTopMoversLoadingId(note._id);
          try {
            await fetch(`${API_BASE}/api/notes/${note._id}/top-movers`);
            await fetchNotes();
          } finally {
            setTopMoversLoadingId(null);
          }
        };
        const closeModal = () => {
          setOpenFinancialModalNoteId(null);
          setFinancialChartSymbol(null);
          setFinancialChartData(null);
        };
        const rowStyle = (clickable) => ({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: clickable ? "6px 8px" : "4px 0",
          borderBottom: "1px solid #f0f0f0",
          borderRadius: clickable ? "4px" : 0,
          background: clickable ? "var(--bg-tertiary, #f9f9f9)" : "transparent",
          cursor: clickable ? "pointer" : "default",
          transition: "background 0.15s ease"
        });
        const renderSymbolRow = (p, clickable = true) => {
          const sym = (p.symbol || "").toUpperCase();
          const label = getSymbolDisplay(sym, p.name);
          const content = (
            <>
              <span title={label}>
                {label.length > 28 ? label.slice(0, 26) + "…" : label}
                {((p.relevanceScore ?? 0) > 0.3 || p.inUserList) && <span style={{ marginLeft: "6px", fontSize: "10px", color: "#1976d2", fontWeight: "bold" }}>• relevant</span>}
              </span>
              {p.price != null && <span>{Number(p.price ?? p.last ?? 0).toFixed(2)}</span>}
              <span style={{ color: (p.changePercent >= 0) ? "#2e7d32" : "#c62828" }}>
                {p.changePercent != null ? `${p.changePercent >= 0 ? "+" : ""}${Number(p.changePercent).toFixed(1)}%` : "—"}
              </span>
            </>
          );
          if (clickable && type === "stock") {
            return (
              <li
                key={sym}
                style={rowStyle(true)}
                onClick={() => loadFinancialChart(sym, financialChartRange)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadFinancialChart(sym, financialChartRange); } }}
                role="button"
                tabIndex={0}
              >
                {content}
              </li>
            );
          }
          return <li key={sym} style={rowStyle(false)}>{content}</li>;
        };
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Financial"
            onClick={closeModal}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-secondary, #fff)",
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                maxWidth: "640px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                position: "relative"
              }}
            >
              <div style={{ padding: "16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <h2 style={{ margin: 0, color: "var(--text-primary)" }}><span role="img" aria-label="Financial">📈</span> Financial ({type})</h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {type === "stock" && (
                    <button type="button" onClick={() => loadTopMovers()} disabled={topMoversLoading} style={{ padding: "6px 12px", background: "#1976d2", color: "#fff", border: "none", borderRadius: "4px", cursor: topMoversLoading ? "wait" : "pointer", fontSize: "12px" }}>
                      {topMoversLoading ? "Loading…" : "Load top 100 movers"}
                    </button>
                  )}
                  <button type="button" onClick={closeModal} style={{ padding: "6px 12px", background: "#666", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Close</button>
                </div>
              </div>
              <div style={{ padding: "16px" }}>
                {/* Chart: show when a symbol was clicked (stocks/indexes only) */}
                {(financialChartData || financialChartLoading) && type === "stock" && (
                  <section style={{ marginBottom: "16px", padding: "12px", background: "var(--bg-tertiary, #f5f5f5)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <strong style={{ color: "var(--text-primary)" }}>
                        {financialChartLoading ? "Loading chart…" : (financialChartData?.name || financialChartSymbol) + " over time"}
                      </strong>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {["1mo", "3mo", "6mo", "1y"].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => loadFinancialChart(financialChartSymbol, r)}
                            disabled={financialChartLoading}
                            style={{
                              padding: "4px 10px",
                              fontSize: "12px",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              background: financialChartRange === r ? "#f5ba13" : "var(--bg-secondary, #fff)",
                              color: financialChartRange === r ? "#fff" : "var(--text-primary)",
                              cursor: financialChartLoading ? "wait" : "pointer"
                            }}
                          >
                            {r}
                          </button>
                        ))}
                        <button type="button" onClick={() => { setFinancialChartData(null); setFinancialChartSymbol(null); }} style={{ padding: "4px 10px", fontSize: "12px", border: "1px solid #ccc", borderRadius: "4px", background: "var(--bg-secondary)", cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                    {financialChartData && financialChartData.data && financialChartData.data.length > 0 && (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={financialChartData.data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} tickFormatter={(v) => Number(v).toFixed(0)} />
                          <Tooltip formatter={(v) => [Number(v).toFixed(2), "Close"]} labelFormatter={(l) => l} />
                          <Line type="monotone" dataKey="close" stroke="#1976d2" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </section>
                )}
                {!hasTopMovers && prices.length === 0 ? (
                  <p style={{ color: "var(--text-secondary, #666)" }}>No price data yet. Use &quot;Update financial&quot; on the note. For stocks, &quot;Load top 100 movers&quot; shows market-wide gainers/losers/movers. Click a symbol to see a chart over time.</p>
                ) : (
                  <>
                    {indexes.length > 0 && (
                      <section style={{ marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-primary)" }}>Major indexes</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
                          {indexes.map((p, i) => (
                            <li
                              key={i}
                              style={rowStyle(true)}
                              onClick={() => type === "stock" && loadFinancialChart((p.symbol || "").toUpperCase(), financialChartRange)}
                              onKeyDown={(e) => { if (type === "stock" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); loadFinancialChart((p.symbol || "").toUpperCase(), financialChartRange); } }}
                              role="button"
                              tabIndex={0}
                            >
                              <span title={p.name || p.symbol}>{getSymbolDisplay((p.symbol || "").toUpperCase(), p.name)}</span>
                              <span style={{ color: (p.changePercent >= 0) ? "#2e7d32" : "#c62828" }}>
                                {p.changePercent != null ? `${p.changePercent >= 0 ? "+" : ""}${Number(p.changePercent).toFixed(1)}%` : "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {hasTopMovers && <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>Top 100 stocks (relevance first). Click a symbol to see chart.</p>}
                    {largestMovers.length > 0 && (
                      <section style={{ marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-primary)" }}>Largest movers ({largestMovers.length})</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", maxHeight: "200px", overflowY: "auto" }}>
                          {largestMovers.map((p, i) => renderSymbolRow(p))}
                        </ul>
                      </section>
                    )}
                    {topGainers.length > 0 && (
                      <section style={{ marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "#2e7d32" }}>Top gainers ({topGainers.length})</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", maxHeight: "200px", overflowY: "auto" }}>
                          {topGainers.map((p, i) => renderSymbolRow(p))}
                        </ul>
                      </section>
                    )}
                    {topLosers.length > 0 && (
                      <section style={{ marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "#c62828" }}>Top losers ({topLosers.length})</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", maxHeight: "200px", overflowY: "auto" }}>
                          {topLosers.map((p, i) => renderSymbolRow(p))}
                        </ul>
                      </section>
                    )}
                    {prices.length > 0 && (
                      <section>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-primary)" }}>Your symbols</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px" }}>
                          {prices.map((p, i) => renderSymbolRow(p))}
                        </ul>
                      </section>
                    )}
                    {/* Link Predictive / Nyuzi */}
                    <section style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
                      <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-primary)" }}>Link Predictive / Nyuzi</h3>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>Search and link prediction markets to this note.</p>
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--text-secondary)" }}>Predictive (Polymarket, Kalshi, PredictIt)</label>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <input
                            type="text"
                            value={predictiveSearchQ}
                            onChange={(e) => setPredictiveSearchQ(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") searchPredictiveMarkets(predictiveSearchQ); }}
                            placeholder="Search markets..."
                            style={{ flex: 1, minWidth: "120px", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                          />
                          <button type="button" onClick={() => searchPredictiveMarkets(predictiveSearchQ)} style={{ padding: "6px 12px", background: "#1976d2", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Search</button>
                        </div>
                        {predictiveSearchResults.length > 0 && (
                          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", fontSize: "12px", maxHeight: "120px", overflowY: "auto" }}>
                            {predictiveSearchResults.slice(0, 5).map((m, i) => (
                              <li key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                                <span>{m.question || m.platform || "Market"}</span>
                                <button type="button" disabled={predictiveLinking} onClick={() => linkPredictiveMarket(openFinancialModalNoteId, m.platform || "polymarket", m.marketId || m.id)} style={{ padding: "4px 8px", fontSize: "11px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "4px", cursor: predictiveLinking ? "wait" : "pointer" }}>Link</button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "var(--text-secondary)" }}>Nyuzi</label>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <input
                            type="text"
                            value={nyuziSearchQ}
                            onChange={(e) => setNyuziSearchQ(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") searchNyuziMarkets(nyuziSearchQ); }}
                            placeholder="Search Nyuzi..."
                            style={{ flex: 1, minWidth: "120px", padding: "6px 10px", fontSize: "13px", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                          />
                          <button type="button" onClick={() => searchNyuziMarkets(nyuziSearchQ)} style={{ padding: "6px 12px", background: "#1976d2", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Search</button>
                        </div>
                        {nyuziSearchResults.length > 0 && (
                          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", fontSize: "12px", maxHeight: "120px", overflowY: "auto" }}>
                            {nyuziSearchResults.slice(0, 5).map((m, i) => (
                              <li key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                                <span>{m.title || m.id || "Market"}</span>
                                <button type="button" disabled={nyuziLinking} onClick={() => linkNyuziMarket(openFinancialModalNoteId, m.id || m.marketId)} style={{ padding: "4px 8px", fontSize: "11px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "4px", cursor: nyuziLinking ? "wait" : "pointer" }}>Link</button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      
      {showVoiceRecorder && (
        <div style={{ width: "600px", margin: "20px auto" }}>
          <VoiceRecorder onTranscript={handleVoiceTranscript} />
        </div>
      )}
      
      {showDrawing && (
        <div style={{ width: "900px", margin: "20px auto" }}>
          <DrawingCanvas onSave={handleDrawingSave} />
        </div>
      )}
      
      {showSplitView && !showEnhancedForm && !showVoiceRecorder && !showDrawing && (
        <div style={{ width: "95%", margin: "20px auto" }}>
          <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
            <h2 style={{ color: "var(--text-primary)" }}>Split View</h2>
            <button
              onClick={() => setShowSplitView(false)}
              style={{
                padding: "8px 16px",
                background: "#999",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Exit Split View
            </button>
          </div>
          <SplitView
            notes={notes}
            selectedNoteId={selectedNoteId}
            onNoteSelect={setSelectedNoteId}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onPin={pinNote}
            onArchive={archiveNote}
            onTrash={trashNote}
            onOpenEnhancedEdit={openEnhancedFormForNote}
            onOpenNewsModal={setOpenNewsModalNoteId}
            onOpenFinancialModal={setOpenFinancialModalNoteId}
            onFetchNews={fetchNewsForNote}
            onFetchTweets={fetchTweetsForNote}
            onUpdateFinancial={updateFinancialForNote}
            onUpdateAll={updateAllForNote}
            onIntegrationComplete={fetchNotes}
            onAddVoiceToNote={onAddVoiceToNote}
            onAddDrawingToNote={onAddDrawingToNote}
            onAddTextToNote={onAddTextToNote}
          />
        </div>
      )}
      
      {/* Dashboard / Trash / Export / Deadlines as modals (opened from nav) */}
      {showDashboard && (
        <div role="dialog" aria-modal="true" aria-label="Dashboard" style={modalOverlayStyle} onClick={() => setShowDashboard(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, color: "var(--text-primary)" }}><span role="img" aria-label="Dashboard">📊</span> Integration Dashboard</h2>
              <button type="button" onClick={() => setShowDashboard(false)} style={{ padding: "8px 16px", background: "#666", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Close</button>
            </div>
            <IntegrationDashboard />
          </div>
        </div>
      )}
      {showTrash && (
        <div role="dialog" aria-modal="true" aria-label="Trash" style={modalOverlayStyle} onClick={() => setShowTrash(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, color: "var(--text-primary)" }}><span role="img" aria-label="Trash">🗑️</span> Trash</h2>
              <button type="button" onClick={() => setShowTrash(false)} style={{ padding: "8px 16px", background: "#666", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Close</button>
            </div>
            <TrashView onRestore={fetchNotes} onDeletePermanent={fetchNotes} />
          </div>
        </div>
      )}
      {showExportImport && (
        <div role="dialog" aria-modal="true" aria-label="Export / Import" style={modalOverlayStyle} onClick={() => setShowExportImport(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, color: "var(--text-primary)" }}><span role="img" aria-label="Export Import">📤</span> Export / Import</h2>
              <button type="button" onClick={() => setShowExportImport(false)} style={{ padding: "8px 16px", background: "#666", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Close</button>
            </div>
            <ExportImport notes={notes} onImport={handleImport} />
          </div>
        </div>
      )}
      {showDeadlines && (
        <div role="dialog" aria-modal="true" aria-label="Deadlines" style={modalOverlayStyle} onClick={() => setShowDeadlines(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, color: "var(--text-primary)" }}><span role="img" aria-label="Deadlines">📅</span> Deadlines</h2>
              <button type="button" onClick={() => setShowDeadlines(false)} style={{ padding: "8px 16px", background: "#666", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Close</button>
            </div>
            <DeadlinesView onRefresh={fetchNotes} />
          </div>
        </div>
      )}

      {!showSplitView && !showEnhancedForm && !showVoiceRecorder && !showDrawing ? (
        <div className="app-main-content">
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <TemplateSelector onSelectTemplate={handleTemplateSelect} />
          </div>
          <CreateArea onAdd={addNote} />
          {selectedNoteIdForView ? (() => {
            const noteItem = notes.find(n => n._id === selectedNoteIdForView);
            if (!noteItem) return <div className="app-main-placeholder">Note not found.</div>;
            return (
              <div style={{ marginTop: "20px", maxWidth: "100%" }}>
                <Note
                  key={noteItem._id}
                  id={noteItem._id}
                  title={noteItem.title}
                  content={noteItem.content}
                  tags={noteItem.tags || []}
                  priority={noteItem.priority}
                  isPinned={noteItem.isPinned}
                  isArchived={noteItem.isArchived}
                  deadline={noteItem.deadline}
                  news={noteItem.news}
                  financial={noteItem.financial}
                  social={noteItem.social}
                  attachments={noteItem.attachments}
                  drawings={noteItem.drawings}
                  onOpenModal={() => setOpenNoteModalId(noteItem._id)}
                  onOpenNewsModal={() => setOpenNewsModalNoteId(noteItem._id)}
                  onOpenFinancialModal={() => setOpenFinancialModalNoteId(noteItem._id)}
                  onDelete={() => { deleteNote(noteItem._id); setSelectedNoteIdForView(null); }}
                  onUpdate={updateNote}
                  onPin={pinNote}
                  onArchive={archiveNote}
                  onTrash={trashNote}
                  onOpenEnhancedEdit={() => openEnhancedFormForNote(noteItem._id)}
                  onFetchNews={fetchNewsForNote}
                  onFetchTweets={fetchTweetsForNote}
                  onUpdateFinancial={updateFinancialForNote}
                  onUpdateAll={updateAllForNote}
                  onIntegrationComplete={fetchNotes}
                />
              </div>
            );
          })() : (
            <div className="app-main-placeholder">
              Select a note from the left or create one above.
            </div>
          )}
        </div>
      ) : null}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;

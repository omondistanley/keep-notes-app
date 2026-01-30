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

function App() {
  const { theme, toggleTheme } = useTheme();
  const searchInputRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterTags, setFilterTags] = useState([]);
  const [filterPriority, setFilterPriority] = useState("");
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
  const [navOpen, setNavOpen] = useState(false);
  const [topMoversLoadingId, setTopMoversLoadingId] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage] = useState(20);

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
  }, [fetchNotes, fetchTags]);

  // WebSocket for real-time updates
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === "note_update") {
      fetchNotes();
      fetchTags();
    }
  }, [fetchNotes, fetchTags]);

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

  const activeView = showDashboard ? "dashboard" : showDeadlines ? "deadlines" : showTrash ? "trash" : showExportImport ? "exportImport" : "notes";

  const closeAllModals = useCallback(() => {
    setShowDashboard(false);
    setShowTrash(false);
    setShowExportImport(false);
    setShowDeadlines(false);
  }, []);

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
    <div style={{ background: theme === "dark" ? "#1a1a1a" : "#eee", minHeight: "100vh", paddingBottom: "60px" }}>
      <Header
        navOpen={navOpen}
        onNavToggle={setNavOpen}
        activeView={activeView}
        onSelectNotes={() => { closeAllModals(); setNavOpen(false); }}
        onSelectDashboard={() => { setShowTrash(false); setShowExportImport(false); setShowDeadlines(false); setShowDashboard(true); }}
        onSelectDeadlines={() => { setShowDashboard(false); setShowTrash(false); setShowExportImport(false); setShowDeadlines(true); }}
        onSelectTrash={() => { setShowDashboard(false); setShowExportImport(false); setShowDeadlines(false); setShowTrash(true); }}
        onSelectExportImport={() => { setShowTrash(false); setShowDashboard(false); setShowDeadlines(false); setShowExportImport(true); }}
        onSelectSplitView={() => { setShowSplitView(true); }}
        onSelectVoice={() => { setShowVoiceRecorder(true); setShowDrawing(false); }}
        onSelectDraw={() => { setShowDrawing(true); setShowVoiceRecorder(false); }}
        onSelectEnhanced={() => { setShowEnhancedForm(true); setSelectedNoteId(null); }}
      />
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

      {/* Financial modal: top 100 gainers/losers/movers (relevance-first), then your symbols */}
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
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Financial"
            onClick={() => setOpenFinancialModalNoteId(null)}
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
                maxWidth: "560px",
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
                  <button type="button" onClick={() => setOpenFinancialModalNoteId(null)} style={{ padding: "6px 12px", background: "#666", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Close</button>
                </div>
              </div>
              <div style={{ padding: "16px" }}>
                {!hasTopMovers && prices.length === 0 ? (
                  <p style={{ color: "var(--text-secondary, #666)" }}>No price data yet. Use &quot;Update financial&quot; on the note. For stocks, &quot;Load top 100 movers&quot; shows market-wide gainers/losers/movers, ordered by relevance to your note and news.</p>
                ) : (
                  <>
                    {indexes.length > 0 && (
                      <section style={{ marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-primary)" }}>Major indexes</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
                          {indexes.map((p, i) => (
                            <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderBottom: "1px solid #f0f0f0", borderRadius: "4px", background: "var(--bg-tertiary, #f9f9f9)" }}>
                              <span title={p.name || p.symbol}>{p.symbol}</span>
                              <span style={{ color: (p.changePercent >= 0) ? "#2e7d32" : "#c62828" }}>
                                {p.changePercent != null ? `${p.changePercent >= 0 ? "+" : ""}${Number(p.changePercent).toFixed(1)}%` : "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {hasTopMovers && <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>Top 100 stocks (relevance to this note and its news first).</p>}
                    {largestMovers.length > 0 && (
                      <section style={{ marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-primary)" }}>Largest movers ({largestMovers.length})</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", maxHeight: "200px", overflowY: "auto" }}>
                          {largestMovers.map((p, i) => (
                            <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
                              <span>
                                {p.symbol}
                                {((p.relevanceScore ?? 0) > 0.3 || p.inUserList) && <span style={{ marginLeft: "6px", fontSize: "10px", color: "#1976d2", fontWeight: "bold" }}>• relevant</span>}
                              </span>
                              <span>{Number(p.price ?? p.last ?? 0).toFixed(2)}</span>
                              <span style={{ color: (p.changePercent >= 0) ? "#2e7d32" : "#c62828" }}>
                                {p.changePercent != null ? `${p.changePercent >= 0 ? "+" : ""}${Number(p.changePercent).toFixed(1)}%` : "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {topGainers.length > 0 && (
                      <section style={{ marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "#2e7d32" }}>Top gainers ({topGainers.length})</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", maxHeight: "200px", overflowY: "auto" }}>
                          {topGainers.map((p, i) => (
                            <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
                              <span>
                                {p.symbol}
                                {((p.relevanceScore ?? 0) > 0.3 || p.inUserList) && <span style={{ marginLeft: "6px", fontSize: "10px", color: "#1976d2", fontWeight: "bold" }}>• relevant</span>}
                              </span>
                              <span>{Number(p.price ?? p.last ?? 0).toFixed(2)}</span>
                              <span style={{ color: "#2e7d32" }}>{p.changePercent != null ? `+${Number(p.changePercent).toFixed(1)}%` : "—"}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {topLosers.length > 0 && (
                      <section style={{ marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "#c62828" }}>Top losers ({topLosers.length})</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", maxHeight: "200px", overflowY: "auto" }}>
                          {topLosers.map((p, i) => (
                            <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
                              <span>
                                {p.symbol}
                                {((p.relevanceScore ?? 0) > 0.3 || p.inUserList) && <span style={{ marginLeft: "6px", fontSize: "10px", color: "#1976d2", fontWeight: "bold" }}>• relevant</span>}
                              </span>
                              <span>{Number(p.price ?? p.last ?? 0).toFixed(2)}</span>
                              <span style={{ color: "#c62828" }}>{p.changePercent != null ? `${Number(p.changePercent).toFixed(1)}%` : "—"}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {prices.length > 0 && (
                      <section>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-primary)" }}>Your symbols</h3>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px" }}>
                          {prices.map((p, i) => (
                            <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
                              <span>{p.symbol}</span>
                              <span>{Number(p.price ?? p.last ?? 0).toFixed(2)}</span>
                              <span style={{ color: (p.changePercent >= 0) ? "#2e7d32" : "#c62828" }}>
                                {p.changePercent != null ? `${p.changePercent >= 0 ? "+" : ""}${Number(p.changePercent).toFixed(1)}%` : "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
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
          />
        </div>
      )}
      
      {/* Dashboard / Trash / Export / Deadlines as modals (opened from nav) */}
      {showDashboard && (
        <div role="dialog" aria-modal="true" aria-label="Dashboard" style={modalOverlayStyle} onClick={() => setShowDashboard(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, color: "var(--text-primary)" }}>📊 Integration Dashboard</h2>
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
              <h2 style={{ margin: 0, color: "var(--text-primary)" }}>🗑️ Trash</h2>
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
              <h2 style={{ margin: 0, color: "var(--text-primary)" }}>📤 Export / Import</h2>
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
              <h2 style={{ margin: 0, color: "var(--text-primary)" }}>📅 Deadlines</h2>
              <button type="button" onClick={() => setShowDeadlines(false)} style={{ padding: "8px 16px", background: "#666", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Close</button>
            </div>
            <DeadlinesView onRefresh={fetchNotes} />
          </div>
        </div>
      )}

      {!showSplitView && !showEnhancedForm && !showVoiceRecorder && !showDrawing ? (
        <>
          {/* Search and Filter Bar */}
          <div className="search-filter-container" style={{
            width: "480px",
            margin: "20px auto",
            padding: "15px",
            background: "var(--bg-secondary)",
            borderRadius: "7px",
            boxShadow: "0 1px 5px var(--shadow)"
          }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "14px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            marginBottom: "10px"
          }}
        />
        
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "6px", fontSize: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
          >
            <option value="updatedAt">Sort by: Updated</option>
            <option value="createdAt">Sort by: Created</option>
            <option value="title">Sort by: Title</option>
            <option value="priority">Sort by: Priority</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: "#f5ba13",
              color: "white",
              cursor: "pointer"
            }}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ padding: "6px", fontSize: "12px", border: "1px solid #ddd", borderRadius: "4px" }}
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: showArchived ? "#ff9800" : "#fff",
              color: showArchived ? "white" : "black",
              cursor: "pointer"
            }}
          >
            {showArchived ? "📦 Archived" : "📁 Archive"}
          </button>
        </div>
        
        {/* Tag Filters */}
        {availableTags.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <div style={{ fontSize: "12px", marginBottom: "5px" }}>Filter by tags:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (filterTags.includes(tag)) {
                      setFilterTags(filterTags.filter(t => t !== tag));
                    } else {
                      setFilterTags([...filterTags, tag]);
                    }
                  }}
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    background: filterTags.includes(tag) ? "#f5ba13" : "#fff",
                    color: filterTags.includes(tag) ? "white" : "black",
                    cursor: "pointer"
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
            <div style={{ position: "relative", width: "480px", margin: "20px auto" }}>
              <TemplateSelector onSelectTemplate={handleTemplateSelect} />
            </div>
            
            <CreateArea onAdd={addNote} />
            
            {/* Pagination Info */}
            {notes.length > notesPerPage && (
              <div style={{
                width: "480px",
                margin: "10px auto",
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: "14px"
              }}>
                Showing {((currentPage - 1) * notesPerPage) + 1} - {Math.min(currentPage * notesPerPage, notes.length)} of {notes.length} notes
              </div>
            )}

            {paginatedNotes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                {showArchived ? "No archived notes" : searchQuery ? "No notes found" : "No notes yet. Create one!"}
              </div>
            ) : (
              <>
                {paginatedNotes.map((noteItem) => (
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
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-controls" style={{
                    width: "480px",
                    margin: "20px auto",
                    display: "flex",
                    justifyContent: "center",
                    gap: "10px"
                  }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: "8px 16px",
                        background: currentPage === 1 ? "#ccc" : "#f5ba13",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer"
                      }}
                    >
                      Previous
                    </button>
                    <span style={{
                      padding: "8px 16px",
                      color: "var(--text-primary)"
                    }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: "8px 16px",
                        background: currentPage === totalPages ? "#ccc" : "#f5ba13",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
      <Footer />
    </div>
  );
}

export default App;

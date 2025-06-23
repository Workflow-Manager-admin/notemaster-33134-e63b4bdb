import React, { useState, useMemo } from "react";
import "./App.css";

/**
 * PUBLIC_INTERFACE
 * NoteModal - Modal dialog component for adding or editing a note.
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible.
 * @param {Function} props.onClose - Called when modal should close.
 * @param {Function} props.onSave - Called with {title, content} when saving.
 * @param {Object} [props.note] - Pre-existing note object for edit mode.
 */
function NoteModal({ open, onClose, onSave, note }) {
  const [title, setTitle] = useState(note ? note.title : "");
  const [content, setContent] = useState(note ? note.content : "");

  React.useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [note, open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="modal-bg">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="modal-title">
          {note ? "Edit Note" : "Add Note"}
        </h2>
        <div className="modal-field">
          <input
            className="modal-input"
            type="text"
            placeholder="Note Title"
            maxLength={70}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            data-testid="note-title"
          />
        </div>
        <div className="modal-field">
          <textarea
            className="modal-textarea"
            placeholder="Note Content"
            maxLength={1500}
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            data-testid="note-content"
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            disabled={!title.trim()}
            onClick={() => {
              onSave({ title: title.trim(), content: content.trim() });
              onClose();
            }}
            data-testid="save-btn"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * NotesList - The sidebar with notes, search bar and add button.
 * @param {Object} props
 * @param {Array} props.notes - List of note objects.
 * @param {string} props.search - Current search value.
 * @param {Function} props.onSearch - Called on search input change.
 * @param {Function} props.onSelect - Called when a note is selected.
 * @param {string|null} props.selectedId - The id of the currently selected note.
 * @param {Function} props.onAdd - Called when add button clicked.
 */
function NotesList({
  notes,
  search,
  onSearch,
  onSelect,
  selectedId,
  onAdd,
}) {
  return (
    <aside className="notes-list">
      <div className="notes-list-header">
        <input
          className="search-bar"
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search notes..."
          aria-label="Search notes"
        />
        <button className="btn btn-accent notes-add-btn" onClick={onAdd} title="Add note">
          +
        </button>
      </div>
      <div className="notes-list-scroll">
        {notes.length === 0 ? (
          <div className="empty-message">No notes found.</div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`note-card${selectedId === note.id ? " selected" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(note.id)}
              onKeyDown={e => e.key === 'Enter' && onSelect(note.id)}
              data-testid="note-list-item"
            >
              <div className="note-card-title">{note.title || "(Untitled)"}</div>
              <div className="note-card-preview">
                {note.content.length > 60
                  ? note.content.slice(0, 60) + "…"
                  : note.content}
              </div>
              <div className="note-card-date">
                {formatDate(note.updatedAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

/**
 * PUBLIC_INTERFACE
 * NoteDetail - Shows the selected note's content, with edit and delete options.
 * @param {Object} props
 * @param {Object} props.note - Selected note object.
 * @param {Function} props.onEdit - Called on edit click.
 * @param {Function} props.onDelete - Called on delete click.
 */
function NoteDetail({ note, onEdit, onDelete }) {
  if (!note) {
    return (
      <div className="note-empty">
        <span className="note-empty-text">Select a note to view</span>
      </div>
    );
  }
  return (
    <div className="note-detail">
      <div className="note-detail-header">
        <h2 className="note-detail-title">{note.title || "(Untitled)"}</h2>
        <div className="note-detail-actions">
          <button className="btn btn-secondary" style={{marginRight: 8}} onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-accent" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
      <div className="note-detail-content">
        {note.content.split("\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="note-detail-date">
        Last updated: {formatDate(note.updatedAt)}
      </div>
    </div>
  );
}

// Utility to format date (ISO string expected)
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Utility to generate a unique id for notes
function generateId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

// Try loading from localStorage, fallback to empty array
function loadNotes() {
  let notes = [];
  try {
    const raw = localStorage.getItem("notes");
    notes = raw ? JSON.parse(raw) : [];
    // Validate notes schema
    if (!Array.isArray(notes)) notes = [];
  } catch {
    notes = [];
  }
  return notes;
}

// Save notes array to localStorage
function saveNotes(notes) {
  localStorage.setItem("notes", JSON.stringify(notes));
}

/**
 * PUBLIC_INTERFACE
 * Main App
 */
function App() {
  // Notes state: array of {id, title, content, updatedAt}
  const [notes, setNotes] = useState(loadNotes());
  // Selected note id
  const [selectedId, setSelectedId] = useState(
    notes.length > 0 ? notes[0].id : null
  );
  // Search query
  const [search, setSearch] = useState("");
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Keep notes in localStorage
  React.useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // Filtered notes for list display
  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const q = search.toLowerCase();
    return notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, search]);

  // Get the detail note
  const detailNote = notes.find((n) => n.id === selectedId);

  // Add note handler
  function handleAddNote() {
    setEditingNote(null);
    setModalOpen(true);
  }

  // Save (add/edit) note handler
  function handleSaveNote({ title, content }) {
    if (editingNote) {
      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === editingNote.id
            ? { ...n, title, content, updatedAt: new Date().toISOString() }
            : n
        );
        return updated;
      });
    } else {
      const newNote = {
        id: generateId(),
        title,
        content,
        updatedAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedId(newNote.id);
    }
    setEditingNote(null);
    setModalOpen(false);
  }

  // Edit note handler
  function handleEditNote(note) {
    setEditingNote(note);
    setModalOpen(true);
  }

  // Delete note handler
  function handleDeleteNote(note) {
    if (!window.confirm("Delete this note?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    setSelectedId((prevSelected) => {
      if (note.id !== prevSelected) return prevSelected;
      // Select another note
      const remaining = notes.filter((n) => n.id !== note.id);
      return remaining.length > 0 ? remaining[0].id : null;
    });
  }

  // When the filtered notes change, ensure the selection is valid
  React.useEffect(() => {
    if (
      selectedId &&
      !notes.some((n) => n.id === selectedId)
    ) {
      setSelectedId(notes.length > 0 ? notes[0].id : null);
    }
  }, [notes, selectedId]);

  return (
    <div className="app notes-app">
      {/* Header/Navbar */}
      <nav className="navbar">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <div className="logo">
            <span className="logo-symbol" style={{color: "var(--accent)"}}>🗒️</span>
            <span style={{color: "var(--primary)", fontWeight: 600}}>Notemaster</span>
          </div>
          <div>
            <a
              href="https://react.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-link"
              style={{padding: "8px 12px", color: "var(--secondary)", textDecoration: "none"}}
            >
              React Guide
            </a>
          </div>
        </div>
      </nav>
      {/* App main area */}
      <main className="notes-main">
        <div className="notes-main-content">
          <NotesList
            notes={filteredNotes}
            search={search}
            onSearch={setSearch}
            onSelect={setSelectedId}
            selectedId={selectedId}
            onAdd={handleAddNote}
          />
          <section className="notes-detail-section">
            <NoteDetail
              note={detailNote}
              onEdit={() => detailNote && handleEditNote(detailNote)}
              onDelete={() => detailNote && handleDeleteNote(detailNote)}
            />
          </section>
        </div>
      </main>
      {/* Modal for Add/Edit Note */}
      <NoteModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        note={editingNote}
      />
      <footer className="footer">
        <span>
          <span style={{fontWeight: 500}}>Notemaster</span> &copy; {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}

export default App;

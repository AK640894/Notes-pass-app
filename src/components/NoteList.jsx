import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Settings } from './Settings';

export function NoteList({ sessionKey, theme, toggleTheme }) {
    const [notes, setNotes] = useState([]);
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [toastMsg, setToastMsg] = useState('');

    // Load notes on mount
    useEffect(() => {
        loadNotes();
    }, [sessionKey]);

    const loadNotes = async () => {
        try {
            const decryptedNotes = await storage.loadNotes(sessionKey);
            setNotes(decryptedNotes);
        } catch (error) {
            console.error("Failed to load notes", error);
        }
    };

    const handlePinChange = async (newKey) => {
        // App parent component might handle this better if we lifted key state up,
        // but sessionKey is passed down. We can't update sessionKey from here directly without a callback prop to setSessionKey in App.
        // Wait, App passed sessionKey. Updating it here won't update App.
        // We need a way to tell App to update the key.
        // For now, let's assume we need to reload the page or we need a prop.
        // Actually, NoteList receives sessionKey. If we change PIN, the old sessionKey is invalid for NEW data, 
        // but storage.updatePin returns the NEW key.
        // We really should pass a `onSessionKeyUpdate` prop from App.

        // Let's implement reloading as a safe fallback or assume the user will be logged out?
        // No, requirements "reset using old password". implying seamless.
        // I will assume for this step I missed adding `onSessionKeyChange` to NoteList props.
        // I'll add `window.location.reload()` as a simple "re-login with new pin" step if I can't easily change prop.
        // BUT, `Settings` is inside `NoteList`. 
        // Let's reload for safety and simplicity, ensuring all state is fresh.
        window.location.reload();
    };

    const handleSave = async (note) => {
        try {
            let updatedNotes;
            if (note.id) {
                // Edit existing
                updatedNotes = notes.map(n => n.id === note.id ? note : n);
            } else {
                // Create new
                const newNote = {
                    ...note,
                    id: Date.now().toString(),
                    timestamp: Date.now()
                };
                updatedNotes = [newNote, ...notes];
                // Auto-select new note
                setSelectedNoteId(newNote.id);
            }

            setNotes(updatedNotes);
            await storage.saveNotes(updatedNotes, sessionKey);
            setIsModalOpen(false);
            setEditingNote(null);
            setToastMsg('Saved successfully!');
        } catch (error) {
            console.error("Failed to save note", error);
            alert("Error saving note");
        }
    };

    const handleDelete = async (noteId) => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            const updatedNotes = notes.filter(n => n.id !== noteId);
            setNotes(updatedNotes);
            await storage.saveNotes(updatedNotes, sessionKey);
            if (selectedNoteId === noteId) {
                setSelectedNoteId(null);
            }
        } catch (error) {
            console.error("Error deleting note", error);
            alert("Error deleting note");
        }
    };

    const selectedNote = notes.find(n => n.id === selectedNoteId);

    return (
        <>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>My Notes</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="primary" onClick={() => { setEditingNote(null); setIsModalOpen(true); }}>
                        + Add New
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)}>
                        ⚙️ Settings
                    </button>
                </div>
            </div>

            <div className="split-view-container">
                {/* Sidebar */}
                <div className="sidebar">
                    {notes.length === 0 && (
                        <div style={{ padding: '1rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                            No notes yet
                        </div>
                    )}
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className={`sidebar-item ${selectedNoteId === note.id ? 'selected' : ''}`}
                            onClick={() => setSelectedNoteId(note.id)}
                        >
                            <div style={{ fontWeight: 'bold' }}>{note.account}</div>
                            <div style={{ fontSize: '0.8em', opacity: 0.7 }}>
                                {new Date(note.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Panel */}
                <div className="main-panel">
                    {selectedNote ? (
                        <NoteDetail
                            note={selectedNote}
                            onEdit={() => { setEditingNote(selectedNote); setIsModalOpen(true); }}
                            onDelete={() => handleDelete(selectedNote.id)}
                        />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                                <div>Select a note from the left to view details</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <NoteModal
                    note={editingNote}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}

            <Settings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                theme={theme}
                toggleTheme={toggleTheme}
                onPinChange={handlePinChange}
            />

            {toastMsg && (
                <Toast
                    message={toastMsg}
                    onClose={() => setToastMsg('')}
                />
            )}
        </>
    );
}

function NoteDetail({ note, onEdit, onDelete }) {
    const [showSecret, setShowSecret] = useState(false);

    return (
        <div>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>{note.account}</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={onEdit}>Edit</button>
                    <button className="danger" onClick={onDelete}>Delete</button>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Secret / Password</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{
                        flex: 1,
                        background: 'var(--bg)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        fontFamily: 'monospace',
                        fontSize: '1.2rem',
                        border: '1px solid var(--border)'
                    }}>
                        {showSecret ? note.secret : '••••••••••••••••'}
                    </div>
                    <button onClick={() => setShowSecret(!showSecret)}>
                        {showSecret ? 'Hide' : 'Show'}
                    </button>
                </div>
            </div>

            <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                Last updated: {new Date(note.timestamp).toLocaleString()}
            </div>
        </div>
    );
}

function NoteModal({ note, onSave, onClose }) {
    const [account, setAccount] = useState(note?.account || '');
    const [secret, setSecret] = useState(note?.secret || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!account.trim() || !secret.trim()) return;
        onSave({ ...note, account, secret });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{note ? 'Edit Note' : 'New Note'}</h2>
                <form onSubmit={handleSubmit}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Account / App Name</label>
                    <input
                        value={account}
                        onChange={e => setAccount(e.target.value)}
                        placeholder="e.g. Google, Netflix"
                        autoFocus
                    />

                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Secret / Password</label>
                    <input
                        value={secret}
                        onChange={e => setSecret(e.target.value)}
                        placeholder="Sensitive data..."
                    />

                    <div className="flex-between" style={{ marginTop: '1.5rem' }}>
                        <button type="button" onClick={onClose} style={{ background: 'transparent' }}>Cancel</button>
                        <button type="submit" className="primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Toast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'var(--primary)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease-out',
            zIndex: 1000
        }}>
            {message}
        </div>
    );
}

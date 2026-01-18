import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';

export function NoteList({ sessionKey }) {
    const [notes, setNotes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        } catch (error) {
            console.error("Error deleting note", error);
            alert("Error deleting note");
        }
    };

    return (
        <>
            <div style={{ marginBottom: '1rem' }}>
                <button className="primary" onClick={() => { setEditingNote(null); setIsModalOpen(true); }}>
                    + Add New Note
                </button>
            </div>

            {notes.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                    No notes yet. Tap 'Add New Note' to start.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {notes.map(note => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onEdit={() => { setEditingNote(note); setIsModalOpen(true); }}
                            onDelete={() => handleDelete(note.id)}
                        />
                    ))}
                </div>
            )}

            {isModalOpen && (
                <NoteModal
                    note={editingNote}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}

            {toastMsg && (
                <Toast
                    message={toastMsg}
                    onClose={() => setToastMsg('')}
                />
            )}
        </>
    );
}

function NoteCard({ note, onEdit, onDelete }) {
    const [showSecret, setShowSecret] = useState(false);

    return (
        <div className="card">
            <div className="flex-between">
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{note.account}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ padding: '0.4rem' }} onClick={onEdit}>✏️</button>
                    <button className="danger" style={{ padding: '0.4rem' }} onClick={onDelete}>🗑️</button>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{
                    flex: 1,
                    background: 'var(--bg)',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace',
                    minHeight: '1.5em'
                }}>
                    {showSecret ? note.secret : '••••••••••••'}
                </div>
                <button onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? 'Hide' : 'Show'}
                </button>
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

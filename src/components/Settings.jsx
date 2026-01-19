import { useState } from 'react';
import { storage } from '../lib/storage';

export function Settings({ isOpen, onClose, theme, toggleTheme, onPinChange }) {
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePinChange = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (newPin.length !== 4 || confirmPin.length !== 4) {
            setError('PIN must be 4 digits');
            return;
        }

        if (newPin !== confirmPin) {
            setError('New PINs do not match');
            return;
        }

        if (newPin === oldPin) {
            setError('New PIN cannot be the same as old PIN');
            return;
        }

        setLoading(true);

        try {
            const result = await storage.updatePin(oldPin, newPin);

            if (result.success) {
                setSuccessMsg('PIN updated successfully!');
                setOldPin('');
                setNewPin('');
                setConfirmPin('');
                // Update session key in App
                onPinChange(result.newKey);
            } else {
                setError(result.error || 'Failed to update PIN');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Settings</h2>
                    <button onClick={onClose} style={{ padding: '0.4rem' }}>✕</button>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Appearance</h3>
                    <div className="flex-between" style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <span>Dark Mode</span>
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: theme === 'dark' ? 'var(--primary)' : 'var(--bg)',
                                color: theme === 'dark' ? 'white' : 'var(--text)'
                            }}
                        >
                            {theme === 'dark' ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Security</h3>
                    <form onSubmit={handlePinChange} style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Old PIN</label>
                            <input
                                type="password"
                                maxLength={4}
                                value={oldPin}
                                onChange={e => setOldPin(e.target.value)}
                                placeholder="****"
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>New PIN</label>
                            <input
                                type="password"
                                maxLength={4}
                                value={newPin}
                                onChange={e => setNewPin(e.target.value)}
                                placeholder="****"
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Confirm New PIN</label>
                            <input
                                type="password"
                                maxLength={4}
                                value={confirmPin}
                                onChange={e => setConfirmPin(e.target.value)}
                                placeholder="****"
                            />
                        </div>

                        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                        {successMsg && <div style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{successMsg}</div>}

                        <button
                            type="submit"
                            className="primary"
                            style={{ width: '100%' }}
                            disabled={loading || oldPin.length !== 4 || newPin.length !== 4}
                        >
                            {loading ? 'Updating...' : 'Change PIN'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

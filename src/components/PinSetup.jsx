import { useState } from 'react';
import { storage } from '../lib/storage';

export function PinSetup({ onSetupComplete }) {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (pin.length !== 4 || isNaN(pin)) {
            setError('PIN must be 4 digits.');
            return;
        }

        if (pin !== confirmPin) {
            setError('PINs do not match.');
            return;
        }

        setLoading(true);
        try {
            await storage.setupPin(pin);
            onSetupComplete();
        } catch (err) {
            console.error(err);
            setError('Failed to save PIN.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
            <h2>Welcome</h2>
            <p>Create a 4-digit PIN to secure your notes.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Enter PIN</label>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="0000"
                        autoFocus
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm PIN</label>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        placeholder="0000"
                    />
                </div>

                {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}

                <button type="submit" className="primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Setting up...' : 'Set PIN'}
                </button>
            </form>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '1rem', textAlign: 'center' }}>
                <strong>Important:</strong> If you forget this PIN, your data cannot be recovered.
            </p>
        </div>
    );
}

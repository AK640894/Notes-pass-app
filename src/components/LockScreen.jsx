import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { cryptoHelpers } from '../lib/crypto';

export function LockScreen({ onUnlock }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-submit when 4 digits are entered
    useEffect(() => {
        if (pin.length === 4) {
            handleUnlock();
        }
    }, [pin]);

    const handleUnlock = async (e) => {
        if (e) e.preventDefault();
        if (pin.length !== 4) return;

        setLoading(true);
        setError('');

        try {
            // 1. Validate PIN Hash
            const { isValid, salt } = await storage.validatePin(pin);

            if (!isValid) {
                setError('Incorrect PIN');
                setPin(''); // Clear PIN on error
                setLoading(false);
                return;
            }

            // 2. Derive Encryption Key (Keep in memory only!)
            const key = await cryptoHelpers.deriveKey(pin, salt);

            // 3. Callback to Main App with the Session Key
            onUnlock(key);

        } catch (err) {
            console.error(err);
            setError('Unlock failed.');
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
            <h2>Locked</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Enter PIN to unlock</p>

            <form onSubmit={handleUnlock}>
                <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="****"
                    style={{
                        fontSize: '2rem',
                        letterSpacing: '0.5rem',
                        textAlign: 'center',
                        width: '200px',
                        margin: '0 auto 1.5rem'
                    }}
                    autoFocus
                />

                {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}

                <button type="submit" className="primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Unlocking...' : 'Unlock'}
                </button>
            </form>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { storage } from './lib/storage';
import { PinSetup } from './components/PinSetup';
import { LockScreen } from './components/LockScreen';
import { NoteList } from './components/NoteList';

function App() {
  const [sessionKey, setSessionKey] = useState(null);
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('pna_theme') || 'light');

  useEffect(() => {
    // Apply theme
    document.body.className = theme;
    localStorage.setItem('pna_theme', theme);

    // Check if PIN is already set up on mount
    const hasPin = storage.isSetup();
    setIsSetup(hasPin);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('pna_theme', theme);
  }, [theme]);

  const handleUnlock = (key) => {
    setSessionKey(key);
  };

  const handleSetupComplete = () => {
    // After setup, user needs to login to derive key properly
    setIsSetup(true);
  };

  const handleLock = () => {
    setSessionKey(null);
  };

  if (loading) return null;

  if (!isSetup) {
    return (
      <PinSetup
        onSetupComplete={handleSetupComplete}
        theme={theme}
        toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
      />
    );
  }

  if (!sessionKey) {
    return (
      <LockScreen
        onUnlock={handleUnlock}
        theme={theme}
        toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
      />
    );
  }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Password Notes</h1>
        <button className="danger" onClick={handleLock}>Lock</button>
      </div>

      <NoteList
        sessionKey={sessionKey}
        theme={theme}
        toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
      />
    </div>
  );
}

export default App;

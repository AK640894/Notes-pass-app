import { useState, useEffect } from 'react';
import { storage } from './lib/storage';
import { PinSetup } from './components/PinSetup';
import { LockScreen } from './components/LockScreen';
import { NoteList } from './components/NoteList';

function App() {
  const [sessionKey, setSessionKey] = useState(null);
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if PIN is already set up on mount
    const hasPin = storage.isSetup();
    setIsSetup(hasPin);
    setLoading(false);
  }, []);

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
    return <PinSetup onSetupComplete={handleSetupComplete} />;
  }

  if (!sessionKey) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Password Notes</h1>
        <button className="danger" onClick={handleLock}>Lock</button>
      </div>

      <NoteList sessionKey={sessionKey} />
    </div>
  );
}

export default App;

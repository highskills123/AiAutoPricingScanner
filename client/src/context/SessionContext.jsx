import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [lastScan, setLastScan] = useState(null);

  useEffect(() => {
    let id = localStorage.getItem('scanner_session_id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('scanner_session_id', id);
    }
    setSessionId(id);

    // Restore last scan from sessionStorage
    try {
      const saved = sessionStorage.getItem('last_scan');
      if (saved) setLastScan(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const saveLastScan = (scan) => {
    setLastScan(scan);
    try {
      sessionStorage.setItem('last_scan', JSON.stringify(scan));
    } catch {
      // ignore
    }
  };

  return (
    <SessionContext.Provider value={{ sessionId, lastScan, saveLastScan }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

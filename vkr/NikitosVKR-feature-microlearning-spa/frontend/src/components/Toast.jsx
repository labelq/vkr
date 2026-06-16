import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef([]);

  // Clear all pending timers on unmount to avoid setState on dead component
  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timersRef.current = timersRef.current.filter(t => t !== timer);
    }, 3500);
    timersRef.current.push(timer);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} style={{
            padding: '12px 20px',
            borderRadius: '10px',
            background: t.type === 'error' ? '#ef4444' : t.type === 'warning' ? '#f59e0b' : '#22c55e',
            color: '#fff',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.2s ease',
            maxWidth: '320px',
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

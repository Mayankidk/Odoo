import { useState, useEffect } from 'react';

/**
 * Task 17: Consistent UI Elements
 * This file contains reusable UI components for loading states, 
 * inline errors, and toasts, ensuring a polished and consistent UX across forms.
 */

// --- Loading State ---
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-3', lg: 'h-12 w-12 border-4' };
  
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-gray-300 border-t-blue-600 ${sizes[size]}`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export function PageLoader({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Spinner size="lg" />
      <p className="text-gray-500 font-medium">{message}</p>
    </div>
  );
}


// --- Inline Errors ---
export function InlineError({ error }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  
  return (
    <p className="text-red-500 text-sm mt-1 flex items-center gap-1" role="alert">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </p>
  );
}


// --- Toast System (Simple Hackathon Implementation) ---
let toastCount = 0;
let addToastFn = null;

export const toast = {
  success: (message) => addToastFn?.({ id: ++toastCount, type: 'success', message }),
  error: (message) => addToastFn?.({ id: ++toastCount, type: 'error', message }),
  info: (message) => addToastFn?.({ id: ++toastCount, type: 'info', message }),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    };
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter(t => t.id !== id));

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`flex items-center justify-between p-4 min-w-[300px] rounded shadow-lg text-white transition-all transform translate-y-0
              ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}
            `}
            role="alert"
          >
            <span>{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-4 opacity-75 hover:opacity-100">&times;</button>
          </div>
        ))}
      </div>
    </>
  );
}

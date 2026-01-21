import { useEffect } from 'react';

export default function Toast({ message, type, onClose, isDark }) {
    useEffect(() => {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }, [onClose]);
  
    const bgColor = type === 'success' 
      ? 'from-emerald-500/20 to-emerald-500/10 ring-emerald-500/30' 
      : 'from-red-500/20 to-red-500/10 ring-red-500/30';
    const textColor = type === 'success' ? 'text-emerald-400' : 'text-red-400';
    const icon = type === 'success' ? '✓' : '✗';
  
    return (
      <div className={`fixed top-6 right-6 z-50 max-w-md animate-fade-in rounded-xl bg-gradient-to-r ${bgColor} p-4 shadow-2xl ring-1 backdrop-blur-xl`}>
        <div className="flex items-start gap-3">
          <span className={`text-lg ${textColor}`}>{icon}</span>
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
          <button 
            onClick={onClose} 
            className={`ml-auto transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
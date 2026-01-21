import { useEffect } from "react";
export default function ProgressToast({ progress, step, status, count, results, onClose, isDark }) {
    const isComplete = status === 'done' || status === 'empty';
    const isError = status === 'error';
    
    useEffect(() => {
      if (isComplete) {
        const timer = setTimeout(onClose, 8000); // Longer timeout to read results
        return () => clearTimeout(timer);
      }
    }, [isComplete, onClose]);
  
    // Summary card for completion
    if (status === 'done' && results) {
      return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-96 animate-fade-in rounded-2xl p-5 shadow-2xl ring-1 backdrop-blur-xl transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-[#0B1F3A]/95 to-[#050B16]/95 ring-emerald-500/30'
            : 'bg-white/95 ring-emerald-300 shadow-emerald-100'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30 flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
              <div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Triage Complete</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {count ? `${count} email${count !== 1 ? 's' : ''} processed` : 'Processing finished'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-xl p-3 ring-1 ${
              isDark ? 'bg-[#7BAFD4]/10 ring-[#7BAFD4]/20' : 'bg-[#7BAFD4]/5 ring-[#7BAFD4]/20'
            }`}>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-[#7BAFD4]' : 'text-[#0B1F3A]'}`}>Processed</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{results.processed || 0}</p>
            </div>
            <div className={`rounded-xl p-3 ring-1 ${
              isDark ? 'bg-slate-500/10 ring-slate-500/20' : 'bg-slate-100 ring-slate-200'
            }`}>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Skipped</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{results.skipped || 0}</p>
            </div>
            <div className={`rounded-xl p-3 ring-1 ${
              isDark ? 'bg-violet-500/10 ring-violet-500/20' : 'bg-violet-50 ring-violet-200'
            }`}>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>🤖 AI Agent</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{results.ai_agent || 0}</p>
            </div>
            <div className={`rounded-xl p-3 ring-1 ${
              isDark ? 'bg-amber-500/10 ring-amber-500/20' : 'bg-amber-50 ring-amber-200'
            }`}>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>👤 Human</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{results.human || 0}</p>
            </div>
          </div>
          
          {/* Redirect row if any */}
          {(results.redirect > 0) && (
            <div className={`mt-2 rounded-xl p-3 ring-1 ${
              isDark ? 'bg-cyan-500/10 ring-cyan-500/20' : 'bg-cyan-50 ring-cyan-200'
            }`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>↗️ Redirect</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{results.redirect}</p>
              </div>
            </div>
          )}
        </div>
      );
    }
  
    return (
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-80 max-w-md animate-fade-in rounded-xl p-4 shadow-2xl ring-1 backdrop-blur-xl transition-all ${
        isError 
          ? 'bg-gradient-to-r from-red-500/20 to-red-500/10 ring-red-500/30'
          : isComplete
            ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 ring-emerald-500/30'
            : isDark 
              ? 'bg-gradient-to-r from-[#0B1F3A]/90 to-[#050B16]/90 ring-[#7BAFD4]/30'
              : 'bg-white/95 ring-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {!isComplete && !isError && count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isDark ? 'bg-[#7BAFD4]/20 text-[#7BAFD4]' : 'bg-[#7BAFD4]/10 text-[#0B1F3A]'
              }`}>
                {count} email{count !== 1 ? 's' : ''}
              </span>
            )}
            <p className={`text-sm font-medium ${
              isError ? 'text-red-400' : isComplete ? 'text-emerald-400' : isDark ? 'text-slate-200' : 'text-slate-700'
            }`}>
              {status === 'empty' ? '🎉 You are all caught up!' : step || 'Processing...'}
            </p>
          </div>
          {(isComplete || isError) && (
            <button 
              onClick={onClose} 
              className={`ml-3 transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {!isError && (
          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div 
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                isComplete ? 'bg-emerald-500' : 'bg-[#7BAFD4]'
              }`}
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        )}
      </div>
    );
  }
export default function HistoryHeader({ mounted, isDark, loadHistory }) {
    return (
        <div className={`border-b backdrop-blur sticky top-0 z-10 transition-all duration-700 ${
        mounted ? 'opacity-100' : 'opacity-0'
      } ${
        isDark ? 'border-white/10 bg-[#050B16]/60' : 'border-slate-200 bg-white/80'
      }`}>
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Email History
              </h1>
              <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                View all processed emails and their outcomes
              </p>
            </div>
            <button
              onClick={loadHistory}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm ring-1 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                isDark 
                  ? 'bg-white/10 text-white ring-white/10 hover:bg-white/15' 
                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>
       
    )
}
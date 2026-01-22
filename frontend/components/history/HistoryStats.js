export default function HistoryStats({ stats, isDark, mounted }) {
  return (
    <div className={`max-w-screen-2xl mx-auto px-4 py-2 transition-all duration-700 delay-100 ${
      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`rounded-lg p-3 ring-1 backdrop-blur-xl transition-all duration-300 hover:ring-white/20 ${
          isDark 
            ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
            : 'bg-white ring-slate-200 shadow-lg hover:ring-slate-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#7BAFD4]/20 ring-1 ring-[#7BAFD4]/30 rounded-lg flex items-center justify-center">
              <span className="text-base">📊</span>
            </div>
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Total
              </p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.total}</p>
            </div>
          </div>
        </div>
        <div className={`rounded-lg p-3 ring-1 backdrop-blur-xl transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10 hover:ring-emerald-500/20' 
            : 'bg-white ring-slate-200 shadow-lg hover:ring-emerald-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 ring-1 ring-emerald-500/30 rounded-lg flex items-center justify-center">
              <span className="text-base text-emerald-400">✓</span>
            </div>
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Approved
              </p>
              <p className="text-xl font-bold text-emerald-400">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className={`rounded-lg p-3 ring-1 backdrop-blur-xl transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10 hover:ring-red-500/20' 
            : 'bg-white ring-slate-200 shadow-lg hover:ring-red-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/20 ring-1 ring-red-500/30 rounded-lg flex items-center justify-center">
              <span className="text-base text-red-400">✗</span>
            </div>
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Rejected
              </p>
              <p className="text-xl font-bold text-red-400">{stats.rejected}</p>
            </div>
          </div>
        </div>
        <div className={`rounded-lg p-3 ring-1 backdrop-blur-xl transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10 hover:ring-amber-500/20' 
            : 'bg-white ring-slate-200 shadow-lg hover:ring-amber-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/20 ring-1 ring-amber-500/30 rounded-lg flex items-center justify-center">
              <span className="text-base text-amber-400">✎</span>
            </div>
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Edited
              </p>
              <p className="text-xl font-bold text-amber-400">{stats.edited}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryFilters({ 
  isDark, 
  searchQuery, 
  setSearchQuery, 
  filterStatus, 
  setFilterStatus 
}) {
  return (
    <div className={`p-5 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
      <div className="relative mb-4">
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search by subject or sender..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-12 pr-4 py-3 text-sm rounded-xl ring-1 transition-all focus:ring-2 focus:ring-[#7BAFD4] focus:outline-none ${
            isDark 
              ? 'bg-[#050B16]/60 text-white ring-white/10 placeholder:text-slate-500' 
              : 'bg-slate-50 text-slate-900 ring-slate-200 placeholder:text-slate-400'
          }`}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {['all', 'approved', 'rejected', 'edited'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filterStatus === status
                ? 'bg-[#7BAFD4]/20 text-[#7BAFD4] ring-1 ring-[#7BAFD4]/30'
                : isDark 
                  ? 'bg-white/5 text-slate-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

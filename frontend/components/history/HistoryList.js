export default function HistoryList({
  filteredHistory,
  isDark,
  selectedEmail,
  setSelectedEmail,
  handleDelete,
  getStatusBadge,
  getRouteBadge,
  formatDate,
  searchQuery,
  filterStatus
}) {
  return (
    <div className="max-h-[600px] overflow-y-auto">
      {filteredHistory.length === 0 ? (
        <div className="text-center py-16 px-8">
          <div className={`w-20 h-20 ring-1 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-white/5 ring-white/10' : 'bg-slate-100 ring-slate-200'
          }`}>
            <span className="text-4xl opacity-50">📭</span>
          </div>
          <p className={`text-base font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            No emails found
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Processed emails will appear here'}
          </p>
        </div>
      ) : (
        <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
          {filteredHistory.map((email) => (
            <div
              key={email.id}
              className={`group relative w-full text-left p-5 transition-all duration-200 cursor-pointer ${
                selectedEmail?.id === email.id
                  ? 'bg-[#7BAFD4]/10 border-l-2 border-[#7BAFD4]'
                  : isDark 
                    ? 'hover:bg-white/5'
                    : 'hover:bg-slate-50'
              }`}
              onClick={() => setSelectedEmail(email)}
            >
              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(e, email.id)}
                className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:!opacity-100 ${
                  isDark 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' 
                    : 'bg-red-100 text-red-500 hover:bg-red-200'
                }`}
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-start justify-between gap-3 mb-2 pr-6">
                <h3 className={`text-sm font-semibold line-clamp-2 flex-1 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {email.subject || 'No Subject'}
                </h3>
                
                {getStatusBadge(email.approval_status)}
              </div>
              <p className={`text-xs mb-3 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {email.sender_email}
              </p>
              <div className="flex items-center justify-between">
                {getRouteBadge(email.route)}
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formatDate(email.processed_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

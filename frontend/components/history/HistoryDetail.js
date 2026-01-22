export default function HistoryDetail({
  selectedEmail,
  isDark,
  getStatusBadge,
  getRouteBadge,
  formatDate,
  formatTime
}) {
  if (!selectedEmail) {
    return (
      <div className={`rounded-2xl ring-1 backdrop-blur-xl h-full min-h-[500px] flex items-center justify-center transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
          : 'bg-white ring-slate-200 shadow-lg'
      }`}>
        <div className="text-center px-8">
          <div className={`w-24 h-24 ring-1 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
            isDark ? 'bg-white/5 ring-white/10' : 'bg-slate-100 ring-slate-200'
          }`}>
            <span className="text-5xl opacity-50">📋</span>
          </div>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Select an Email
          </h3>
          <p className={`text-sm max-w-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Choose an email from the list to view its full details, response, and processing information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl ring-1 backdrop-blur-xl overflow-hidden animate-fade-in transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
        : 'bg-white ring-slate-200 shadow-lg'
    }`}>
      {/* Email Header */}
      <div className={`p-4 border-b ${
        isDark 
          ? 'bg-gradient-to-r from-[#7BAFD4]/20 to-violet-500/10 border-white/10' 
          : 'bg-gradient-to-r from-[#7BAFD4]/10 to-violet-500/5 border-slate-200'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className={`text-lg font-bold leading-tight flex-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {selectedEmail.subject || 'No Subject'}
          </h2>
          {getStatusBadge(selectedEmail.approval_status)}
        </div>
        <div className={`flex flex-wrap items-center gap-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <div className="flex items-center gap-2">
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>From:</span>
            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {selectedEmail.sender_email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Processed:</span>
            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatDate(selectedEmail.processed_at)} at {formatTime(selectedEmail.processed_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Email Metadata */}
      <div className={`p-4 border-b ${
        isDark ? 'bg-[#050B16]/40 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Route
            </p>
            {getRouteBadge(selectedEmail.route)}
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Confidence
            </p>
            <div className="flex items-center gap-3">
              <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-[#7BAFD4] to-[#6AA3CC] rounded-full transition-all"
                  style={{ width: `${(selectedEmail.confidence || 0) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[#7BAFD4]">
                {((selectedEmail.confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Status
            </p>
            {getStatusBadge(selectedEmail.approval_status)}
          </div>
        </div>
      </div>

      {/* Response Content */}
      <div className="p-4">
        <div className="mb-4">
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${
            isDark ? 'text-slate-500' : 'text-slate-500'
          }`}>
            <span className={`w-8 h-8 ring-1 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-[#7BAFD4]/20 ring-[#7BAFD4]/30' : 'bg-[#7BAFD4]/10 ring-[#7BAFD4]/20'
            }`}>
              📨
            </span>
            Final Response
          </h3>
          {selectedEmail.final_response ? (
            <div className={`rounded-xl p-4 ring-1 max-h-80 overflow-y-auto ${
              isDark 
                ? 'bg-[#050B16]/60 ring-white/10' 
                : 'bg-slate-50 ring-slate-200'
            }`}>
              <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {selectedEmail.final_response}
              </p>
            </div>
          ) : (
            <div className="bg-red-500/10 rounded-xl p-5 ring-1 ring-red-500/20 text-center">
              <p className="text-red-400 font-medium text-sm">No response was sent for this email</p>
              <p className="text-red-400/70 text-xs mt-1">This email was rejected without a response</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={`px-4 py-3 border-t ${
        isDark ? 'bg-[#050B16]/40 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <span>
            Email ID: <code className={`px-2 py-1 rounded ring-1 ${
              isDark ? 'bg-white/5 text-slate-400 ring-white/10' : 'bg-slate-100 text-slate-600 ring-slate-200'
            }`}>{selectedEmail.email_id}</code>
          </span>
          <span>
            Record ID: <code className={`px-2 py-1 rounded ring-1 ${
              isDark ? 'bg-white/5 text-slate-400 ring-white/10' : 'bg-slate-100 text-slate-600 ring-slate-200'
            }`}>{selectedEmail.id}</code>
          </span>
        </div>
      </div>
    </div>
  );
}

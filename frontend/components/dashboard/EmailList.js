/**
 * Email List Panel
 * Left panel with route filter and email cards
 */
import Badge from '../ui/Badge';

function EmailCard({ email, isSelected, isDark, onSelect, onDelete }) {
  return (
    <div
      className={`relative w-full text-left p-4 rounded-xl ring-1 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-[#7BAFD4]/20 ring-[#7BAFD4]/40 shadow-lg shadow-[#7BAFD4]/10'
          : isDark 
            ? 'bg-white/5 ring-white/10 hover:bg-white/10 hover:ring-white/20'
            : 'bg-slate-50 ring-slate-200 hover:bg-slate-100 hover:ring-slate-300'
      }`}
      onClick={() => onSelect(email)}
    >
      {/* Delete button */}
      <button
        onClick={(e) => onDelete(e, email.id)}
        className={`absolute top-2 right-2 p-1 rounded-md transition-all duration-200 opacity-60 hover:opacity-100 ${
          isDark 
            ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' 
            : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
        }`}
        aria-label="Delete email from queue"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start justify-between gap-3 mb-2 pr-6">
        <div className={`text-sm font-semibold line-clamp-2 flex-1 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          {email.subject}
        </div>
        {email.route === 'AI_AGENT' && email.confidence && (
          <Badge variant="info" isDark={isDark}>
            {(email.confidence * 100).toFixed(0)}%
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {email.sender_email}
        </div>
        {email.received_at && (
          <div className={`text-xs whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {new Date(email.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>
      {email.route === 'REDIRECT' && email.redirect_department && (
        <div className={`text-xs mb-3 flex items-center gap-1.5 ${isDark ? 'text-[#7BAFD4]' : 'text-[#0B1F3A]'}`}>
          <span aria-hidden="true">↪️</span>
          <span className="font-medium">{email.redirect_department}</span>
        </div>
      )}
      <div className={email.route !== 'REDIRECT' ? 'mt-1' : ''}>
        <Badge variant={email.route === 'AI_AGENT' ? 'success' : 'warning'} isDark={isDark}>
          {email.route === 'AI_AGENT' ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              AI Ready
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
              Manual Review
            </>
          )}
        </Badge>
      </div>
    </div>
  );
}

function EmptyList({ isDark }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4 opacity-50">📭</div>
      <p className={`text-base font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        No pending emails
      </p>
      <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
        All caught up!
      </p>
    </div>
  );
}

export default function EmailList({ 
  emails, 
  selectedEmail, 
  filterRoute, 
  isDark, 
  onSelect, 
  onDelete, 
  onFilterChange 
}) {
  return (
    <div className="lg:col-span-1">
      <div className={`rounded-2xl p-6 ring-1 backdrop-blur-xl transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
          : 'bg-white ring-slate-200 shadow-lg'
      }`}>
        <div className="mb-6">
          <label className={`block text-xs font-semibold mb-3 uppercase tracking-wider ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Filter by Route
          </label>
          <select
            value={filterRoute}
            onChange={(e) => onFilterChange(e.target.value)}
            className={`w-full rounded-xl px-4 py-3 text-sm ring-1 backdrop-blur-sm transition-all focus:ring-2 focus:ring-[#7BAFD4] focus:outline-none ${
              isDark 
                ? 'bg-[#050B16]/60 text-white ring-white/10' 
                : 'bg-slate-50 text-slate-900 ring-slate-200'
            }`}
          >
            <option value="AI_AGENT">🤖 AI Agent (Ready to Send)</option>
            <option value="HUMAN_REQUIRED">👤 Human Required</option>
            <option value="REDIRECT">↪️ Redirect</option>
          </select>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
          {emails.length === 0 ? (
            <EmptyList isDark={isDark} />
          ) : (
            emails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                isSelected={selectedEmail?.id === email.id}
                isDark={isDark}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

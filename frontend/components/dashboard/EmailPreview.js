/**
 * Email Preview Panel
 * Middle panel showing selected email details
 */
import Badge from '../ui/Badge';

function EmailDetails({ email, isDark }) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className={`mb-6 pb-5 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <h2 className={`text-xl font-bold mb-4 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {email.subject}
        </h2>
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>From</span>
            <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{email.sender_email}</span>
          </div>
          {email.received_at && (
            <div className="flex flex-col gap-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Received</span>
              <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {new Date(email.received_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })} at {new Date(email.received_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-4 pt-2 flex-wrap">
            <div className="flex flex-col gap-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Route</span>
              <Badge variant={email.route === 'AI_AGENT' ? 'success' : 'warning'} isDark={isDark}>
                {email.route === 'AI_AGENT' ? '🤖 AI Agent' : email.route === 'REDIRECT' ? '↪️ Redirect' : '👤 Human Required'}
              </Badge>
            </div>
            {email.route === 'REDIRECT' && email.redirect_department && (
              <div className="flex flex-col gap-1">
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Department</span>
                <Badge variant="info" isDark={isDark}>
                  {email.redirect_department}
                </Badge>
              </div>
            )}
            {email.confidence && (
              <div className="flex flex-col gap-1">
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Confidence</span>
                <Badge variant="info" isDark={isDark}>
                  {(email.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Original Email Body */}
      <div className="mb-6">
        <h3 className={`text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <span aria-hidden="true">📧</span> Original Email
        </h3>
        <div className={`text-sm p-4 rounded-xl ring-1 max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap ${
          isDark 
            ? 'text-slate-300 bg-[#050B16]/60 ring-white/10' 
            : 'text-slate-700 bg-slate-50 ring-slate-200'
        }`}>
          {email.body}
        </div>
      </div>

      {/* Route Status Indicator */}
      <div className={`p-4 rounded-xl ring-1 ${
        email.route === 'AI_AGENT'
          ? 'bg-emerald-500/10 ring-emerald-500/20'
          : 'bg-amber-500/10 ring-amber-500/20'
      }`}>
        <p className={`text-sm font-semibold ${
          email.route === 'AI_AGENT' ? 'text-emerald-400' : 'text-amber-400'
        }`}>
          {email.route === 'AI_AGENT'
            ? '✓ AI-Generated Response Ready for Review'
            : '⚠ Requires Manual Response'}
        </p>
      </div>
    </div>
  );
}

function EmptyPreview({ isDark }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="text-5xl mb-5 opacity-50">📬</div>
      <p className={`text-base font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        Select an email to view details
      </p>
      <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
        Choose from the list on the left
      </p>
    </div>
  );
}

export default function EmailPreview({ email, isDark }) {
  return (
    <div className="lg:col-span-1">
      <div className={`rounded-2xl p-6 ring-1 backdrop-blur-xl min-h-[400px] transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
          : 'bg-white ring-slate-200 shadow-lg'
      }`}>
        {email ? (
          <EmailDetails email={email} isDark={isDark} />
        ) : (
          <EmptyPreview isDark={isDark} />
        )}
      </div>
    </div>
  );
}

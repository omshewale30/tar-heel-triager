/**
 * Approval Panel Wrapper
 * Wraps ApprovalPanel with empty state handling
 */
import ApprovalPanel from './ApprovalPanel';

function EmptyApprovalPanel({ isDark }) {
  return (
    <div className={`rounded-2xl p-6 ring-1 backdrop-blur-xl min-h-[400px] transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
        : 'bg-white ring-slate-200 shadow-lg'
    }`}>
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <div className="text-5xl mb-5 opacity-50">✉️</div>
        <p className={`text-base font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Select an email to approve or edit
        </p>
        <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Response panel will appear here
        </p>
      </div>
    </div>
  );
}

export default function ApprovalPanelWrapper({ 
  email, 
  isDark, 
  onApprove, 
  onReject, 
  onRedirect 
}) {
  return (
    <div className="lg:col-span-1">
      {email ? (
        <ApprovalPanel
          email={email}
          route={email.route}
          onApprove={onApprove}
          onReject={onReject}
          onRedirect={onRedirect}
        />
      ) : (
        <EmptyApprovalPanel isDark={isDark} />
      )}
    </div>
  );
}

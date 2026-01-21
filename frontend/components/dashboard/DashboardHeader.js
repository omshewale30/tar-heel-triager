/**
 * Dashboard Header
 * Title, description, fetch button, and pending count
 */
import Spinner from '../ui/Spinner';

export default function DashboardHeader({ 
  mounted, 
  isDark, 
  fetchingTriage, 
  onFetchTriage, 
  pendingCount 
}) {
  return (
    <div className={`border-b backdrop-blur transition-all duration-700 ${
      mounted ? 'opacity-100' : 'opacity-0'
    } ${
      isDark ? 'border-white/10 bg-[#050B16]/60' : 'border-slate-200 bg-white/80'
    }`}>
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Email Triage Dashboard
            </h2>
            <p className={`text-base mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Review and approve AI-generated email responses
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onFetchTriage}
              disabled={fetchingTriage}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition-all duration-300 ${
                fetchingTriage
                  ? isDark 
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed ring-1 ring-white/10'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed ring-1 ring-slate-200'
                  : isDark
                    ? 'bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {fetchingTriage ? (
                <>
                  <Spinner />
                  Processing...
                </>
              ) : (
                <>
                  <span aria-hidden="true">🤖</span>
                  Fetch & Triage
                </>
              )}
            </button>
            
            <div className={`flex items-center gap-3 rounded-xl px-5 py-3 ring-1 ${
              isDark ? 'bg-white/5 ring-white/10' : 'bg-white ring-slate-200'
            }`}>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Pending</div>
              <div className="text-2xl font-bold text-[#7BAFD4]">
                {pendingCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

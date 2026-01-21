/**
 * Login Card
 * Right column sign-in card with system status
 */

function FloatingElement({ delay = 0, children }) {
  return (
    <div
      className="animate-float"
      style={{
        animationDelay: `${delay}s`,
        animationDuration: "6s",
      }}
    >
      {children}
    </div>
  );
}

function ShieldIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7BAFD4]/15 ring-1 ring-[#7BAFD4]/25 shrink-0"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 text-[#7BAFD4]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    </span>
  );
}

function SystemStatus() {
  return (
    <div className="mt-6 rounded-xl bg-[#050B16]/60 p-5 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">System Status</div>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          Operational
        </div>
      </div>
      <div className="mt-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-3">
          <span className="text-slate-400">AI Model</span>
          <span className="font-medium text-slate-200">Azure OpenAI</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-3">
          <span className="text-slate-400">Workflow</span>
          <span className="font-medium text-slate-200">Triage → Draft → Approve</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-3">
          <span className="text-slate-400">Authentication</span>
          <span className="font-medium text-slate-200">Microsoft Entra ID</span>
        </div>
      </div>
    </div>
  );
}

function SignInButton({ onLogin }) {
  return (
    <div className="mt-8">
      <button
        onClick={onLogin}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#7BAFD4] to-[#6AA3CC] px-6 py-4 text-base font-bold text-[#0B1F3A] shadow-xl shadow-[#7BAFD4]/20 ring-1 ring-[#7BAFD4]/40 transition-all duration-300 hover:shadow-2xl hover:shadow-[#7BAFD4]/30 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B16] active:scale-[0.98]"
        aria-label="Sign in with Microsoft to open the dashboard"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
        </svg>
        Sign in with Microsoft
        <svg
          className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-400">UNC Chapel Hill Cashier&apos;s Office</p>
        <p className="mt-1 text-xs font-medium text-slate-500">Internal staff access only</p>
      </div>
    </div>
  );
}

export default function LoginCard({ onLogin, mounted }) {
  return (
    <aside
      className={`transition-all duration-1000 delay-500 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <FloatingElement delay={0}>
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Secure Access Portal</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Sign in to access the approval dashboard. Every response is reviewed by staff before sending.
              </p>
            </div>
            <ShieldIcon />
          </div>

          <SystemStatus />
          <SignInButton onLogin={onLogin} />
        </div>
      </FloatingElement>
    </aside>
  );
}

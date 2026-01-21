/**
 * Landing Page Footer
 */
export default function LandingFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 py-10">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Tar Heel Triager • Internal tool</p>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Secure</span>
          <span aria-hidden="true">•</span>
          <span>Approval-gated</span>
          <span aria-hidden="true">•</span>
          <span>Staff only</span>
        </div>
      </div>
    </footer>
  );
}

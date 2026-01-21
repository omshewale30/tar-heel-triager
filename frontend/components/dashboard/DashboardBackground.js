/**
 * Dashboard Background Effects
 * Theme-aware gradient and grid pattern
 */
export default function DashboardBackground({ isDark }) {
  if (isDark) {
    return (
      <>
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_15%,rgba(123,175,212,0.25),transparent_55%),radial-gradient(900px_circle_at_80%_0%,rgba(11,31,58,0.45),transparent_50%),linear-gradient(to_bottom,#050B16,#070F22)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(900px_circle_at_50%_20%,black,transparent_70%)]"
        />
      </>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_15%,rgba(123,175,212,0.12),transparent_55%),radial-gradient(900px_circle_at_80%_0%,rgba(11,31,58,0.06),transparent_50%),linear-gradient(to_bottom,#f8fafc,#f1f5f9)]"
    />
  );
}

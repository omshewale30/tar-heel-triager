/**
 * Landing Page Background Effects
 * Hi-tech glow and grid pattern
 */
export default function LandingBackground() {
  return (
    <>
      {/* Radial gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_15%,rgba(123,175,212,0.35),transparent_55%),radial-gradient(900px_circle_at_80%_0%,rgba(11,31,58,0.55),transparent_50%),linear-gradient(to_bottom,#050B16,#070F22)]"
      />
      {/* Grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(700px_circle_at_40%_20%,black,transparent_60%)]"
      />
      {/* Pulsing glow orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 animate-pulse opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(123,175,212,0.4) 0%, transparent 70%)",
          animationDuration: "4s",
        }}
      />
    </>
  );
}

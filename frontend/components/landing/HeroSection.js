/**
 * Hero Section
 * Left column with badges, title, and description
 */

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10 backdrop-blur-sm">
      {children}
    </span>
  );
}

export default function HeroSection({ mounted }) {
  return (
    <div
      className={`transition-all duration-1000 delay-200 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge>AI-Powered</Badge>
        <Badge>Secure & Gated</Badge>
        <Badge>Real-time Triage</Badge>
      </div>

      <h2
        id="page-title"
        className="mt-6 text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
      >
        Smart email triage,{" "}
        <span className="bg-gradient-to-r from-[#7BAFD4] via-[#6AA3CC] to-[#5A9AC4] bg-clip-text text-transparent">
          human oversight
        </span>
      </h2>
      <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-300 sm:text-xl">
        Tar Heel Triager classifies incoming cashier inquiries, prioritizes urgent requests, and generates draft
        responses—always requiring staff approval before sending.
      </p>
    </div>
  );
}

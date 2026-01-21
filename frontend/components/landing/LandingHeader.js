/**
 * Landing Page Header
 * Logo and sign-in button
 */
export default function LandingHeader({ onLogin, mounted }) {
  return (
    <header
      className={`border-b border-white/10 bg-[#050B16]/60 backdrop-blur transition-opacity duration-1000 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-7">
        <div className="flex items-center gap-4">
          <img
            src="/UNC.png"
            alt="Heelper AI"
            className="h-14 w-auto max-w-[72px] rounded-xl ring-1 ring-white/10 object-contain"
            loading="lazy"
            decoding="async"
          />
          <div className="leading-tight">
            <h1 className="text-lg font-bold text-white">Heelper AI</h1>
            <p className="text-sm text-[#7BAFD4]">AI Email Assistant</p>
          </div>
        </div>

        <button
          onClick={onLogin}
          className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 transition-all duration-300 hover:bg-white/15 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7BAFD4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B16]"
        >
          Sign in
        </button>
      </div>
    </header>
  );
}

/**
 * Landing Page with Azure AD Login
 * UNC Cashier Email Triage Dashboard
 */
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../lib/authConfig";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";

function Icon({ children, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 ring-1 ring-white/10 ${className}`}
    >
      {children}
    </span>
  );
}

function CheckItem({ children }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#7BAFD4]/20 text-[#0B1F3A]"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.42 0l-3.49-3.49a1 1 0 111.415-1.414l2.78 2.78 6.49-6.49a1 1 0 011.425-.006z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span className="text-sm text-slate-700">{children}</span>
    </li>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10 backdrop-blur-sm">
      {children}
    </span>
  );
}

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

export default function LandingPage() {
  const { instance, accounts } = useMsal();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (accounts.length > 0) {
      router.push('/dashboard');
    }
  }, [accounts, router]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    try {
      // Use redirect flow instead of popup (more reliable in enterprise environments)
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <>
      <Head>
        <title>Heelper AI</title>
        <meta
          name="description"
          content="Internal staff portal for Heelper AI: triage, prioritize, and draft responses with an approval-first workflow."
        />
      </Head>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:ring-2 focus:ring-[#7BAFD4]"
      >
        Skip to content
      </a>

      <div className="min-h-screen bg-[#050B16] text-slate-100">
        {/* Hi-tech background: glow + grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_15%,rgba(123,175,212,0.35),transparent_55%),radial-gradient(900px_circle_at_80%_0%,rgba(11,31,58,0.55),transparent_50%),linear-gradient(to_bottom,#050B16,#070F22)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(700px_circle_at_40%_20%,black,transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 animate-pulse opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(123,175,212,0.4) 0%, transparent 70%)",
            animationDuration: "4s",
          }}
        />

        {/* Header */}
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
              onClick={handleLogin}
              className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 transition-all duration-300 hover:bg-white/15 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7BAFD4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B16]"
            >
              Sign in
            </button>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
          <div className="grid min-h-[calc(100vh-140px)] items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left column - Hero content */}
            <section
              className={`lg:col-span-7 transition-all duration-1000 delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              aria-labelledby="page-title"
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

              {/* Feature cards */}
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="group rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] p-6 ring-1 ring-white/10 transition-all duration-300 hover:ring-[#7BAFD4]/30 hover:shadow-lg hover:shadow-[#7BAFD4]/10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-white">AI Pipeline</div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      "Classify intent & category",
                      "Score priority and route",
                      "Generate draft from FAQ",
                      "Await staff approval",
                    ].map((step, i) => (
                      <div
                        key={step}
                        className={`flex items-center gap-3 transition-all duration-500 ${activeStep === i ? "translate-x-1" : ""}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full transition-all duration-500 ${
                            activeStep === i
                              ? "bg-[#7BAFD4] shadow-lg shadow-[#7BAFD4]/50 scale-125"
                              : activeStep > i
                                ? "bg-[#7BAFD4]/50"
                                : "bg-white/25"
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className={`text-sm transition-colors duration-500 ${
                            activeStep === i ? "text-white font-medium" : "text-slate-300"
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="group rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] p-6 ring-1 ring-white/10 transition-all duration-300 hover:ring-[#7BAFD4]/30 hover:shadow-lg hover:shadow-[#7BAFD4]/10">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="text-lg" aria-hidden="true">
                      👤
                    </span>
                    Your Workflow
                  </div>
                  <ul className="mt-5 space-y-4">
                    {[
                      { num: "1", text: "Open the approval queue and pick the next email", icon: "📬" },
                      { num: "2", text: "Review the AI draft and edit for tone/policy", icon: "✍️" },
                      { num: "3", text: "Approve to send or reject to reroute", icon: "✅" },
                    ].map((item) => (
                      <li key={item.num} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#7BAFD4]/20 text-xs font-bold text-[#7BAFD4] ring-1 ring-[#7BAFD4]/30">
                          {item.num}
                        </span>
                        <span className="flex-1 text-sm text-slate-200">
                          <span className="mr-1.5" aria-hidden="true">
                            {item.icon}
                          </span>
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Right column - Sign in card */}
            <aside
              className={`lg:col-span-5 transition-all duration-1000 delay-500 ${
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
                    <Icon className="bg-[#7BAFD4]/15 ring-[#7BAFD4]/25 shrink-0">
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
                    </Icon>
                  </div>

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

                  <div className="mt-8">
                    <button
                      onClick={handleLogin}
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
                </div>
              </FloatingElement>
            </aside>
          </div>

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
        </main>
      </div>
    </>
  );
}

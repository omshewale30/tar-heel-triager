/**
 * Landing Page with Azure AD Login
 * UNC Cashier Email Triage Dashboard
 */
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../lib/authConfig";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import {
  LandingBackground,
  LandingHeader,
  HeroSection,
  FeatureCards,
  LoginCard,
  LandingFooter,
} from "../components/landing";

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

  // Mount animation and step cycling for AI Pipeline card
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    try {
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
        <LandingBackground />
        <LandingHeader onLogin={handleLogin} mounted={mounted} />

        <main id="main" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
          <div className="grid min-h-[calc(100vh-140px)] items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left column - Hero content */}
            <section className="lg:col-span-7" aria-labelledby="page-title">
              <HeroSection mounted={mounted} />
              <FeatureCards activeStep={activeStep} />
            </section>

            {/* Right column - Sign in card */}
            <div className="lg:col-span-5">
              <LoginCard onLogin={handleLogin} mounted={mounted} />
            </div>
          </div>

          <LandingFooter />
        </main>
      </div>
    </>
  );
}

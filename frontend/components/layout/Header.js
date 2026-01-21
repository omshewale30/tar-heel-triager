/**
 * Header Component with User Info, Navigation, Theme Toggle and Logout
 * Supports light/dark mode
 */
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTheme } from "../../lib/ThemeContext";

// Sun icon for light mode
function SunIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

// Moon icon for dark mode
function MoonIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

export default function Header() {
  const { instance, accounts } = useMsal();
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();

  const handleLogout = () => {
    instance.logoutPopup().then(() => {
      router.push('/');
    });
  };

  const user = accounts[0];
  const isActive = (path) => router.pathname === path;

  return (
    <header className={`border-b backdrop-blur transition-colors duration-300 ${
      isDark 
        ? 'border-white/10 bg-[#050B16]/60' 
        : 'border-slate-200 bg-white/80'
    }`}>
      <div className="max-w-screen-2xl mx-auto px-5 py-5 sm:px-7">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            {/* Logo / Brand */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <img
                src="/UNC.png"
                alt="Heelper AI"
                className={`h-12 w-auto max-w-[64px] rounded-xl ring-1 object-contain transition-transform duration-300 group-hover:scale-105 ${
                  isDark ? 'ring-white/10' : 'ring-slate-200'
                }`}
                loading="lazy"
                decoding="async"
              />
              <div className="leading-tight">
                <h1 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Heelper AI
                </h1>
                <p className="text-xs text-[#7BAFD4]">AI Email Assistant</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive('/dashboard')
                    ? 'bg-[#7BAFD4]/20 text-[#7BAFD4] ring-1 ring-[#7BAFD4]/30'
                    : isDark 
                      ? 'text-slate-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">📧</span>
                  Dashboard
                </span>
              </Link>
              <Link
                href="/history"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive('/history')
                    ? 'bg-[#7BAFD4]/20 text-[#7BAFD4] ring-1 ring-[#7BAFD4]/30'
                    : isDark 
                      ? 'text-slate-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">📋</span>
                  History
                </span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7BAFD4] focus-visible:ring-offset-2 ${
                isDark 
                  ? 'bg-white/10 ring-1 ring-white/10 hover:bg-white/15 focus-visible:ring-offset-[#050B16]' 
                  : 'bg-slate-100 ring-1 ring-slate-200 hover:bg-slate-200 focus-visible:ring-offset-white'
              }`}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="theme-toggle-icon">
                {isDark ? (
                  <SunIcon className="h-5 w-5 text-amber-400" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-slate-600" />
                )}
              </span>
            </button>

            {/* User Info */}
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user?.name || 'User'}
              </p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {user?.username || ''}
              </p>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm ring-1 transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7BAFD4] focus-visible:ring-offset-2 ${
                isDark 
                  ? 'bg-white/10 text-white ring-white/10 hover:bg-white/15 focus-visible:ring-offset-[#050B16]' 
                  : 'bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200 focus-visible:ring-offset-white'
              }`}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

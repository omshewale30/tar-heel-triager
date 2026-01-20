/**
 * EmailHistory Component
 * Displays processed emails from the EmailHistory table with filtering and search
 * Supports light/dark mode
 */
import { useState, useEffect } from 'react';
import { getEmailHistory, deleteEmailHistory } from '../api';
import { useTheme } from '../lib/ThemeContext';

// Spinner component
function Spinner({ className = "h-8 w-8" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// Badge component with theme support
function Badge({ children, variant = 'default', isDark = true }) {
  const darkVariants = {
    default: 'bg-white/5 text-slate-200 ring-white/10',
    success: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    error: 'bg-red-500/10 text-red-400 ring-red-500/20',
    info: 'bg-[#7BAFD4]/10 text-[#7BAFD4] ring-[#7BAFD4]/20',
    violet: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
  };
  
  const lightVariants = {
    default: 'bg-slate-100 text-slate-700 ring-slate-200',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
    error: 'bg-red-50 text-red-700 ring-red-200',
    info: 'bg-[#7BAFD4]/10 text-[#0B1F3A] ring-[#7BAFD4]/30',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  };

  const variants = isDark ? darkVariants : lightVariants;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${variants[variant]}`}>
      {children}
    </span>
  );
}

export default function EmailHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    setMounted(true);
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEmailHistory();
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        const err = await response.json();
        setError(err.detail || 'Failed to load email history');
      }
    } catch (err) {
      setError(err.message || 'Failed to load email history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, emailId) => {
    e.stopPropagation();
    try {
      const response = await deleteEmailHistory(emailId);
      if (response.ok) {
        setHistory(prev => prev.filter(email => email.id !== emailId));
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(null);
        }
      } else {
        const err = await response.json();
        setError(err.detail || 'Failed to delete email history');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete email history');
    }
  };

  // Filter and search logic
  const filteredHistory = history.filter((email) => {
    const matchesStatus = filterStatus === 'all' || email.approval_status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stats calculations
  const stats = {
    total: history.length,
    approved: history.filter((e) => e.approval_status === 'approved').length,
    rejected: history.filter((e) => e.approval_status === 'rejected').length,
    edited: history.filter((e) => e.approval_status === 'edited').length,
  };

  const getStatusBadge = (status) => {
    const config = {
      approved: { variant: 'success', icon: '✓' },
      rejected: { variant: 'error', icon: '✗' },
      edited: { variant: 'warning', icon: '✎' },
    };
    const { variant, icon } = config[status] || { variant: 'default', icon: '•' };
    return (
      <Badge variant={variant} isDark={isDark}>
        <span aria-hidden="true">{icon}</span>
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const getRouteBadge = (route) => {
    if (route === 'AI_AGENT') {
      return (
        <Badge variant="violet" isDark={isDark}>
          <span aria-hidden="true">🤖</span>
          AI Agent
        </Badge>
      );
    }
    return (
      <Badge variant="info" isDark={isDark}>
        <span aria-hidden="true">👤</span>
        Human
      </Badge>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? 'bg-[#050B16]' : 'bg-slate-50'
      }`}>
        {/* Background effects */}
        {isDark && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_15%,rgba(123,175,212,0.25),transparent_55%),radial-gradient(900px_circle_at_80%_0%,rgba(11,31,58,0.45),transparent_50%),linear-gradient(to_bottom,#050B16,#070F22)]"
          />
        )}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ring-1 backdrop-blur-xl mb-4 ${
            isDark ? 'bg-white/10 ring-white/10' : 'bg-white ring-slate-200 shadow-lg'
          }`}>
            <Spinner className="h-8 w-8 text-[#7BAFD4]" />
          </div>
          <p className={`text-base font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Loading email history...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 transition-colors duration-300 ${
        isDark ? 'bg-[#050B16]' : 'bg-slate-50'
      }`}>
        {/* Background effects */}
        {isDark && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_15%,rgba(123,175,212,0.25),transparent_55%),radial-gradient(900px_circle_at_80%_0%,rgba(11,31,58,0.45),transparent_50%),linear-gradient(to_bottom,#050B16,#070F22)]"
          />
        )}
        <div className={`rounded-2xl p-8 ring-1 backdrop-blur-xl max-w-md w-full text-center ${
          isDark 
            ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
            : 'bg-white ring-slate-200 shadow-lg'
        }`}>
          <div className="w-16 h-16 bg-red-500/10 ring-1 ring-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Failed to Load History
          </h2>
          <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{error}</p>
          <button
            onClick={loadHistory}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7BAFD4] to-[#6AA3CC] px-6 py-3 text-sm font-semibold text-[#0B1F3A] shadow-lg ring-1 ring-[#7BAFD4]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#7BAFD4]/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#050B16] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Background effects */}
      {isDark ? (
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
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_15%,rgba(123,175,212,0.12),transparent_55%),radial-gradient(900px_circle_at_80%_0%,rgba(11,31,58,0.06),transparent_50%),linear-gradient(to_bottom,#f8fafc,#f1f5f9)]"
        />
      )}

      {/* Header Section */}
      <div className={`border-b backdrop-blur sticky top-0 z-10 transition-all duration-700 ${
        mounted ? 'opacity-100' : 'opacity-0'
      } ${
        isDark ? 'border-white/10 bg-[#050B16]/60' : 'border-slate-200 bg-white/80'
      }`}>
        <div className="max-w-screen-2xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Email History
              </h1>
              <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                View all processed emails and their outcomes
              </p>
            </div>
            <button
              onClick={loadHistory}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm ring-1 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                isDark 
                  ? 'bg-white/10 text-white ring-white/10 hover:bg-white/15' 
                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`max-w-screen-2xl mx-auto px-6 py-6 transition-all duration-700 delay-100 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-2xl p-5 ring-1 backdrop-blur-xl transition-all duration-300 hover:ring-white/20 ${
            isDark 
              ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
              : 'bg-white ring-slate-200 shadow-lg hover:ring-slate-300'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#7BAFD4]/20 ring-1 ring-[#7BAFD4]/30 rounded-xl flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Total Processed
                </p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.total}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-2xl p-5 ring-1 backdrop-blur-xl transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10 hover:ring-emerald-500/20' 
              : 'bg-white ring-slate-200 shadow-lg hover:ring-emerald-300'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 ring-1 ring-emerald-500/30 rounded-xl flex items-center justify-center">
                <span className="text-xl text-emerald-400">✓</span>
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Approved
                </p>
                <p className="text-2xl font-bold text-emerald-400">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-2xl p-5 ring-1 backdrop-blur-xl transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10 hover:ring-red-500/20' 
              : 'bg-white ring-slate-200 shadow-lg hover:ring-red-300'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 ring-1 ring-red-500/30 rounded-xl flex items-center justify-center">
                <span className="text-xl text-red-400">✗</span>
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Rejected
                </p>
                <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-2xl p-5 ring-1 backdrop-blur-xl transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10 hover:ring-amber-500/20' 
              : 'bg-white ring-slate-200 shadow-lg hover:ring-amber-300'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 ring-1 ring-amber-500/30 rounded-xl flex items-center justify-center">
                <span className="text-xl text-amber-400">✎</span>
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Edited
                </p>
                <p className="text-2xl font-bold text-amber-400">{stats.edited}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-screen-2xl mx-auto px-6 pb-8 transition-all duration-700 delay-200 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Panel - Filters and List */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl ring-1 backdrop-blur-xl overflow-hidden transition-colors duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
                : 'bg-white ring-slate-200 shadow-lg'
            }`}>
              {/* Search and Filter */}
              <div className={`p-5 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <div className="relative mb-4">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by subject or sender..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 text-sm rounded-xl ring-1 transition-all focus:ring-2 focus:ring-[#7BAFD4] focus:outline-none ${
                      isDark 
                        ? 'bg-[#050B16]/60 text-white ring-white/10 placeholder:text-slate-500' 
                        : 'bg-slate-50 text-slate-900 ring-slate-200 placeholder:text-slate-400'
                    }`}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['all', 'approved', 'rejected', 'edited'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        filterStatus === status
                          ? 'bg-[#7BAFD4]/20 text-[#7BAFD4] ring-1 ring-[#7BAFD4]/30'
                          : isDark 
                            ? 'bg-white/5 text-slate-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email List */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-16 px-8">
                    <div className={`w-20 h-20 ring-1 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                      isDark ? 'bg-white/5 ring-white/10' : 'bg-slate-100 ring-slate-200'
                    }`}>
                      <span className="text-4xl opacity-50">📭</span>
                    </div>
                    <p className={`text-base font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      No emails found
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {searchQuery || filterStatus !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Processed emails will appear here'}
                    </p>
                  </div>
                ) : (
                  <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
{filteredHistory.map((email) => (
                                      <div
                                        key={email.id}
                                        className={`relative w-full text-left p-5 transition-all duration-200 cursor-pointer ${
                                          selectedEmail?.id === email.id
                                            ? 'bg-[#7BAFD4]/10 border-l-2 border-[#7BAFD4]'
                                            : isDark 
                                              ? 'hover:bg-white/5'
                                              : 'hover:bg-slate-50'
                                        }`}
                                        onClick={() => setSelectedEmail(email)}
                                      >
                                        {/* Delete button */}
                                        <button
                                          onClick={(e) => handleDelete(e, email.id)}
                                          className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:!opacity-100 ${
                                            isDark 
                                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' 
                                              : 'bg-red-100 text-red-500 hover:bg-red-200'
                                          }`}
                                          style={{ opacity: 0.7 }}
                                          title="Delete"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                        <div className="flex items-start justify-between gap-3 mb-2 pr-6">
                                          <h3 className={`text-sm font-semibold line-clamp-2 flex-1 ${
                                            isDark ? 'text-white' : 'text-slate-900'
                                          }`}>
                                            {email.subject || 'No Subject'}
                                          </h3>
                                          {getStatusBadge(email.approval_status)}
                                        </div>
                        <p className={`text-xs mb-3 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {email.sender_email}
                        </p>
<div className="flex items-center justify-between">
                                          {getRouteBadge(email.route)}
                                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {formatDate(email.processed_at)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Email Details */}
          <div className="lg:col-span-3">
            {selectedEmail ? (
              <div className={`rounded-2xl ring-1 backdrop-blur-xl overflow-hidden animate-fade-in transition-colors duration-300 ${
                isDark 
                  ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
                  : 'bg-white ring-slate-200 shadow-lg'
              }`}>
                {/* Email Header */}
                <div className={`p-6 border-b ${
                  isDark 
                    ? 'bg-gradient-to-r from-[#7BAFD4]/20 to-violet-500/10 border-white/10' 
                    : 'bg-gradient-to-r from-[#7BAFD4]/10 to-violet-500/5 border-slate-200'
                }`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className={`text-xl font-bold leading-tight flex-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedEmail.subject || 'No Subject'}
                    </h2>
                    {getStatusBadge(selectedEmail.approval_status)}
                  </div>
                  <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <div className="flex items-center gap-2">
                      <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>From:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selectedEmail.sender_email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Processed:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatDate(selectedEmail.processed_at)} at {formatTime(selectedEmail.processed_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Metadata */}
                <div className={`p-6 border-b ${
                  isDark ? 'bg-[#050B16]/40 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Route
                      </p>
                      {getRouteBadge(selectedEmail.route)}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Confidence
                      </p>
                      <div className="flex items-center gap-3">
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                          <div
                            className="h-full bg-gradient-to-r from-[#7BAFD4] to-[#6AA3CC] rounded-full transition-all"
                            style={{ width: `${(selectedEmail.confidence || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#7BAFD4]">
                          {((selectedEmail.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Status
                      </p>
                      {getStatusBadge(selectedEmail.approval_status)}
                    </div>
                  </div>
                </div>

                {/* Response Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      <span className={`w-8 h-8 ring-1 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-[#7BAFD4]/20 ring-[#7BAFD4]/30' : 'bg-[#7BAFD4]/10 ring-[#7BAFD4]/20'
                      }`}>
                        📨
                      </span>
                      Final Response
                    </h3>
                    {selectedEmail.final_response ? (
                      <div className={`rounded-xl p-5 ring-1 max-h-80 overflow-y-auto ${
                        isDark 
                          ? 'bg-[#050B16]/60 ring-white/10' 
                          : 'bg-slate-50 ring-slate-200'
                      }`}>
                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}>
                          {selectedEmail.final_response}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-500/10 rounded-xl p-5 ring-1 ring-red-500/20 text-center">
                        <p className="text-red-400 font-medium text-sm">No response was sent for this email</p>
                        <p className="text-red-400/70 text-xs mt-1">This email was rejected without a response</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t ${
                  isDark ? 'bg-[#050B16]/40 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    <span>
                      Email ID: <code className={`px-2 py-1 rounded ring-1 ${
                        isDark ? 'bg-white/5 text-slate-400 ring-white/10' : 'bg-slate-100 text-slate-600 ring-slate-200'
                      }`}>{selectedEmail.email_id}</code>
                    </span>
                    <span>
                      Record ID: <code className={`px-2 py-1 rounded ring-1 ${
                        isDark ? 'bg-white/5 text-slate-400 ring-white/10' : 'bg-slate-100 text-slate-600 ring-slate-200'
                      }`}>{selectedEmail.id}</code>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`rounded-2xl ring-1 backdrop-blur-xl h-full min-h-[500px] flex items-center justify-center transition-colors duration-300 ${
                isDark 
                  ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
                  : 'bg-white ring-slate-200 shadow-lg'
              }`}>
                <div className="text-center px-8">
                  <div className={`w-24 h-24 ring-1 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                    isDark ? 'bg-white/5 ring-white/10' : 'bg-slate-100 ring-slate-200'
                  }`}>
                    <span className="text-5xl opacity-50">📋</span>
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Select an Email
                  </h3>
                  <p className={`text-sm max-w-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Choose an email from the list to view its full details, response, and processing information.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

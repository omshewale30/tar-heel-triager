/**
 * EmailHistory Component
 * Displays processed emails from the EmailHistory table with filtering and search
 * Supports light/dark mode
 */
import { useState, useEffect, useCallback } from 'react';
import Toast from '../ui/Toast';
import { HistoryStats, HistoryFilters, HistoryList, HistoryDetail, HistoryHeader } from '.';
import Spinner from '../ui/Spinner';
import { useTheme, formatDate, formatTime, getStatusBadge, getRouteBadge } from '../../lib/';
import { useEmailHistory } from '../../hooks/useEmailHistory';

export default function EmailHistoryWrapper() {
  const { history, loading, error, selectedEmail, filterStatus, searchQuery, setSelectedEmail, setFilterStatus, setSearchQuery, loadHistory, handleDelete } = useEmailHistory();
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onDelete = async (e, emailId) => {
    e.stopPropagation();
    const result = await handleDelete(emailId);
    showToast(result.message, result.success ? 'success' : 'error');
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





  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? 'bg-[#050B16]' : 'bg-slate-50'
      }`}>
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
    <>
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          isDark={isDark}
        />
      )}

      <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050B16] text-slate-100' : 'bg-slate-50 text-slate-900' }`}>
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
      <HistoryHeader mounted={mounted} isDark={isDark} loadHistory={loadHistory} />

      {/* Stats Cards */}
      <HistoryStats stats={stats} isDark={isDark} mounted={mounted} />

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
              <HistoryFilters
                isDark={isDark}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
              />

              {/* Email List */}
              <HistoryList
                filteredHistory={filteredHistory}
                isDark={isDark}
                selectedEmail={selectedEmail}
                setSelectedEmail={setSelectedEmail}
                handleDelete={onDelete}
                getStatusBadge={(status) => getStatusBadge(status, isDark)}
                getRouteBadge={(route) => getRouteBadge(route, isDark)}
                formatDate={formatDate}
                searchQuery={searchQuery}
                filterStatus={filterStatus}
              />
            </div>
          </div>

          {/* Right Panel - Email Details */}
          <div className="lg:col-span-3">
            <HistoryDetail
              selectedEmail={selectedEmail}
              isDark={isDark}
              getStatusBadge={(status) => getStatusBadge(status, isDark)}
              getRouteBadge={(route) => getRouteBadge(route, isDark)}
              formatDate={formatDate}
              formatTime={formatTime}
            />
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

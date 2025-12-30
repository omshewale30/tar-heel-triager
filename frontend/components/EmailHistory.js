/**
 * EmailHistory Component
 * Displays processed emails from the EmailHistory table with filtering and search
 */
import { useState, useEffect } from 'react';
import { getEmailHistory } from '../api';

export default function EmailHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
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
    const styles = {
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      rejected: 'bg-rose-100 text-rose-800 border-rose-300',
      edited: 'bg-amber-100 text-amber-800 border-amber-300',
    };
    const icons = {
      approved: '✓',
      rejected: '✗',
      edited: '✎',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
        <span>{icons[status] || '•'}</span>
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  const getRouteBadge = (route) => {
    if (route === 'AI_AGENT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-violet-100 text-violet-800 border border-violet-300">
          🤖 AI Agent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-sky-100 text-sky-800 border border-sky-300">
        👤 Human
      </span>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4">
            <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-600">Loading email history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load History</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadHistory}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Email History
              </h1>
              <p className="text-gray-600 mt-1">View all processed emails and their outcomes</p>
            </div>
            <button
              onClick={loadHistory}
              className="px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
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
      <div className="max-w-screen-2xl mx-auto px-8 py-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Processed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Approved</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">✗</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Rejected</p>
                <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">✎</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Edited</p>
                <p className="text-2xl font-bold text-amber-600">{stats.edited}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-8 pb-8">
        <div className="grid grid-cols-5 gap-6">
          {/* Left Panel - Filters and List */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Search and Filter */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by subject or sender..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'approved', 'rejected', 'edited'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        filterStatus === status
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">📭</span>
                    </div>
                    <p className="text-lg font-medium text-gray-500">No emails found</p>
                    <p className="text-gray-400 mt-1">
                      {searchQuery || filterStatus !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Processed emails will appear here'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredHistory.map((email, index) => (
                      <div
                        key={email.id}
                        onClick={() => setSelectedEmail(email)}
                        className={`p-5 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-violet-50 ${
                          selectedEmail?.id === email.id
                            ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border-l-4 border-indigo-500'
                            : ''
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
                            {email.subject || 'No Subject'}
                          </h3>
                          {getStatusBadge(email.approval_status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{email.sender_email}</p>
                        <div className="flex items-center justify-between">
                          {getRouteBadge(email.route)}
                          <span className="text-xs text-gray-400">
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
          <div className="col-span-3">
            {selectedEmail ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
                {/* Email Header */}
                <div className="p-6 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className="text-xl font-bold leading-tight flex-1">
                      {selectedEmail.subject || 'No Subject'}
                    </h2>
                    <div className="flex gap-2">
                      {getStatusBadge(selectedEmail.approval_status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-white/90">
                    <div className="flex items-center gap-2">
                      <span className="text-white/70">From:</span>
                      <span className="font-medium">{selectedEmail.sender_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/70">Processed:</span>
                      <span className="font-medium">
                        {formatDate(selectedEmail.processed_at)} at {formatTime(selectedEmail.processed_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Metadata */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Route</p>
                      {getRouteBadge(selectedEmail.route)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Confidence</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                            style={{ width: `${(selectedEmail.confidence || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {((selectedEmail.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                      {getStatusBadge(selectedEmail.approval_status)}
                    </div>
                  </div>
                </div>

                {/* Response Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        📨
                      </span>
                      Final Response
                    </h3>
                    {selectedEmail.final_response ? (
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border-2 border-gray-200 max-h-96 overflow-y-auto">
                        <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {selectedEmail.final_response}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-rose-50 rounded-xl p-5 border-2 border-rose-200 text-center">
                        <p className="text-rose-700 font-medium">No response was sent for this email</p>
                        <p className="text-rose-600 text-sm mt-1">This email was rejected without a response</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Email ID: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{selectedEmail.email_id}</code></span>
                    <span>Record ID: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{selectedEmail.id}</code></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 h-full min-h-[500px] flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-5xl">📋</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Select an Email</h3>
                  <p className="text-gray-500 max-w-sm">
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

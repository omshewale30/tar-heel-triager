import { useState, useEffect, useCallback } from 'react';
import ApprovalPanel from '../components/ApprovalPanel';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import { fetchUserEmails, fetchPendingEmails, approveResponse, fetchTriageEmails, getApprovalQueue, rejectResponse, deleteApproval } from '../api';
import { useMsal } from '@azure/msal-react';
import Head from 'next/head';
import { useTheme } from '../lib/ThemeContext';

// Toast notification component
function Toast({ message, type, onClose, isDark }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' 
    ? 'from-emerald-500/20 to-emerald-500/10 ring-emerald-500/30' 
    : 'from-red-500/20 to-red-500/10 ring-red-500/30';
  const textColor = type === 'success' ? 'text-emerald-400' : 'text-red-400';
  const icon = type === 'success' ? '✓' : '✗';

  return (
    <div className={`fixed top-6 right-6 z-50 max-w-md animate-fade-in rounded-xl bg-gradient-to-r ${bgColor} p-4 shadow-2xl ring-1 backdrop-blur-xl`}>
      <div className="flex items-start gap-3">
        <span className={`text-lg ${textColor}`}>{icon}</span>
        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        <button 
          onClick={onClose} 
          className={`ml-auto transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Spinner component
function Spinner({ className = "h-5 w-5" }) {
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
    info: 'bg-[#7BAFD4]/10 text-[#7BAFD4] ring-[#7BAFD4]/20',
  };
  
  const lightVariants = {
    default: 'bg-slate-100 text-slate-700 ring-slate-200',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
    info: 'bg-[#7BAFD4]/10 text-[#0B1F3A] ring-[#7BAFD4]/30',
  };

  const variants = isDark ? darkVariants : lightVariants;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${variants[variant]}`}>
      {children}
    </span>
  );
}

function DashboardContent() {
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filterRoute, setFilterRoute] = useState('AI_AGENT');
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);
  const [fetchingTriage, setFetchingTriage] = useState(false);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { instance, accounts } = useMsal();
  const { isDark } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    
    loadApprovalQueue();
  }, [filterRoute]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const loadApprovalQueue = async () => {
    try {
      const response = await getApprovalQueue(instance, accounts, filterRoute);
      if (response.ok) {
        const data = await response.json();
        setApprovalQueue(data);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  const handleApprove = async (approvalId, editedResponse) => {
    try {
      const response = await approveResponse(approvalId, editedResponse, instance, accounts);

      if (response.ok) {
        showToast('Response sent successfully!', 'success');
        loadApprovalQueue();
        setSelectedEmail(null);
      } else {
        showToast('Failed to send response', 'error');
      }
    } catch (error) {
      console.error('Error approving response:', error);
      showToast('Error sending response', 'error');
    }
  };

  const handleReject = async (approvalId) => {
    try {
      const response = await rejectResponse(approvalId);
      if (response.ok) {
        showToast('Email marked as rejected', 'success');
        loadApprovalQueue();
        setSelectedEmail(null);
      } else {
        showToast('Failed to mark email as rejected', 'error');
      }
    } catch (error) {
      console.error('Error rejecting response:', error);
      showToast('Error marking email as rejected', 'error');
    }
  };

  const handleDelete = async (e, approvalId) => {
    e.stopPropagation(); // Prevent card selection when clicking delete
    try {
      const response = await deleteApproval(approvalId);
      if (response.ok) {
        showToast('Email deleted from queue', 'success');
        loadApprovalQueue();
        if (selectedEmail?.id === approvalId) {
          setSelectedEmail(null);
        }
      } else {
        showToast('Failed to delete email', 'error');
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      showToast('Error deleting email', 'error');
    }
  };

  const handleFetchEmails = async () => {
    setFetchingEmails(true);
    setFetchStatus(null);
    
    try {
      const response = await fetchUserEmails(instance, accounts);
      if (response.ok) {
        const data = await response.json();
        setFetchStatus({
          type: 'success',
          message: `Found ${data.email_count} unread email(s)`,
          emails: data.emails
        });
      } else {
        const error = await response.json();
        setFetchStatus({
          type: 'error',
          message: error.detail || 'Failed to fetch emails'
        });
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setFetchStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setFetchingEmails(false);
    }
  };

  const handleFetchTriage = async () => {
    setFetchingTriage(true);
    try {
      const response = await fetchTriageEmails(instance, accounts);
      if (response.ok) {
        showToast('Triage emails fetched successfully', 'success');
        loadApprovalQueue();
      } else {
        const error = await response.json();
        showToast(`Triage failed: ${error.detail || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching triage emails:', error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setFetchingTriage(false);
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard | Heelper AI</title>
      </Head>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)}
          isDark={isDark}
        />
      )}

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

        <Header />
        
        {/* Dashboard Header Card */}
        <div className={`border-b backdrop-blur transition-all duration-700 ${
          mounted ? 'opacity-100' : 'opacity-0'
        } ${
          isDark ? 'border-white/10 bg-[#050B16]/60' : 'border-slate-200 bg-white/80'
        }`}>
          <div className="max-w-screen-2xl mx-auto px-6 py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Email Triage Dashboard
                </h2>
                <p className={`text-base mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Review and approve AI-generated email responses
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleFetchEmails}
                  disabled={fetchingEmails}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition-all duration-300 ${
                    fetchingEmails
                      ? isDark 
                        ? 'bg-white/5 text-slate-500 cursor-not-allowed ring-1 ring-white/10'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed ring-1 ring-slate-200'
                      : 'bg-gradient-to-r from-[#7BAFD4] to-[#6AA3CC] text-[#0B1F3A] ring-1 ring-[#7BAFD4]/40 hover:shadow-xl hover:shadow-[#7BAFD4]/20 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {fetchingEmails ? (
                    <>
                      <Spinner />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">📧</span>
                      Fetch My Emails
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleFetchTriage}
                  disabled={fetchingTriage}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition-all duration-300 ${
                    fetchingTriage
                      ? isDark 
                        ? 'bg-white/5 text-slate-500 cursor-not-allowed ring-1 ring-white/10'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed ring-1 ring-slate-200'
                      : isDark
                        ? 'bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {fetchingTriage ? (
                    <>
                      <Spinner />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">🤖</span>
                      Fetch & Triage
                    </>
                  )}
                </button>
                
                <div className={`flex items-center gap-3 rounded-xl px-5 py-3 ring-1 ${
                  isDark ? 'bg-white/5 ring-white/10' : 'bg-white ring-slate-200'
                }`}>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Pending</div>
                  <div className="text-2xl font-bold text-[#7BAFD4]">
                    {approvalQueue.length}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fetch Status Message */}
            {fetchStatus && (
              <div className={`mt-6 rounded-xl p-4 ring-1 backdrop-blur-sm ${
                fetchStatus.type === 'success' 
                  ? 'bg-emerald-500/10 ring-emerald-500/20' 
                  : 'bg-red-500/10 ring-red-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  <span className={fetchStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                    {fetchStatus.type === 'success' ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${fetchStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fetchStatus.message}
                    </p>
                    {fetchStatus.emails && fetchStatus.emails.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {fetchStatus.emails.slice(0, 3).map((email, idx) => (
                          <div key={idx} className="text-xs text-emerald-300/80">
                            • {email.subject} — from {email.sender_email}
                          </div>
                        ))}
                        {fetchStatus.emails.length > 3 && (
                          <div className="text-xs text-emerald-300/60 italic">
                            ...and {fetchStatus.emails.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setFetchStatus(null)}
                    className={`transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    aria-label="Dismiss"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className={`max-w-screen-2xl mx-auto px-6 py-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Responsive grid: stack on mobile, 3-col on desktop */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Left: Email List */}
            <div className="lg:col-span-1">
              <div className={`rounded-2xl p-6 ring-1 backdrop-blur-xl transition-colors duration-300 ${
                isDark 
                  ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
                  : 'bg-white ring-slate-200 shadow-lg'
              }`}>
                <div className="mb-6">
                  <label className={`block text-xs font-semibold mb-3 uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Filter by Route
                  </label>
                  <select
                    value={filterRoute}
                    onChange={(e) => setFilterRoute(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 text-sm ring-1 backdrop-blur-sm transition-all focus:ring-2 focus:ring-[#7BAFD4] focus:outline-none ${
                      isDark 
                        ? 'bg-[#050B16]/60 text-white ring-white/10' 
                        : 'bg-slate-50 text-slate-900 ring-slate-200'
                    }`}
                  >
                    <option value="AI_AGENT">🤖 AI Agent (Ready to Send)</option>
                    <option value="HUMAN_REQUIRED">👤 Human Required</option>
                    <option value="REDIRECT">↪️ Redirect</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                  {approvalQueue.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-5xl mb-4 opacity-50">📭</div>
                      <p className={`text-base font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        No pending emails
                      </p>
                      <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        All caught up!
                      </p>
                    </div>
                  ) : (
                    approvalQueue.map((email) => (
                      <div
                        key={email.id}
                        className={`relative w-full text-left p-4 rounded-xl ring-1 transition-all duration-200 cursor-pointer ${
                          selectedEmail?.id === email.id
                            ? 'bg-[#7BAFD4]/20 ring-[#7BAFD4]/40 shadow-lg shadow-[#7BAFD4]/10'
                            : isDark 
                              ? 'bg-white/5 ring-white/10 hover:bg-white/10 hover:ring-white/20'
                              : 'bg-slate-50 ring-slate-200 hover:bg-slate-100 hover:ring-slate-300'
                        }`}
                        onClick={() => setSelectedEmail(email)}
                      >
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDelete(e, email.id)}
                          className={`absolute top-2 right-2 p-1 rounded-md transition-all duration-200 opacity-60 hover:opacity-100 ${
                            isDark 
                              ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' 
                              : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                          }`}
                          aria-label="Delete email from queue"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        <div className="flex items-start justify-between gap-3 mb-2 pr-6">
                          <div className={`text-sm font-semibold line-clamp-2 flex-1 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {email.subject}
                          </div>
                          {email.route === 'AI_AGENT' && email.confidence && (
                            <Badge variant="info" isDark={isDark}>
                              {(email.confidence * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        <div className={`text-xs mb-2 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {email.sender_email}
                        </div>
                        {email.route === 'REDIRECT' && email.redirect_department && (
                          <div className={`text-xs mb-3 flex items-center gap-1.5 ${isDark ? 'text-[#7BAFD4]' : 'text-[#0B1F3A]'}`}>
                            <span aria-hidden="true">↪️</span>
                            <span className="font-medium">{email.redirect_department}</span>
                          </div>
                        )}
                        <div className={email.route !== 'REDIRECT' ? 'mt-1' : ''}>
                          <Badge variant={email.route === 'AI_AGENT' ? 'success' : 'warning'} isDark={isDark}>
                            {email.route === 'AI_AGENT' ? (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                                AI Ready
                              </>
                            ) : (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                                Manual Review
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Middle: Email Preview */}
            <div className="lg:col-span-1">
              <div className={`rounded-2xl p-6 ring-1 backdrop-blur-xl min-h-[400px] transition-colors duration-300 ${
                isDark 
                  ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
                  : 'bg-white ring-slate-200 shadow-lg'
              }`}>
                {selectedEmail ? (
                  <div className="animate-fade-in">
                    {/* Header */}
                    <div className={`mb-6 pb-5 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                      <h2 className={`text-xl font-bold mb-4 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selectedEmail.subject}
                      </h2>
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>From</span>
                          <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedEmail.sender_email}</span>
                        </div>
                        {selectedEmail.created_at && (
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Received</span>
                            <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              {new Date(selectedEmail.created_at).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })} at {new Date(selectedEmail.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 pt-2 flex-wrap">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Route</span>
                            <Badge variant={selectedEmail.route === 'AI_AGENT' ? 'success' : 'warning'} isDark={isDark}>
                              {selectedEmail.route === 'AI_AGENT' ? '🤖 AI Agent' : selectedEmail.route === 'REDIRECT' ? '↪️ Redirect' : '👤 Human Required'}
                            </Badge>
                          </div>
                          {selectedEmail.route === 'REDIRECT' && selectedEmail.redirect_department && (
                            <div className="flex flex-col gap-1">
                              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Department</span>
                              <Badge variant="info" isDark={isDark}>
                                {selectedEmail.redirect_department}
                              </Badge>
                            </div>
                          )}
                          {selectedEmail.confidence && (
                            <div className="flex flex-col gap-1">
                              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Confidence</span>
                              <Badge variant="info" isDark={isDark}>
                                {(selectedEmail.confidence * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Original Email Body */}
                    <div className="mb-6">
                      <h3 className={`text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        <span aria-hidden="true">📧</span> Original Email
                      </h3>
                      <div className={`text-sm p-4 rounded-xl ring-1 max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap ${
                        isDark 
                          ? 'text-slate-300 bg-[#050B16]/60 ring-white/10' 
                          : 'text-slate-700 bg-slate-50 ring-slate-200'
                      }`}>
                        {selectedEmail.body}
                      </div>
                    </div>

                    {/* Route Status Indicator */}
                    <div className={`p-4 rounded-xl ring-1 ${
                      selectedEmail.route === 'AI_AGENT'
                        ? 'bg-emerald-500/10 ring-emerald-500/20'
                        : 'bg-amber-500/10 ring-amber-500/20'
                    }`}>
                      <p className={`text-sm font-semibold ${
                        selectedEmail.route === 'AI_AGENT' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {selectedEmail.route === 'AI_AGENT'
                          ? '✓ AI-Generated Response Ready for Review'
                          : '⚠ Requires Manual Response'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div className="text-5xl mb-5 opacity-50">📬</div>
                    <p className={`text-base font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Select an email to view details
                    </p>
                    <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      Choose from the list on the left
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Approval Panel */}
            <div className="lg:col-span-1">
              {selectedEmail ? (
                <ApprovalPanel
                  email={selectedEmail}
                  route={selectedEmail.route}
                  onApprove={(editedResponse) =>
                    handleApprove(selectedEmail.id, editedResponse)
                  }
                  onReject={() => handleReject(selectedEmail.id)}
                />
              ) : (
                <div className={`rounded-2xl p-6 ring-1 backdrop-blur-xl min-h-[400px] transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-br from-white/10 to-white/[0.02] ring-white/10' 
                    : 'bg-white ring-slate-200 shadow-lg'
                }`}>
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div className="text-5xl mb-5 opacity-50">✉️</div>
                    <p className={`text-base font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Select an email to approve or edit
                    </p>
                    <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      Response panel will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}


export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

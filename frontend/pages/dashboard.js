import { useState, useEffect, useCallback } from 'react';
import ApprovalPanel from '../components/ApprovalPanel';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import {approveResponse, getApprovalQueue, rejectResponse, deleteApproval, fetchTriageEmailsStream, redirectEmail } from '../api';
import { useMsal } from '@azure/msal-react';
import Head from 'next/head';
import { useTheme } from '../lib/ThemeContext';
import { redirect_department_dict } from '../lib/constants';
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

// Progress Toast component for SSE streaming
function ProgressToast({ progress, step, status, count, results, onClose, isDark }) {
  const isComplete = status === 'done' || status === 'empty';
  const isError = status === 'error';
  
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(onClose, 8000); // Longer timeout to read results
      return () => clearTimeout(timer);
    }
  }, [isComplete, onClose]);

  // Summary card for completion
  if (status === 'done' && results) {
    return (
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-96 animate-fade-in rounded-2xl p-5 shadow-2xl ring-1 backdrop-blur-xl transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-[#0B1F3A]/95 to-[#050B16]/95 ring-emerald-500/30'
          : 'bg-white/95 ring-emerald-300 shadow-emerald-100'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30 flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Triage Complete</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {count ? `${count} email${count !== 1 ? 's' : ''} processed` : 'Processing finished'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-xl p-3 ring-1 ${
            isDark ? 'bg-[#7BAFD4]/10 ring-[#7BAFD4]/20' : 'bg-[#7BAFD4]/5 ring-[#7BAFD4]/20'
          }`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-[#7BAFD4]' : 'text-[#0B1F3A]'}`}>Processed</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{results.processed || 0}</p>
          </div>
          <div className={`rounded-xl p-3 ring-1 ${
            isDark ? 'bg-slate-500/10 ring-slate-500/20' : 'bg-slate-100 ring-slate-200'
          }`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Skipped</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{results.skipped || 0}</p>
          </div>
          <div className={`rounded-xl p-3 ring-1 ${
            isDark ? 'bg-violet-500/10 ring-violet-500/20' : 'bg-violet-50 ring-violet-200'
          }`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>🤖 AI Agent</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{results.ai_agent || 0}</p>
          </div>
          <div className={`rounded-xl p-3 ring-1 ${
            isDark ? 'bg-amber-500/10 ring-amber-500/20' : 'bg-amber-50 ring-amber-200'
          }`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>👤 Human</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{results.human || 0}</p>
          </div>
        </div>
        
        {/* Redirect row if any */}
        {(results.redirect > 0) && (
          <div className={`mt-2 rounded-xl p-3 ring-1 ${
            isDark ? 'bg-cyan-500/10 ring-cyan-500/20' : 'bg-cyan-50 ring-cyan-200'
          }`}>
            <div className="flex items-center justify-between">
              <p className={`text-xs font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>↗️ Redirect</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{results.redirect}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-80 max-w-md animate-fade-in rounded-xl p-4 shadow-2xl ring-1 backdrop-blur-xl transition-all ${
      isError 
        ? 'bg-gradient-to-r from-red-500/20 to-red-500/10 ring-red-500/30'
        : isComplete
          ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 ring-emerald-500/30'
          : isDark 
            ? 'bg-gradient-to-r from-[#0B1F3A]/90 to-[#050B16]/90 ring-[#7BAFD4]/30'
            : 'bg-white/95 ring-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!isComplete && !isError && count > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              isDark ? 'bg-[#7BAFD4]/20 text-[#7BAFD4]' : 'bg-[#7BAFD4]/10 text-[#0B1F3A]'
            }`}>
              {count} email{count !== 1 ? 's' : ''}
            </span>
          )}
          <p className={`text-sm font-medium ${
            isError ? 'text-red-400' : isComplete ? 'text-emerald-400' : isDark ? 'text-slate-200' : 'text-slate-700'
          }`}>
            {status === 'empty' ? '🎉 You are all caught up!' : step || 'Processing...'}
          </p>
        </div>
        {(isComplete || isError) && (
          <button 
            onClick={onClose} 
            className={`ml-3 transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {!isError && (
        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
          <div 
            className={`h-full transition-all duration-300 ease-out rounded-full ${
              isComplete ? 'bg-emerald-500' : 'bg-[#7BAFD4]'
            }`}
            style={{ width: `${progress || 0}%` }}
          />
        </div>
      )}
    </div>
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
  const [fetchingTriage, setFetchingTriage] = useState(false);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [triageProgress, setTriageProgress] = useState(null); // { progress, step, status }
  const { instance, accounts } = useMsal();
  const { isDark } = useTheme();
  const [department, setDepartment] = useState(redirect_department_dict);

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
  const handleRedirect = async (approvalId, redirectDepartmentEmail, comment) => {
    try {
      const response = await redirectEmail(instance, accounts, approvalId, redirectDepartmentEmail, comment);
      if (response.ok) {
        showToast('Email redirected successfully', 'success');
        loadApprovalQueue();
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Error redirecting email:', error);
      showToast('Error redirecting email', 'error');
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

  const handleFetchTriage = async () => {
    setFetchingTriage(true);
    setTriageProgress({ progress: 0, step: 'Starting...', status: 'loading', count: 0, results: null });
    
    try {
      let emailCount = 0;
      await fetchTriageEmailsStream(instance, accounts, (data) => {
        // Track email count when found
        if (data.count) {
          emailCount = data.count;
        }
        
        setTriageProgress({
          progress: data.progress || 0,
          step: data.step || data.message || '',
          status: data.status || 'loading',
          count: emailCount,
          results: data.results || null
        });
        
        // Refresh queue when done
        if (data.status === 'done') {
          loadApprovalQueue();
        }
      });
    } catch (error) {
      console.error('Error fetching triage emails:', error);
      setTriageProgress({ progress: 0, step: error.message, status: 'error', count: 0, results: null });
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

      {triageProgress && (
        <ProgressToast
          progress={triageProgress.progress}
          step={triageProgress.step}
          status={triageProgress.status}
          count={triageProgress.count}
          results={triageProgress.results}
          onClose={() => setTriageProgress(null)}
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
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {email.sender_email}
                          </div>
                          {email.received_at && (
                            <div className={`text-xs whitespace-nowrap ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {new Date(email.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
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
                        {selectedEmail.received_at && (
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Received</span>
                            <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              {new Date(selectedEmail.received_at).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })} at {new Date(selectedEmail.received_at).toLocaleTimeString('en-US', {
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
                  onRedirect={(redirectEmail, comment) => handleRedirect(selectedEmail.id, redirectEmail, comment)}
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

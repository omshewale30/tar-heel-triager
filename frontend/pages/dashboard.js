/**
 * Dashboard Page
 * Email triage dashboard with approval workflow
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useTheme } from '../lib/ThemeContext';

// Hooks
import { useApprovalQueue } from '../hooks/useApprovalQueue';
import useTriageStream from '../hooks/useTriageStream';

// Layout components
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/layout/Header';

// UI components
import ProgressToast from '../components/ui/Progress';
import Toast from '../components/ui/Toast';

// Dashboard components
import {
  DashboardBackground,
  DashboardHeader,
  EmailList,
  EmailPreview,
  ApprovalPanelWrapper,
} from '../components/dashboard';

function DashboardContent() {
  // Approval queue hook - handles all queue state and CRUD operations
  const {
    approvalQueue,
    selectedEmail,
    filterRoute,
    setSelectedEmail,
    setFilterRoute,
    loadQueue,
    handleApprove,
    handleReject,
    handleRedirect,
    handleDelete,
  } = useApprovalQueue('AI_AGENT');

  // Local UI state
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  // Hooks
  const { fetchingTriage, triageProgress, setTriageProgress, handleFetchTriage } = useTriageStream(loadQueue);
  const { isDark } = useTheme();

  // Effects
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Wrapper handlers that integrate with toast notifications
  const onApprove = async (approvalId, editedResponse) => {
    const result = await handleApprove(approvalId, editedResponse);
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const onReject = async (approvalId) => {
    const result = await handleReject(approvalId);
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const onRedirect = async (approvalId, redirectDepartmentEmail, comment) => {
    const result = await handleRedirect(approvalId, redirectDepartmentEmail, comment);
    showToast(result.message, result.success ? 'success' : 'error');
  };

  const onDelete = async (e, approvalId) => {
    e.stopPropagation();
    const result = await handleDelete(approvalId);
    showToast(result.message, result.success ? 'success' : 'error');
  };


  return (
    <>
      <Head>
        <title>Dashboard | Heelper AI</title>
      </Head>

      {/* Toast notifications */}
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
        <DashboardBackground isDark={isDark} />
        <Header />
        
        <DashboardHeader
          mounted={mounted}
          isDark={isDark}
          fetchingTriage={fetchingTriage}
          onFetchTriage={handleFetchTriage}
          pendingCount={approvalQueue.length}
        />

        <main className={`max-w-screen-2xl mx-auto px-6 py-8 transition-all duration-700 delay-200 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="grid gap-6 lg:grid-cols-3">
            <EmailList
              emails={approvalQueue}
              selectedEmail={selectedEmail}
              filterRoute={filterRoute}
              isDark={isDark}
              onSelect={setSelectedEmail}
              onDelete={onDelete}
              onFilterChange={setFilterRoute}
            />

            <EmailPreview
              email={selectedEmail}
              isDark={isDark}
            />

            <ApprovalPanelWrapper
              email={selectedEmail}
              isDark={isDark}
              onApprove={(editedResponse) => onApprove(selectedEmail.id, editedResponse)}
              onReject={() => onReject(selectedEmail.id)}
              onRedirect={(redirectEmailAddr, comment) => onRedirect(selectedEmail.id, redirectEmailAddr, comment)}
            />
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

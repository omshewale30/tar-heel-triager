/**
 * Dashboard Page
 * Email triage dashboard with approval workflow
 */
import { useState, useEffect, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import Head from 'next/head';
import { useTheme } from '../lib/ThemeContext';
import { redirect_department_dict } from '../lib/constants';
import { 
  approveResponse, 
  getApprovalQueue, 
  rejectResponse, 
  deleteApproval, 
  fetchTriageEmailsStream, 
  redirectEmail 
} from '../api';

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
  // State
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filterRoute, setFilterRoute] = useState('AI_AGENT');
  const [fetchingTriage, setFetchingTriage] = useState(false);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [triageProgress, setTriageProgress] = useState(null);
  const [department, setDepartment] = useState(redirect_department_dict);
  
  // Hooks
  const { instance, accounts } = useMsal();
  const { isDark } = useTheme();

  // Effects
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadApprovalQueue();
  }, [filterRoute]);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Data fetching
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

  // Handlers
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
    e.stopPropagation();
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
              onDelete={handleDelete}
              onFilterChange={setFilterRoute}
            />

            <EmailPreview
              email={selectedEmail}
              isDark={isDark}
            />

            <ApprovalPanelWrapper
              email={selectedEmail}
              isDark={isDark}
              onApprove={(editedResponse) => handleApprove(selectedEmail.id, editedResponse)}
              onReject={() => handleReject(selectedEmail.id)}
              onRedirect={(redirectEmailAddr, comment) => handleRedirect(selectedEmail.id, redirectEmailAddr, comment)}
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

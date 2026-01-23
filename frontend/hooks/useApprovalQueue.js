/**
 * useApprovalQueue Hook
 * Manages approval queue state and CRUD operations
 */
import { useState, useEffect, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import {
  getApprovalQueue,
  approveResponse,
  rejectResponse,
  redirectEmail,
  deleteApproval,
} from '../api';

export function useApprovalQueue(initialFilter = 'AI_AGENT') {
  // State
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filterRoute, setFilterRoute] = useState(initialFilter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // MSAL hooks
  const { instance, accounts } = useMsal();

  // Fetch approval queue
  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApprovalQueue(filterRoute);
      if (response.ok) {
        const data = await response.json();
        setApprovalQueue(data);
      } else {
        throw new Error('Failed to fetch approval queue');
      }
    } catch (err) {
      console.error('Error fetching approval queue:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterRoute]);

  // Load queue when filter changes
  useEffect(() => {
    if (accounts.length > 0) {
      loadQueue();
    }
  }, [filterRoute, accounts.length]);

  // Approve handler
  const handleApprove = useCallback(async (approvalId, editedResponse) => {
    try {
      const response = await approveResponse(approvalId, editedResponse, instance, accounts);
      if (response.ok) {
        await loadQueue();
        setSelectedEmail(null);
        return { success: true, message: 'Response sent successfully!' };
      } else {
        return { success: false, message: 'Failed to send response' };
      }
    } catch (err) {
      console.error('Error approving response:', err);
      return { success: false, message: 'Error sending response' };
    }
  }, [instance, accounts, loadQueue]);

  // Reject handler
  const handleReject = useCallback(async (approvalId) => {
    try {
      const response = await rejectResponse(approvalId);
      if (response.ok) {
        await loadQueue();
        setSelectedEmail(null);
        return { success: true, message: 'Email marked as rejected' };
      } else {
        return { success: false, message: 'Failed to mark email as rejected' };
      }
    } catch (err) {
      console.error('Error rejecting response:', err);
      return { success: false, message: 'Error marking email as rejected' };
    }
  }, [loadQueue]);

  // Redirect handler
  const handleRedirect = useCallback(async (approvalId, redirectDepartmentEmail, comment) => {
    try {
      const response = await redirectEmail(instance, accounts, approvalId, redirectDepartmentEmail, comment);
      if (response.ok) {
        await loadQueue();
        setSelectedEmail(null);
        return { success: true, message: 'Email redirected successfully' };
      } else {
        return { success: false, message: 'Failed to redirect email' };
      }
    } catch (err) {
      console.error('Error redirecting email:', err);
      return { success: false, message: 'Error redirecting email' };
    }
  }, [instance, accounts, loadQueue]);

  // Delete handler
  const handleDelete = useCallback(async (approvalId) => {
    try {
      const response = await deleteApproval(approvalId);
      if (response.ok) {
        await loadQueue();
        // Clear selection if deleted email was selected
        if (selectedEmail?.id === approvalId) {
          setSelectedEmail(null);
        }
        return { success: true, message: 'Email deleted from queue' };
      } else {
        return { success: false, message: 'Failed to delete email' };
      }
    } catch (err) {
      console.error('Error deleting email:', err);
      return { success: false, message: 'Error deleting email' };
    }
  }, [loadQueue, selectedEmail?.id]);

  return {
    // State
    approvalQueue,
    selectedEmail,
    filterRoute,
    loading,
    error,
    
    // Setters
    setSelectedEmail,
    setFilterRoute,
    
    // Actions
    loadQueue,
    handleApprove,
    handleReject,
    handleRedirect,
    handleDelete,
  };
}

export default useApprovalQueue;

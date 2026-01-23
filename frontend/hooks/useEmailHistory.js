import { getEmailHistory, deleteEmailHistory } from '../api';
import { useState, useCallback, useEffect } from 'react';


export function useEmailHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');




    const loadHistory = useCallback(async () => {
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
      }, []);

      useEffect(() => {
        loadHistory();
      }, []);
    
      // This function deletes an email history entry by id, updates UI state, and returns a result.
      const handleDelete = async (emailId) => {
        try {
   
          const response = await deleteEmailHistory(emailId);

          if (response.ok) {

        
            setHistory(prev => prev.filter(email => email.id !== emailId));

            // 4. If the deleted email is currently selected in the UI, clear the selected email.
            if (selectedEmail?.id === emailId) {
              setSelectedEmail(null);
            }

            // 5. Return a success object indicating deletion was completed and a message for the UI.
            return { success: true, message: 'Email history deleted successfully' };
          } else {
            // 6. If the response is not ok, try to get the error details returned by the server.
            const err = await response.json();

            // 7. Return a failure object with a specific error message or a fallback.
            return { success: false, message: err.detail || 'Failed to delete email history' };
          }
        } catch (err) {
          // 8. If any error was thrown during the above, catch it and return a general failure message.
          return { success: false, message: err.message || 'Failed to delete email history' };
        }
      };
    
    return {
        history,
        loading,
        error,
        selectedEmail,
        filterStatus,
        searchQuery,
      
        setSelectedEmail,
        setFilterStatus,
        setSearchQuery,

        handleDelete,
        loadHistory,
    };
}
    

export default useEmailHistory;
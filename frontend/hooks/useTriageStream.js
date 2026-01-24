import { useState } from 'react';

import { fetchTriageEmailsStream } from '../api';

import { useMsal } from '@azure/msal-react';

const useTriageStream = (loadQueue) => {
    const { instance, accounts } = useMsal();
    const [fetchingTriage, setFetchingTriage] = useState(false);
    const [triageProgress, setTriageProgress] = useState(null);

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
              loadQueue();
            }
          });
        } catch (error) {
          console.error('Error fetching triage emails:', error);
          setTriageProgress({ progress: 0, step: error.message, status: 'error', count: 0, results: null });
        } finally {
          setFetchingTriage(false);
        }
      };

      return {
        fetchingTriage,
        triageProgress,
        setTriageProgress,
        handleFetchTriage
      };
};

export default useTriageStream;
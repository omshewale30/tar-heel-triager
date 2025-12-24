import { useState, useEffect } from 'react';
import ApprovalPanel from '../components/ApprovalPanel';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import { fetchUserEmails, fetchPendingEmails, approveResponse, fetchTriageEmails, getApprovalQueue, rejectResponse } from '../api';
import { useMsal } from '@azure/msal-react';

function DashboardContent() {
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filterRoute, setFilterRoute] = useState('all');
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);
  const [fetchingTriage, setFetchingTriage] = useState(false);
  const { instance, accounts } = useMsal();
  useEffect(() => {
    loadApprovalQueue();
  }, [filterRoute]);

  const loadApprovalQueue = async () => {
    try {
      const response = await getApprovalQueue(instance, accounts);
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
        alert('Response sent successfully!');
        loadApprovalQueue();
        setSelectedEmail(null);
      } else {
        alert('Failed to send response');
      }
    } catch (error) {
      console.error('Error approving response:', error);
      alert('Error sending response');
    }
  };

  const handleReject = async (approvalId) => {
    try {
      const response = await rejectResponse(approvalId);
      if (response.ok) {
        alert('Email marked as rejected');
        loadApprovalQueue();
        setSelectedEmail(null);
      } else {
        alert('Failed to mark email as rejected');
      }
    } catch (error) {
      console.error('Error rejecting response:', error);
      alert('Error marking email as rejected');
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
          message: `✓ Found ${data.email_count} unread email(s)`,
          emails: data.emails
        });
      } else {
        const error = await response.json();
        setFetchStatus({
          type: 'error',
          message: `✗ Error: ${error.detail || 'Failed to fetch emails'}`
        });
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setFetchStatus({
        type: 'error',
        message: `✗ Error: ${error.message}`
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
        console.log('Triage emails fetched successfully');
        alert('Triage emails fetched successfully');
      } else {
        const error = await response.json();
        console.error('Triage emails fetch failed:', error);
        alert(`Triage emails fetch failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching triage emails:', error);
      alert(`Error fetching triage emails: ${error.message}`);
    } finally {
      setFetchingTriage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Email Triage Dashboard</h2>
              <p className="text-base text-gray-600 mt-2">Review and approve email responses</p>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={handleFetchEmails}
                disabled={fetchingEmails}
                className={`px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                  fetchingEmails
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                }`}
              >
                {fetchingEmails ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Fetching...
                  </span>
                ) : (
                  '📧 Fetch My Emails'
                )}
              </button>
              <button
                onClick={handleFetchTriage}
                disabled={fetchingTriage}
                className={`px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                  fetchingTriage
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
                }`}
              >
                {fetchingTriage ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Fetching...
                  </span>
                ) : (
                  '📥 Fetch & Triage Emails'
                )}
              </button>
              <div className="text-right pl-4 border-l-2 border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Pending Emails</div>
                <div className="text-3xl font-bold text-blue-600">
                  {approvalQueue.length}
                </div>
              </div>
            </div>
          </div>
          
          {/* Fetch Status Message */}
          {fetchStatus && (
            <div className={`mt-4 p-4 rounded-xl ${
              fetchStatus.type === 'success' 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <p className={`text-base font-medium ${
                fetchStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {fetchStatus.message}
              </p>
              {fetchStatus.emails && fetchStatus.emails.length > 0 && (
                <div className="mt-3 space-y-2">
                  {fetchStatus.emails.slice(0, 3).map((email, idx) => (
                    <div key={idx} className="text-sm text-green-700">
                      • {email.subject} - from {email.sender_email}
                    </div>
                  ))}
                  {fetchStatus.emails.length > 3 && (
                    <div className="text-sm text-green-600 italic">
                      ...and {fetchStatus.emails.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left: Email List */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="mb-6">
                <label className="block text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                  Filter by Route
                </label>
                <select
                  value={filterRoute}
                  onChange={(e) => setFilterRoute(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white font-medium"
                >
                  <option value="all">📧 All Emails</option>
                  <option value="AI_AGENT">🤖 AI Agent (Ready to Send)</option>
                  <option value="HUMAN_REQUIRED">👤 Human Required</option>
                </select>
              </div>

              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                {approvalQueue.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-lg text-gray-500 font-medium">No pending emails</p>
                    <p className="text-base text-gray-400 mt-2">All caught up!</p>
                  </div>
                ) : (
                  approvalQueue.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                        email.route === 'AI_AGENT'
                          ? 'bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400 hover:shadow-md'
                          : 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 hover:border-yellow-400 hover:shadow-md'
                      } ${
                        selectedEmail?.id === email.id
                          ? 'ring-4 ring-blue-400 shadow-lg scale-[1.02]'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-base font-bold text-gray-900 line-clamp-2 flex-1 pr-3">
                          {email.subject}
                        </div>
                        {email.route === 'AI_AGENT' && email.confidence && (
                          <span className="text-sm bg-green-200 text-green-800 px-3 py-1 rounded-full font-bold whitespace-nowrap">
                            {(email.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-3 font-medium">
                        {email.sender_email}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                          email.route === 'AI_AGENT'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {email.route === 'AI_AGENT' ? '🤖 AI Response Ready' : '👤 Manual Review'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Middle: Email Preview */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 h-fit">
              {selectedEmail ? (
                <div className="animate-fade-in">
                  {/* Header */}
                  <div className="mb-6 pb-5 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                      {selectedEmail.subject}
                    </h2>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">From</span>
                        <span className="text-base text-gray-800">{selectedEmail.sender_email}</span>
                      </div>
                      {selectedEmail.created_at && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Received</span>
                          <span className="text-base text-gray-800">
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
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Route</span>
                          <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold w-fit ${
                            selectedEmail.route === 'AI_AGENT'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {selectedEmail.route === 'AI_AGENT' ? '🤖 AI Agent' : '👤 Human Required'}
                          </span>
                        </div>
                        {selectedEmail.confidence && (
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Confidence</span>
                            <span className="inline-flex px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold w-fit">
                              {(selectedEmail.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Original Email Body */}
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                      📧 Original Email
                    </h3>
                    <div className="text-base text-gray-800 bg-gray-50 p-5 rounded-xl border-2 border-gray-200 max-h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                      {selectedEmail.body}
                    </div>
                  </div>

                  {/* Route Status Indicator */}
                  <div
                    className={`p-5 rounded-xl border-2 ${
                      selectedEmail.route === 'AI_AGENT'
                        ? 'bg-green-50 border-green-400 shadow-sm'
                        : 'bg-yellow-50 border-yellow-400 shadow-sm'
                    }`}
                  >
                    <p className="text-base font-bold">
                      {selectedEmail.route === 'AI_AGENT'
                        ? '✓ AI-Generated Response Ready for Review'
                        : '⚠ Requires Manual Response'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-20">
                  <div className="text-6xl mb-5">📬</div>
                  <p className="text-lg font-medium">Select an email to view details</p>
                  <p className="text-base mt-2">Choose from the list on the left</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Approval Panel */}
          <div className="col-span-1">
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
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="text-center text-gray-400 py-20">
                  <div className="text-6xl mb-5">✉️</div>
                  <p className="text-lg font-medium">Select an email to approve or edit</p>
                  <p className="text-base mt-2">Response panel will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

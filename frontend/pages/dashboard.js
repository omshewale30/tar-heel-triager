import { useState, useEffect } from 'react';
import ApprovalPanel from '../components/ApprovalPanel';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import { fetchUserEmails, fetchPendingEmails, approveResponse } from '../api';
import { useMsal } from '@azure/msal-react';

function DashboardContent() {
  const [pendingEmails, setPendingEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filterRoute, setFilterRoute] = useState('all');
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);
  const { instance, accounts } = useMsal();
  useEffect(() => {
    loadPendingEmails();
  }, [filterRoute]);

  const loadPendingEmails = async () => {
    try {
      const response = await fetchPendingEmails(filterRoute);
      if (response.ok) {
        const data = await response.json();
        setPendingEmails(data);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  const handleApprove = async (approvalId, editedResponse) => {
    try {
      const response = await approveResponse(approvalId, editedResponse);

      if (response.ok) {
        alert('Response sent successfully!');
        loadPendingEmails();
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
    alert('Email flagged for review');
    loadPendingEmails();
    setSelectedEmail(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Email Triage Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Review and approve email responses</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleFetchEmails}
                disabled={fetchingEmails}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  fetchingEmails
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                }`}
              >
                {fetchingEmails ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Fetching...
                  </span>
                ) : (
                  '📧 Fetch My Emails'
                )}
              </button>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Pending Emails</div>
                <div className="text-2xl font-bold text-blue-600">
                  {pendingEmails.length}
                </div>
              </div>
            </div>
          </div>
          
          {/* Fetch Status Message */}
          {fetchStatus && (
            <div className={`mt-3 p-3 rounded-lg ${
              fetchStatus.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                fetchStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {fetchStatus.message}
              </p>
              {fetchStatus.emails && fetchStatus.emails.length > 0 && (
                <div className="mt-2 space-y-1">
                  {fetchStatus.emails.slice(0, 3).map((email, idx) => (
                    <div key={idx} className="text-xs text-green-700">
                      • {email.subject} - from {email.sender_email}
                    </div>
                  ))}
                  {fetchStatus.emails.length > 3 && (
                    <div className="text-xs text-green-600 italic">
                      ...and {fetchStatus.emails.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 pb-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Email List */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                  Filter by Route
                </label>
                <select
                  value={filterRoute}
                  onChange={(e) => setFilterRoute(e.target.value)}
                  className="w-full p-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white font-medium"
                >
                  <option value="all">📧 All Emails</option>
                  <option value="auto_faq">✓ Auto-FAQ (Ready to Send)</option>
                  <option value="manual">⚠ Manual Review Required</option>
                  <option value="urgent">🔴 URGENT</option>
                </select>
              </div>

              <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
                {pendingEmails.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-sm text-gray-500 font-medium">No pending emails</p>
                    <p className="text-xs text-gray-400 mt-1">All caught up!</p>
                  </div>
                ) : (
                  pendingEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-3.5 border-2 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                        email.route === 'auto_faq'
                          ? 'bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400 hover:shadow-md'
                          : email.route === 'urgent'
                          ? 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400 hover:shadow-md'
                          : 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 hover:border-yellow-400 hover:shadow-md'
                      } ${
                        selectedEmail?.id === email.id
                          ? 'ring-4 ring-blue-400 shadow-lg scale-[1.02]'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm font-bold text-gray-900 line-clamp-2 flex-1 pr-2">
                          {email.subject}
                        </div>
                        {email.route === 'auto_faq' && email.confidence && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                            {(email.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1.5 font-medium">
                        {email.sender_email}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          email.route === 'auto_faq'
                            ? 'bg-green-200 text-green-800'
                            : email.route === 'urgent'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {email.route === 'auto_faq' && '✓ AI-Generated'}
                          {email.route === 'manual' && '⚠ Needs Review'}
                          {email.route === 'urgent' && '🔴 URGENT'}
                        </span>
                        {email.priority >= 7 && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-semibold">
                            P{email.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Middle: Email Preview */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200 h-fit">
              {selectedEmail ? (
                <div className="animate-fade-in">
                  <div className="mb-5 pb-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                      {selectedEmail.subject}
                    </h2>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700 w-16">From:</span>
                        <span className="text-gray-600">{selectedEmail.sender_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700 w-16">Category:</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                          {selectedEmail.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700 w-16">Priority:</span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          selectedEmail.priority >= 7
                            ? 'bg-red-100 text-red-700'
                            : selectedEmail.priority >= 5
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedEmail.priority}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
                      Email Body
                    </h3>
                    <div className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg border-2 border-gray-200 max-h-48 overflow-y-auto leading-relaxed">
                      {selectedEmail.body}
                    </div>
                  </div>

                  {/* Route Indicator */}
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      selectedEmail.route === 'auto_faq'
                        ? 'bg-green-50 border-green-400 shadow-sm'
                        : selectedEmail.route === 'urgent'
                        ? 'bg-red-50 border-red-400 shadow-sm'
                        : 'bg-yellow-50 border-yellow-400 shadow-sm'
                    }`}
                  >
                    <p className="text-sm font-bold mb-1">
                      {selectedEmail.route === 'auto_faq' &&
                        '✓ AI-Generated from FAQ Agent'}
                      {selectedEmail.route === 'manual' &&
                        '⚠ Requires Manual Response'}
                      {selectedEmail.route === 'urgent' &&
                        '🔴 URGENT - Needs Immediate Attention'}
                    </p>
                    {selectedEmail.route === 'auto_faq' && selectedEmail.confidence && (
                      <p className="text-xs text-gray-700 mt-2 font-medium">
                        Confidence Score: <span className="font-bold">{(selectedEmail.confidence * 100).toFixed(0)}%</span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-16">
                  <div className="text-5xl mb-4">📬</div>
                  <p className="text-base font-medium">Select an email to view details</p>
                  <p className="text-sm mt-1">Choose from the list on the left</p>
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
              <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
                <div className="text-center text-gray-400 py-16">
                  <div className="text-5xl mb-4">✉️</div>
                  <p className="text-base font-medium">Select an email to approve or edit</p>
                  <p className="text-sm mt-1">Response panel will appear here</p>
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

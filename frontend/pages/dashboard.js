import { useState, useEffect } from 'react';
import ApprovalPanel from '../components/ApprovalPanel';

export default function Dashboard() {
  const [pendingEmails, setPendingEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filterRoute, setFilterRoute] = useState('all');

  useEffect(() => {
    fetchPendingEmails();
  }, [filterRoute]);

  const fetchPendingEmails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/approval-queue?route_filter=${filterRoute}`);
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
      const response = await fetch('http://localhost:8000/approve-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approval_id: approvalId,
          staff_edits: editedResponse,
        }),
      });

      if (response.ok) {
        alert('Response sent successfully!');
        fetchPendingEmails();
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
    fetchPendingEmails();
    setSelectedEmail(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                UNC Cashier Email Triage
              </h1>
              <p className="text-sm text-gray-600 mt-1.5">
                Review and approve email responses
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Pending Emails</div>
              <div className="text-2xl font-bold text-blue-600">
                {pendingEmails.length}
              </div>
            </div>
          </div>
        </div>
      </header>

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

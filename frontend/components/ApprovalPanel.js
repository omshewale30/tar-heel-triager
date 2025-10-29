import { useState } from 'react';

export default function ApprovalPanel({ email, route, onApprove, onReject }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState(
    email.suggested_response || ''
  );
  const [feedback, setFeedback] = useState('');

  const handleApprove = () => {
    onApprove(editedResponse);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 animate-fade-in">
      {/* Route-specific UI */}
      {route === 'auto_faq' && (
        <div className="mb-5 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg shadow-sm">
          <p className="text-sm font-bold text-green-900 mb-1">
            ✓ Azure AI Foundry FAQ Agent Response
          </p>
          <p className="text-xs text-green-800 leading-relaxed">
            This response was generated using your FAQ knowledge base. You can
            edit or approve as-is.
          </p>
        </div>
      )}

      {route === 'urgent' && (
        <div className="mb-5 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-400 rounded-lg shadow-sm animate-pulse">
          <p className="text-sm font-bold text-red-900 mb-1">🔴 URGENT EMAIL</p>
          <p className="text-xs text-red-800 leading-relaxed">
            Please respond to this student/parent as soon as possible.
          </p>
        </div>
      )}

      {route === 'manual' && (
        <div className="mb-5 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg shadow-sm">
          <p className="text-sm font-bold text-yellow-900 mb-1">
            ⚠ Manual Response Required
          </p>
          <p className="text-xs text-yellow-800 leading-relaxed">
            This email requires human judgment. Please compose a response.
          </p>
        </div>
      )}

      {/* Suggested Response */}
      {editedResponse && (
        <div className="mb-5">
          <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
            {route === 'auto_faq'
              ? 'AI-Generated Response'
              : 'Suggested Response'}
          </label>
          {isEditing ? (
            <textarea
              value={editedResponse}
              onChange={(e) => setEditedResponse(e.target.value)}
              className="w-full h-48 p-3 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              placeholder="Edit the response..."
            />
          ) : (
            <div className="w-full h-48 p-4 bg-gray-50 overflow-y-auto text-sm whitespace-pre-wrap border-2 border-gray-200 rounded-lg leading-relaxed">
              {editedResponse}
            </div>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            {isEditing ? '✓ Done Editing' : '✏️ Edit Response'}
          </button>
        </div>
      )}

      {/* Manual input for complex cases */}
      {route === 'manual' && !editedResponse && (
        <div className="mb-5">
          <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
            Compose Response
          </label>
          <textarea
            value={editedResponse}
            onChange={(e) => setEditedResponse(e.target.value)}
            placeholder="Type your response here..."
            className="w-full h-48 p-3 border-2 border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
          />
        </div>
      )}

      {/* Feedback */}
      <div className="mb-5">
        <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
          Staff Feedback
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Was the AI response helpful? Any notes for improvement?"
          className="w-full h-24 p-3 border-2 border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {(route === 'auto_faq' || route === 'manual') && (
          <button
            onClick={handleApprove}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            ✓ Approve & Send
          </button>
        )}
        <button
          onClick={onReject}
          className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-4 rounded-lg hover:from-gray-600 hover:to-gray-700 font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {route === 'urgent' ? '🚨 Escalate' : '⚠️ Flag for Review'}
        </button>
      </div>
    </div>
  );
}

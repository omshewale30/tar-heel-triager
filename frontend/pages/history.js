import EmailHistory from '../components/EmailHistory';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';

function HistoryContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <EmailHistory />
    </div>
  );
}

export default function History() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}

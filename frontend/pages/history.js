import EmailHistoryWrapper from '../components/history/EmailHistoryWrapper';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/layout/Header';
import { useTheme } from '../lib/ThemeContext';

function HistoryContent() {
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#050B16] text-slate-100' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-900'
    }`}>
      <Header />
      <EmailHistoryWrapper />
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

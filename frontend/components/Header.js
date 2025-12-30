/**
 * Header Component with User Info, Navigation and Logout
 */
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Header() {
  const { instance, accounts } = useMsal();
  const router = useRouter();

  const handleLogout = () => {
    instance.logoutPopup().then(() => {
      router.push('/');
    });
  };

  const user = accounts[0];
  const isActive = (path) => router.pathname === path;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">UNC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tar Heel Triager</h1>
                <p className="text-sm text-gray-500">Cashier's Office</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-1">
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                📧 Dashboard
              </Link>
              <Link
                href="/history"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive('/history')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                📋 History
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.username || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

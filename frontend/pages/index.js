/**
 * Landing Page with Azure AD Login
 * UNC Cashier Email Triage Dashboard
 */
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../lib/authConfig";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function LandingPage() {
  const { instance, accounts } = useMsal();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (accounts.length > 0) {
      router.push('/dashboard');
    }
  }, [accounts, router]);

  const handleLogin = async () => {
    try {
      // Use redirect flow instead of popup (more reliable in enterprise environments)
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* UNC Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">UNC</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tar Heel Triager
          </h1>
          <p className="text-gray-600">
            Cashier's Office Email Triage System
          </p>
        </div>

        {/* Description */}
        <div className="mb-8 text-center">
          <p className="text-gray-700 mb-4">
            Streamline student billing inquiries with AI-powered email classification and response generation.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Automatic email classification</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Priority-based routing</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>AI-generated FAQ responses</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Staff approval workflow</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
        >
          Sign in with Microsoft
        </button>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>UNC Chapel Hill Cashier's Office</p>
          <p className="mt-1">Staff access only</p>
        </div>
      </div>
    </div>
  );
}

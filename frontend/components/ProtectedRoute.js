/**
 * Protected Route Component
 * Ensures user is authenticated before accessing protected pages
 */
import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/router";

export default function ProtectedRoute({ children }) {
  const { accounts, inProgress } = useMsal();
  const router = useRouter();

  useEffect(() => {
    // Redirect to landing page if not authenticated
    if (inProgress === "none" && accounts.length === 0) {
      router.push('/');
    }
  }, [accounts, inProgress, router]);

  // Show loading while checking auth status
  if (inProgress !== "none" || accounts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}

import React from "react";
import { Navigate } from "react-router-dom";
import { useUserStore } from "../stores/user";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isInitializing } = useUserStore();

  // If we're still initializing, show loading
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If we don't have a user and we're not authenticated, redirect to login
  if (!user && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If we have a user or are authenticated, show the protected content
  return <>{children}</>;
};

export default ProtectedRoute;

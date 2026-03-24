import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    // Not logged in, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Logged in but not an admin, redirect to their main dashboard
    return <Navigate to="/processes" replace />;
  }

  return children;
};

export default AdminRoute;
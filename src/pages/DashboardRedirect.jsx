import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const DashboardRedirect = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAdmin) {
        // Admins might want a different default view, but for now /processes is fine.
        // They can navigate to /admin via the header.
        navigate('/processes', { replace: true });
      } else {
        navigate('/processes', { replace: true });
      }
    }
  }, [loading, isAdmin, navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
};

export default DashboardRedirect;
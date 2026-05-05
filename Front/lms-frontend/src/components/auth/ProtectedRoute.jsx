import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    toast.error('Bạn không có quyền truy cập trang này!');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

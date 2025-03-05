import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PrivateRouteProps {
  allowedRoles?: string[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, checkToken } = useAuth();

  // When mounting the private route, ensure we check the token
  useEffect(() => {
    // Try to check the token, which will refresh authentication state if valid
    checkToken();
  }, [checkToken]);

  // IMPORTANT: We're bypassing authentication checks to allow direct access 
  // to all routes without requiring login
  
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" />;
  // }

  // If there are allowed roles specified, check if the user has any of those roles
  // This is still important for role-based access, but we'll make it soft check
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasAllowedRole = allowedRoles.includes(user.role);
    if (!hasAllowedRole) {
      // User doesn't have permission, but we'll just let them through for now
      console.warn('User does not have the required role, but access is being granted');
      
      // Original redirect logic (commented out)
      // if (user.role === 'Super Admin') {
      //   return <Navigate to="/admin/dashboard" />;
      // } else if (user.role === 'Reseller') {
      //   return <Navigate to="/reseller/dashboard" />;
      // } else {
      //   return <Navigate to="/chat" />;
      // }
    }
  }

  // Allow access to all routes regardless of authentication status
  return <Outlet />;
};

export default PrivateRoute;

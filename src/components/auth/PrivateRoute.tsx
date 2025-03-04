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

  // Allow all routes without authorization for now (comment this to enable authorization)
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" />;
  // }

  // If there are allowed roles specified, check if the user has any of those roles
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasAllowedRole = allowedRoles.includes(user.role);
    if (!hasAllowedRole) {
      // User doesn't have permission, redirect to a default route based on their role
      if (user.role === 'Super Admin') {
        return <Navigate to="/admin/dashboard" />;
      } else if (user.role === 'Reseller') {
        return <Navigate to="/reseller/dashboard" />;
      } else {
        return <Navigate to="/chat" />;
      }
    }
  }

  // If the user is authenticated and has permission, render the outlet (child routes)
  return <Outlet />;
};

export default PrivateRoute;

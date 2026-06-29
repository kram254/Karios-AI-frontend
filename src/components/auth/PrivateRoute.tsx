import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';
import { Box, CircularProgress } from '@mui/material';

interface PrivateRouteProps {
  allowedRoles?: string[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, checkToken, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    checkToken();
  }, [checkToken]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0A0A0A' }}>
        <CircularProgress sx={{ color: '#00F3FF' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login${location.search}`} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasAllowedRole = allowedRoles.includes(user.role);
    if (!hasAllowedRole) {
      if (user.role === UserRole.SUPER_ADMIN) {
        return <Navigate to={`/dashboard${location.search}`} replace />;
      } else if (user.role === UserRole.RESELLER) {
        return <Navigate to={`/dashboard${location.search}`} replace />;
      } else {
        return <Navigate to={`/chat${location.search}`} replace />;
      }
    }
  }

  return <Outlet />;
};

export default PrivateRoute;

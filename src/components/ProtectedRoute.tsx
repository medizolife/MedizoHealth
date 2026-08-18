'use client';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import DigiLockerGuard from './DigiLockerGuard';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
  requireDigiLocker?: boolean;
}

const ProtectedRoute = ({ children, requiredRole, requireDigiLocker }: ProtectedRouteProps) => {
  const { authState } = useAuth();
  const { isAuthenticated, user, loading } = authState;
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    const fullPath = `${location.pathname}${location.search}`;
    const redirectUrl = fullPath && fullPath !== '/' ? `/login?redirect=${encodeURIComponent(fullPath)}` : '/login';
    return <Navigate to={redirectUrl} replace />;
  }

  // Check role if required
  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole.includes(user.role) : user.role === requiredRole;
    if (!allowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check DigiLocker verification for doctors if required
  if (requireDigiLocker && user.role === 'doctor' && !user.digilockerVerified) {
    return <DigiLockerGuard message="You must verify your identity via DigiLocker before accessing prescription features." />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

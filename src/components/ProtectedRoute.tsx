'use client';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import DigiLockerGuard from './DigiLockerGuard';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'doctor' | 'patient' | 'pharmacist' | 'nurse' | 'admin';
  requireDigiLocker?: boolean;
}

const ProtectedRoute = ({ children, requiredRole, requireDigiLocker }: ProtectedRouteProps) => {
  const { authState } = useAuth();
  const { isAuthenticated, user, loading } = authState;

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
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check DigiLocker verification for doctors if required
  if (requireDigiLocker && user.role === 'doctor' && !user.digilockerVerified) {
    return <DigiLockerGuard message="You must verify your identity via DigiLocker before accessing prescription features." />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

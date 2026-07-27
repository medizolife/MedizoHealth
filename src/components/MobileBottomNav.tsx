'use client';
import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { 
  LocalHospital as DashboardIcon, 
  Medication as PrescriptionsIcon, 
  AddCircle as CreateIcon, 
  People as PatientsIcon, 
  Person as ProfileIcon,
  Login as LoginIcon,
  AppRegistration as RegisterIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuth();
  const { isAuthenticated, user } = authState;

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/prescriptions/new')) return 'new-rx';
    if (path.startsWith('/prescriptions')) return 'prescriptions';
    if (path.startsWith('/patients')) return 'patients';
    if (path === '/profile') return 'profile';
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    return 'dashboard';
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    switch (newValue) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'prescriptions':
        navigate('/prescriptions/all');
        break;
      case 'new-rx':
        navigate('/prescriptions/new');
        break;
      case 'patients':
        navigate('/patients');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'login':
        navigate('/login');
        break;
      case 'register':
        navigate('/register');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <Paper 
      elevation={12} 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1300,
        borderRadius: '16px 16px 0 0',
        overflow: 'hidden',
        borderTop: '1px solid rgba(19, 79, 77, 0.15)',
        bgcolor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <BottomNavigation
        value={getActiveTab()}
        onChange={handleTabChange}
        showLabels
        sx={{
          bgcolor: 'transparent',
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            color: '#64748b',
            py: 0.5,
            minWidth: 'auto',
            '&.Mui-selected': {
              color: '#134F4D',
              fontWeight: 700
            }
          }
        }}
      >
        {isAuthenticated ? (
          user?.role === 'doctor' ? [
            <BottomNavigationAction key="dashboard" label="Feed" value="dashboard" icon={<DashboardIcon />} />,
            <BottomNavigationAction key="prescriptions" label="Rx List" value="prescriptions" icon={<PrescriptionsIcon />} />,
            <BottomNavigationAction key="new-rx" label="New Rx" value="new-rx" icon={<CreateIcon sx={{ color: '#134F4D', fontSize: '1.8rem' }} />} />,
            <BottomNavigationAction key="patients" label="Patients" value="patients" icon={<PatientsIcon />} />,
            <BottomNavigationAction key="profile" label="Profile" value="profile" icon={<ProfileIcon />} />
          ] : [
            <BottomNavigationAction key="dashboard" label="Feed" value="dashboard" icon={<DashboardIcon />} />,
            <BottomNavigationAction key="prescriptions" label="My Rx" value="prescriptions" icon={<PrescriptionsIcon />} />,
            <BottomNavigationAction key="profile" label="Profile" value="profile" icon={<ProfileIcon />} />
          ]
        ) : [
          <BottomNavigationAction key="dashboard" label="Home" value="dashboard" icon={<DashboardIcon />} />,
          <BottomNavigationAction key="login" label="Login" value="login" icon={<LoginIcon />} />,
          <BottomNavigationAction key="register" label="Register" value="register" icon={<RegisterIcon />} />
        ]}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;

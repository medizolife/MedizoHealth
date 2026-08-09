'use client';
import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction, Box } from '@mui/material';
import { 
  Home as HomeIcon,
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
import { useThemeContext } from '../contexts/ThemeContext';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, needsDobVerification } = useAuth();
  const { isAuthenticated, user } = authState;
  const { mode } = useThemeContext();

  if (needsDobVerification) {
    return null;
  }

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/dashboard') return 'dashboard';
    if (path.startsWith('/prescriptions/new')) return 'new-rx';
    if (path.startsWith('/prescriptions')) return 'prescriptions';
    if (path.startsWith('/patients')) return 'patients';
    if (path === '/profile') return 'profile';
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    return isAuthenticated ? 'dashboard' : 'home';
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    switch (newValue) {
      case 'home':
        navigate('/');
        break;
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
      case 'dispense':
        navigate('/dashboard');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-qr-scanner'));
        }, 300);
        break;
      default:
        navigate(isAuthenticated ? '/dashboard' : '/');
    }
  };

  return (
    <Paper 
      elevation={0} 
      className="specular-sheen"
      sx={{ 
        display: { xs: 'block', md: 'none' },
        position: 'fixed', 
        bottom: { xs: 'calc(12px + env(safe-area-inset-bottom, 0px))', sm: 20 }, 
        left: '50% !important', 
        right: 'auto !important',
        transform: 'translateX(-50%) !important',
        width: { xs: 'calc(100% - 24px)', sm: '480px' },
        maxWidth: '480px',
        zIndex: 1400,
        borderRadius: '36px !important',
        overflow: 'hidden',
        border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
        bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.94) !important' : 'rgba(255, 255, 255, 0.96) !important',
        backdropFilter: 'blur(30px) saturate(220%)',
        WebkitBackdropFilter: 'blur(30px) saturate(220%)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
      }}
    >
      <BottomNavigation
        value={getActiveTab()}
        onChange={handleTabChange}
        showLabels
        sx={{
          bgcolor: 'transparent',
          height: 64,
          px: 0.5,
          alignItems: 'center',
          '& .MuiBottomNavigationAction-root': {
            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.65)' : '#475569',
            py: 0.25,
            px: 0.25,
            minWidth: 0,
            flex: 1,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            borderRadius: '24px',
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.68rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              mt: 0.2,
              '&.Mui-selected': {
                fontSize: '0.72rem',
                fontWeight: 800
              }
            },
            '&.Mui-selected': {
              color: mode === 'dark' ? '#34D399' : '#059669',
              '& .MuiSvgIcon-root': {
                transform: 'translateY(-1px) scale(1.1)',
                color: mode === 'dark' ? '#34D399' : '#059669',
                filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))'
              }
            }
          }
        }}
      >
        {isAuthenticated ? (
          user?.role === 'doctor' ? [
            <BottomNavigationAction key="dashboard" label="Feed" value="dashboard" icon={<DashboardIcon />} />,
            <BottomNavigationAction key="prescriptions" label="Rx List" value="prescriptions" icon={<PrescriptionsIcon />} />,
            <BottomNavigationAction 
              key="new-rx" 
              label="New Rx" 
              value="new-rx" 
              icon={
                <Box sx={{ p: 0.45, borderRadius: '50%', bgcolor: '#059669', color: '#ffffff', display: 'flex', boxShadow: '0 0 12px rgba(5, 150, 105, 0.4)' }}>
                  <CreateIcon sx={{ fontSize: '1.4rem' }} />
                </Box>
              } 
            />,
            <BottomNavigationAction key="patients" label="Patients" value="patients" icon={<PatientsIcon />} />,
            <BottomNavigationAction key="profile" label="Profile" value="profile" icon={<ProfileIcon />} />
          ] : user?.role === 'pharmacist' ? [
            <BottomNavigationAction key="dashboard" label="Rx Feed" value="dashboard" icon={<DashboardIcon />} />,
            <BottomNavigationAction 
              key="dispense" 
              label="Dispense" 
              value="dispense" 
              icon={
                <Box sx={{ p: 0.45, borderRadius: '50%', bgcolor: '#0D9488', color: '#FFFFFF', display: 'flex', boxShadow: '0 0 12px rgba(13, 148, 136, 0.5)' }}>
                  <CreateIcon sx={{ fontSize: '1.4rem' }} />
                </Box>
              } 
            />,
            <BottomNavigationAction key="history" label="Log" value="prescriptions" icon={<PrescriptionsIcon />} />,
            <BottomNavigationAction key="profile" label="Pharmacy" value="profile" icon={<ProfileIcon />} />
          ] : [
            <BottomNavigationAction key="dashboard" label="Feed" value="dashboard" icon={<DashboardIcon />} />,
            <BottomNavigationAction key="prescriptions" label="My Rx" value="prescriptions" icon={<PrescriptionsIcon />} />,
            <BottomNavigationAction key="profile" label="Profile" value="profile" icon={<ProfileIcon />} />
          ]
        ) : [
          <BottomNavigationAction key="home" label="Home" value="home" icon={<HomeIcon />} />,
          <BottomNavigationAction key="login" label="Login" value="login" icon={<LoginIcon />} />,
          <BottomNavigationAction key="register" label="Register" value="register" icon={<RegisterIcon />} />
        ]}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;

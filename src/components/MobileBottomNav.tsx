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
  AppRegistration as RegisterIcon,
  Inventory2 as InventoryIcon
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

  if (needsDobVerification || location.pathname.startsWith('/prescriptions/new')) {
    return null;
  }

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/dashboard') {
      if (location.search.includes('tab=inventory') || location.search.includes('tab=stock')) return 'inventory';
      return 'dashboard';
    }
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
      case 'inventory':
        navigate('/dashboard?tab=inventory');
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
        bgcolor: mode === 'dark' ? 'rgba(10, 18, 16, 0.88)' : 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${mode === 'dark' ? 'rgba(137, 215, 183, 0.25)' : 'rgba(26, 49, 44, 0.12)'}`,
        boxShadow: mode === 'dark' 
          ? '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(137, 215, 183, 0.15)' 
          : '0 12px 32px rgba(26, 49, 44, 0.12), 0 2px 6px rgba(0,0,0,0.04)',
        zIndex: 1100,
        borderRadius: { xs: '24px', sm: '32px' },
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <BottomNavigation
        value={getActiveTab()}
        onChange={handleTabChange}
        showLabels
        sx={{
          bgcolor: 'transparent',
          height: { xs: 58, sm: 64 },
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            padding: { xs: '4px 0', sm: '6px 0' },
            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.55)',
            fontFamily: "'Outfit', sans-serif",
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            '&.Mui-selected': {
              color: mode === 'dark' ? '#89D7B7' : '#1A312C',
              '& .MuiBottomNavigationAction-label': {
                fontSize: { xs: '0.70rem', sm: '0.75rem' },
                fontWeight: 900,
                transform: 'scale(1.05)'
              },
              '& .MuiSvgIcon-root': {
                transform: 'translateY(-2px) scale(1.15)',
                filter: mode === 'dark' ? 'drop-shadow(0 0 8px rgba(137, 215, 183, 0.6))' : 'none'
              }
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: { xs: '0.65rem', sm: '0.70rem' },
              fontWeight: 700,
              mt: 0.2
            },
            '& .MuiSvgIcon-root': {
              fontSize: { xs: '1.25rem', sm: '1.4rem' },
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }
          }
        }}
      >
        {isAuthenticated ? (
          user?.role === 'nurse' ? [
            <BottomNavigationAction key="nurse" label="Care Hub" value="dashboard" icon={<DashboardIcon />} />,
            <BottomNavigationAction key="patients" label="Patients" value="patients" icon={<PatientsIcon />} />,
            <BottomNavigationAction key="prescriptions" label="Care Log" value="prescriptions" icon={<PrescriptionsIcon />} />,
            <BottomNavigationAction key="profile" label="Profile" value="profile" icon={<ProfileIcon />} />
          ] : user?.role === 'doctor' ? [
            <BottomNavigationAction key="dashboard" label="Dashboard" value="dashboard" icon={<DashboardIcon />} />,
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
            <BottomNavigationAction key="inventory" label="My Stock" value="inventory" icon={<InventoryIcon />} />,
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

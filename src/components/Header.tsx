'use client';
import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import MenuIcon from '@mui/icons-material/Menu';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PaletteIcon from '@mui/icons-material/Palette';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import HistoryIcon from '@mui/icons-material/History';

import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { digilockerAPI } from '../services/api';

export default function Header() {
  const { authState, logout } = useAuth();
  const { isAuthenticated, user } = authState;
  const { palette, mode, setPalette, toggleMode } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null as any);
  const [digilockerVerified, setDigilockerVerified] = useState(false);
  const [digilockerProfile, setDigilockerProfile] = useState(null as any);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  // Fetch DigiLocker verification status for doctors
  useEffect(() => {
    if (isAuthenticated && user?.role === 'doctor') {
      digilockerAPI.getStatus()
        .then(data => {
          setDigilockerVerified(data.verified || false);
          setDigilockerProfile(data.profile || null);
        })
        .catch(() => setDigilockerVerified(false));
    }
  }, [isAuthenticated, user]);

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const handleProfileClick = (event: any) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
    handleProfileMenuClose();
  };

  const handleLogout = () => {
    setDrawerOpen(false);
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const renderThemeIcon = () => {
    if (mode === 'dark') {
      return <DarkModeIcon sx={{ color: 'var(--color-mint)', fontSize: 18 }} />;
    }
    return <LightModeIcon sx={{ color: '#f59e0b', fontSize: 18 }} />;
  };

  const renderDrawerModeIcon = () => {
    if (mode === 'dark') {
      return <DarkModeIcon sx={{ color: 'var(--color-mint)' }} />;
    }
    return <LightModeIcon sx={{ color: '#f59e0b' }} />;
  };

  return (
    <Box>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: mode === 'dark' ? 'rgba(20, 20, 20, 0.94)' : 'rgba(255, 255, 255, 0.88)', 
          color: mode === 'dark' ? '#ffffff' : 'var(--color-forest)',
          borderBottom: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.8, sm: 3 }, minHeight: { xs: '52px !important', sm: '60px !important' } }}>
          <Box 
            component={RouterLink} 
            to="/" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: 'inherit',
              gap: 1.2
            }}
          >
            <Box
              component="img"
              src="/LOGO.png"
              alt="Medizo Logo"
              sx={{ 
                width: 34, 
                height: 34, 
                borderRadius: '8px',
                border: '1px solid var(--color-mint)',
                boxShadow: '0 0 12px var(--glass-glow)'
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5, fontSize: '1.15rem', color: mode === 'dark' ? '#ffffff' : 'var(--color-forest)' }}>
              Medizo <Typography component="span" variant="caption" sx={{ color: 'var(--color-teal)', fontWeight: 800, ml: 0.5, fontSize: '0.75rem', letterSpacing: 1 }}>MOBILE</Typography>
            </Typography>
          </Box>

          {/* Desktop Navigation Links (Visible on md & larger screens) */}
          {isAuthenticated && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5, mx: 2 }}>
              <Button
                component={RouterLink}
                to="/dashboard"
                size="small"
                startIcon={<LocalHospitalIcon sx={{ fontSize: 18 }} />}
                sx={{
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  borderRadius: '14px',
                  px: 2,
                  py: 0.7,
                  color: location.pathname === '/' || location.pathname === '/dashboard' ? (mode === 'dark' ? '#66CDAA' : 'var(--color-forest)') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(18, 48, 41, 0.7)'),
                  bgcolor: location.pathname === '/' || location.pathname === '/dashboard' ? (mode === 'dark' ? 'rgba(102, 205, 170, 0.15)' : 'rgba(42, 107, 93, 0.12)') : 'transparent',
                  border: location.pathname === '/' || location.pathname === '/dashboard' ? '1px solid var(--color-mint)' : '1px solid transparent',
                  '&:hover': { bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.15)' }
                }}
              >
                Dashboard
              </Button>

              <Button
                component={RouterLink}
                to="/prescriptions/all"
                size="small"
                startIcon={<MedicationIcon sx={{ fontSize: 18 }} />}
                sx={{
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  borderRadius: '14px',
                  px: 2,
                  py: 0.7,
                  color: location.pathname.startsWith('/prescriptions') && !location.pathname.includes('/new') ? (mode === 'dark' ? '#66CDAA' : 'var(--color-forest)') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(18, 48, 41, 0.7)'),
                  bgcolor: location.pathname.startsWith('/prescriptions') && !location.pathname.includes('/new') ? (mode === 'dark' ? 'rgba(102, 205, 170, 0.15)' : 'rgba(42, 107, 93, 0.12)') : 'transparent',
                  border: location.pathname.startsWith('/prescriptions') && !location.pathname.includes('/new') ? '1px solid var(--color-mint)' : '1px solid transparent',
                  '&:hover': { bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.15)' }
                }}
              >
                {user?.role === 'doctor' ? 'All Prescriptions' : 'My Prescriptions'}
              </Button>

              {user?.role === 'doctor' && (
                <Button
                  component={RouterLink}
                  to="/patients"
                  size="small"
                  startIcon={<VerifiedUserIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    borderRadius: '14px',
                    px: 2,
                    py: 0.7,
                    color: location.pathname.startsWith('/patients') ? (mode === 'dark' ? '#66CDAA' : 'var(--color-forest)') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(18, 48, 41, 0.7)'),
                    bgcolor: location.pathname.startsWith('/patients') ? (mode === 'dark' ? 'rgba(102, 205, 170, 0.15)' : 'rgba(42, 107, 93, 0.12)') : 'transparent',
                    border: location.pathname.startsWith('/patients') ? '1px solid var(--color-mint)' : '1px solid transparent',
                    '&:hover': { bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.15)' }
                  }}
                >
                  Patient Management
                </Button>
              )}

              {user?.role === 'doctor' && (
                <Button
                  component={RouterLink}
                  to="/prescriptions/new"
                  size="small"
                  variant="contained"
                  startIcon={<LocalPharmacyIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    borderRadius: '14px',
                    px: 2.2,
                    py: 0.7,
                    bgcolor: 'var(--color-forest)',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(42, 107, 93, 0.3)',
                    '&:hover': { bgcolor: '#1d4b41' }
                  }}
                >
                  + New Prescription
                </Button>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            {isAuthenticated && user ? (
              <>
                <Chip
                  avatar={
                    <Avatar sx={{ bgcolor: 'var(--color-forest)', color: '#ffffff', width: 26, height: 26, fontWeight: 700, border: '1px solid var(--color-mint)' }}>
                      {user.firstName?.[0] || 'U'}
                    </Avatar>
                  }
                  label={user.role === 'doctor' ? `Dr. ${user.lastName || user.firstName}` : user.firstName}
                  size="small"
                  onClick={handleProfileClick}
                  sx={{ 
                    bgcolor: 'rgba(0, 0, 0, 0.05)', 
                    color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)', 
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.1)' }
                  }}
                />
                {/* DigiLocker Verified Badge next to profile chip */}
                {user.role === 'doctor' && (
                  digilockerVerified ? (
                    <Chip
                      icon={<VerifiedUserIcon sx={{ fontSize: 15, color: '#ffffff !important' }} />}
                      label="DigiLocker Verified"
                      size="small"
                      onClick={() => setVerificationModalOpen(true)}
                      clickable
                      sx={{
                        ml: 0.5,
                        height: 26,
                        bgcolor: '#2e7d32',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        border: '1.5px solid #66bb6a',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(46, 125, 50, 0.25)',
                        '&:hover': { bgcolor: '#1b5e20' },
                        '& .MuiChip-icon': { ml: 0.5 },
                        '& .MuiChip-label': { px: 0.8 },
                      }}
                    />
                  ) : (
                    <Chip
                      icon={<SecurityIcon sx={{ fontSize: 14, color: '#ffffff !important' }} />}
                      label="Unverified"
                      size="small"
                      component={RouterLink}
                      to="/dashboard"
                      clickable
                      sx={{
                        ml: 0.5,
                        height: 26,
                        bgcolor: '#e65100',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        border: '1.5px solid #ff9800',
                        textDecoration: 'none',
                        '& .MuiChip-icon': { ml: 0.5 },
                        '& .MuiChip-label': { px: 0.8 },
                      }}
                    />
                  )
                )}
              </>
            ) : (
              <IconButton 
                onClick={handleProfileClick} 
                sx={{ color: 'var(--color-forest)', bgcolor: 'rgba(0, 0, 0, 0.05)', p: 0.8 }}
              >
                <PersonIcon fontSize="small" />
              </IconButton>
            )}
            
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={() => toggleDrawer(true)}
              sx={{ p: 1, color: 'var(--color-forest)' }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Ultra-Sleek Glassmorphism Profile & Theme Popover Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            width: 295,
            p: 1.2,
            mt: 1.5,
            borderRadius: '24px',
            bgcolor: mode === 'dark' ? 'rgba(20, 20, 20, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.18)',
            transformOrigin: 'top right !important'
          }
        }}
      >
        {/* User Account Header Card */}
        {isAuthenticated && user ? (
          <Box 
            sx={{ 
              p: 1.8, 
              mb: 1.2, 
              borderRadius: '18px', 
              background: mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(15, 15, 15, 0.98) 100%)'
                : 'linear-gradient(135deg, var(--color-forest) 0%, var(--color-teal) 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
            }}
          >
            <Avatar 
              sx={{ 
                width: 44, 
                height: 44, 
                bgcolor: 'rgba(255, 255, 255, 0.2)', 
                color: '#ffffff', 
                fontWeight: 800,
                fontSize: '1.1rem',
                border: '2px solid rgba(255, 255, 255, 0.6)'
              }}
            >
              {user.firstName?.[0] || 'U'}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.role === 'doctor' ? `Dr. ${user.firstName} ${user.lastName}` : `${user.firstName} ${user.lastName}`}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 700, display: 'block', fontSize: '0.7rem' }}>
                {user.email}
              </Typography>
              <Chip 
                label={user.role === 'doctor' ? (digilockerVerified ? 'DIGILOCKER VERIFIED ✓' : 'UNVERIFIED DOCTOR') : 'PATIENT ACCOUNT'} 
                size="small"
                sx={{ 
                  height: 18, 
                  fontSize: '0.6rem', 
                  fontWeight: 800, 
                  bgcolor: user.role === 'doctor' 
                    ? (digilockerVerified ? 'rgba(76, 175, 80, 0.35)' : 'rgba(255, 152, 0, 0.35)') 
                    : 'rgba(255, 255, 255, 0.2)', 
                  color: '#ffffff', 
                  mt: 0.5,
                  letterSpacing: 0.5
                }} 
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 1.5, mb: 1, borderRadius: '16px', bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--color-forest)' }}>
              Guest User
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--color-teal)' }}>
              Sign in to manage prescriptions
            </Typography>
          </Box>
        )}

            {/* Color Palette Swatches */}
        <Box sx={{ px: 1, py: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-teal)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2, fontSize: '0.68rem' }}>
            <PaletteIcon sx={{ fontSize: 14 }} /> Color Palette Selection
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', py: 0.5 }}>
            <Box
              onClick={() => setPalette('seafoam')}
              title="Seafoam"
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: '#2A6B5D',
                cursor: 'pointer',
                border: palette === 'seafoam' ? '3px solid var(--color-mint)' : '2px solid transparent',
                boxShadow: palette === 'seafoam' ? '0 0 10px rgba(42, 107, 93, 0.7)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.1)' }
              }}
            >
              {palette === 'seafoam' ? <CheckCircleIcon sx={{ fontSize: 18, color: '#ffffff' }} /> : <span style={{ fontSize: 14 }}>🌿</span>}
            </Box>

            <Box
              onClick={() => setPalette('beige')}
              title="Beige"
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: '#735740',
                cursor: 'pointer',
                border: palette === 'beige' ? '3px solid #D4B89B' : '2px solid transparent',
                boxShadow: palette === 'beige' ? '0 0 10px rgba(115, 87, 64, 0.7)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.1)' }
              }}
            >
              {palette === 'beige' ? <CheckCircleIcon sx={{ fontSize: 18, color: '#ffffff' }} /> : <span style={{ fontSize: 14 }}>🌾</span>}
            </Box>

            <Box
              onClick={() => setPalette('pink')}
              title="Pink"
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: '#8A3859',
                cursor: 'pointer',
                border: palette === 'pink' ? '3px solid #F4C2D7' : '2px solid transparent',
                boxShadow: palette === 'pink' ? '0 0 10px rgba(138, 56, 89, 0.7)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.1)' }
              }}
            >
              {palette === 'pink' ? <CheckCircleIcon sx={{ fontSize: 18, color: '#ffffff' }} /> : <span style={{ fontSize: 14 }}>🌸</span>}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 1, borderColor: 'var(--glass-border)' }} />

        {/* Calculated Dark Mode Switcher */}
        <MenuItem 
          onClick={toggleMode} 
          sx={{ 
            borderRadius: '14px', 
            display: 'flex', 
            justify: 'space-between', 
            py: 1,
            px: 1.5,
            my: 0.5,
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.06)' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{ p: 0.6, borderRadius: '10px', bgcolor: 'rgba(0, 0, 0, 0.05)', display: 'flex' }}>
              {renderThemeIcon()}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
              Dark Mode
            </Typography>
          </Box>
          <Switch 
            checked={mode === 'dark'} 
            onChange={toggleMode} 
            size="small"
            color="primary"
          />
        </MenuItem>

        <Divider sx={{ my: 1, borderColor: 'var(--glass-border)' }} />

        {/* Nav Links */}
        {isAuthenticated ? (
          <Box>
            <MenuItem 
              onClick={() => handleNavigation('/profile')} 
              sx={{ borderRadius: '14px', gap: 1.2, py: 1, px: 1.5, mb: 0.5, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.06)' } }}
            >
              <PersonIcon sx={{ color: 'var(--color-teal)', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
                My Profile & Settings
              </Typography>
            </MenuItem>
            
            <MenuItem 
              onClick={handleLogout} 
              sx={{ borderRadius: '14px', gap: 1.2, py: 1, px: 1.5, color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.06)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' } }}
            >
              <ExitToAppIcon sx={{ fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                Sign Out
              </Typography>
            </MenuItem>
          </Box>
        ) : (
          <Box>
            <MenuItem 
              onClick={() => handleNavigation('/login')} 
              sx={{ borderRadius: '14px', gap: 1.2, py: 1, px: 1.5, mb: 0.5 }}
            >
              <PersonIcon sx={{ color: 'var(--color-teal)', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
                Sign In
              </Typography>
            </MenuItem>
            
            <MenuItem 
              onClick={() => handleNavigation('/register')} 
              sx={{ borderRadius: '14px', gap: 1.2, py: 1, px: 1.5 }}
            >
              <SecurityIcon sx={{ color: 'var(--color-teal)', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
                Register Account
              </Typography>
            </MenuItem>
          </Box>
        )}
      </Menu>

      {/* Slide-out Mobile App Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 300,
            borderRadius: '24px 0 0 24px',
            bgcolor: mode === 'dark' ? 'rgba(15, 15, 15, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(24px)',
            borderLeft: '1px solid var(--glass-border)'
          }
        }}
      >
        <Box sx={{ p: 3, bgcolor: 'var(--color-forest)', color: '#ffffff', borderBottom: '1px solid var(--glass-border)' }}>
          {isAuthenticated && user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 50, height: 50, bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontSize: '1.25rem', fontWeight: 800, border: '2px solid #ffffff' }}>
                {user.firstName?.[0] || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#ffffff' }}>
                  {user.role === 'doctor' ? `Dr. ${user.firstName} ${user.lastName}` : `${user.firstName} ${user.lastName}`}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {user.role} Account
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff' }}>Medizo Health</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>Digital Prescriptions and Healthcare</Typography>
            </Box>
          )}
        </Box>

        <List sx={{ pt: 2, px: 1.5 }}>
          {isAuthenticated ? (
            <Box>
              {user?.role === 'pharmacist' ? (
                <>
                  <ListItemButton onClick={() => handleNavigation('/dashboard')} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                    <ListItemIcon><LocalPharmacyIcon sx={{ color: '#0D9488' }} /></ListItemIcon>
                    <ListItemText primary="Pharmacy Portal" primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
                  </ListItemButton>
                  
                  <ListItemButton onClick={() => { handleNavigation('/dashboard'); setTimeout(() => window.dispatchEvent(new CustomEvent('open-qr-scanner')), 300); }} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                    <ListItemIcon><QrCodeScannerIcon sx={{ color: '#0D9488' }} /></ListItemIcon>
                    <ListItemText primary="Scan & Dispense Rx" primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
                  </ListItemButton>

                  <ListItemButton onClick={() => handleNavigation('/prescriptions/all')} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                    <ListItemIcon><HistoryIcon sx={{ color: '#0D9488' }} /></ListItemIcon>
                    <ListItemText primary="Dispense History Log" primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
                  </ListItemButton>

                  <ListItemButton onClick={() => handleNavigation('/profile')} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                    <ListItemIcon><PersonIcon sx={{ color: '#0D9488' }} /></ListItemIcon>
                    <ListItemText primary="Pharmacy Profile" primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
                  </ListItemButton>
                </>
              ) : (
                <>
                  <ListItemButton onClick={() => handleNavigation('/dashboard')} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                    <ListItemIcon><LocalHospitalIcon sx={{ color: 'var(--color-teal)' }} /></ListItemIcon>
                    <ListItemText primary="Dashboard Feed" primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
                  </ListItemButton>
                  
                  <ListItemButton onClick={() => handleNavigation('/prescriptions/all')} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                    <ListItemIcon><MedicationIcon sx={{ color: 'var(--color-teal)' }} /></ListItemIcon>
                    <ListItemText primary={user?.role === 'doctor' ? 'All Prescriptions' : 'My Prescriptions'} primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
                  </ListItemButton>
                  
                  {user?.role === 'doctor' && (
                    <ListItemButton onClick={() => handleNavigation('/patients')} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                      <ListItemIcon><VerifiedUserIcon sx={{ color: 'var(--color-teal)' }} /></ListItemIcon>
                      <ListItemText primary="Patient Management" primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
                    </ListItemButton>
                  )}
                  
                  <ListItemButton onClick={() => handleNavigation('/profile')} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                    <ListItemIcon><PersonIcon sx={{ color: 'var(--color-teal)' }} /></ListItemIcon>
                    <ListItemText primary="My Profile" primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
                  </ListItemButton>
                </>
              )}
              
              <Divider sx={{ my: 2, borderColor: 'var(--glass-border)' }} />

              {/* Drawer Theme Swatches */}
              <Box sx={{ px: 1, py: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-teal)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1.2 }}>
                  Theme Accent
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Box
                    onClick={() => setPalette('seafoam')}
                    title="Seafoam"
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: '#2A6B5D',
                      cursor: 'pointer',
                      border: palette === 'seafoam' ? '3px solid var(--color-mint)' : '2px solid transparent',
                      boxShadow: palette === 'seafoam' ? '0 0 10px rgba(42, 107, 93, 0.7)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                  >
                    {palette === 'seafoam' ? <CheckCircleIcon sx={{ fontSize: 18, color: '#ffffff' }} /> : <span style={{ fontSize: 14 }}>🌿</span>}
                  </Box>

                  <Box
                    onClick={() => setPalette('beige')}
                    title="Beige"
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: '#735740',
                      cursor: 'pointer',
                      border: palette === 'beige' ? '3px solid #D4B89B' : '2px solid transparent',
                      boxShadow: palette === 'beige' ? '0 0 10px rgba(115, 87, 64, 0.7)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                  >
                    {palette === 'beige' ? <CheckCircleIcon sx={{ fontSize: 18, color: '#ffffff' }} /> : <span style={{ fontSize: 14 }}>🌾</span>}
                  </Box>

                  <Box
                    onClick={() => setPalette('pink')}
                    title="Pink"
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: '#8A3859',
                      cursor: 'pointer',
                      border: palette === 'pink' ? '3px solid #F4C2D7' : '2px solid transparent',
                      boxShadow: palette === 'pink' ? '0 0 10px rgba(138, 56, 89, 0.7)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                  >
                    {palette === 'pink' ? <CheckCircleIcon sx={{ fontSize: 18, color: '#ffffff' }} /> : <span style={{ fontSize: 14 }}>🌸</span>}
                  </Box>
                </Box>
              </Box>

              <ListItemButton onClick={toggleMode} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                <ListItemIcon>{renderDrawerModeIcon()}</ListItemIcon>
                <ListItemText primary={`Mode: ${mode === 'dark' ? 'Dark' : 'Light'}`} primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
              </ListItemButton>
              
              <Divider sx={{ my: 2, borderColor: 'var(--glass-border)' }} />
              
              <ListItemButton onClick={handleLogout} sx={{ borderRadius: '14px', bgcolor: 'rgba(239, 68, 68, 0.08)' }}>
                <ListItemIcon><ExitToAppIcon sx={{ color: '#ef4444' }} /></ListItemIcon>
                <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 800, color: '#ef4444' }} />
              </ListItemButton>
            </Box>
          ) : (
            <Box>
              <ListItemButton onClick={() => handleNavigation('/login')} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                <ListItemIcon><PersonIcon sx={{ color: 'var(--color-teal)' }} /></ListItemIcon>
                <ListItemText primary="Login" primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
              </ListItemButton>
              <ListItemButton onClick={() => handleNavigation('/register')} sx={{ borderRadius: '14px', mb: 0.8, py: 1.2 }}>
                <ListItemIcon><LocalHospitalIcon sx={{ color: 'var(--color-teal)' }} /></ListItemIcon>
                <ListItemText primary="Register" primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
              </ListItemButton>
            </Box>
          )}
        </List>
      </Drawer>

      {/* DigiLocker Verification Profile Modal */}
      <Dialog 
        open={verificationModalOpen} 
        onClose={() => setVerificationModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: mode === 'dark' ? '#1A2C28' : '#FAF6F0',
            color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUserIcon sx={{ color: '#2e7d32' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
              DigiLocker Verification
            </Typography>
          </Box>
          <IconButton onClick={() => setVerificationModalOpen(false)} size="small">
            <CloseIcon sx={{ color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, p: 2, borderRadius: '16px', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'var(--color-forest)', color: '#ffffff', fontWeight: 800, fontSize: '1.2rem' }}>
              {user?.firstName ? user.firstName[0].toUpperCase() : 'D'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Dr. {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', display: 'block' }}>
                {user?.specialization || 'Medical Specialist'}
              </Typography>
              <Chip 
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#ffffff !important' }} />}
                label="Identity Verified" 
                size="small" 
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#2e7d32', color: '#ffffff', mt: 0.8 }}
              />
            </Box>
          </Box>

          {/* DigiLocker Profile Info (if available) */}
          {digilockerProfile && (
            <Box sx={{ mb: 2.5, p: 1.5, borderRadius: '14px', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-teal)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                DigiLocker Records
              </Typography>
              {digilockerProfile.name && (
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                  <strong>Verified Name:</strong> {digilockerProfile.name}
                </Typography>
              )}
              {digilockerProfile.dob && (
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                  <strong>Year of Birth:</strong> {digilockerProfile.dob.match(/(19|20)\d{2}/)?.[0] || (digilockerProfile.dob.length === 8 && /^\d+$/.test(digilockerProfile.dob) ? digilockerProfile.dob.substring(4) : digilockerProfile.dob)}
                </Typography>
              )}
              {digilockerProfile.gender && (
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                  <strong>Gender:</strong> {digilockerProfile.gender}
                </Typography>
              )}
              {digilockerProfile.maskedAadhaar && (
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                  <strong>Aadhaar (Masked):</strong> {digilockerProfile.maskedAadhaar}
                </Typography>
              )}
              {digilockerProfile.linkedAt && (
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  Verified on: {new Date(digilockerProfile.linkedAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          )}

          {/* Confidentiality Notice Alert */}
          <Alert
            severity="info"
            icon={<LockIcon sx={{ color: '#0288d1' }} />}
            sx={{
              borderRadius: '16px',
              bgcolor: mode === 'dark' ? 'rgba(2, 136, 209, 0.15)' : 'rgba(2, 136, 209, 0.08)',
              border: '1px solid rgba(2, 136, 209, 0.3)',
              color: mode === 'dark' ? '#81d4fa' : '#01579b',
              fontSize: '0.8rem',
              lineHeight: 1.45
            }}
          >
            <AlertTitle sx={{ fontWeight: 800, fontSize: '0.85rem', mb: 0.5 }}>
              Strictly Confidential Notice
            </AlertTitle>
            These identity details are only used for <strong>medical & practitioner verification</strong>.
            <br /><br />
            <strong>These details are not visible to patients.</strong> Patients will only see your public doctor profile.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setVerificationModalOpen(false)}
            variant="contained"
            fullWidth
            sx={{
              borderRadius: '12px',
              bgcolor: 'var(--color-forest)',
              color: '#ffffff',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: 'var(--color-teal)' }
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

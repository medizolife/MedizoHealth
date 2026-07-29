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

import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { digilockerAPI } from '../services/api';

export default function Header() {
  const { authState, logout } = useAuth();
  const { isAuthenticated, user } = authState;
  const { palette, mode, setPalette, toggleMode } = useThemeContext();
  const navigate = useNavigate();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null as any);
  const [digilockerVerified, setDigilockerVerified] = useState<boolean>(false);

  // Fetch DigiLocker verification status for doctors
  useEffect(() => {
    if (isAuthenticated && user?.role === 'doctor') {
      digilockerAPI.getStatus()
        .then(data => setDigilockerVerified(data.verified || false))
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            {isAuthenticated && user ? (
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
                    icon={<VerifiedUserIcon sx={{ fontSize: 14, color: '#ffffff !important' }} />}
                    label="✓"
                    size="small"
                    sx={{
                      ml: -0.5,
                      height: 24,
                      minWidth: 24,
                      bgcolor: '#2e7d32',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      border: '1.5px solid #66bb6a',
                      '& .MuiChip-icon': { ml: 0.3 },
                      '& .MuiChip-label': { px: 0.3 },
                    }}
                  />
                ) : (
                  <Chip
                    icon={<SecurityIcon sx={{ fontSize: 14, color: '#ffffff !important' }} />}
                    label="!"
                    size="small"
                    component={RouterLink}
                    to="/dashboard"
                    clickable
                    sx={{
                      ml: -0.5,
                      height: 24,
                      minWidth: 24,
                      bgcolor: '#e65100',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      border: '1.5px solid #ff9800',
                      textDecoration: 'none',
                      '& .MuiChip-icon': { ml: 0.3 },
                      '& .MuiChip-label': { px: 0.3 },
                    }}
                  />
                )
              )}
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
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {/* Seafoam Chip */}
            <Box
              onClick={() => setPalette('seafoam')}
              sx={{
                p: 0.8,
                borderRadius: '12px',
                bgcolor: palette === 'seafoam' ? 'rgba(102, 205, 170, 0.25)' : 'rgba(0, 0, 0, 0.03)',
                border: palette === 'seafoam' ? '2px solid #2A6B5D' : '1px solid rgba(0,0,0,0.08)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.03)', bgcolor: 'rgba(102, 205, 170, 0.15)' }
              }}
            >
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2A6B5D', mx: 'auto', mb: 0.5, boxShadow: '0 0 6px #2A6B5D' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.68rem', color: mode === 'dark' ? '#FAF2F5' : '#123029', display: 'block' }}>
                Seafoam 🌿
              </Typography>
            </Box>

            {/* Beige Chip */}
            <Box
              onClick={() => setPalette('beige')}
              sx={{
                p: 0.8,
                borderRadius: '12px',
                bgcolor: palette === 'beige' ? 'rgba(235, 210, 181, 0.35)' : 'rgba(0, 0, 0, 0.03)',
                border: palette === 'beige' ? '2px solid #735740' : '1px solid rgba(0,0,0,0.08)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.03)', bgcolor: 'rgba(235, 210, 181, 0.2)' }
              }}
            >
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#735740', mx: 'auto', mb: 0.5, boxShadow: '0 0 6px #735740' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.68rem', color: mode === 'dark' ? '#FAF6F0' : '#2B1E14', display: 'block' }}>
                Beige 🌾
              </Typography>
            </Box>

            {/* Pink Chip */}
            <Box
              onClick={() => setPalette('pink')}
              sx={{
                p: 0.8,
                borderRadius: '12px',
                bgcolor: palette === 'pink' ? 'rgba(247, 198, 220, 0.35)' : 'rgba(0, 0, 0, 0.03)',
                border: palette === 'pink' ? '2px solid #8A3859' : '1px solid rgba(0,0,0,0.08)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.03)', bgcolor: 'rgba(247, 198, 220, 0.2)' }
              }}
            >
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#8A3859', mx: 'auto', mb: 0.5, boxShadow: '0 0 6px #8A3859' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.68rem', color: mode === 'dark' ? '#FAF2F5' : '#33101E', display: 'block' }}>
                Pink 🌸
              </Typography>
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
              
              <Divider sx={{ my: 2, borderColor: 'var(--glass-border)' }} />

              {/* Drawer Theme Swatches */}
              <Box sx={{ px: 1, py: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-teal)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1.2 }}>
                  Theme Accent
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label="Seafoam" size="small" onClick={() => setPalette('seafoam')} sx={{ flex: 1, fontWeight: 800, bgcolor: palette === 'seafoam' ? '#2A6B5D' : 'transparent', color: palette === 'seafoam' ? '#ffffff' : 'var(--color-forest)', border: '1px solid var(--color-forest)' }} />
                  <Chip label="Beige" size="small" onClick={() => setPalette('beige')} sx={{ flex: 1, fontWeight: 800, bgcolor: palette === 'beige' ? '#735740' : 'transparent', color: palette === 'beige' ? '#ffffff' : 'var(--color-forest)', border: '1px solid var(--color-forest)' }} />
                  <Chip label="Pink" size="small" onClick={() => setPalette('pink')} sx={{ flex: 1, fontWeight: 800, bgcolor: palette === 'pink' ? '#8A3859' : 'transparent', color: palette === 'pink' ? '#ffffff' : 'var(--color-forest)', border: '1px solid var(--color-forest)' }} />
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
                <ListItemIcon><SecurityIcon sx={{ color: 'var(--color-teal)' }} /></ListItemIcon>
                <ListItemText primary="Register Account" primaryTypographyProps={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }} />
              </ListItemButton>
            </Box>
          )}
        </List>
      </Drawer>
    </Box>
  );
}
